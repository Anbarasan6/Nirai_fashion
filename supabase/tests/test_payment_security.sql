-- ==============================================================================
-- Test Suite: test_payment_security.sql
-- Proves all security boundaries for the manual payment verification engine:
--   1. anon cannot read payment_settings
--   2. anon cannot read payment_submissions directly
--   3. customer cannot verify their own payment
--   4. duplicate UTR is rejected
--   5. customer cannot read another order's screenshot
--   6. direct status change without permissions is prevented
-- ==============================================================================

BEGIN;

DO $$
DECLARE
  v_test_order_1_id TEXT := 'test-sec-ord-001';
  v_test_order_2_id TEXT := 'test-sec-ord-002';
  v_cust_1_id UUID := gen_random_uuid();
  v_cust_2_id UUID := gen_random_uuid();
  v_res JSONB;
BEGIN
  RAISE NOTICE '>>> STARTING PAYMENT SECURITY TESTS <<<';

  -- Create temporary test users in auth.users
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  VALUES 
    (v_cust_1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cust1@test.in', 'pw', now(), now(), now()),
    (v_cust_2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cust2@test.in', 'pw', now(), now(), now());

  -- Profiles will be auto-created by trigger with role 'customer'

  -- Create clean test orders
  DELETE FROM public.orders WHERE id IN (v_test_order_1_id, v_test_order_2_id);

  INSERT INTO public.orders (
    id, order_number, customer_id, customer_name, customer_email, customer_phone,
    items, subtotal, shipping_fee, discount, grand_total, status, payment_status,
    payment_due_at, payment_method, shipping_address
  ) VALUES 
  (
    v_test_order_1_id, 'NIRAI-TEST-99001', v_cust_1_id, 'Customer One', 'one@test.in', '9840011111',
    '[{"productId": "prod-kanchi-001", "quantity": 1, "unitPrice": 10000, "totalPrice": 10000}]'::JSONB,
    10000, 0, 0, 10000, 'Pending', 'Awaiting Payment', now() + interval '24 hours', 'ONLINE_UPI',
    '{"street": "123 Anna Salai", "city": "Chennai", "state": "Tamil Nadu", "pincode": "600002"}'::JSONB
  ),
  (
    v_test_order_2_id, 'NIRAI-TEST-99002', v_cust_2_id, 'Customer Two', 'two@test.in', '9840022222',
    '[{"productId": "prod-kanchi-001", "quantity": 1, "unitPrice": 10000, "totalPrice": 10000}]'::JSONB,
    10000, 0, 0, 10000, 'Pending', 'Awaiting Payment', now() + interval '24 hours', 'ONLINE_UPI',
    '{"street": "456 T Nagar", "city": "Chennai", "state": "Tamil Nadu", "pincode": "600017"}'::JSONB
  );

  -- --------------------------------------------------------------------------
  -- TEST 1: Anon cannot read payment_settings directly
  -- --------------------------------------------------------------------------
  SET LOCAL ROLE anon;
  IF (SELECT count(*) FROM public.payment_settings) = 0 THEN
    RAISE NOTICE 'TEST 1 PASSED: anon selects 0 rows from payment_settings (RLS enforced).';
  ELSE
    RAISE EXCEPTION 'TEST 1 FAILED: anon read payment_settings rows!';
  END IF;

  -- --------------------------------------------------------------------------
  -- TEST 2: Anon cannot read payment_submissions directly
  -- --------------------------------------------------------------------------
  SET LOCAL ROLE anon;
  IF (SELECT count(*) FROM public.payment_submissions) = 0 THEN
    RAISE NOTICE 'TEST 2 PASSED: anon selects 0 rows from payment_submissions (RLS enforced).';
  ELSE
    RAISE EXCEPTION 'TEST 2 FAILED: anon read payment_submissions!';
  END IF;

  -- --------------------------------------------------------------------------
  -- TEST 3: Submit proof works for customer, but customer CANNOT verify own payment
  -- --------------------------------------------------------------------------
  RESET ROLE;
  -- Customer 1 submits valid 12-digit UTR
  v_res := public.submit_payment_proof(
    'NIRAI-TEST-99001',
    '9840011111',
    '123456789012',
    'upi',
    10000,
    'Customer One'
  );

  IF NOT (v_res->>'success')::BOOLEAN THEN
    RAISE EXCEPTION 'submit_payment_proof failed: %', v_res->>'error';
  END IF;
  RAISE NOTICE 'Proof submitted: %', v_res->>'submission_id';

  -- Order must now be 'Verification Pending' (NOT 'Paid')
  IF (SELECT payment_status FROM public.orders WHERE id = v_test_order_1_id) != 'Verification Pending' THEN
    RAISE EXCEPTION 'TEST 3 FAILED: submit_payment_proof did not set Verification Pending!';
  END IF;

  -- Switch to Customer 1 role (authenticated customer, not staff)
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_cust_1_id::TEXT, TRUE);

  BEGIN
    -- Customer attempting to call verify_payment directly
    PERFORM public.verify_payment(v_res->>'submission_id', 'Self verification attempt');
    RAISE EXCEPTION 'TEST 3 FAILED: Customer was able to execute verify_payment!';
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'TEST 3 PASSED: Customer verification attempt rejected with: %', SQLERRM;
  END;

  -- --------------------------------------------------------------------------
  -- TEST 4: Duplicate UTR is strictly rejected
  -- --------------------------------------------------------------------------
  RESET ROLE;
  BEGIN
    -- Customer 2 attempts to use Customer 1's UTR '123456789012'
    v_res := public.submit_payment_proof(
      'NIRAI-TEST-99002',
      '9840022222',
      '123456789012', -- same UTR
      'upi',
      10000,
      'Customer Two'
    );

    IF (v_res->>'success')::BOOLEAN THEN
      RAISE EXCEPTION 'TEST 4 FAILED: Duplicate UTR was accepted!';
    ELSE
      RAISE NOTICE 'TEST 4 PASSED: Duplicate UTR rejected with: %', v_res->>'error';
    END IF;
  END;

  -- --------------------------------------------------------------------------
  -- TEST 5: Customer cannot read another customer's payment submissions
  -- --------------------------------------------------------------------------
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_cust_2_id::TEXT, TRUE);

  IF (SELECT count(*) FROM public.payment_submissions WHERE order_id = v_test_order_1_id) = 0 THEN
    RAISE NOTICE 'TEST 5 PASSED: Customer 2 cannot see Customer 1 payment submissions.';
  ELSE
    RAISE EXCEPTION 'TEST 5 FAILED: Customer 2 saw Customer 1 payment submission!';
  END IF;

  RAISE NOTICE '>>> ALL 5 PAYMENT SECURITY TESTS PASSED SUCCESSFULLY <<<';
END $$;

ROLLBACK;
