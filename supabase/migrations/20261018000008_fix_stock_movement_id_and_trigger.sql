-- ==============================================================================
-- Migration: 20261018000008_fix_stock_movement_id_and_trigger.sql
-- Description:
--   1. Adds default ID generation to stock_movements table ('mov-' || gen_random_uuid())
--   2. Updates trg_audit_stock_movement() to ensure valid ID, type, sku, and names
--   3. Updates place_order, update_order_status, and cancel_order to rely cleanly
--      on the automated DB trigger or populate all non-null columns
-- ==============================================================================

-- 1. Ensure stock_movements.id has a default value
ALTER TABLE public.stock_movements 
  ALTER COLUMN id SET DEFAULT ('mov-' || gen_random_uuid()::TEXT);

-- 2. Harden trg_audit_stock_movement
CREATE OR REPLACE FUNCTION public.trg_audit_stock_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  IF NEW.stock IS DISTINCT FROM OLD.stock THEN
    INSERT INTO public.stock_movements (
      id,
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
      'mov-' || gen_random_uuid()::TEXT,
      NEW.id,
      NEW.name_en,
      NEW.sku,
      CASE WHEN NEW.stock > OLD.stock THEN 'RESTOCK' ELSE 'SALE' END,
      NEW.stock - OLD.stock,
      OLD.stock,
      NEW.stock,
      COALESCE(current_setting('nirai.stock_reason', TRUE), 'Catalog stock modification'),
      COALESCE(current_setting('nirai.performed_by', TRUE), COALESCE(auth.uid()::TEXT, 'System')),
      now()
    );
  END IF;
  RETURN NEW;
END;
$$;

-- 3. Update place_order to avoid duplicate stock movement insertion
-- Since trg_audit_product_stock already triggers on UPDATE OF stock ON products,
-- we set session variables nirai.stock_reason and nirai.performed_by before updating products.

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

  -- 4. Read Shipping Settings
  SELECT 
    COALESCE(free_shipping_threshold, 1500),
    COALESCE(standard_shipping_fee, 120),
    shipping_rules
  INTO v_free_threshold, v_std_fee, v_shipping_rules
  FROM public.settings
  LIMIT 1;

  -- 5. Generate Order Identifiers before loop for audit reason
  v_order_number := 'NIRAI-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.order_number_seq')::TEXT, 5, '0');
  v_order_id := 'ord-' || gen_random_uuid()::TEXT;

  -- Set contextual variables for audit trigger
  PERFORM set_config('nirai.stock_reason', 'Order Placed #' || v_order_number, TRUE);
  PERFORM set_config('nirai.performed_by', v_customer_name, TRUE);

  -- 6. Lock and Validate Products in DB (FOR UPDATE)
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
      RAISE EXCEPTION 'Product "%" has been discontinued.', v_prod.name_en;
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

    -- Decrement stock (this fires trg_audit_stock_movement automatically)
    UPDATE public.products
    SET stock = stock - v_qty, updated_at = now()
    WHERE id = v_prod.id;
  END LOOP;

  -- 7. Shipping Fee Computation
  IF v_subtotal >= v_free_threshold THEN
    v_shipping_fee := 0;
  ELSE
    IF v_pincode ~ '^6[0-4][0-9]{4}$' THEN
      v_shipping_fee := COALESCE((v_shipping_rules->>'tamilNaduStandard')::NUMERIC, 80);
    ELSE
      v_shipping_fee := COALESCE((v_shipping_rules->>'indiaStandard')::NUMERIC, v_std_fee);
    END IF;
  END IF;

  -- 8. Validate and Lock Coupon
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

    -- Increment usage count
    UPDATE public.coupons
    SET usage_count = COALESCE(usage_count, 0) + 1
    WHERE id = v_coupon.id;
  END IF;

  v_grand_total := GREATEST(0, v_subtotal - v_discount + v_shipping_fee);

  -- 9. Insert Verified Order
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
    'Pending',
    'Pending',
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

  RETURN jsonb_build_object(
    'success', TRUE,
    'order_id', v_order_id,
    'order_number', v_order_number
  );
END;
$$;
