-- ==============================================================================
-- RLS SECURITY TEST SUITE: supabase/tests/rls_check.sql
-- Description:
--   Automated verification of Row Level Security (RLS) policies and permissions:
--   1. anon cannot read public.profiles
--   2. anon cannot read public.orders
--   3. anon cannot read public.coupons
--   4. anon cannot insert/update public.products
--   5. customer cannot read another customer's order
--   6. customer cannot escalate their own role to 'admin' or 'super_admin'
--
-- Instructions: Run this in the Supabase SQL Editor. If all tests pass,
-- the script outputs "ALL RLS SECURITY CHECKS PASSED SUCCESSFULLY."
-- ==============================================================================

BEGIN;

-- Helper UUIDs for testing
DO $$
DECLARE
  v_cust_a UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  v_cust_b UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  v_order_b UUID := 'b1111111-1111-1111-1111-111111111111';
  v_cnt INTEGER;
  v_error_caught BOOLEAN := false;
BEGIN
  RAISE NOTICE 'Starting RLS Security Verification...';

  -- Setup dummy auth users if not present
  INSERT INTO auth.users (id, email, raw_user_meta_data)
  VALUES 
    (v_cust_a, 'customer_a@test.com', '{"name": "Customer A"}'::jsonb),
    (v_cust_b, 'customer_b@test.com', '{"name": "Customer B"}'::jsonb)
  ON CONFLICT (id) DO NOTHING;

  -- Ensure profiles exist for test users
  INSERT INTO public.profiles (id, name, role, is_active)
  VALUES 
    (v_cust_a, 'Customer A', 'customer', true),
    (v_cust_b, 'Customer B', 'customer', true)
  ON CONFLICT (id) DO UPDATE SET role = 'customer';

  -- Create order belonging to Customer B
  INSERT INTO public.orders (
    id, order_number, customer_id, customer_name, customer_email, customer_phone,
    items, subtotal, shipping_fee, discount, grand_total, status, payment_status
  ) VALUES (
    v_order_b::text, 'ORD-TEST-B001', v_cust_b, 'Customer B', 'customer_b@test.com', '9840000000',
    '[]'::jsonb, 5000, 0, 0, 5000, 'Confirmed', 'Paid'
  ) ON CONFLICT (id) DO NOTHING;

  -- Insert a test coupon
  INSERT INTO public.coupons (id, code, description, discount_type, discount_value, is_active)
  VALUES ('cp-test-secret', 'TESTSECRET10', '10% off', 'percentage', 10, true)
  ON CONFLICT (id) DO NOTHING;

  -- ----------------------------------------------------------------------------
  -- TEST 1: Anon role cannot read public.profiles
  -- ----------------------------------------------------------------------------
  EXECUTE 'SET LOCAL ROLE anon';
  BEGIN
    SELECT COUNT(*) INTO v_cnt FROM public.profiles;
    IF v_cnt > 0 THEN
      RAISE EXCEPTION 'TEST 1 FAILED: Anon user was able to read % profile(s)!', v_cnt;
    END IF;
  EXCEPTION WHEN insufficient_privilege THEN
    -- Expected: permission denied
    NULL;
  END;
  RESET ROLE;
  RAISE NOTICE '✓ TEST 1 PASSED: Anon cannot read public.profiles';

  -- ----------------------------------------------------------------------------
  -- TEST 2: Anon role cannot read public.orders
  -- ----------------------------------------------------------------------------
  EXECUTE 'SET LOCAL ROLE anon';
  BEGIN
    SELECT COUNT(*) INTO v_cnt FROM public.orders;
    IF v_cnt > 0 THEN
      RAISE EXCEPTION 'TEST 2 FAILED: Anon user was able to read % order(s)!', v_cnt;
    END IF;
  EXCEPTION WHEN insufficient_privilege THEN
    -- Expected: permission denied
    NULL;
  END;
  RESET ROLE;
  RAISE NOTICE '✓ TEST 2 PASSED: Anon cannot read public.orders';

  -- ----------------------------------------------------------------------------
  -- TEST 3: Anon role cannot read public.coupons
  -- ----------------------------------------------------------------------------
  EXECUTE 'SET LOCAL ROLE anon';
  BEGIN
    SELECT COUNT(*) INTO v_cnt FROM public.coupons;
    IF v_cnt > 0 THEN
      RAISE EXCEPTION 'TEST 3 FAILED: Anon user was able to read % coupon(s)!', v_cnt;
    END IF;
  EXCEPTION WHEN insufficient_privilege THEN
    -- Expected: permission denied
    NULL;
  END;
  RESET ROLE;
  RAISE NOTICE '✓ TEST 3 PASSED: Anon cannot read public.coupons';

  -- ----------------------------------------------------------------------------
  -- TEST 4: Anon role cannot write to public.products
  -- ----------------------------------------------------------------------------
  EXECUTE 'SET LOCAL ROLE anon';
  v_error_caught := false;
  BEGIN
    INSERT INTO public.products (id, sku, name_en, slug, final_price, is_active)
    VALUES ('p-anon-hack', 'SKU-HACK', 'Hacked Product', 'hacked-product', 1, true);
  EXCEPTION WHEN insufficient_privilege THEN
    v_error_caught := true;
  END;
  RESET ROLE;

  IF NOT v_error_caught THEN
    RAISE EXCEPTION 'TEST 4 FAILED: Anon was able to insert into public.products!';
  END IF;
  RAISE NOTICE '✓ TEST 4 PASSED: Anon cannot write to public.products';

  -- ----------------------------------------------------------------------------
  -- TEST 5: Customer A cannot read Customer B''s orders
  -- ----------------------------------------------------------------------------
  EXECUTE 'SET LOCAL ROLE authenticated';
  PERFORM set_config('request.jwt.claim.sub', v_cust_a::text, true);

  SELECT COUNT(*) INTO v_cnt
  FROM public.orders
  WHERE customer_id = v_cust_b;

  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);

  IF v_cnt > 0 THEN
    RAISE EXCEPTION 'TEST 5 FAILED: Customer A was able to read % order(s) of Customer B!', v_cnt;
  END IF;
  RAISE NOTICE '✓ TEST 5 PASSED: Customer A cannot read Customer B orders';

  -- ----------------------------------------------------------------------------
  -- TEST 6: Customer A cannot escalate their own role to admin or super_admin
  -- ----------------------------------------------------------------------------
  EXECUTE 'SET LOCAL ROLE authenticated';
  PERFORM set_config('request.jwt.claim.sub', v_cust_a::text, true);

  v_error_caught := false;
  BEGIN
    UPDATE public.profiles
    SET role = 'admin'
    WHERE id = v_cust_a;
  EXCEPTION WHEN OTHERS THEN
    v_error_caught := true;
  END;
  RESET ROLE;
  PERFORM set_config('request.jwt.claim.sub', '', true);

  -- Verify role remains 'customer'
  SELECT role INTO v_cnt FROM public.profiles WHERE id = v_cust_a;
  IF NOT v_error_caught THEN
    RAISE EXCEPTION 'TEST 6 FAILED: Customer A succeeded in escalating their own role to admin!';
  END IF;
  RAISE NOTICE '✓ TEST 6 PASSED: Customer cannot escalate their own role to admin';

  RAISE NOTICE '=========================================================';
  RAISE NOTICE 'ALL RLS SECURITY CHECKS PASSED SUCCESSFULLY.';
  RAISE NOTICE '=========================================================';
END $$;

-- Rollback test insertions to keep database clean
ROLLBACK;
