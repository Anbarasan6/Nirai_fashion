-- ==============================================================================
-- Migration: 20261018000012_notifications_outbox_hardening.sql
-- Phase 4B: Robust Transactional Notifications & Outbox Engine
-- 1. payment_settings notification configurations (admin emails, toggles, reminder hours)
-- 2. notifications_outbox schema normalization (type, to_email, to_phone, locale, next_attempt_at, last_error)
-- 3. Watertight UNIQUE idempotency index: (order_id, type, coalesce(submission_id, '00000000-0000-0000-0000-000000000000'))
-- 4. Complete RLS lockdown: NO policies for anon/authenticated (service role only)
-- 5. Staff/Admin SECURITY DEFINER RPCs: list_notifications(), retry_notification()
-- 6. Atomic worker claim RPC: claim_notifications() with FOR UPDATE SKIP LOCKED
-- 7. Automated enqueue logic on all lifecycle events (placed, proof, verified, rejected, reminder, expired, shipped, delivered, cancelled, admin alert)
-- ==============================================================================

-- 1. Add notification configuration fields to public.payment_settings
ALTER TABLE public.payment_settings
  ADD COLUMN IF NOT EXISTS admin_notification_emails text[] DEFAULT ARRAY['orders@nirai.in'],
  ADD COLUMN IF NOT EXISTS reminder_hours_before_deadline int DEFAULT 4,
  ADD COLUMN IF NOT EXISTS notification_type_toggles jsonb DEFAULT '{
    "order_placed": true,
    "payment_proof_received": true,
    "payment_verified": true,
    "payment_rejected": true,
    "payment_reminder": true,
    "order_expired": true,
    "shipped": true,
    "delivered": true,
    "cancelled": true,
    "admin_payment_pending": true
  }'::jsonb;

-- 2. Normalize public.notifications_outbox table structure
DO $$
BEGIN
  -- Rename event_type to type if needed
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications_outbox' AND column_name = 'event_type') THEN
    ALTER TABLE public.notifications_outbox RENAME COLUMN event_type TO type;
  END IF;

  -- Rename recipient_email to to_email if needed
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications_outbox' AND column_name = 'recipient_email') THEN
    ALTER TABLE public.notifications_outbox RENAME COLUMN recipient_email TO to_email;
  END IF;

  -- Rename error_message to last_error if needed
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications_outbox' AND column_name = 'error_message') THEN
    ALTER TABLE public.notifications_outbox RENAME COLUMN error_message TO last_error;
  END IF;

  -- Ensure to_phone column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications_outbox' AND column_name = 'to_phone') THEN
    ALTER TABLE public.notifications_outbox ADD COLUMN to_phone text;
  END IF;

  -- Ensure locale column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications_outbox' AND column_name = 'locale') THEN
    ALTER TABLE public.notifications_outbox ADD COLUMN locale text NOT NULL DEFAULT 'en' CHECK (locale IN ('en', 'ta'));
  END IF;

  -- Ensure next_attempt_at column exists
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications_outbox' AND column_name = 'next_attempt_at') THEN
    ALTER TABLE public.notifications_outbox ADD COLUMN next_attempt_at timestamptz NOT NULL DEFAULT now();
  END IF;

  -- Allow submission_id to be nullable and normalize empty string to null
  ALTER TABLE public.notifications_outbox ALTER COLUMN submission_id DROP NOT NULL;
  ALTER TABLE public.notifications_outbox ALTER COLUMN submission_id DROP DEFAULT;
  UPDATE public.notifications_outbox SET submission_id = NULL WHERE submission_id = '';

  -- Allow subject and recipient_name to be optional/default '' (rendered dynamically in templates)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications_outbox' AND column_name = 'subject') THEN
    ALTER TABLE public.notifications_outbox ALTER COLUMN subject DROP NOT NULL;
    ALTER TABLE public.notifications_outbox ALTER COLUMN subject SET DEFAULT '';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications_outbox' AND column_name = 'recipient_name') THEN
    ALTER TABLE public.notifications_outbox ALTER COLUMN recipient_name DROP NOT NULL;
    ALTER TABLE public.notifications_outbox ALTER COLUMN recipient_name SET DEFAULT '';
  END IF;
END $$;

-- Drop legacy triggers from 011 to prevent duplicate trigger firing
DROP TRIGGER IF EXISTS trg_order_placed_notification ON public.orders;
DROP TRIGGER IF EXISTS trg_order_fulfillment_notification ON public.orders;

-- 3. Watertight UNIQUE idempotency index
-- (order_id, type, coalesce(submission_id, '00000000-0000-0000-0000-000000000000'))
DROP INDEX IF EXISTS public.idx_notifications_outbox_idempotency;
CREATE UNIQUE INDEX idx_notifications_outbox_idempotency
  ON public.notifications_outbox (order_id, type, (coalesce(submission_id, '00000000-0000-0000-0000-000000000000')));

CREATE INDEX IF NOT EXISTS idx_notifications_outbox_pending_attempts
  ON public.notifications_outbox (status, next_attempt_at, attempts)
  WHERE status = 'pending';

-- 4. Complete RLS lockdown: NO policies for anon or authenticated (Service Role Only)
ALTER TABLE public.notifications_outbox ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff and admin view notifications outbox" ON public.notifications_outbox;
DROP POLICY IF EXISTS "Anon view notifications outbox" ON public.notifications_outbox;
DROP POLICY IF EXISTS "Allow service role full access" ON public.notifications_outbox;

-- Revoke all direct table access from anon and authenticated
REVOKE ALL ON public.notifications_outbox FROM anon, authenticated, public;

-- 5. Staff/Admin SECURITY DEFINER RPCs: list_notifications() and retry_notification()
CREATE OR REPLACE FUNCTION public.list_notifications(
  p_status text DEFAULT NULL,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  type text,
  order_id text,
  order_number text,
  submission_id text,
  to_email text,
  to_phone text,
  locale text,
  payload jsonb,
  status text,
  attempts int,
  next_attempt_at timestamptz,
  last_error text,
  created_at timestamptz,
  sent_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total bigint;
BEGIN
  IF NOT public.is_staff_or_admin() THEN
    RAISE EXCEPTION 'Access Denied: Administrative privileges required' USING ERRCODE = '42501';
  END IF;

  SELECT count(*) INTO v_total
  FROM public.notifications_outbox
  WHERE (p_status IS NULL OR p_status = 'all' OR notifications_outbox.status = p_status);

  RETURN QUERY
  SELECT 
    n.id,
    n.type,
    n.order_id,
    n.order_number,
    n.submission_id,
    n.to_email,
    n.to_phone,
    n.locale,
    n.payload,
    n.status,
    n.attempts,
    n.next_attempt_at,
    n.last_error,
    n.created_at,
    n.sent_at,
    v_total AS total_count
  FROM public.notifications_outbox n
  WHERE (p_status IS NULL OR p_status = 'all' OR n.status = p_status)
  ORDER BY n.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_notifications(text, int, int) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.list_notifications(text, int, int) FROM anon, public;

CREATE OR REPLACE FUNCTION public.retry_notification(p_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_staff_or_admin() THEN
    RAISE EXCEPTION 'Access Denied: Administrative privileges required' USING ERRCODE = '42501';
  END IF;

  UPDATE public.notifications_outbox
  SET 
    status = 'pending',
    attempts = 0,
    next_attempt_at = now(),
    last_error = NULL,
    updated_at = now()
  WHERE id = p_id;

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.retry_notification(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.retry_notification(uuid) FROM anon, public;

-- 6. Atomic worker claim RPC: claim_notifications() with FOR UPDATE SKIP LOCKED
CREATE OR REPLACE FUNCTION public.claim_notifications(p_limit int DEFAULT 20)
RETURNS TABLE (
  id uuid,
  type text,
  order_id text,
  order_number text,
  submission_id text,
  to_email text,
  to_phone text,
  locale text,
  payload jsonb,
  attempts int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH claimed AS (
    SELECT n.id
    FROM public.notifications_outbox n
    WHERE n.status = 'pending'
      AND n.next_attempt_at <= now()
      AND n.attempts < 5
    ORDER BY n.created_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  UPDATE public.notifications_outbox u
  SET 
    next_attempt_at = now() + interval '2 minutes',
    updated_at = now()
  FROM claimed
  WHERE u.id = claimed.id
  RETURNING 
    u.id,
    u.type,
    u.order_id,
    u.order_number,
    u.submission_id,
    u.to_email,
    u.to_phone,
    u.locale,
    u.payload,
    u.attempts;
END;
$$;

-- Only service role can execute claim_notifications
REVOKE ALL ON FUNCTION public.claim_notifications(int) FROM anon, authenticated, public;

-- 7. Unified enqueue_notification helper
DROP FUNCTION IF EXISTS public.enqueue_notification(text, text, text, jsonb);
CREATE OR REPLACE FUNCTION public.enqueue_notification(
  p_order_id text,
  p_type text,
  p_submission_id text DEFAULT NULL,
  p_extra_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order record;
  v_settings record;
  v_recipient_email text;
  v_recipient_phone text;
  v_recipient_name text;
  v_locale text;
  v_full_payload jsonb;
  v_id uuid;
  v_admin_emails text[];
  v_admin_to text;
  v_is_enabled boolean;
BEGIN
  -- Normalize empty string submission_id to NULL
  IF p_submission_id = '' THEN
    p_submission_id := NULL;
  END IF;

  -- Read store settings
  SELECT * INTO v_settings FROM public.payment_settings LIMIT 1;

  -- Check if this notification type is enabled in settings
  IF v_settings.notification_type_toggles IS NOT NULL THEN
    v_is_enabled := coalesce((v_settings.notification_type_toggles->>p_type)::boolean, true);
    IF NOT v_is_enabled THEN
      RETURN NULL; -- Notification type disabled in settings
    END IF;
  END IF;

  -- Fetch order details
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Extract customer details
  v_recipient_email := coalesce(
    v_order.customer_email,
    v_order.shipping_address->>'email'
  );

  v_recipient_phone := coalesce(
    v_order.customer_phone,
    v_order.shipping_address->>'phone'
  );

  v_recipient_name := coalesce(
    v_order.shipping_address->>'fullName',
    v_order.customer_name,
    'Valued Customer'
  );

  v_locale := coalesce(
    v_order.shipping_address->>'locale',
    'en'
  );
  IF v_locale NOT IN ('en', 'ta') THEN
    v_locale := 'en';
  END IF;

  -- Base payload
  v_full_payload := jsonb_build_object(
    'order_number', v_order.order_number,
    'customer_name', v_recipient_name,
    'customer_phone', v_recipient_phone,
    'grand_total', v_order.grand_total,
    'payment_due_at', v_order.payment_due_at,
    'items', v_order.items
  ) || p_extra_payload;

  -- Handle ADMIN alert event
  IF p_type = 'admin_payment_pending' THEN
    v_admin_emails := coalesce(v_settings.admin_notification_emails, ARRAY['orders@nirai.in']);
    IF array_length(v_admin_emails, 1) > 0 THEN
      v_admin_to := v_admin_emails[1];
    ELSE
      v_admin_to := 'orders@nirai.in';
    END IF;

    v_full_payload := v_full_payload || jsonb_build_object('admin_emails', to_jsonb(v_admin_emails));

    INSERT INTO public.notifications_outbox (
      order_id,
      order_number,
      type,
      submission_id,
      to_email,
      to_phone,
      locale,
      payload,
      status,
      next_attempt_at
    )
    VALUES (
      v_order.id,
      v_order.order_number,
      p_type,
      p_submission_id,
      v_admin_to,
      NULL,
      'en',
      v_full_payload,
      'pending',
      now()
    )
    ON CONFLICT (order_id, type, (coalesce(submission_id, '00000000-0000-0000-0000-000000000000')))
    DO NOTHING
    RETURNING id INTO v_id;

    RETURN v_id;
  END IF;

  -- Handle customer events (must have an email)
  IF v_recipient_email IS NULL OR v_recipient_email = '' THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.notifications_outbox (
    order_id,
    order_number,
    type,
    submission_id,
    to_email,
    to_phone,
    locale,
    payload,
    status,
    next_attempt_at
  )
  VALUES (
    v_order.id,
    v_order.order_number,
    p_type,
    p_submission_id,
    v_recipient_email,
    v_recipient_phone,
    v_locale,
    v_full_payload,
    'pending',
    now()
  )
  ON CONFLICT (order_id, type, (coalesce(submission_id, '00000000-0000-0000-0000-000000000000')))
  DO NOTHING
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_notification(text, text, text, jsonb) FROM anon, authenticated, public;

-- 8. Payment reminder scheduled check (respects configurable reminder_hours_before_deadline)
CREATE OR REPLACE FUNCTION public.check_payment_reminders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec record;
  v_count integer := 0;
  v_hours int := 4;
BEGIN
  -- Read configured reminder hours from payment_settings
  SELECT coalesce(reminder_hours_before_deadline, 4) INTO v_hours FROM public.payment_settings LIMIT 1;
  IF v_hours IS NULL OR v_hours < 1 THEN
    v_hours := 4;
  END IF;

  FOR v_rec IN
    SELECT o.id, o.order_number, o.payment_due_at
    FROM public.orders o
    WHERE o.payment_status IN ('Awaiting Payment', 'Rejected')
      AND o.status NOT IN ('Cancelled', 'Delivered')
      AND o.payment_due_at IS NOT NULL
      AND o.payment_due_at <= now() + (interval '1 hour' * v_hours)
      AND o.payment_due_at > now()
      -- Exclude if already enqueued
      AND NOT EXISTS (
        SELECT 1 FROM public.notifications_outbox n
        WHERE n.order_id = o.id AND n.type = 'payment_reminder'
      )
  LOOP
    PERFORM public.enqueue_notification(
      v_rec.id,
      'payment_reminder',
      NULL,
      jsonb_build_object('hours_remaining', v_hours)
    );
    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$;

-- 9. Wire triggers on Orders table (placed, shipped, delivered, cancelled)
CREATE OR REPLACE FUNCTION public.trg_orders_notification_dispatcher()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. On INSERT: order_placed
  IF TG_OP = 'INSERT' THEN
    PERFORM public.enqueue_notification(NEW.id, 'order_placed', NULL, jsonb_build_object(
      'order_number', NEW.order_number,
      'grand_total', NEW.grand_total,
      'payment_due_at', NEW.payment_due_at
    ));
    RETURN NEW;
  END IF;

  -- 2. On UPDATE: status transitions
  IF TG_OP = 'UPDATE' THEN
    -- Shipped
    IF NEW.status = 'Shipped' AND (OLD.status IS DISTINCT FROM 'Shipped') THEN
      PERFORM public.enqueue_notification(NEW.id, 'shipped', NULL, jsonb_build_object(
        'courierName', coalesce(NEW.courier_name, 'Express Courier'),
        'trackingId', coalesce(NEW.tracking_id, 'In Transit'),
        'trackingUrl', coalesce(NEW.tracking_url, '')
      ));
    END IF;

    -- Delivered
    IF NEW.status = 'Delivered' AND (OLD.status IS DISTINCT FROM 'Delivered') THEN
      PERFORM public.enqueue_notification(NEW.id, 'delivered', NULL, jsonb_build_object(
        'delivered_at', now()
      ));
    END IF;

    -- Cancelled (if not already enqueued via order_expired)
    IF NEW.status = 'Cancelled' AND (OLD.status IS DISTINCT FROM 'Cancelled') THEN
      PERFORM public.enqueue_notification(NEW.id, 'cancelled', NULL, jsonb_build_object(
        'cancellation_reason', coalesce(NEW.cancellation_reason, 'Order cancelled')
      ));
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_notifications ON public.orders;
CREATE TRIGGER trg_orders_notifications
  AFTER INSERT OR UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_orders_notification_dispatcher();

-- 10. Wire triggers on Payment Proof submission
CREATE OR REPLACE FUNCTION public.trg_payment_submission_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Customer acknowledgement
  PERFORM public.enqueue_notification(
    NEW.order_id,
    'payment_proof_received',
    NEW.id::text,
    jsonb_build_object(
      'utr', NEW.utr_number,
      'amount_paid', NEW.amount_paid,
      'payment_method', NEW.payment_method
    )
  );

  -- Store admin alert
  PERFORM public.enqueue_notification(
    NEW.order_id,
    'admin_payment_pending',
    NEW.id::text,
    jsonb_build_object(
      'utr', NEW.utr_number,
      'amount_paid', NEW.amount_paid,
      'method', NEW.payment_method,
      'payer_name', NEW.payer_name
    )
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payment_submissions_notifications ON public.payment_submissions;
CREATE TRIGGER trg_payment_submissions_notifications
  AFTER INSERT ON public.payment_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_payment_submission_notification();

-- 11. Wire triggers on Payment Verification and Rejection
CREATE OR REPLACE FUNCTION public.trg_order_audit_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.action = 'PAYMENT_VERIFIED' THEN
    PERFORM public.enqueue_notification(
      NEW.order_id,
      'payment_verified',
      NEW.details->>'submission_id',
      jsonb_build_object(
        'utr', NEW.details->>'utr',
        'verified_at', NEW.created_at
      )
    );
  ELSIF NEW.action = 'PAYMENT_REJECTED' THEN
    PERFORM public.enqueue_notification(
      NEW.order_id,
      'payment_rejected',
      NEW.details->>'submission_id',
      jsonb_build_object(
        'utr', NEW.details->>'utr',
        'reject_reason', coalesce(NEW.details->>'reject_reason', 'Payment could not be matched')
      )
    );
  ELSIF NEW.action = 'ORDER_EXPIRED' THEN
    PERFORM public.enqueue_notification(
      NEW.order_id,
      'order_expired',
      NULL,
      jsonb_build_object(
        'expired_at', NEW.created_at
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_audit_notifications ON public.order_audit_log;
CREATE TRIGGER trg_order_audit_notifications
  AFTER INSERT ON public.order_audit_log
  FOR EACH ROW
  WHEN (NEW.action IN ('PAYMENT_VERIFIED', 'PAYMENT_REJECTED', 'ORDER_EXPIRED'))
  EXECUTE FUNCTION public.trg_order_audit_notifications();
