-- ==============================================================================
-- Migration: 20261018000010_payment_hardening.sql
-- Nirai Hardening Patch:
-- 1. Schedule expire_unpaid_orders via pg_cron every 15m + job_runs audit table
-- 2. Function Lockdown: REVOKE EXECUTE on privileged functions from anon/public
-- 3. Strict Storage Policies on payment-proofs (path validation, active order check, max 5 files, mime types)
-- 4. Strict UTR validation (12 digits for UPI/QR, 6-22 alphanumeric for bank transfer)
-- 5. Idempotent verify_payment with SELECT ... FOR UPDATE
-- 6. Trigger preventing direct modification of order payment_status/status
-- ==============================================================================

-- 1. Enable pg_cron and create job_runs audit table
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

ALTER TABLE public.order_audit_log ADD COLUMN IF NOT EXISTS details jsonb;

CREATE TABLE IF NOT EXISTS public.job_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name text NOT NULL,
  status text NOT NULL DEFAULT 'completed',
  items_affected integer NOT NULL DEFAULT 0,
  details jsonb DEFAULT '{}'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.job_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff and admin view job runs" ON public.job_runs;
CREATE POLICY "Staff and admin view job runs" ON public.job_runs
  FOR SELECT TO authenticated
  USING (public.is_staff_or_admin());

-- 2. Update expire_unpaid_orders to log to job_runs
CREATE OR REPLACE FUNCTION public.expire_unpaid_orders()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_order record;
  v_item jsonb;
  v_prod_id text;
  v_var_sku text;
  v_qty integer;
  v_count integer := 0;
  v_start_time timestamptz := clock_timestamp();
  v_expired_ids text[] := '{}';
BEGIN
  PERFORM set_config('nirai.authorized_workflow', 'true', true);

  -- Only process orders past payment deadline in 'Awaiting Payment' or 'Rejected'
  -- Orders in 'Verification Pending' are NEVER expired
  FOR v_order IN
    SELECT id, order_number, customer_id, customer_email, items, payment_status, status
    FROM public.orders
    WHERE payment_status IN ('Awaiting Payment', 'Rejected')
      AND status NOT IN ('Cancelled', 'Delivered', 'Returned')
      AND payment_due_at IS NOT NULL
      AND payment_due_at < now()
    FOR UPDATE
  LOOP
    -- Restock inventory for each order line item
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_order.items)
    LOOP
      v_prod_id := v_item->>'productId';
      v_var_sku := v_item->>'sku';
      v_qty     := coalesce((v_item->>'quantity')::integer, 1);

      -- Restore total stock
      UPDATE public.products
      SET stock = stock + v_qty,
          updated_at = now()
      WHERE id = v_prod_id;

      -- Restore variant stock if present
      IF v_var_sku IS NOT NULL AND v_var_sku != '' THEN
        UPDATE public.products
        SET variants = (
          SELECT jsonb_agg(
            CASE
              WHEN v->>'sku' = v_var_sku THEN
                jsonb_set(v, '{stock}', to_jsonb(coalesce((v->>'stock')::integer, 0) + v_qty))
              ELSE v
            END
          )
          FROM jsonb_array_elements(variants) AS v
        ),
        updated_at = now()
        WHERE id = v_prod_id;
      END IF;

      -- Audit restock in stock_movements
      INSERT INTO public.stock_movements (
        product_id, variant_sku, change_type, quantity, reason, reference_id, created_at
      ) VALUES (
        v_prod_id,
        v_var_sku,
        'RESTOCK',
        v_qty,
        'Auto-restock from expired unpaid order #' || v_order.order_number,
        v_order.id,
        now()
      );
    END LOOP;

    -- Update order status to Cancelled / Expired
    UPDATE public.orders
    SET status = 'Cancelled',
        payment_status = 'Expired',
        updated_at = now()
    WHERE id = v_order.id;

    -- Log transition in order_audit_log
    INSERT INTO public.order_audit_log (
      order_id, actor, action, old_value, new_value, created_at
    ) VALUES (
      v_order.id,
      'SYSTEM_CRON',
      'ORDER_EXPIRED',
      jsonb_build_object('status', v_order.status, 'payment_status', v_order.payment_status),
      jsonb_build_object(
        'status', 'Cancelled',
        'payment_status', 'Expired',
        'reason', 'Payment deadline exceeded without verified receipt'
      ),
      now()
    );

    v_count := v_count + 1;
    v_expired_ids := array_append(v_expired_ids, v_order.id);
  END LOOP;

  -- Log execution in job_runs table
  INSERT INTO public.job_runs (
    job_name, status, items_affected, details, started_at, completed_at
  ) VALUES (
    'expire_unpaid_orders',
    'completed',
    v_count,
    jsonb_build_object('expired_order_ids', v_expired_ids),
    v_start_time,
    clock_timestamp()
  );

  RETURN jsonb_build_object(
    'success', true,
    'expired_count', v_count,
    'expired_order_ids', v_expired_ids
  );
END;
$$;

-- 3. Schedule cron job in pg_cron (runs every 15 minutes)
DO $$
BEGIN
  PERFORM cron.unschedule('expire-unpaid-orders-every-15-min');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'expire-unpaid-orders-every-15-min',
  '*/15 * * * *',
  'SELECT public.expire_unpaid_orders();'
);

-- 4. FUNCTION LOCKDOWN: Revoke execute on privileged RPCs
REVOKE EXECUTE ON FUNCTION public.expire_unpaid_orders() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_unpaid_orders() TO postgres, service_role;

REVOKE EXECUTE ON FUNCTION public.verify_payment(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_payment(text, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.reject_payment(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reject_payment(text, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.mark_order_paid_manually(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_order_paid_manually(text, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.update_order_status(text, text, text, jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_order_status(text, text, text, jsonb, text) TO authenticated, service_role;

-- 5. TRIGGER: Prevent non-staff/anon direct modification of order payment_status & status
CREATE OR REPLACE FUNCTION public.check_order_status_update_permission()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (NEW.status IS DISTINCT FROM OLD.status OR NEW.payment_status IS DISTINCT FROM OLD.payment_status) THEN
    -- If executed within an authorized RPC workflow
    IF current_setting('nirai.authorized_workflow', true) = 'true' THEN
      RETURN NEW;
    END IF;

    -- Staff and admin users are authorized
    IF public.is_staff_or_admin() THEN
      RETURN NEW;
    END IF;

    -- Otherwise, direct client modification is prohibited
    RAISE EXCEPTION 'Direct update of status or payment_status is prohibited. Use official RPC workflows.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_order_status_updates ON public.orders;
CREATE TRIGGER trg_protect_order_status_updates
  BEFORE UPDATE OF status, payment_status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.check_order_status_update_permission();

-- 6. IDEMPOTENT verify_payment WITH ROW-LOCKING
CREATE OR REPLACE FUNCTION public.verify_payment(
  p_submission_id text,
  p_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub record;
  v_order record;
  v_actor text;
BEGIN
  IF NOT public.is_staff_or_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only staff or administrators can verify payment proofs.';
  END IF;

  PERFORM set_config('nirai.authorized_workflow', 'true', true);
  v_actor := coalesce(auth.uid()::text, 'admin_console');

  -- Lock submission row
  SELECT * INTO v_sub
  FROM public.payment_submissions
  WHERE id = p_submission_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Payment submission record not found.');
  END IF;

  -- Lock order row
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = v_sub.order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Associated order not found.');
  END IF;

  -- IDEMPOTENCY CHECK:
  -- If submission is already verified and order is already Paid, return success gracefully
  IF v_sub.status = 'verified' AND v_order.payment_status = 'Paid' THEN
    RETURN jsonb_build_object(
      'success', true,
      'order_id', v_sub.order_id,
      'order_number', v_order.order_number,
      'payment_status', 'Paid',
      'idempotent', true,
      'message', 'Payment was already verified previously.'
    );
  END IF;

  -- Update submission status
  UPDATE public.payment_submissions
  SET status = 'verified',
      verified_by = auth.uid(),
      verified_at = now()
  WHERE id = v_sub.id;

  -- Update order to Paid & Confirmed
  UPDATE public.orders
  SET payment_status = 'Paid',
      status = 'Confirmed',
      notes = CASE
        WHEN p_notes IS NOT NULL AND trim(p_notes) <> ''
          THEN coalesce(notes || E'\n', '') || 'Verified: ' || trim(p_notes)
        ELSE notes
      END,
      updated_at = now()
  WHERE id = v_sub.order_id;

  -- Write immutable audit log
  INSERT INTO public.order_audit_log (
    order_id, actor, action, old_value, new_value, created_at
  ) VALUES (
    v_sub.order_id,
    v_actor,
    'PAYMENT_VERIFIED',
    jsonb_build_object('status', v_order.status, 'payment_status', v_order.payment_status),
    jsonb_build_object(
      'status', 'Confirmed',
      'payment_status', 'Paid',
      'submission_id', v_sub.id,
      'utr', v_sub.utr,
      'amount_paid', v_sub.amount_paid,
      'notes', p_notes
    ),
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_sub.order_id,
    'order_number', v_order.order_number,
    'payment_status', 'Paid',
    'status', 'Confirmed'
  );
END;
$$;

-- 7. REJECT PAYMENT RPC
CREATE OR REPLACE FUNCTION public.reject_payment(
  p_submission_id text,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub record;
  v_order record;
  v_admin_id uuid;
  v_clean_reason text;
BEGIN
  IF NOT public.is_staff_or_admin() THEN
    RAISE EXCEPTION 'Access denied. Only staff and administrators can reject payments.';
  END IF;

  PERFORM set_config('nirai.authorized_workflow', 'true', true);

  v_clean_reason := trim(coalesce(p_reason, ''));
  IF v_clean_reason = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'A clear rejection reason is required.');
  END IF;

  v_admin_id := auth.uid();

  SELECT * INTO v_sub
  FROM public.payment_submissions
  WHERE id = p_submission_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Payment submission not found.');
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = v_sub.order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Associated order not found.');
  END IF;

  -- Update submission status to rejected
  UPDATE public.payment_submissions
  SET status = 'rejected',
      reject_reason = v_clean_reason,
      verified_by = v_admin_id,
      verified_at = now()
  WHERE id = v_sub.id;

  -- Set order payment_status to 'Rejected' (remains eligible for resubmission until deadline)
  UPDATE public.orders
  SET payment_status = 'Rejected',
      updated_at = now()
  WHERE id = v_order.id;

  -- Record audit log
  INSERT INTO public.order_audit_log (
    order_id, actor, action, old_value, new_value, created_at
  ) VALUES (
    v_order.id,
    coalesce(v_admin_id::text, 'admin'),
    'payment_rejected',
    jsonb_build_object('payment_status', v_order.payment_status),
    jsonb_build_object('payment_status', 'Rejected', 'reject_reason', v_clean_reason, 'utr', v_sub.utr),
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order.id,
    'order_number', v_order.order_number,
    'message', 'Payment submission rejected. Customer notified.'
  );
END;
$$;

-- 8. MARK ORDER PAID MANUALLY RPC
CREATE OR REPLACE FUNCTION public.mark_order_paid_manually(
  p_order_id text,
  p_notes text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order record;
  v_admin_id uuid;
  v_clean_notes text;
  v_manual_utr text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Only administrators can mark orders as paid manually.';
  END IF;

  PERFORM set_config('nirai.authorized_workflow', 'true', true);

  v_clean_notes := trim(coalesce(p_notes, ''));
  IF v_clean_notes = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Audit note is required when marking an order as paid manually.');
  END IF;

  v_admin_id := auth.uid();

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found.');
  END IF;

  IF v_order.payment_status = 'Paid' THEN
    RETURN jsonb_build_object('success', true, 'message', 'Order is already marked as Paid.');
  END IF;

  v_manual_utr := 'MANUAL-' || upper(substr(md5(random()::text), 1, 8));

  -- Insert submission record
  INSERT INTO public.payment_submissions (
    id, order_id, utr, amount_paid, paid_at, payer_name, method, status, verified_by, verified_at, created_at
  ) VALUES (
    'sub-' || gen_random_uuid()::text,
    v_order.id,
    v_manual_utr,
    v_order.grand_total,
    now(),
    'Manual Admin Entry (' || coalesce(v_admin_id::text, 'admin') || ')',
    'cash',
    'verified',
    v_admin_id,
    now(),
    now()
  );

  -- Update order
  UPDATE public.orders
  SET payment_status = 'Paid',
      status = 'Confirmed',
      notes = coalesce(notes || E'\n', '') || 'Manual Payment Confirmed: ' || v_clean_notes,
      updated_at = now()
  WHERE id = v_order.id;

  -- Record audit log
  INSERT INTO public.order_audit_log (
    order_id, actor, action, old_value, new_value, created_at
  ) VALUES (
    v_order.id,
    coalesce(v_admin_id::text, 'admin'),
    'manual_paid',
    jsonb_build_object('status', v_order.status, 'payment_status', v_order.payment_status),
    jsonb_build_object('status', 'Confirmed', 'payment_status', 'Paid', 'notes', v_clean_notes),
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'order_number', v_order.order_number,
    'message', 'Order successfully marked Paid manually.'
  );
END;
$$;

-- 9. STRICT UTR VALIDATION IN submit_payment_proof
CREATE OR REPLACE FUNCTION public.submit_payment_proof(
  p_order_number text,
  p_phone text,
  p_utr text,
  p_method text,
  p_amount_paid numeric,
  p_payer_name text,
  p_screenshot_path text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order record;
  v_norm_utr text;
  v_norm_method text;
  v_attempts integer;
  v_sub_id text;
BEGIN
  PERFORM set_config('nirai.authorized_workflow', 'true', true);

  -- Normalize UTR and method
  v_norm_utr := upper(trim(p_utr));
  v_norm_method := lower(trim(p_method));

  -- 1. STRICT UTR FORMAT VALIDATION:
  -- UPI / QR = exactly 12 digits
  -- Bank Transfer (NEFT/IMPS/RTGS) = alphanumeric 6-22 characters
  IF v_norm_method = 'upi' OR v_norm_method = 'qr' THEN
    IF v_norm_utr !~ '^\d{12}$' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Invalid UPI UTR: Must be exactly 12 numeric digits.');
    END IF;
  ELSIF v_norm_method = 'bank_transfer' THEN
    IF v_norm_utr !~ '^[A-Z0-9]{6,22}$' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Invalid bank transfer reference: Must be alphanumeric 6 to 22 characters.');
    END IF;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Unsupported payment method. Must be upi, qr, or bank_transfer.');
  END IF;

  IF p_amount_paid <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Paid amount must be greater than zero.');
  END IF;

  IF trim(p_payer_name) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Payer name is required.');
  END IF;

  -- 2. Fetch order and verify authorization
  SELECT * INTO v_order
  FROM public.orders
  WHERE order_number = upper(trim(p_order_number))
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found.');
  END IF;

  -- Check identity: logged-in owner OR matching billing phone
  IF auth.uid() IS NOT NULL THEN
    IF v_order.customer_id IS DISTINCT FROM auth.uid() AND NOT public.is_staff_or_admin() THEN
      IF right(regexp_replace(v_order.customer_phone, '\D', '', 'g'), 10) != right(regexp_replace(p_phone, '\D', '', 'g'), 10) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Order verification failed.');
      END IF;
    END IF;
  ELSE
    IF right(regexp_replace(v_order.customer_phone, '\D', '', 'g'), 10) != right(regexp_replace(p_phone, '\D', '', 'g'), 10) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Unauthorized: Phone number does not match order record.');
    END IF;
  END IF;

  -- 3. Check order payment status allows submission
  IF v_order.payment_status NOT IN ('Awaiting Payment', 'Rejected', 'Pending') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Order is currently in status ''' || v_order.payment_status || ''' and cannot accept new proof.'
    );
  END IF;

  -- 4. Check deadline
  IF v_order.payment_due_at IS NOT NULL AND v_order.payment_due_at < now() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Payment deadline has expired for this order.');
  END IF;

  -- 5. Rate limiting: max 5 submission attempts per order
  SELECT count(*) INTO v_attempts
  FROM public.payment_submissions
  WHERE order_id = v_order.id;

  IF v_attempts >= 5 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Maximum payment submission attempts (5) reached for this order.');
  END IF;

  -- 6. Check unique UTR among unrejected submissions for any other order
  IF EXISTS (
    SELECT 1 FROM public.payment_submissions
    WHERE upper(trim(utr)) = v_norm_utr
      AND status != 'rejected'
      AND order_id != v_order.id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'This UTR has already been submitted for another order.');
  END IF;

  -- 7. Insert payment submission
  v_sub_id := 'sub-' || gen_random_uuid()::text;
  INSERT INTO public.payment_submissions (
    id,
    order_id,
    utr,
    amount_paid,
    paid_at,
    payer_name,
    method,
    screenshot_path,
    status,
    created_at
  ) VALUES (
    v_sub_id,
    v_order.id,
    v_norm_utr,
    p_amount_paid,
    now(),
    trim(p_payer_name),
    v_norm_method,
    p_screenshot_path,
    'submitted',
    now()
  );

  -- 8. Update order payment_status to 'Verification Pending' (NEVER 'Paid'!)
  UPDATE public.orders
  SET payment_status = 'Verification Pending',
      payment_details = jsonb_build_object(
        'utrNumber', v_norm_utr,
        'amountPaid', p_amount_paid,
        'payerName', trim(p_payer_name),
        'method', v_norm_method,
        'screenshotPath', p_screenshot_path,
        'submittedAt', now()
      ),
      updated_at = now()
  WHERE id = v_order.id;

  -- 9. Audit log entry
  INSERT INTO public.order_audit_log (
    order_id, actor, action, old_value, new_value, created_at
  ) VALUES (
    v_order.id,
    coalesce(auth.uid()::text, 'customer'),
    'PAYMENT_PROOF_SUBMITTED',
    jsonb_build_object('payment_status', v_order.payment_status),
    jsonb_build_object(
      'payment_status', 'Verification Pending',
      'submission_id', v_sub_id,
      'utr', v_norm_utr,
      'amount_paid', p_amount_paid,
      'method', v_norm_method,
      'has_screenshot', p_screenshot_path IS NOT NULL
    ),
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'submission_id', v_sub_id,
    'order_number', v_order.order_number,
    'payment_status', 'Verification Pending',
    'message', 'Payment proof submitted successfully for verification.'
  );
END;
$$;

-- 10. STORAGE HARDENING: Strict Bucket limits and upload validation policy
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'],
    file_size_limit = 2097152 -- 2 MB
WHERE id = 'payment-proofs';

-- Helper to validate storage proof upload constraints
CREATE OR REPLACE FUNCTION public.can_upload_payment_proof(p_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_segments text[];
  v_order_id text;
  v_is_valid boolean;
  v_file_count integer;
BEGIN
  -- Strict path format: <order_id>/<filename>
  v_segments := string_to_array(p_name, '/');
  IF array_length(v_segments, 1) != 2 THEN
    RETURN false;
  END IF;

  v_order_id := v_segments[1];

  -- Order must exist, be awaiting payment or rejected, not cancelled, and not expired
  SELECT EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = v_order_id
      AND o.payment_status IN ('Awaiting Payment', 'Rejected', 'Pending')
      AND o.status NOT IN ('Cancelled', 'Delivered')
      AND (o.payment_due_at IS NULL OR o.payment_due_at > now())
  ) INTO v_is_valid;

  IF NOT v_is_valid THEN
    RETURN false;
  END IF;

  -- Limit uploads per order to 5 files
  SELECT count(*) INTO v_file_count
  FROM storage.objects
  WHERE bucket_id = 'payment-proofs'
    AND name LIKE (v_order_id || '/%');

  IF v_file_count >= 5 THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

-- Drop permissive or outdated policies on storage.objects for payment-proofs
DROP POLICY IF EXISTS "Anyone can upload payment proof for active orders" ON storage.objects;
DROP POLICY IF EXISTS "Customers can upload payment proof for active pending orders" ON storage.objects;
DROP POLICY IF EXISTS "Caller upload payment proof for active pending orders" ON storage.objects;
DROP POLICY IF EXISTS "Staff and Admin view payment proofs" ON storage.objects;
DROP POLICY IF EXISTS "Staff and Admin delete payment proofs" ON storage.objects;

-- Only INSERT allowed for caller, restricted to valid pending order paths
CREATE POLICY "Caller upload payment proof for active pending orders"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'payment-proofs'
  AND public.can_upload_payment_proof(name)
);

-- SELECT strictly restricted to staff and admin
CREATE POLICY "Staff and Admin view payment proofs"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND public.is_staff_or_admin()
);

-- Deny DELETE on payment-proofs for non-staff
CREATE POLICY "Staff and Admin delete payment proofs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'payment-proofs'
  AND public.is_staff_or_admin()
);
