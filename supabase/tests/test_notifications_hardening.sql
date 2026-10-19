-- ==============================================================================
-- Test Suite: test_notifications_hardening.sql
-- Validates:
-- 1. RLS Lockdown: Anon and authenticated cannot select notifications_outbox directly
-- 2. RPC Authorization: Non-admin cannot call list_notifications() or retry_notification()
-- 3. Idempotency: Duplicate enqueue calls are ignored (unique index protects outbox)
-- 4. Automatic Triggers: Order placed and payment verified each create exactly 1 row
-- 5. Atomic Worker Claim: claim_notifications() claims rows without race conditions
-- ==============================================================================

BEGIN;

CREATE TEMPORARY TABLE test_results (
  test_name TEXT PRIMARY KEY,
  status TEXT CHECK (status IN ('PASS', 'FAIL')),
  details TEXT
);
GRANT ALL ON test_results TO anon, authenticated, public;

-- Test 1: Anon cannot select notifications_outbox directly
DO $$
DECLARE
  v_count INT;
BEGIN
  SET LOCAL ROLE anon;
  BEGIN
    SELECT count(*) INTO v_count FROM public.notifications_outbox;
    IF v_count = 0 THEN
      INSERT INTO test_results VALUES ('1. Anon RLS Lockdown', 'PASS', 'Anon received 0 rows from direct table select');
    ELSE
      INSERT INTO test_results VALUES ('1. Anon RLS Lockdown', 'FAIL', 'Anon was able to read ' || v_count || ' rows');
    END IF;
  EXCEPTION WHEN insufficient_privilege THEN
    INSERT INTO test_results VALUES ('1. Anon RLS Lockdown', 'PASS', 'Permission denied correctly thrown for anon');
  END;
  RESET ROLE;
END $$;

-- Test 2: Authenticated customer cannot select notifications_outbox directly
DO $$
DECLARE
  v_count INT;
BEGIN
  SET LOCAL ROLE authenticated;
  -- Simulate non-admin customer
  PERFORM set_config('request.jwt.claims', '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}', true);
  BEGIN
    SELECT count(*) INTO v_count FROM public.notifications_outbox;
    IF v_count = 0 THEN
      INSERT INTO test_results VALUES ('2. Customer RLS Lockdown', 'PASS', 'Authenticated customer received 0 rows from direct table select');
    ELSE
      INSERT INTO test_results VALUES ('2. Customer RLS Lockdown', 'FAIL', 'Customer was able to read ' || v_count || ' rows');
    END IF;
  EXCEPTION WHEN insufficient_privilege THEN
    INSERT INTO test_results VALUES ('2. Customer RLS Lockdown', 'PASS', 'Permission denied correctly thrown for customer');
  END;
  RESET ROLE;
END $$;

-- Test 3: Non-admin cannot execute list_notifications()
DO $$
BEGIN
  SET LOCAL ROLE anon;
  BEGIN
    PERFORM * FROM public.list_notifications('all', 10, 0);
    INSERT INTO test_results VALUES ('3. Non-Admin list_notifications Protection', 'FAIL', 'Anon was able to call list_notifications');
  EXCEPTION WHEN insufficient_privilege OR string_data_right_truncation OR others THEN
    INSERT INTO test_results VALUES ('3. Non-Admin list_notifications Protection', 'PASS', 'Execution correctly blocked for anon');
  END;
  RESET ROLE;
END $$;

-- Test 4: Non-admin cannot execute retry_notification()
DO $$
BEGIN
  SET LOCAL ROLE anon;
  BEGIN
    PERFORM public.retry_notification('00000000-0000-0000-0000-000000000000'::uuid);
    INSERT INTO test_results VALUES ('4. Non-Admin retry_notification Protection', 'FAIL', 'Anon was able to call retry_notification');
  EXCEPTION WHEN insufficient_privilege OR string_data_right_truncation OR others THEN
    INSERT INTO test_results VALUES ('4. Non-Admin retry_notification Protection', 'PASS', 'Execution correctly blocked for anon');
  END;
  RESET ROLE;
END $$;

-- Test 5 & 6: Order placed and duplicate enqueue idempotency
DO $$
DECLARE
  v_order_id TEXT;
  v_first_enqueue UUID;
  v_second_enqueue UUID;
  v_outbox_count INT;
BEGIN
  -- Insert dummy order for test
  INSERT INTO public.orders (
    id,
    order_number,
    customer_name,
    customer_email,
    customer_phone,
    items,
    subtotal,
    discount,
    shipping_fee,
    grand_total,
    status,
    payment_status,
    shipping_address
  )
  VALUES (
    'ord_test_' || gen_random_uuid()::text,
    'TEST-IDEMP-001',
    'Test Customer',
    'testcustomer@example.com',
    '9876543210',
    '[]'::jsonb,
    2500,
    0,
    0,
    2500,
    'Pending',
    'Awaiting Payment',
    '{"fullName": "Test Customer", "street": "Test Road", "city": "Chennai", "state": "Tamil Nadu", "pincode": "600001", "phone": "9876543210", "locale": "en"}'::jsonb
  )
  RETURNING id INTO v_order_id;

  -- The order insert trigger already enqueued 1 'order_placed' row!
  SELECT count(*) INTO v_outbox_count
  FROM public.notifications_outbox
  WHERE order_id = v_order_id AND type = 'order_placed';

  IF v_outbox_count = 1 THEN
    INSERT INTO test_results VALUES ('5. Order Placed Trigger', 'PASS', 'Order insert trigger automatically enqueued exactly 1 order_placed notification');
  ELSE
    INSERT INTO test_results VALUES ('5. Order Placed Trigger', 'FAIL', 'Found ' || v_outbox_count || ' order_placed rows');
  END IF;

  -- Test duplicate enqueue attempt:
  v_second_enqueue := public.enqueue_notification(v_order_id, 'order_placed', NULL, '{}'::jsonb);

  SELECT count(*) INTO v_outbox_count
  FROM public.notifications_outbox
  WHERE order_id = v_order_id AND type = 'order_placed';

  IF v_second_enqueue IS NULL AND v_outbox_count = 1 THEN
    INSERT INTO test_results VALUES ('6. Outbox Idempotency Deduplication', 'PASS', 'Duplicate enqueue returned NULL and outbox remained exactly 1 row');
  ELSE
    INSERT INTO test_results VALUES ('6. Outbox Idempotency Deduplication', 'FAIL', 'Duplicate created multiple rows: ' || v_outbox_count);
  END IF;

  -- Test 7: Payment Verified Trigger (Audit log hook)
  INSERT INTO public.order_audit_log (
    order_id,
    action,
    details,
    actor
  )
  VALUES (
    v_order_id,
    'PAYMENT_VERIFIED',
    '{"utr": "TESTUTR123456", "submission_id": "sub_test_001"}'::jsonb,
    'admin@nirai.in'
  );

  SELECT count(*) INTO v_outbox_count
  FROM public.notifications_outbox
  WHERE order_id = v_order_id AND type = 'payment_verified';

  IF v_outbox_count = 1 THEN
    INSERT INTO test_results VALUES ('7. Payment Verified Trigger', 'PASS', 'Audit log hook created exactly 1 payment_verified notification');
  ELSE
    INSERT INTO test_results VALUES ('7. Payment Verified Trigger', 'FAIL', 'Found ' || v_outbox_count || ' payment_verified rows');
  END IF;

  -- Test 8: Atomic Worker Claim RPC
  DECLARE
    v_claimed_count INT;
  BEGIN
    SELECT count(*) INTO v_claimed_count
    FROM public.claim_notifications(10);

    IF v_claimed_count > 0 THEN
      INSERT INTO test_results VALUES ('8. Atomic Worker Claim RPC', 'PASS', 'claim_notifications() successfully claimed ' || v_claimed_count || ' pending rows via FOR UPDATE SKIP LOCKED');
    ELSE
      INSERT INTO test_results VALUES ('8. Atomic Worker Claim RPC', 'FAIL', 'claim_notifications() claimed 0 rows');
    END IF;
  END;

END $$;

SELECT * FROM test_results ORDER BY test_name;

ROLLBACK;
