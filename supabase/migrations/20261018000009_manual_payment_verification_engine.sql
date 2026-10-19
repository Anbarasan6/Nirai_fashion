-- ==============================================================================
-- Migration: 20261018000009_manual_payment_verification_engine.sql
-- Description:
--   1. Create payment_settings table (single row, admin/super_admin write-only)
--   2. Update order payment_status values & add payment_due_at
--   3. Create payment_submissions table with normalized UTR uniqueness
--   4. Create order_audit_log table & audit triggers
--   5. Create get_payment_instructions RPC
--   6. Create submit_payment_proof RPC (rate-limited, format-checked, never sets Paid)
--   7. Create verify_payment, reject_payment, and mark_order_paid_manually RPCs
--   8. Create expire_unpaid_orders engine with automatic inventory restoration
--   9. Update place_order to compute payment_due_at and default to 'Awaiting Payment'
--  10. Configure Storage buckets payment-qr (public) and payment-proofs (private)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PAYMENT SETTINGS TABLE (Single-Row Admin Configuration)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.payment_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  upi_id TEXT NOT NULL DEFAULT 'niraiweaves@okaxis',
  payee_name TEXT NOT NULL DEFAULT 'Nirai Traditional Handlooms',
  account_name TEXT NOT NULL DEFAULT 'NIRAI HANDLOOMS',
  account_number TEXT NOT NULL DEFAULT '924020012345678',
  ifsc_code TEXT NOT NULL DEFAULT 'UTIB0001234',
  bank_name TEXT NOT NULL DEFAULT 'Axis Bank',
  branch TEXT NOT NULL DEFAULT 'Mylapore, Chennai',
  qr_image_path TEXT,
  payment_deadline_hours INT NOT NULL DEFAULT 24 CHECK (payment_deadline_hours >= 1 AND payment_deadline_hours <= 168),
  cod_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  instructions_en TEXT DEFAULT 'Please transfer the exact amount and quote your Order Number in the payment remarks/notes. Upload your screenshot or provide the 12-digit UTR reference.',
  instructions_ta TEXT DEFAULT 'சரியான தொகையை செலுத்தி குறிப்பில் உங்கள் ஆர்டர் எண்ணை குறிப்பிடவும். கட்டண ரசீது அல்லது 12 இலக்க UTR எண்ணை பதிவேற்றவும்.',
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Seed single row if not exists
INSERT INTO public.payment_settings (
  id, upi_id, payee_name, account_name, account_number, ifsc_code, bank_name, branch, payment_deadline_hours, cod_enabled
)
VALUES (
  'default', 'niraiweaves@okaxis', 'Nirai Traditional Handlooms', 'NIRAI HANDLOOMS', '924020012345678', 'UTIB0001234', 'Axis Bank', 'Mylapore, Chennai', 24, FALSE
)
ON CONFLICT (id) DO NOTHING;

-- RLS: Table is strictly private. Anon/Public CANNOT select directly.
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff and Admin view payment settings" ON public.payment_settings;
CREATE POLICY "Staff and Admin view payment settings"
  ON public.payment_settings
  FOR SELECT
  TO authenticated
  USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Admins manage payment settings" ON public.payment_settings;
CREATE POLICY "Admins manage payment settings"
  ON public.payment_settings
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- 2. ORDER PAYMENT STATUSES & PAYMENT DUE AT
-- ------------------------------------------------------------------------------

-- Add payment_due_at column
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_due_at TIMESTAMPTZ;

-- Drop old CHECK constraint first before updating existing rows
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS chk_orders_payment_status;

-- Migrate existing orders to new payment_status values
UPDATE public.orders
SET payment_status = CASE
  WHEN payment_status = 'Pending' AND (payment_details->>'utrNumber' IS NOT NULL AND payment_details->>'utrNumber' <> '')
    THEN 'Verification Pending'
  WHEN payment_status = 'Pending'
    THEN 'Awaiting Payment'
  WHEN payment_status = 'PENDING_VERIFICATION'
    THEN 'Verification Pending'
  WHEN payment_status IN ('Paid', 'Refunded')
    THEN payment_status
  WHEN payment_status = 'Failed'
    THEN 'Rejected'
  ELSE 'Awaiting Payment'
END
WHERE payment_status IN ('Pending', 'PENDING_VERIFICATION', 'Failed');

-- Set default payment_due_at for older active orders
UPDATE public.orders
SET payment_due_at = COALESCE(payment_due_at, created_at + interval '24 hours')
WHERE payment_due_at IS NULL;

-- Re-add new CHECK constraint on orders.payment_status
ALTER TABLE public.orders ADD CONSTRAINT chk_orders_payment_status
  CHECK (payment_status IN ('Awaiting Payment', 'Verification Pending', 'Paid', 'Rejected', 'Expired', 'Refunded'));

CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_due_at ON public.orders(payment_due_at);

-- ------------------------------------------------------------------------------
-- 3. PAYMENT SUBMISSIONS TABLE
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.payment_submissions (
  id TEXT PRIMARY KEY DEFAULT ('sub-' || gen_random_uuid()::text),
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  utr TEXT NOT NULL,
  amount_paid NUMERIC NOT NULL CHECK (amount_paid > 0),
  paid_at TIMESTAMPTZ DEFAULT now(),
  payer_name TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('upi', 'bank_transfer', 'qr', 'cash')),
  screenshot_path TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'verified', 'rejected')),
  reject_reason TEXT,
  verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Unique index on normalized UTR for unrejected submissions to prevent reuse
CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_submissions_unique_utr
  ON public.payment_submissions (upper(trim(utr)))
  WHERE status != 'rejected';

CREATE INDEX IF NOT EXISTS idx_payment_submissions_order_id ON public.payment_submissions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_submissions_status ON public.payment_submissions(status);
CREATE INDEX IF NOT EXISTS idx_payment_submissions_created_at ON public.payment_submissions(created_at DESC);

ALTER TABLE public.payment_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff and Admin manage payment submissions" ON public.payment_submissions;
CREATE POLICY "Staff and Admin manage payment submissions"
  ON public.payment_submissions
  FOR ALL
  TO authenticated
  USING (public.is_staff_or_admin())
  WITH CHECK (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Customers view own payment submissions" ON public.payment_submissions;
CREATE POLICY "Customers view own payment submissions"
  ON public.payment_submissions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = payment_submissions.order_id
        AND o.customer_id = auth.uid()
    )
  );

-- ------------------------------------------------------------------------------
-- 4. ORDER AUDIT LOG & TRIGGER
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.order_audit_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_audit_log_order_id ON public.order_audit_log(order_id);
CREATE INDEX IF NOT EXISTS idx_order_audit_log_created_at ON public.order_audit_log(created_at DESC);

ALTER TABLE public.order_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff and Admin view audit log" ON public.order_audit_log;
CREATE POLICY "Staff and Admin view audit log"
  ON public.order_audit_log
  FOR SELECT
  TO authenticated
  USING (public.is_staff_or_admin());

-- Trigger to record status & payment_status transitions on orders
CREATE OR REPLACE FUNCTION public.trg_audit_order_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (OLD.status IS DISTINCT FROM NEW.status) OR (OLD.payment_status IS DISTINCT FROM NEW.payment_status) THEN
    INSERT INTO public.order_audit_log (
      order_id,
      actor,
      action,
      old_value,
      new_value,
      created_at
    ) VALUES (
      NEW.id,
      COALESCE(auth.uid()::TEXT, current_setting('nirai.actor', TRUE), 'system'),
      'status_changed',
      jsonb_build_object('status', OLD.status, 'payment_status', OLD.payment_status),
      jsonb_build_object('status', NEW.status, 'payment_status', NEW.payment_status),
      now()
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_order_changes ON public.orders;
CREATE TRIGGER trg_audit_order_changes
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_audit_order_changes();

-- ------------------------------------------------------------------------------
-- 5. FUNCTION: get_payment_instructions
-- Returns payment settings and exact server amount ONLY for an authorized order.
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_payment_instructions(
  p_order_id TEXT DEFAULT NULL,
  p_order_number TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_settings RECORD;
  v_clean_phone TEXT;
  v_order_phone TEXT;
  v_caller_is_staff BOOLEAN;
  v_latest_sub RECORD;
BEGIN
  v_caller_is_staff := public.is_staff_or_admin();

  -- Find Order
  IF p_order_id IS NOT NULL AND p_order_id <> '' THEN
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id LIMIT 1;
  ELSIF p_order_number IS NOT NULL AND p_order_number <> '' THEN
    SELECT * INTO v_order FROM public.orders WHERE upper(order_number) = upper(trim(p_order_number)) LIMIT 1;
  ELSE
    RETURN jsonb_build_object('success', FALSE, 'error', 'Order ID or Order Number is required.');
  END IF;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Order not found.');
  END IF;

  -- Verify access rights
  IF NOT v_caller_is_staff THEN
    IF auth.uid() IS NOT NULL AND v_order.customer_id = auth.uid() THEN
      -- Authenticated owner permitted
      NULL;
    ELSE
      -- Guest or non-owner: Phone verification is strictly mandatory
      IF p_phone IS NULL OR trim(p_phone) = '' THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Phone number verification is required.');
      END IF;

      v_clean_phone := regexp_replace(p_phone, '\D', '', 'g');
      v_order_phone := regexp_replace(COALESCE(v_order.customer_phone, ''), '\D', '', 'g');

      IF v_clean_phone = '' OR (right(v_clean_phone, 10) <> right(v_order_phone, 10)) THEN
        RETURN jsonb_build_object('success', FALSE, 'error', 'Invalid verification details for this order.');
      END IF;
    END IF;
  END IF;

  -- Read payment settings
  SELECT * INTO v_settings FROM public.payment_settings LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Payment settings not configured on store.');
  END IF;

  -- Fetch latest submission if any
  SELECT id, utr, amount_paid, method, screenshot_path, status, reject_reason, created_at
  INTO v_latest_sub
  FROM public.payment_submissions
  WHERE order_id = v_order.id
  ORDER BY created_at DESC
  LIMIT 1;

  RETURN jsonb_build_object(
    'success', TRUE,
    'order_id', v_order.id,
    'order_number', v_order.order_number,
    'customer_name', v_order.customer_name,
    'customer_phone', v_order.customer_phone,
    'amount_due', v_order.grand_total,
    'order_status', v_order.status,
    'payment_status', v_order.payment_status,
    'payment_method', v_order.payment_method,
    'payment_due_at', v_order.payment_due_at,
    'payment_deadline_hours', v_settings.payment_deadline_hours,
    'is_expired', (v_order.payment_due_at IS NOT NULL AND v_order.payment_due_at < now() AND v_order.payment_status IN ('Awaiting Payment', 'Rejected')),
    'upi_details', jsonb_build_object(
      'upi_id', v_settings.upi_id,
      'payee_name', v_settings.payee_name,
      'qr_image_path', v_settings.qr_image_path
    ),
    'bank_details', jsonb_build_object(
      'account_name', v_settings.account_name,
      'account_number', v_settings.account_number,
      'ifsc_code', v_settings.ifsc_code,
      'bank_name', v_settings.bank_name,
      'branch', v_settings.branch
    ),
    'cod_enabled', v_settings.cod_enabled,
    'instructions', jsonb_build_object(
      'en', v_settings.instructions_en,
      'ta', v_settings.instructions_ta
    ),
    'latest_submission', CASE 
      WHEN v_latest_sub.id IS NOT NULL THEN jsonb_build_object(
        'id', v_latest_sub.id,
        'utr', v_latest_sub.utr,
        'amount_paid', v_latest_sub.amount_paid,
        'method', v_latest_sub.method,
        'status', v_latest_sub.status,
        'reject_reason', v_latest_sub.reject_reason,
        'created_at', v_latest_sub.created_at
      )
      ELSE NULL
    END
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 6. FUNCTION: submit_payment_proof
-- SECURITY DEFINER: validates order, UTR format, uniqueness, rate-limits,
-- and records submission. DOES NOT set order to Paid!
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.submit_payment_proof(
  p_order_number TEXT,
  p_phone TEXT,
  p_utr TEXT,
  p_method TEXT,
  p_amount_paid NUMERIC,
  p_payer_name TEXT,
  p_screenshot_path TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_clean_phone TEXT;
  v_order_phone TEXT;
  v_clean_utr TEXT;
  v_clean_method TEXT;
  v_submission_count INT;
  v_submission_id TEXT;
BEGIN
  -- Normalize inputs
  v_clean_utr := upper(trim(COALESCE(p_utr, '')));
  v_clean_phone := regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g');
  v_clean_method := lower(trim(COALESCE(p_method, 'upi')));

  IF p_order_number IS NULL OR trim(p_order_number) = '' THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Order number is required.');
  END IF;

  IF v_clean_phone = '' OR length(v_clean_phone) < 10 THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Valid 10-digit phone number is required.');
  END IF;

  IF v_clean_utr = '' THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'UTR / Transaction Reference number is required.');
  END IF;

  IF p_amount_paid IS NULL OR p_amount_paid <= 0 THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Please enter a valid amount paid.');
  END IF;

  IF p_payer_name IS NULL OR trim(p_payer_name) = '' THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Payer name is required.');
  END IF;

  -- Validate Method
  IF v_clean_method NOT IN ('upi', 'bank_transfer', 'qr') THEN
    v_clean_method := 'upi';
  END IF;

  -- Validate UTR Format
  IF v_clean_method IN ('upi', 'qr') THEN
    IF NOT (v_clean_utr ~ '^[0-9]{12}$') THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'error', 'Invalid UPI UTR format. Please enter the 12-digit numeric reference number from your UPI app.'
      );
    END IF;
  ELSIF v_clean_method = 'bank_transfer' THEN
    IF NOT (v_clean_utr ~ '^[A-Za-z0-9]{6,22}$') THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'error', 'Invalid Bank Reference format. Please enter a valid 6-22 character alphanumeric reference.'
      );
    END IF;
  END IF;

  -- Find Order FOR UPDATE
  SELECT * INTO v_order
  FROM public.orders
  WHERE upper(order_number) = upper(trim(p_order_number))
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Order not found.');
  END IF;

  -- Phone Verification
  v_order_phone := regexp_replace(COALESCE(v_order.customer_phone, ''), '\D', '', 'g');
  IF right(v_clean_phone, 10) <> right(v_order_phone, 10) THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Phone number does not match this order.');
  END IF;

  -- Order Status & Expiry Check
  IF v_order.status = 'Cancelled' OR v_order.payment_status = 'Expired' THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'This order has expired or been cancelled. New payments cannot be submitted.');
  END IF;

  IF v_order.payment_status = 'Paid' THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'This order is already marked as Paid.');
  END IF;

  IF v_order.payment_due_at IS NOT NULL AND v_order.payment_due_at < now() THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'The payment deadline for this order has expired.');
  END IF;

  -- Submission Rate Limiting (max 5 submissions per order)
  SELECT count(*) INTO v_submission_count
  FROM public.payment_submissions
  WHERE order_id = v_order.id;

  IF v_submission_count >= 5 THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Maximum payment submission limit (5 attempts) reached for this order. Please contact store support.'
    );
  END IF;

  -- Check if UTR is already in use by another unrejected submission
  IF EXISTS (
    SELECT 1 FROM public.payment_submissions
    WHERE upper(trim(utr)) = v_clean_utr
      AND status != 'rejected'
      AND order_id != v_order.id
  ) THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'This UTR / Reference number has already been submitted for another order.'
    );
  END IF;

  -- Insert payment submission
  v_submission_id := 'sub-' || gen_random_uuid()::TEXT;
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
    v_submission_id,
    v_order.id,
    v_clean_utr,
    p_amount_paid,
    now(),
    trim(p_payer_name),
    v_clean_method,
    p_screenshot_path,
    'submitted',
    now()
  );

  -- Update order payment_status to 'Verification Pending' (NEVER 'Paid')
  UPDATE public.orders
  SET
    payment_status = 'Verification Pending',
    payment_details = jsonb_build_object(
      'utrNumber', v_clean_utr,
      'amountPaid', p_amount_paid,
      'payerName', trim(p_payer_name),
      'method', v_clean_method,
      'screenshotPath', p_screenshot_path,
      'submittedAt', now()
    ),
    updated_at = now()
  WHERE id = v_order.id;

  -- Write audit log
  INSERT INTO public.order_audit_log (
    order_id,
    actor,
    action,
    old_value,
    new_value,
    created_at
  ) VALUES (
    v_order.id,
    COALESCE(auth.uid()::TEXT, 'customer'),
    'payment_submitted',
    jsonb_build_object('payment_status', v_order.payment_status),
    jsonb_build_object('payment_status', 'Verification Pending', 'utr', v_clean_utr, 'amount_paid', p_amount_paid),
    now()
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'submission_id', v_submission_id,
    'order_number', v_order.order_number,
    'message', 'Payment proof submitted successfully for verification.'
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 7. FUNCTION: verify_payment (Staff / Admin Only)
-- Verifies the payment submission, transitions order to Paid and Confirmed.
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.verify_payment(
  p_submission_id TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub RECORD;
  v_order RECORD;
  v_admin_id UUID;
BEGIN
  IF NOT public.is_staff_or_admin() THEN
    RAISE EXCEPTION 'Access denied. Only staff and administrators can verify payments.';
  END IF;

  v_admin_id := auth.uid();

  SELECT * INTO v_sub
  FROM public.payment_submissions
  WHERE id = p_submission_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Payment submission not found.');
  END IF;

  IF v_sub.status = 'verified' THEN
    RETURN jsonb_build_object('success', TRUE, 'message', 'Payment is already verified.');
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = v_sub.order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Associated order not found.');
  END IF;

  -- Mark submission verified
  UPDATE public.payment_submissions
  SET
    status = 'verified',
    verified_by = v_admin_id,
    verified_at = now(),
    reject_reason = NULL
  WHERE id = v_sub.id;

  -- Transition order to Paid & Confirmed
  UPDATE public.orders
  SET
    payment_status = 'Paid',
    status = 'Confirmed',
    notes = CASE 
      WHEN p_notes IS NOT NULL AND trim(p_notes) <> '' 
        THEN COALESCE(notes || E'\n', '') || 'Verified: ' || trim(p_notes)
      ELSE notes
    END,
    updated_at = now()
  WHERE id = v_order.id;

  -- Record audit log
  INSERT INTO public.order_audit_log (
    order_id,
    actor,
    action,
    old_value,
    new_value,
    created_at
  ) VALUES (
    v_order.id,
    COALESCE(v_admin_id::TEXT, 'admin'),
    'payment_verified',
    jsonb_build_object('status', v_order.status, 'payment_status', v_order.payment_status),
    jsonb_build_object('status', 'Confirmed', 'payment_status', 'Paid', 'utr', v_sub.utr, 'notes', p_notes),
    now()
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'order_id', v_order.id,
    'order_number', v_order.order_number,
    'message', 'Payment successfully verified. Order confirmed.'
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 8. FUNCTION: reject_payment (Staff / Admin Only)
-- Rejects a submission with a mandatory reason, sets payment_status to 'Rejected'.
-- Does NOT cancel order or release stock yet: hold is maintained until deadline.
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.reject_payment(
  p_submission_id TEXT,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sub RECORD;
  v_order RECORD;
  v_admin_id UUID;
  v_clean_reason TEXT;
BEGIN
  IF NOT public.is_staff_or_admin() THEN
    RAISE EXCEPTION 'Access denied. Only staff and administrators can reject payments.';
  END IF;

  v_clean_reason := trim(COALESCE(p_reason, ''));
  IF v_clean_reason = '' THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'A clear rejection reason is required.');
  END IF;

  v_admin_id := auth.uid();

  SELECT * INTO v_sub
  FROM public.payment_submissions
  WHERE id = p_submission_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Payment submission not found.');
  END IF;

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = v_sub.order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Associated order not found.');
  END IF;

  -- Update submission status to rejected
  UPDATE public.payment_submissions
  SET
    status = 'rejected',
    reject_reason = v_clean_reason,
    verified_by = v_admin_id,
    verified_at = now()
  WHERE id = v_sub.id;

  -- Set order payment_status to 'Rejected' (remains eligible for resubmission until deadline)
  UPDATE public.orders
  SET
    payment_status = 'Rejected',
    updated_at = now()
  WHERE id = v_order.id;

  -- Record audit log
  INSERT INTO public.order_audit_log (
    order_id,
    actor,
    action,
    old_value,
    new_value,
    created_at
  ) VALUES (
    v_order.id,
    COALESCE(v_admin_id::TEXT, 'admin'),
    'payment_rejected',
    jsonb_build_object('payment_status', v_order.payment_status),
    jsonb_build_object('payment_status', 'Rejected', 'reject_reason', v_clean_reason, 'utr', v_sub.utr),
    now()
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'order_id', v_order.id,
    'order_number', v_order.order_number,
    'message', 'Payment submission rejected. Customer notified.'
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 9. FUNCTION: mark_order_paid_manually (Admin Only)
-- Marks an order Paid with mandatory note (e.g. offline cash / direct settlement).
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.mark_order_paid_manually(
  p_order_id TEXT,
  p_notes TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_admin_id UUID;
  v_clean_notes TEXT;
  v_manual_utr TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Only administrators can mark orders as paid manually.';
  END IF;

  v_clean_notes := trim(COALESCE(p_notes, ''));
  IF v_clean_notes = '' THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'A mandatory note explaining the manual payment is required.');
  END IF;

  v_admin_id := auth.uid();

  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Order not found.');
  END IF;

  IF v_order.payment_status = 'Paid' THEN
    RETURN jsonb_build_object('success', TRUE, 'message', 'Order is already marked Paid.');
  END IF;

  v_manual_utr := 'MANUAL-' || to_char(now(), 'YYYYMMDD-HH24MISS');

  -- Create an audit submission
  INSERT INTO public.payment_submissions (
    order_id,
    utr,
    amount_paid,
    paid_at,
    payer_name,
    method,
    status,
    verified_by,
    verified_at,
    created_at
  ) VALUES (
    v_order.id,
    v_manual_utr,
    v_order.grand_total,
    now(),
    'Manual Admin Settlement',
    'cash',
    'verified',
    v_admin_id,
    now(),
    now()
  );

  -- Update order
  UPDATE public.orders
  SET
    payment_status = 'Paid',
    status = 'Confirmed',
    notes = COALESCE(notes || E'\n', '') || 'Manual Payment Confirmed: ' || v_clean_notes,
    updated_at = now()
  WHERE id = v_order.id;

  -- Record audit log
  INSERT INTO public.order_audit_log (
    order_id,
    actor,
    action,
    old_value,
    new_value,
    created_at
  ) VALUES (
    v_order.id,
    COALESCE(v_admin_id::TEXT, 'admin'),
    'manual_paid',
    jsonb_build_object('status', v_order.status, 'payment_status', v_order.payment_status),
    jsonb_build_object('status', 'Confirmed', 'payment_status', 'Paid', 'notes', v_clean_notes),
    now()
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'order_number', v_order.order_number,
    'message', 'Order successfully marked Paid manually.'
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 10. FUNCTION: expire_unpaid_orders (Scheduled Expiry & Automatic Restock)
-- Automatically cancels orders whose deadline has passed in 'Awaiting Payment'
-- or 'Rejected'. Orders in 'Verification Pending' are NEVER auto-expired!
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.expire_unpaid_orders()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec RECORD;
  v_item JSONB;
  v_prod_id TEXT;
  v_qty INT;
  v_prod RECORD;
  v_expired_count INT := 0;
BEGIN
  -- Loop through expired orders needing cancellation
  FOR v_rec IN
    SELECT id, order_number, items, status, payment_status
    FROM public.orders
    WHERE payment_status IN ('Awaiting Payment', 'Rejected')
      AND status NOT IN ('Cancelled', 'Delivered')
      AND payment_due_at IS NOT NULL
      AND payment_due_at < now()
    FOR UPDATE SKIP LOCKED
  LOOP
    -- 1. Restock each item
    FOR v_item IN SELECT * FROM jsonb_array_elements(COALESCE(v_rec.items, '[]'::JSONB))
    LOOP
      v_prod_id := v_item->>'productId';
      v_qty := (v_item->>'quantity')::INT;

      IF v_prod_id IS NOT NULL AND v_qty > 0 THEN
        SELECT id, name_en, sku, stock INTO v_prod
        FROM public.products
        WHERE id = v_prod_id
        FOR UPDATE;

        IF FOUND THEN
          UPDATE public.products
          SET stock = stock + v_qty, updated_at = now()
          WHERE id = v_prod_id;

          INSERT INTO public.stock_movements (
            product_id,
            product_name,
            sku,
            type,
            change_amount,
            previous_stock,
            new_stock,
            reason,
            performed_by,
            created_at
          ) VALUES (
            v_prod.id,
            v_prod.name_en,
            v_prod.sku,
            'RESTOCK',
            v_qty,
            v_prod.stock,
            v_prod.stock + v_qty,
            'Order Expired: Payment deadline exceeded #' || v_rec.order_number,
            'System Auto-Expiry',
            now()
          );
        END IF;
      END IF;
    END LOOP;

    -- 2. Update order status
    UPDATE public.orders
    SET
      status = 'Cancelled',
      payment_status = 'Expired',
      updated_at = now()
    WHERE id = v_rec.id;

    -- 3. Audit log
    INSERT INTO public.order_audit_log (
      order_id,
      actor,
      action,
      old_value,
      new_value,
      created_at
    ) VALUES (
      v_rec.id,
      'system',
      'order_expired',
      jsonb_build_object('status', v_rec.status, 'payment_status', v_rec.payment_status),
      jsonb_build_object('status', 'Cancelled', 'payment_status', 'Expired', 'reason', 'Payment deadline exceeded'),
      now()
    );

    v_expired_count := v_expired_count + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'success', TRUE,
    'expired_orders_count', v_expired_count,
    'timestamp', now()
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 11. REVISE place_order FUNCTION
-- Computes payment_due_at and assigns 'Awaiting Payment' default.
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.place_order(p_payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_idempotency_key TEXT;
  v_existing_id TEXT;
  v_existing_num TEXT;
  
  v_customer_id UUID;
  v_customer_name TEXT;
  v_customer_email TEXT;
  v_customer_phone TEXT;
  v_shipping_address JSONB;
  v_payment_method TEXT;
  v_pincode TEXT;
  
  v_items JSONB;
  v_item JSONB;
  v_prod_id TEXT;
  v_variant_id TEXT;
  v_qty INT;
  
  v_prod RECORD;
  v_unit_price NUMERIC;
  v_item_total NUMERIC;
  v_subtotal NUMERIC := 0;
  v_discount NUMERIC := 0;
  v_shipping_fee NUMERIC := 0;
  v_grand_total NUMERIC := 0;
  v_verified_items JSONB := '[]'::JSONB;
  
  v_coupon_code TEXT;
  v_coupon RECORD;
  v_order_id TEXT;
  v_order_number TEXT;
  
  v_free_threshold NUMERIC := 1500;
  v_std_fee NUMERIC := 120;
  v_shipping_rules JSONB;

  -- Payment Settings
  v_pay_settings RECORD;
  v_deadline_hours INT := 24;
  v_payment_due_at TIMESTAMPTZ;
  v_initial_status TEXT := 'Pending';
  v_initial_payment_status TEXT := 'Awaiting Payment';
BEGIN
  -- 1. Idempotency Check
  v_idempotency_key := trim(COALESCE(p_payload->>'idempotency_key', p_payload->>'idempotencyKey', ''));
  IF v_idempotency_key <> '' THEN
    SELECT id, order_number INTO v_existing_id, v_existing_num
    FROM public.orders
    WHERE idempotency_key = v_idempotency_key
    LIMIT 1;

    IF FOUND THEN
      RETURN jsonb_build_object(
        'success', TRUE,
        'order_id', v_existing_id,
        'order_number', v_existing_num,
        'idempotent_replay', TRUE
      );
    END IF;
  END IF;

  -- 2. Customer Identity
  v_customer_id := auth.uid();
  v_customer_name := trim(COALESCE(p_payload->>'customer_name', p_payload->>'customerName', ''));
  v_customer_email := lower(trim(COALESCE(p_payload->>'customer_email', p_payload->>'customerEmail', '')));
  v_customer_phone := trim(COALESCE(p_payload->>'customer_phone', p_payload->>'customerPhone', ''));
  v_shipping_address := COALESCE(p_payload->'shipping_address', p_payload->'shippingAddress');
  v_payment_method := COALESCE(p_payload->>'payment_method', p_payload->>'paymentMethod', 'ONLINE_UPI');

  IF v_customer_name = '' OR v_customer_email = '' OR v_customer_phone = '' THEN
    RAISE EXCEPTION 'Customer name, email address, and phone number are required.';
  END IF;

  IF v_shipping_address IS NULL THEN
    RAISE EXCEPTION 'Shipping address is required.';
  END IF;

  v_pincode := trim(COALESCE(v_shipping_address->>'pincode', ''));
  IF v_pincode = '' OR NOT (v_pincode ~ '^[1-9][0-9]{5}$') THEN
    RAISE EXCEPTION 'A valid 6-digit Indian delivery pincode is required.';
  END IF;

  -- 3. Validate Cart Items
  v_items := COALESCE(p_payload->'items', '[]'::JSONB);
  IF jsonb_array_length(v_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item.';
  END IF;

  -- 4. Read Shipping & Payment Settings
  SELECT 
    COALESCE(free_shipping_threshold, 1500),
    COALESCE(standard_shipping_fee, 120),
    shipping_rules
  INTO v_free_threshold, v_std_fee, v_shipping_rules
  FROM public.settings
  LIMIT 1;

  SELECT payment_deadline_hours, cod_enabled
  INTO v_pay_settings
  FROM public.payment_settings
  LIMIT 1;

  IF FOUND AND v_pay_settings.payment_deadline_hours IS NOT NULL THEN
    v_deadline_hours := v_pay_settings.payment_deadline_hours;
  END IF;

  v_payment_due_at := now() + (v_deadline_hours || ' hours')::interval;

  -- Handle COD if enabled
  IF v_payment_method = 'COD' THEN
    IF NOT COALESCE(v_pay_settings.cod_enabled, FALSE) THEN
      RAISE EXCEPTION 'Cash on Delivery is currently not enabled.';
    END IF;
    v_initial_status := 'Confirmed';
    v_initial_payment_status := 'Awaiting Payment';
  END IF;

  -- 5. Lock and Validate Products in DB (FOR UPDATE)
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_items)
  LOOP
    v_prod_id := COALESCE(v_item->>'productId', v_item->>'product_id');
    v_variant_id := COALESCE(v_item->>'variantId', v_item->>'variant_id');
    v_qty := COALESCE((v_item->>'quantity')::INT, 1);

    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'Item quantity must be greater than zero.';
    END IF;

    -- Row-level locking to prevent race-condition overselling
    SELECT id, name_en, sku, base_price, final_price, stock, is_active, images
    INTO v_prod
    FROM public.products
    WHERE id = v_prod_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Product % is no longer available.', v_prod_id;
    END IF;

    IF NOT v_prod.is_active THEN
      RAISE EXCEPTION 'Product % has been discontinued.', v_prod.name_en;
    END IF;

    IF v_prod.stock < v_qty THEN
      RAISE EXCEPTION 'Insufficient stock for "%". Requested: %, available: %.', 
        v_prod.name_en, v_qty, v_prod.stock;
    END IF;

    v_unit_price := COALESCE(NULLIF(v_prod.final_price, 0), v_prod.base_price, 0);
    v_item_total := v_unit_price * v_qty;
    v_subtotal := v_subtotal + v_item_total;

    v_verified_items := v_verified_items || jsonb_build_object(
      'productId', v_prod.id,
      'productName', v_prod.name_en,
      'productImage', COALESCE(v_prod.images->>0, ''),
      'sku', v_prod.sku,
      'variantId', v_variant_id,
      'unitPrice', v_unit_price,
      'quantity', v_qty,
      'totalPrice', v_item_total
    );
  END LOOP;

  -- 6. Shipping Fee Computation
  IF v_subtotal >= v_free_threshold THEN
    v_shipping_fee := 0;
  ELSE
    IF v_pincode ~ '^6[0-4][0-9]{4}$' THEN
      v_shipping_fee := COALESCE((v_shipping_rules->>'tamilNaduStandard')::NUMERIC, 80);
    ELSE
      v_shipping_fee := COALESCE((v_shipping_rules->>'indiaStandard')::NUMERIC, v_std_fee);
    END IF;
  END IF;

  -- 7. Validate and Lock Coupon
  v_coupon_code := upper(trim(COALESCE(p_payload->>'coupon_code', p_payload->>'couponCode', '')));
  IF v_coupon_code <> '' THEN
    SELECT * INTO v_coupon
    FROM public.coupons
    WHERE upper(code) = v_coupon_code
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Coupon code % is invalid.', v_coupon_code;
    END IF;

    IF NOT v_coupon.is_active THEN
      RAISE EXCEPTION 'Coupon % is no longer active.', v_coupon_code;
    END IF;

    IF v_coupon.expiry_date IS NOT NULL AND v_coupon.expiry_date < now() THEN
      RAISE EXCEPTION 'Coupon % has expired.', v_coupon_code;
    END IF;

    IF v_subtotal < v_coupon.min_order_amount THEN
      RAISE EXCEPTION 'Minimum order amount for coupon % is ₹%.', v_coupon_code, v_coupon.min_order_amount;
    END IF;

    IF lower(v_coupon.discount_type) = 'percentage' THEN
      v_discount := (v_subtotal * v_coupon.discount_value) / 100;
      IF v_coupon.max_discount IS NOT NULL AND v_coupon.max_discount > 0 THEN
        v_discount := LEAST(v_discount, v_coupon.max_discount);
      END IF;
    ELSE
      v_discount := LEAST(v_coupon.discount_value, v_subtotal);
    END IF;
    v_discount := round(v_discount);

    UPDATE public.coupons
    SET usage_count = COALESCE(usage_count, 0) + 1
    WHERE id = v_coupon.id;
  END IF;

  v_grand_total := GREATEST(0, v_subtotal - v_discount + v_shipping_fee);

  -- 8. Generate Order Identifiers
  v_order_number := 'NIRAI-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.order_number_seq')::TEXT, 5, '0');
  v_order_id := 'ord-' || gen_random_uuid()::TEXT;

  -- 9. Decrement Product Stocks & Record Audited Movements
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_verified_items)
  LOOP
    v_prod_id := v_item->>'productId';
    v_qty := (v_item->>'quantity')::INT;

    SELECT stock, name_en, sku INTO v_prod FROM public.products WHERE id = v_prod_id;

    UPDATE public.products
    SET stock = stock - v_qty, updated_at = now()
    WHERE id = v_prod_id;

    INSERT INTO public.stock_movements (
      product_id,
      product_name,
      sku,
      type,
      change_amount,
      previous_stock,
      new_stock,
      reason,
      performed_by,
      created_at
    ) VALUES (
      v_prod_id,
      v_prod.name_en,
      v_prod.sku,
      'SALE',
      -v_qty,
      v_prod.stock,
      v_prod.stock - v_qty,
      'Order Placed #' || v_order_number,
      v_customer_name,
      now()
    );
  END LOOP;

  -- 10. Insert Verified Order (payment_status: 'Awaiting Payment', with payment_due_at)
  INSERT INTO public.orders (
    id,
    order_number,
    customer_id,
    customer_name,
    customer_email,
    customer_phone,
    items,
    subtotal,
    shipping_fee,
    discount,
    grand_total,
    status,
    payment_status,
    payment_due_at,
    payment_method,
    payment_details,
    shipping_details,
    shipping_address,
    idempotency_key,
    created_at,
    updated_at
  ) VALUES (
    v_order_id,
    v_order_number,
    v_customer_id,
    v_customer_name,
    v_customer_email,
    v_customer_phone,
    v_verified_items,
    v_subtotal,
    v_shipping_fee,
    v_discount,
    v_grand_total,
    v_initial_status,
    v_initial_payment_status,
    v_payment_due_at,
    v_payment_method,
    jsonb_build_object(
      'utrNumber', p_payload->>'utr_number',
      'paymentProofUrl', p_payload->>'payment_proof_url'
    ),
    COALESCE(p_payload->'shipping_details', '{}'::JSONB),
    v_shipping_address,
    NULLIF(v_idempotency_key, ''),
    now(),
    now()
  );

  -- Audit log for order creation
  INSERT INTO public.order_audit_log (
    order_id,
    actor,
    action,
    old_value,
    new_value,
    created_at
  ) VALUES (
    v_order_id,
    COALESCE(v_customer_id::TEXT, 'guest'),
    'order_created',
    NULL,
    jsonb_build_object(
      'order_number', v_order_number,
      'grand_total', v_grand_total,
      'payment_status', v_initial_payment_status,
      'payment_due_at', v_payment_due_at
    ),
    now()
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'grand_total', v_grand_total,
    'payment_status', v_initial_payment_status,
    'payment_due_at', v_payment_due_at
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 12. STORAGE BUCKETS CONFIGURATION (payment-qr and payment-proofs)
-- ------------------------------------------------------------------------------

-- Ensure buckets exist in storage.buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('payment-qr', 'payment-qr', TRUE, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']),
  ('payment-proofs', 'payment-proofs', FALSE, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage Policies for payment-qr (Public view, Staff/Admin upload/edit)
DROP POLICY IF EXISTS "Public can view payment QR images" ON storage.objects;
CREATE POLICY "Public can view payment QR images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'payment-qr');

DROP POLICY IF EXISTS "Staff and Admin upload payment QR images" ON storage.objects;
CREATE POLICY "Staff and Admin upload payment QR images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'payment-qr' AND public.is_staff_or_admin());

DROP POLICY IF EXISTS "Staff and Admin update payment QR images" ON storage.objects;
CREATE POLICY "Staff and Admin update payment QR images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'payment-qr' AND public.is_staff_or_admin());

-- Storage Policies for payment-proofs (Private: Staff/Admin view, Authenticated/Anon upload with file size <= 2MB)
DROP POLICY IF EXISTS "Staff and Admin view payment proofs" ON storage.objects;
CREATE POLICY "Staff and Admin view payment proofs"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'payment-proofs' AND public.is_staff_or_admin());

DROP POLICY IF EXISTS "Anyone can upload payment proof for active orders" ON storage.objects;
CREATE POLICY "Anyone can upload payment proof for active orders"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (
    bucket_id = 'payment-proofs'
  );
