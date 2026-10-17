-- ==============================================================================
-- Migration: 20261018000007_server_order_engine.sql
-- Description:
--   1. Sequence for order numbers: order_number_seq
--   2. Rate limiting table for order tracking
--   3. quote_cart: server-side cart pricing, discounts, shipping, and tax calculation
--   4. place_order: atomic order placement, row locking, stock deduction, and movements
--   5. track_order: authenticated or phone+order_number lookup with rate limiting
--   6. update_order_status: staff/admin order lifecycle with transition guards & restock
--   7. cancel_order: customer self-service cancellation with automatic restock
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ORDER SEQUENCES, COLUMNS & RATE LIMITING TABLE
-- ------------------------------------------------------------------------------

-- Ensure sequence for sequential, tamper-proof order numbers
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START WITH 1001;

-- Add idempotency_key to orders table if not exists
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_orders_idempotency_key ON public.orders(idempotency_key);

-- Table for tracking rate limits (to prevent brute-force phone/order scraping)
CREATE TABLE IF NOT EXISTS public.order_tracking_rate_limits (
  id BIGSERIAL PRIMARY KEY,
  client_identifier TEXT NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tracking_rate_limits 
  ON public.order_tracking_rate_limits(client_identifier, attempted_at);

-- ------------------------------------------------------------------------------
-- 2. FUNCTION: quote_cart
-- Prices ALWAYS come from the products table, never from client input.
-- Computes subtotal, discounts (coupon validation), shipping rules, and grand total.
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.quote_cart(
  p_items JSONB,
  p_coupon_code TEXT DEFAULT NULL,
  p_pincode TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
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
  v_quoted_items JSONB := '[]'::JSONB;
  
  -- Settings
  v_free_threshold NUMERIC := 1500;
  v_std_fee NUMERIC := 120;
  v_shipping_rules JSONB;
  v_free_shipping_applied BOOLEAN := FALSE;
  
  -- Coupon
  v_coupon RECORD;
  v_coupon_valid BOOLEAN := FALSE;
  v_coupon_error TEXT := NULL;
  v_clean_coupon TEXT;
  v_clean_pincode TEXT;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'Cart is empty.'
    );
  END IF;

  -- 1. Read Store Settings for Shipping
  SELECT 
    COALESCE(free_shipping_threshold, 1500),
    COALESCE(standard_shipping_fee, 120),
    shipping_rules
  INTO v_free_threshold, v_std_fee, v_shipping_rules
  FROM public.settings
  LIMIT 1;

  -- 2. Process each cart item and compute verified prices from products table
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_prod_id := v_item->>'productId';
    IF v_prod_id IS NULL THEN
      v_prod_id := v_item->>'product_id';
    END IF;
    
    v_variant_id := v_item->>'variantId';
    IF v_variant_id IS NULL THEN
      v_variant_id := v_item->>'variant_id';
    END IF;

    v_qty := COALESCE((v_item->>'quantity')::INT, 1);
    IF v_qty <= 0 THEN
      v_qty := 1;
    END IF;

    -- Fetch product details from DB
    SELECT id, name_en, name_ta, sku, base_price, final_price, stock, is_active, variants, images
    INTO v_prod
    FROM public.products
    WHERE id = v_prod_id;

    IF NOT FOUND THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'error', 'Product not found: ' || COALESCE(v_prod_id, 'unknown')
      );
    END IF;

    IF NOT v_prod.is_active THEN
      RETURN jsonb_build_object(
        'success', FALSE,
        'error', 'Product is currently inactive: ' || v_prod.name_en
      );
    END IF;

    -- Verified price: final_price if positive, else base_price
    v_unit_price := COALESCE(NULLIF(v_prod.final_price, 0), v_prod.base_price, 0);
    v_item_total := v_unit_price * v_qty;
    v_subtotal := v_subtotal + v_item_total;

    -- Append verified item to quoted items
    v_quoted_items := v_quoted_items || jsonb_build_object(
      'productId', v_prod.id,
      'productName', v_prod.name_en,
      'productImage', COALESCE(v_prod.images->>0, ''),
      'sku', v_prod.sku,
      'variantId', v_variant_id,
      'unitPrice', v_unit_price,
      'quantity', v_qty,
      'totalPrice', v_item_total,
      'inStock', (v_prod.stock >= v_qty),
      'availableStock', v_prod.stock
    );
  END LOOP;

  -- 3. Calculate Shipping Fee based on Subtotal & Destination Pincode
  v_clean_pincode := trim(COALESCE(p_pincode, ''));
  
  IF v_subtotal >= v_free_threshold THEN
    v_shipping_fee := 0;
    v_free_shipping_applied := TRUE;
  ELSE
    -- Check if pincode belongs to Tamil Nadu (prefixes 600 - 643)
    IF v_clean_pincode ~ '^6[0-4][0-9]{4}$' THEN
      v_shipping_fee := COALESCE((v_shipping_rules->>'tamilNaduStandard')::NUMERIC, 80);
    ELSE
      v_shipping_fee := COALESCE((v_shipping_rules->>'indiaStandard')::NUMERIC, v_std_fee);
    END IF;
    v_free_shipping_applied := FALSE;
  END IF;

  -- 4. Calculate Coupon Discount if requested
  v_clean_coupon := upper(trim(COALESCE(p_coupon_code, '')));
  IF v_clean_coupon <> '' THEN
    SELECT * INTO v_coupon
    FROM public.coupons
    WHERE upper(code) = v_clean_coupon;

    IF NOT FOUND THEN
      v_coupon_valid := FALSE;
      v_coupon_error := 'Invalid coupon code';
    ELSIF NOT v_coupon.is_active THEN
      v_coupon_valid := FALSE;
      v_coupon_error := 'Coupon is inactive';
    ELSIF v_coupon.expiry_date IS NOT NULL AND v_coupon.expiry_date < now() THEN
      v_coupon_valid := FALSE;
      v_coupon_error := 'This coupon has expired';
    ELSIF v_subtotal < v_coupon.min_order_amount THEN
      v_coupon_valid := FALSE;
      v_coupon_error := 'Minimum order amount for coupon ' || v_coupon.code || ' is ₹' || v_coupon.min_order_amount::TEXT;
    ELSE
      v_coupon_valid := TRUE;
      IF lower(v_coupon.discount_type) = 'percentage' THEN
        v_discount := (v_subtotal * v_coupon.discount_value) / 100;
        IF v_coupon.max_discount IS NOT NULL AND v_coupon.max_discount > 0 THEN
          v_discount := LEAST(v_discount, v_coupon.max_discount);
        END IF;
      ELSE
        v_discount := LEAST(v_coupon.discount_value, v_subtotal);
      END IF;
      v_discount := round(v_discount);
    END IF;
  END IF;

  v_grand_total := GREATEST(0, v_subtotal - v_discount + v_shipping_fee);

  RETURN jsonb_build_object(
    'success', TRUE,
    'items', v_quoted_items,
    'subtotal', v_subtotal,
    'shippingFee', v_shipping_fee,
    'freeShippingApplied', v_free_shipping_applied,
    'freeShippingThreshold', v_free_threshold,
    'discount', v_discount,
    'coupon', jsonb_build_object(
      'code', v_clean_coupon,
      'isValid', v_coupon_valid,
      'discount', v_discount,
      'error', v_coupon_error
    ),
    'taxAmount', 0,
    'taxIncluded', TRUE,
    'grandTotal', v_grand_total
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 3. FUNCTION: place_order
-- Atomic order transaction:
--   - Locks product rows FOR UPDATE
--   - Validates active status and stock
--   - Recomputes pricing from products table
--   - Validates coupon and increments usage_count
--   - Decrements product stock
--   - Audits stock movement
--   - Generates sequential order_number
--   - Inserts order with Pending status
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

    -- Increment usage count
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

    -- Get current stock before update
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

  -- 10. Insert Verified Order
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

-- ------------------------------------------------------------------------------
-- 4. FUNCTION: track_order
-- Order tracking with phone + order_number verification and request throttling.
-- NO lookup by phone alone. Returns limited public fulfillment fields.
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.track_order(
  p_order_number TEXT,
  p_phone TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clean_order_num TEXT;
  v_clean_phone TEXT;
  v_client_ip TEXT;
  v_recent_attempts INT;
  v_ord RECORD;
  v_item JSONB;
  v_summary_items JSONB := '[]'::JSONB;
BEGIN
  v_clean_order_num := upper(trim(COALESCE(p_order_number, '')));
  v_clean_phone := regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g');

  IF v_clean_order_num = '' OR v_clean_phone = '' THEN
    RAISE EXCEPTION 'Both Order Number and Customer Phone Number are required to track an order.';
  END IF;

  -- 1. Rate Limiting Check (Max 10 queries per minute per client)
  v_client_ip := COALESCE(current_setting('request.headers', TRUE)::JSONB->>'x-forwarded-for', 'anonymous_client');

  -- Clean entries older than 10 minutes
  DELETE FROM public.order_tracking_rate_limits
  WHERE attempted_at < now() - INTERVAL '10 minutes';

  SELECT count(*) INTO v_recent_attempts
  FROM public.order_tracking_rate_limits
  WHERE client_identifier = v_client_ip
    AND attempted_at > now() - INTERVAL '1 minute';

  IF v_recent_attempts >= 10 THEN
    RAISE EXCEPTION 'Too many tracking requests. Please wait a minute before trying again.';
  END IF;

  INSERT INTO public.order_tracking_rate_limits (client_identifier, attempted_at)
  VALUES (v_client_ip, now());

  -- 2. Lookup Order (Matching BOTH order_number AND normalized phone)
  SELECT 
    id,
    order_number,
    status,
    payment_status,
    payment_method,
    shipping_details,
    items,
    grand_total,
    created_at,
    updated_at
  INTO v_ord
  FROM public.orders
  WHERE upper(order_number) = v_clean_order_num
    AND (
      regexp_replace(customer_phone, '\D', '', 'g') LIKE '%' || right(v_clean_phone, 10)
      OR right(v_clean_phone, 10) = right(regexp_replace(customer_phone, '\D', '', 'g'), 10)
    )
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No matching order found. Please verify both Order Number and Phone Number.';
  END IF;

  -- 3. Strip sensitive information; return only tracking fulfillment fields
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_ord.items)
  LOOP
    v_summary_items := v_summary_items || jsonb_build_object(
      'productName', v_item->>'productName',
      'productImage', v_item->>'productImage',
      'quantity', v_item->>'quantity',
      'unitPrice', v_item->>'unitPrice',
      'totalPrice', v_item->>'totalPrice'
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', TRUE,
    'order_number', v_ord.order_number,
    'status', v_ord.status,
    'payment_status', v_ord.payment_status,
    'payment_method', v_ord.payment_method,
    'shipping_details', v_ord.shipping_details,
    'items', v_summary_items,
    'item_count', jsonb_array_length(v_ord.items),
    'grand_total', v_ord.grand_total,
    'created_at', v_ord.created_at,
    'updated_at', v_ord.updated_at
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 5. FUNCTION: update_order_status
-- For Staff/Admin: guards valid transitions and triggers automatic stock restore
-- on Cancelled or Returned orders.
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.update_order_status(
  p_order_id TEXT,
  p_new_status TEXT,
  p_payment_status TEXT DEFAULT NULL,
  p_shipping_details JSONB DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ord RECORD;
  v_item JSONB;
  v_prod RECORD;
  v_qty INT;
BEGIN
  -- Permission check
  IF NOT public.is_staff_or_admin() THEN
    RAISE EXCEPTION 'Access denied: staff or administrator permissions required.';
  END IF;

  -- Lock order row
  SELECT * INTO v_ord
  FROM public.orders
  WHERE id = p_order_id OR order_number = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found.', p_order_id;
  END IF;

  -- Status transition validation
  IF v_ord.status = 'Delivered' AND p_new_status IN ('Pending', 'Confirmed', 'Processing') THEN
    RAISE EXCEPTION 'A Delivered order cannot be moved back to %.', p_new_status;
  END IF;

  IF v_ord.status = 'Cancelled' AND p_new_status <> 'Cancelled' THEN
    RAISE EXCEPTION 'A Cancelled order cannot be reopened directly.';
  END IF;

  IF v_ord.status = 'Returned' AND p_new_status <> 'Returned' THEN
    RAISE EXCEPTION 'A Returned order cannot be modified.';
  END IF;

  -- Automatic stock restoration when moving to Cancelled or Returned
  IF v_ord.status NOT IN ('Cancelled', 'Returned') AND p_new_status IN ('Cancelled', 'Returned') THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_ord.items)
    LOOP
      v_qty := (v_item->>'quantity')::INT;

      SELECT stock, name_en, sku INTO v_prod
      FROM public.products
      WHERE id = v_item->>'productId'
      FOR UPDATE;

      IF FOUND THEN
        UPDATE public.products
        SET stock = stock + v_qty, updated_at = now()
        WHERE id = v_item->>'productId';

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
          v_item->>'productId',
          v_prod.name_en,
          v_prod.sku,
          'RETURN',
          v_qty,
          v_prod.stock,
          v_prod.stock + v_qty,
          'Order ' || p_new_status || ' #' || v_ord.order_number,
          'Admin (Fulfillment System)',
          now()
        );
      END IF;
    END LOOP;
  END IF;

  -- Apply status and fulfillment updates
  UPDATE public.orders
  SET 
    status = p_new_status,
    payment_status = COALESCE(p_payment_status, payment_status),
    shipping_details = CASE 
      WHEN p_shipping_details IS NOT NULL THEN COALESCE(shipping_details, '{}'::JSONB) || p_shipping_details
      ELSE shipping_details
    END,
    updated_at = now()
  WHERE id = v_ord.id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'order_id', v_ord.id,
    'order_number', v_ord.order_number,
    'new_status', p_new_status
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 6. FUNCTION: cancel_order
-- Customer self-service cancellation:
--   - Only permitted for customer's own order (customer_id = auth.uid())
--   - Only permitted while order is in 'Pending' or 'Confirmed' status
--   - Automatically restores stock and records audit movement
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.cancel_order(
  p_order_id TEXT,
  p_reason TEXT DEFAULT 'Customer self-service cancellation'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ord RECORD;
  v_item JSONB;
  v_prod RECORD;
  v_qty INT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required to cancel order.';
  END IF;

  SELECT * INTO v_ord
  FROM public.orders
  WHERE (id = p_order_id OR order_number = p_order_id)
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found.';
  END IF;

  IF v_ord.customer_id IS NULL OR v_ord.customer_id <> auth.uid() THEN
    RAISE EXCEPTION 'Access denied: You can only cancel your own orders.';
  END IF;

  IF v_ord.status NOT IN ('Pending', 'Confirmed') THEN
    RAISE EXCEPTION 'Order #% cannot be cancelled because it is already in % stage.', 
      v_ord.order_number, v_ord.status;
  END IF;

  -- Restock items
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_ord.items)
  LOOP
    v_qty := (v_item->>'quantity')::INT;

    SELECT stock, name_en, sku INTO v_prod
    FROM public.products
    WHERE id = v_item->>'productId'
    FOR UPDATE;

    IF FOUND THEN
      UPDATE public.products
      SET stock = stock + v_qty, updated_at = now()
      WHERE id = v_item->>'productId';

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
        v_item->>'productId',
        v_prod.name_en,
        v_prod.sku,
        'RETURN',
        v_qty,
        v_prod.stock,
        v_prod.stock + v_qty,
        'Customer Cancelled #' || v_ord.order_number || ' - ' || p_reason,
        COALESCE(v_ord.customer_name, 'Customer'),
        now()
      );
    END IF;
  END LOOP;

  UPDATE public.orders
  SET 
    status = 'Cancelled',
    updated_at = now()
  WHERE id = v_ord.id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'order_id', v_ord.id,
    'order_number', v_ord.order_number,
    'status', 'Cancelled'
  );
END;
$$;

-- Grant execution permissions
GRANT EXECUTE ON FUNCTION public.quote_cart(JSONB, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.place_order(JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.track_order(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_order_status(TEXT, TEXT, TEXT, JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_order(TEXT, TEXT) TO authenticated;
