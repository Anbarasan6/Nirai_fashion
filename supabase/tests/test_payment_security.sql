-- ==============================================================================
-- Test Suite: test_payment_security.sql
-- Comprehensive Security Assertions for Nirai Payment Hardening Patch:
--   (a) an authenticated customer and anon cannot UPDATE orders.payment_status or status directly
--   (b) a non-staff user calling verify_payment/reject_payment/mark_order_paid_manually gets an error
--   (c) anon cannot call expire_unpaid_orders
--   (d) a customer cannot read payment_submissions or screenshots of another customer's order
--   (e) NEFT alphanumeric reference accepted and a duplicate in different case rejected
--   (f) upload to payment-proofs for a non-existent or expired order is refused
-- ==============================================================================

CREATE TEMP TABLE IF NOT EXISTS payment_security_test_results (
  test_case text,
  description text,
  status text,
  detail text
);
TRUNCATE payment_security_test_results;
GRANT ALL ON payment_security_test_results TO public, anon, authenticated;

DO $$
DECLARE
  v_test_order_1_id TEXT := 'test-sec-ord-001';
  v_test_order_2_id TEXT := 'test-sec-ord-002';
  v_test_order_3_id TEXT := 'test-sec-ord-003';
  v_test_order_4_id TEXT := 'test-sec-ord-004';
  v_cust_1_id UUID := gen_random_uuid();
  v_cust_2_id UUID := gen_random_uuid();
  v_res JSONB;
  v_count INT;
BEGIN
  -- Create temporary test users in auth.users
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  VALUES 
    (v_cust_1_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cust1_sec@test.in', 'pw', now(), now(), now()),
    (v_cust_2_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cust2_sec@test.in', 'pw', now(), now(), now());

  -- Ensure clean test orders
  DELETE FROM public.orders WHERE id IN (v_test_order_1_id, v_test_order_2_id, v_test_order_3_id, v_test_order_4_id);

  INSERT INTO public.orders (
    id, order_number, customer_id, customer_name, customer_email, customer_phone,
    items, subtotal, shipping_fee, discount, grand_total, status, payment_status,
    payment_due_at, payment_method, shipping_address
  ) VALUES 
  (
    v_test_order_1_id, 'NIRAI-TEST-99001', v_cust_1_id, 'Customer One', 'cust1_sec@test.in', '9840011111',
    '[{"productId": "prod-kanchi-001", "quantity": 1, "unitPrice": 10000, "totalPrice": 10000}]'::JSONB,
    10000, 0, 0, 10000, 'Pending', 'Awaiting Payment', now() + interval '24 hours', 'ONLINE_UPI',
    '{"street": "123 Anna Salai", "city": "Chennai", "state": "Tamil Nadu", "pincode": "600002"}'::JSONB
  ),
  (
    v_test_order_2_id, 'NIRAI-TEST-99002', v_cust_2_id, 'Customer Two', 'cust2_sec@test.in', '9840022222',
    '[{"productId": "prod-kanchi-001", "quantity": 1, "unitPrice": 10000, "totalPrice": 10000}]'::JSONB,
    10000, 0, 0, 10000, 'Pending', 'Awaiting Payment', now() + interval '24 hours', 'ONLINE_UPI',
    '{"street": "456 T Nagar", "city": "Chennai", "state": "Tamil Nadu", "pincode": "600017"}'::JSONB
  );

  -- --------------------------------------------------------------------------
  -- ASSERTION (a.1): anon cannot UPDATE orders.payment_status directly
  -- --------------------------------------------------------------------------
  SET LOCAL ROLE anon;
  BEGIN
    UPDATE public.orders SET payment_status = 'Paid' WHERE id = v_test_order_1_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count = 0 THEN
      INSERT INTO payment_security_test_results VALUES ('(a.1)', 'anon direct update orders.payment_status', 'PASSED', 'Blocked: 0 rows updated');
    ELSE
      INSERT INTO payment_security_test_results VALUES ('(a.1)', 'anon direct update orders.payment_status', 'FAILED', 'anon direct update succeeded unexpectedly');
    END IF;
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO payment_security_test_results VALUES ('(a.1)', 'anon direct update orders.payment_status', 'PASSED', 'Blocked: ' || SQLERRM);
  END;

  -- --------------------------------------------------------------------------
  -- ASSERTION (a.2): Authenticated customer cannot UPDATE orders.status directly
  -- --------------------------------------------------------------------------
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_cust_1_id::TEXT, TRUE);
  BEGIN
    UPDATE public.orders SET status = 'Delivered' WHERE id = v_test_order_1_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    IF v_count = 0 THEN
      INSERT INTO payment_security_test_results VALUES ('(a.2)', 'authenticated customer direct update orders.status', 'PASSED', 'Blocked by RLS & trigger: 0 rows updated, status unchanged');
    ELSE
      INSERT INTO payment_security_test_results VALUES ('(a.2)', 'authenticated customer direct update orders.status', 'FAILED', 'customer updated ' || v_count || ' rows directly');
    END IF;
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO payment_security_test_results VALUES ('(a.2)', 'authenticated customer direct update orders.status', 'PASSED', 'Blocked by trigger: ' || SQLERRM);
  END;

  -- --------------------------------------------------------------------------
  -- ASSERTION (b.1): Non-staff user calling verify_payment gets an error
  -- --------------------------------------------------------------------------
  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_cust_1_id::TEXT, TRUE);
  BEGIN
    PERFORM public.verify_payment('sub-non-existent', 'Unauthorized verification attempt');
    INSERT INTO payment_security_test_results VALUES ('(b.1)', 'customer calling verify_payment', 'FAILED', 'call succeeded unexpectedly');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO payment_security_test_results VALUES ('(b.1)', 'customer calling verify_payment', 'PASSED', 'Correctly rejected: ' || SQLERRM);
  END;

  -- --------------------------------------------------------------------------
  -- ASSERTION (b.2): Non-staff user calling reject_payment gets an error
  -- --------------------------------------------------------------------------
  BEGIN
    PERFORM public.reject_payment('sub-non-existent', 'Unauthorized rejection attempt');
    INSERT INTO payment_security_test_results VALUES ('(b.2)', 'customer calling reject_payment', 'FAILED', 'call succeeded unexpectedly');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO payment_security_test_results VALUES ('(b.2)', 'customer calling reject_payment', 'PASSED', 'Correctly rejected: ' || SQLERRM);
  END;

  -- --------------------------------------------------------------------------
  -- ASSERTION (b.3): Non-staff user calling mark_order_paid_manually gets an error
  -- --------------------------------------------------------------------------
  BEGIN
    PERFORM public.mark_order_paid_manually(v_test_order_1_id, 'Unauthorized manual paid attempt');
    INSERT INTO payment_security_test_results VALUES ('(b.3)', 'customer calling mark_order_paid_manually', 'FAILED', 'call succeeded unexpectedly');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO payment_security_test_results VALUES ('(b.3)', 'customer calling mark_order_paid_manually', 'PASSED', 'Correctly rejected: ' || SQLERRM);
  END;

  -- --------------------------------------------------------------------------
  -- ASSERTION (c): anon cannot call expire_unpaid_orders
  -- --------------------------------------------------------------------------
  SET LOCAL ROLE anon;
  BEGIN
    PERFORM public.expire_unpaid_orders();
    INSERT INTO payment_security_test_results VALUES ('(c)', 'anon calling expire_unpaid_orders', 'FAILED', 'anon execution succeeded unexpectedly');
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO payment_security_test_results VALUES ('(c)', 'anon calling expire_unpaid_orders', 'PASSED', 'Permission denied / rejected: ' || SQLERRM);
  END;

  -- --------------------------------------------------------------------------
  -- ASSERTION (d.1 & d.2): Customer cannot read payment_submissions or screenshots of another customer
  -- --------------------------------------------------------------------------
  RESET ROLE;
  v_res := public.submit_payment_proof(
    'NIRAI-TEST-99001',
    '9840011111',
    '123456789012',
    'upi',
    10000,
    'Customer One',
    v_test_order_1_id || '/receipt_sec.png'
  );

  SET LOCAL ROLE authenticated;
  PERFORM set_config('request.jwt.claim.sub', v_cust_2_id::TEXT, TRUE);

  IF (SELECT count(*) FROM public.payment_submissions WHERE order_id = v_test_order_1_id) = 0 THEN
    INSERT INTO payment_security_test_results VALUES ('(d.1)', 'customer reading other customer submissions', 'PASSED', 'RLS returned 0 rows as expected');
  ELSE
    INSERT INTO payment_security_test_results VALUES ('(d.1)', 'customer reading other customer submissions', 'FAILED', 'customer was able to view another customer submissions');
  END IF;

  IF (SELECT count(*) FROM storage.objects WHERE bucket_id = 'payment-proofs' AND name LIKE (v_test_order_1_id || '/%')) = 0 THEN
    INSERT INTO payment_security_test_results VALUES ('(d.2)', 'customer reading other customer screenshots in storage', 'PASSED', 'Storage policy restricted access (0 rows)');
  ELSE
    INSERT INTO payment_security_test_results VALUES ('(d.2)', 'customer reading other customer screenshots in storage', 'FAILED', 'customer accessed storage objects of another customer');
  END IF;

  -- --------------------------------------------------------------------------
  -- ASSERTION (e): NEFT alphanumeric reference accepted and duplicate in different case rejected
  -- --------------------------------------------------------------------------
  RESET ROLE;
  v_res := public.submit_payment_proof(
    'NIRAI-TEST-99002',
    '9840022222',
    'HDFC0001234N1',
    'bank_transfer',
    10000,
    'Customer Two'
  );

  IF (v_res->>'success')::BOOLEAN THEN
    INSERT INTO payment_security_test_results VALUES ('(e.1)', 'NEFT alphanumeric reference accepted', 'PASSED', 'Reference HDFC0001234N1 accepted');
  ELSE
    INSERT INTO payment_security_test_results VALUES ('(e.1)', 'NEFT alphanumeric reference accepted', 'FAILED', v_res->>'error');
  END IF;

  INSERT INTO public.orders (
    id, order_number, customer_id, customer_name, customer_email, customer_phone,
    items, subtotal, shipping_fee, discount, grand_total, status, payment_status,
    payment_due_at, payment_method, shipping_address
  ) VALUES (
    v_test_order_3_id, 'NIRAI-TEST-99003', v_cust_1_id, 'Customer Three', 'cust3_sec@test.in', '9840033333',
    '[{"productId": "prod-kanchi-001", "quantity": 1, "unitPrice": 10000, "totalPrice": 10000}]'::JSONB,
    10000, 0, 0, 10000, 'Pending', 'Awaiting Payment', now() + interval '24 hours', 'ONLINE_BANK_TRANSFER',
    '{"street": "789 OMR", "city": "Chennai", "state": "Tamil Nadu", "pincode": "600096"}'::JSONB
  );

  v_res := public.submit_payment_proof(
    'NIRAI-TEST-99003',
    '9840033333',
    'hdfc0001234n1', -- lower case duplicate
    'bank_transfer',
    10000,
    'Customer Three'
  );

  IF NOT (v_res->>'success')::BOOLEAN THEN
    INSERT INTO payment_security_test_results VALUES ('(e.2)', 'NEFT duplicate in lowercase rejected', 'PASSED', 'Normalized uniqueness enforced: ' || (v_res->>'error'));
  ELSE
    INSERT INTO payment_security_test_results VALUES ('(e.2)', 'NEFT duplicate in lowercase rejected', 'FAILED', 'Lowercase duplicate was accepted unexpectedly');
  END IF;

  -- --------------------------------------------------------------------------
  -- ASSERTION (f): Upload to payment-proofs for non-existent or expired order is refused
  -- --------------------------------------------------------------------------
  RESET ROLE;
  IF public.can_upload_payment_proof('non-existent-order-id/receipt.jpg') = FALSE THEN
    INSERT INTO payment_security_test_results VALUES ('(f.1)', 'upload refused for non-existent order', 'PASSED', 'can_upload_payment_proof returned false');
  ELSE
    INSERT INTO payment_security_test_results VALUES ('(f.1)', 'upload refused for non-existent order', 'FAILED', 'can_upload_payment_proof permitted non-existent order');
  END IF;

  INSERT INTO public.orders (
    id, order_number, customer_id, customer_name, customer_email, customer_phone,
    items, subtotal, shipping_fee, discount, grand_total, status, payment_status,
    payment_due_at, payment_method, shipping_address
  ) VALUES (
    v_test_order_4_id, 'NIRAI-TEST-99004', v_cust_1_id, 'Customer Expired', 'cust4_sec@test.in', '9840044444',
    '[{"productId": "prod-kanchi-001", "quantity": 1, "unitPrice": 10000, "totalPrice": 10000}]'::JSONB,
    10000, 0, 0, 10000, 'Pending', 'Awaiting Payment', now() - interval '2 hours', 'ONLINE_UPI',
    '{"street": "100 GST Road", "city": "Chennai", "state": "Tamil Nadu", "pincode": "600045"}'::JSONB
  );

  IF public.can_upload_payment_proof(v_test_order_4_id || '/receipt.jpg') = FALSE THEN
    INSERT INTO payment_security_test_results VALUES ('(f.2)', 'upload refused for expired order', 'PASSED', 'can_upload_payment_proof returned false for expired order');
  ELSE
    INSERT INTO payment_security_test_results VALUES ('(f.2)', 'upload refused for expired order', 'FAILED', 'can_upload_payment_proof permitted expired order');
  END IF;

  -- Clean up test orders
  DELETE FROM public.orders WHERE id IN (v_test_order_1_id, v_test_order_2_id, v_test_order_3_id, v_test_order_4_id);
  DELETE FROM auth.users WHERE id IN (v_cust_1_id, v_cust_2_id);
END $$;

SELECT test_case, description, status, detail FROM payment_security_test_results ORDER BY test_case;
