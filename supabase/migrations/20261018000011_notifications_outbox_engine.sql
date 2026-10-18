-- ==============================================================================
-- Migration: 20261018000011_notifications_outbox_engine.sql
-- Phase 4B: Transactional Notifications Outbox & Automated Lifecycle Triggers
-- 1. Create notifications_outbox table with strict idempotency unique index
-- 2. Create enqueue_notification() helper with deduplication
-- 3. Automatic event triggers:
--    - order_placed
--    - payment_proof_received
--    - admin_payment_pending
--    - payment_verified
--    - payment_rejected
--    - order_expired
--    - shipped, delivered, cancelled
-- 4. Payment reminder job (4 hours before payment_due_at) scheduled via pg_cron
-- 5. RLS lockdown (staff/admin view only)
-- ==============================================================================

-- 1. Create notifications_outbox table
CREATE TABLE IF NOT EXISTS public.notifications_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  order_number text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'order_placed',
    'payment_proof_received',
    'payment_verified',
    'payment_rejected',
    'payment_reminder',
    'order_expired',
    'shipped',
    'delivered',
    'cancelled',
    'admin_payment_pending'
  )),
  submission_id text NOT NULL DEFAULT '',
  recipient_email text NOT NULL,
  recipient_name text NOT NULL DEFAULT '',
  subject text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message text,
  attempts integer NOT NULL DEFAULT 0,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Requirement E: Idempotency unique key (order_id + event_type + submission_id)
-- Retries or double triggers will NEVER insert or send duplicate emails
CREATE UNIQUE INDEX IF NOT EXISTS idx_notifications_outbox_idempotency
  ON public.notifications_outbox (order_id, event_type, submission_id);

CREATE INDEX IF NOT EXISTS idx_notifications_outbox_status_created
  ON public.notifications_outbox (status, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_notifications_outbox_order_id
  ON public.notifications_outbox (order_id);

-- Enable Row Level Security
ALTER TABLE public.notifications_outbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff and admin view notifications outbox" ON public.notifications_outbox;
CREATE POLICY "Staff and admin view notifications outbox"
  ON public.notifications_outbox
  FOR SELECT
  TO authenticated
  USING (public.is_staff_or_admin());

-- 2. ENQUEUE NOTIFICATION HELPER (Security Definer)
CREATE OR REPLACE FUNCTION public.enqueue_notification(
  p_order_id text,
  p_event_type text,
  p_submission_id text DEFAULT '',
  p_extra_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order record;
  v_recipient_email text;
  v_recipient_name text;
  v_subject text;
  v_full_payload jsonb;
  v_clean_sub_id text;
  v_id uuid;
  v_admin_email text;
BEGIN
  v_clean_sub_id := coalesce(trim(p_submission_id), '');

  -- Fetch order details
  SELECT
    id, order_number, customer_name, customer_email, customer_phone,
    grand_total, status, payment_status, payment_due_at, shipping_details, items
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Admin recipient email for admin notifications
  v_admin_email := 'orders@nirai.in';

  -- Compose Subject & Recipient based on Event Type
  CASE p_event_type
    WHEN 'order_placed' THEN
      v_recipient_email := v_order.customer_email;
      v_recipient_name  := v_order.customer_name;
      v_subject         := 'Order Confirmation & Payment Details - #' || v_order.order_number;

    WHEN 'payment_proof_received' THEN
      v_recipient_email := v_order.customer_email;
      v_recipient_name  := v_order.customer_name;
      v_subject         := 'Payment Proof Received for Order #' || v_order.order_number;

    WHEN 'payment_verified' THEN
      v_recipient_email := v_order.customer_email;
      v_recipient_name  := v_order.customer_name;
      v_subject         := 'Payment Verified & Order Confirmed! - #' || v_order.order_number;

    WHEN 'payment_rejected' THEN
      v_recipient_email := v_order.customer_email;
      v_recipient_name  := v_order.customer_name;
      v_subject         := 'Action Required: Payment Verification Update - Order #' || v_order.order_number;

    WHEN 'payment_reminder' THEN
      v_recipient_email := v_order.customer_email;
      v_recipient_name  := v_order.customer_name;
      v_subject         := 'Payment Reminder: 4 Hours Remaining - Order #' || v_order.order_number;

    WHEN 'order_expired' THEN
      v_recipient_email := v_order.customer_email;
      v_recipient_name  := v_order.customer_name;
      v_subject         := 'Order Notice: Payment Window Expired - #' || v_order.order_number;

    WHEN 'shipped' THEN
      v_recipient_email := v_order.customer_email;
      v_recipient_name  := v_order.customer_name;
      v_subject         := 'Your Handloom Order has Shipped! - #' || v_order.order_number;

    WHEN 'delivered' THEN
      v_recipient_email := v_order.customer_email;
      v_recipient_name  := v_order.customer_name;
      v_subject         := 'Your Order has been Delivered! - #' || v_order.order_number;

    WHEN 'cancelled' THEN
      v_recipient_email := v_order.customer_email;
      v_recipient_name  := v_order.customer_name;
      v_subject         := 'Order Cancellation Notice - #' || v_order.order_number;

    WHEN 'admin_payment_pending' THEN
      v_recipient_email := v_admin_email;
      v_recipient_name  := 'Nirai Store Operations';
      v_subject         := '[Nirai Admin] New Payment Proof Awaiting Verification - Order #' || v_order.order_number;

    ELSE
      RETURN NULL;
  END CASE;

  -- Build consolidated payload
  v_full_payload := jsonb_build_object(
    'order_id', v_order.id,
    'order_number', v_order.order_number,
    'customer_name', v_order.customer_name,
    'grand_total', v_order.grand_total,
    'status', v_order.status,
    'payment_status', v_order.payment_status,
    'payment_due_at', v_order.payment_due_at,
    'shipping_details', v_order.shipping_details
  ) || coalesce(p_extra_payload, '{}'::jsonb);

  -- Insert into notifications outbox (Idempotent ON CONFLICT DO NOTHING)
  INSERT INTO public.notifications_outbox (
    order_id,
    order_number,
    event_type,
    submission_id,
    recipient_email,
    recipient_name,
    subject,
    payload,
    status
  ) VALUES (
    v_order.id,
    v_order.order_number,
    p_event_type,
    v_clean_sub_id,
    v_recipient_email,
    v_recipient_name,
    v_subject,
    v_full_payload,
    'pending'
  )
  ON CONFLICT (order_id, event_type, submission_id) DO NOTHING
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- 3. INTEGRATE ENQUEUE CALLS INTO CORE PAYMENT & ORDER WORKFLOWS

-- 3.1 Order Placed Trigger (enqueues order_placed when order is inserted)
CREATE OR REPLACE FUNCTION public.trg_enqueue_order_placed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.enqueue_notification(NEW.id, 'order_placed', '', jsonb_build_object('items_count', jsonb_array_length(coalesce(NEW.items, '[]'::jsonb))));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_placed_notification ON public.orders;
CREATE TRIGGER trg_order_placed_notification
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_enqueue_order_placed();

-- 3.2 Update submit_payment_proof to enqueue proof received & admin alert
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

  -- 10. ENQUEUE NOTIFICATIONS:
  -- A. Customer: payment proof received
  PERFORM public.enqueue_notification(
    v_order.id,
    'payment_proof_received',
    v_sub_id,
    jsonb_build_object('utr', v_norm_utr, 'amount_paid', p_amount_paid, 'method', v_norm_method)
  );

  -- B. Admin: new payment awaiting verification
  PERFORM public.enqueue_notification(
    v_order.id,
    'admin_payment_pending',
    v_sub_id,
    jsonb_build_object(
      'utr', v_norm_utr,
      'amount_paid', p_amount_paid,
      'payer_name', trim(p_payer_name),
      'method', v_norm_method
    )
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

-- 3.3 Update verify_payment to enqueue payment_verified
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

  SELECT * INTO v_sub
  FROM public.payment_submissions
  WHERE id = p_submission_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Payment submission record not found.');
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = v_sub.order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Associated order not found.');
  END IF;

  -- Idempotency check:
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

  UPDATE public.payment_submissions
  SET status = 'verified',
      verified_by = auth.uid(),
      verified_at = now()
  WHERE id = v_sub.id;

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

  -- ENQUEUE NOTIFICATION: Customer payment verified (order confirmed)
  PERFORM public.enqueue_notification(
    v_order.id,
    'payment_verified',
    v_sub.id,
    jsonb_build_object('utr', v_sub.utr, 'amount_paid', v_sub.amount_paid, 'notes', p_notes)
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

-- 3.4 Update reject_payment to enqueue payment_rejected
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
    RETURN jsonb_build_object('success', false, 'error', 'Payment submission record not found.');
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = v_sub.order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Associated order not found.');
  END IF;

  UPDATE public.payment_submissions
  SET status = 'rejected',
      reject_reason = v_clean_reason,
      verified_by = v_admin_id,
      verified_at = now()
  WHERE id = v_sub.id;

  UPDATE public.orders
  SET payment_status = 'Rejected',
      updated_at = now()
  WHERE id = v_order.id;

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

  -- ENQUEUE NOTIFICATION: Customer payment rejected (with reason + resubmit link payload)
  PERFORM public.enqueue_notification(
    v_order.id,
    'payment_rejected',
    v_sub.id,
    jsonb_build_object('utr', v_sub.utr, 'reject_reason', v_clean_reason)
  );

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order.id,
    'order_number', v_order.order_number,
    'message', 'Payment submission rejected. Customer notified.'
  );
END;
$$;

-- 3.5 Update expire_unpaid_orders to enqueue order_expired
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

  FOR v_order IN
    SELECT id, order_number, customer_id, customer_email, items, payment_status, status
    FROM public.orders
    WHERE payment_status IN ('Awaiting Payment', 'Rejected')
      AND status NOT IN ('Cancelled', 'Delivered', 'Returned')
      AND payment_due_at IS NOT NULL
      AND payment_due_at < now()
    FOR UPDATE
  LOOP
    -- Restock inventory
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_order.items)
    LOOP
      v_prod_id := v_item->>'productId';
      v_var_sku := v_item->>'sku';
      v_qty     := coalesce((v_item->>'quantity')::integer, 1);

      UPDATE public.products
      SET stock = stock + v_qty,
          updated_at = now()
      WHERE id = v_prod_id;

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

    -- Update order to Cancelled / Expired
    UPDATE public.orders
    SET status = 'Cancelled',
        payment_status = 'Expired',
        updated_at = now()
    WHERE id = v_order.id;

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

    -- ENQUEUE NOTIFICATION: Customer order expired
    PERFORM public.enqueue_notification(
      v_order.id,
      'order_expired',
      '',
      jsonb_build_object('reason', 'Payment deadline exceeded without verified receipt')
    );

    v_count := v_count + 1;
    v_expired_ids := array_append(v_expired_ids, v_order.id);
  END LOOP;

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

-- 3.6 Fulfillment Notifications Trigger (shipped, delivered, cancelled)
CREATE OR REPLACE FUNCTION public.trg_enqueue_fulfillment_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Shipped
  IF NEW.status = 'Shipped' AND OLD.status != 'Shipped' THEN
    PERFORM public.enqueue_notification(
      NEW.id,
      'shipped',
      '',
      jsonb_build_object(
        'courierName', coalesce(NEW.shipping_details->>'courierName', 'Courier Partner'),
        'trackingId', coalesce(NEW.shipping_details->>'trackingId', ''),
        'trackingUrl', coalesce(NEW.shipping_details->>'trackingUrl', ''),
        'estimatedDelivery', coalesce(NEW.shipping_details->>'estimatedDelivery', '')
      )
    );
  END IF;

  -- Delivered
  IF NEW.status = 'Delivered' AND OLD.status != 'Delivered' THEN
    PERFORM public.enqueue_notification(NEW.id, 'delivered', '', jsonb_build_object());
  END IF;

  -- Cancelled (excluding automatic expiry handled separately)
  IF NEW.status = 'Cancelled' AND OLD.status != 'Cancelled' AND NEW.payment_status != 'Expired' THEN
    PERFORM public.enqueue_notification(NEW.id, 'cancelled', '', jsonb_build_object());
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_fulfillment_notification ON public.orders;
CREATE TRIGGER trg_order_fulfillment_notification
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_enqueue_fulfillment_notifications();

-- 4. PAYMENT REMINDER JOB: 4 Hours before payment_due_at
CREATE OR REPLACE FUNCTION public.check_payment_reminders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec record;
  v_count integer := 0;
BEGIN
  -- Find orders in 'Awaiting Payment' or 'Rejected' where due date is within the next 4 hours
  FOR v_rec IN
    SELECT id, order_number, payment_due_at
    FROM public.orders
    WHERE payment_status IN ('Awaiting Payment', 'Rejected')
      AND status NOT IN ('Cancelled', 'Delivered')
      AND payment_due_at IS NOT NULL
      AND payment_due_at > now()
      AND payment_due_at <= now() + interval '4 hours'
  LOOP
    PERFORM public.enqueue_notification(
      v_rec.id,
      'payment_reminder',
      '',
      jsonb_build_object(
        'payment_due_at', v_rec.payment_due_at,
        'hours_remaining', 4
      )
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- Schedule payment reminder check in pg_cron (runs every 15 minutes)
DO $$
BEGIN
  PERFORM cron.unschedule('check-payment-reminders-every-15-min');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'check-payment-reminders-every-15-min',
  '*/15 * * * *',
  'SELECT public.check_payment_reminders();'
);
