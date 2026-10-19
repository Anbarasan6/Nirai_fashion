-- ==============================================================================
-- Migration: 20261019000013_checkout_killswitch.sql
-- Description:
--   Adds emergency killswitch flag `checkout_enabled` and customizable
--   maintenance messages (English + Tamil) to `settings` table.
--   Enforces killswitch directly in `place_order` RPC.
-- ==============================================================================

BEGIN;

-- 1. Add columns to settings table
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS checkout_enabled BOOLEAN DEFAULT true;

ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS maintenance_message_en TEXT 
DEFAULT 'Checkout is temporarily paused for scheduled inventory maintenance. Please check back shortly.';

ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS maintenance_message_ta TEXT 
DEFAULT 'பராமரிப்பு பணி காரணமாக செக்அவுட் தற்காலிகமாக நிறுத்தப்பட்டுள்ளது. விரைவில் மீண்டும் முயற்சிக்கவும்.';

-- 2. Update place_order to enforce checkout_enabled guard
CREATE OR REPLACE FUNCTION public.place_order(
  p_items JSONB,
  p_customer JSONB,
  p_payment_method TEXT,
  p_coupon_code TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_checkout_enabled BOOLEAN := true;
  v_maint_msg_en TEXT;
  v_maint_msg_ta TEXT;
  
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
  
  v_coupon RECORD;
  v_order_id TEXT;
  v_order_number TEXT;
  v_order_seq INT;
  v_date_str TEXT;
  v_payment_due TIMESTAMPTZ;
  v_deadline_hours INT := 24;
  
  v_free_threshold NUMERIC := 1500;
  v_std_fee NUMERIC := 120;
  v_shipping_rules JSONB;
BEGIN
  -- 0. Emergency Killswitch Guard
  SELECT 
    COALESCE(checkout_enabled, true),
    maintenance_message_en,
    maintenance_message_ta
  INTO v_checkout_enabled, v_maint_msg_en, v_maint_msg_ta
  FROM public.settings
  LIMIT 1;

  IF NOT v_checkout_enabled THEN
    RETURN jsonb_build_object(
      'success', FALSE,
      'error', COALESCE(v_maint_msg_en, 'Checkout is temporarily disabled for maintenance.')
    );
  END IF;

  -- 1. Idempotency Check
  v_idempotency_key := trim(COALESCE(p_idempotency_key, ''));
  IF v_idempotency_key <> '' THEN
    SELECT id, order_number INTO v_existing_id, v_existing_num
    FROM public.orders
    WHERE idempotency_key = v_idempotency_key
    LIMIT 1;
    
    IF FOUND THEN
      RETURN jsonb_build_object(
        'success', TRUE,
        'orderId', v_existing_id,
        'orderNumber', v_existing_num,
        'idempotentReplay', TRUE
      );
    END IF;
  END IF;

  -- 2. Validate Customer Details
  v_customer_name := trim(COALESCE(p_customer->>'name', ''));
  v_customer_phone := trim(COALESCE(p_customer->>'phone', ''));
  v_customer_email := trim(COALESCE(p_customer->>'email', ''));
  
  IF v_customer_name = '' OR v_customer_phone = '' THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Customer name and phone number are required.');
  END IF;

  IF NOT (v_customer_phone ~ '^[6-9]\d{9}$') THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Valid 10-digit Indian phone number starting with 6-9 is required.');
  END IF;

  v_shipping_address := p_customer;
  v_pincode := trim(COALESCE(p_customer->>'pincode', ''));
  v_customer_id := auth.uid();

  -- 3. Payment Method
  v_payment_method := upper(trim(COALESCE(p_payment_method, 'ONLINE_UPI')));
  IF v_payment_method NOT IN ('ONLINE_UPI', 'BANK_TRANSFER', 'COD') THEN
    v_payment_method := 'ONLINE_UPI';
  END IF;

  -- 4. Shipping Settings
  SELECT 
    COALESCE(free_shipping_threshold, 1500),
    COALESCE(standard_shipping_fee, 120),
    shipping_rules
  INTO v_free_threshold, v_std_fee, v_shipping_rules
  FROM public.settings
  LIMIT 1;

  -- 5. Process Cart Items & Decrement Stock atomically
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Cart is empty.');
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_prod_id := v_item->>'productId';
    IF v_prod_id IS NULL THEN v_prod_id := v_item->>'product_id'; END IF;
    
    v_qty := COALESCE((v_item->>'quantity')::INT, 1);
    IF v_qty <= 0 THEN v_qty := 1; END IF;

    -- Lock and check stock
    SELECT id, name_en, name_ta, sku, final_price, stock, is_active, images
    INTO v_prod
    FROM public.products
    WHERE id = v_prod_id
    FOR UPDATE;

    IF NOT FOUND OR NOT v_prod.is_active THEN
      RETURN jsonb_build_object('success', FALSE, 'error', 'Product ' || COALESCE(v_prod_id, '') || ' is unavailable.');
    END IF;

    IF v_prod.stock < v_qty THEN
      RETURN jsonb_build_object('success', FALSE, 'error', 'Insufficient stock for ' || v_prod.name_en || '. Only ' || v_prod.stock || ' available.');
    END IF;

    -- Decrement stock
    UPDATE public.products
    SET stock = stock - v_qty, updated_at = now()
    WHERE id = v_prod_id;

    v_unit_price := v_prod.final_price;
    v_item_total := v_unit_price * v_qty;
    v_subtotal := v_subtotal + v_item_total;

    v_verified_items := v_verified_items || jsonb_build_object(
      'productId', v_prod.id,
      'nameEn', v_prod.name_en,
      'nameTa', v_prod.name_ta,
      'sku', v_prod.sku,
      'quantity', v_qty,
      'unitPrice', v_unit_price,
      'totalPrice', v_item_total,
      'image', COALESCE(v_prod.images->>0, '')
    );
  END LOOP;

  -- 6. Apply Coupon if provided
  IF p_coupon_code IS NOT NULL AND trim(p_coupon_code) <> '' THEN
    SELECT * INTO v_coupon
    FROM public.coupons
    WHERE code = upper(trim(p_coupon_code))
      AND is_active = TRUE
      AND (valid_from IS NULL OR valid_from <= now())
      AND (valid_until IS NULL OR valid_until >= now());

    IF FOUND AND v_subtotal >= COALESCE(v_coupon.min_order_amount, 0) THEN
      IF v_coupon.discount_type = 'percentage' THEN
        v_discount := round((v_subtotal * (v_coupon.discount_value / 100.0)), 2);
        IF v_coupon.max_discount_amount IS NOT NULL THEN
          v_discount := LEAST(v_discount, v_coupon.max_discount_amount);
        END IF;
      ELSE
        v_discount := LEAST(v_coupon.discount_value, v_subtotal);
      END IF;

      UPDATE public.coupons
      SET current_uses = current_uses + 1
      WHERE id = v_coupon.id;
    END IF;
  END IF;

  -- 7. Shipping fee calculation
  IF v_subtotal >= v_free_threshold THEN
    v_shipping_fee := 0;
  ELSE
    v_shipping_fee := v_std_fee;
  END IF;

  v_grand_total := GREATEST(0, (v_subtotal - v_discount + v_shipping_fee));

  -- 8. Generate Order Number NIRAI-YYYYMMDD-XXXX
  v_date_str := to_char(now(), 'YYYYMMDD');
  SELECT COALESCE(MAX(SUBSTRING(order_number FROM '\d+$')::INT), 0) + 1
  INTO v_order_seq
  FROM public.orders
  WHERE order_number LIKE 'NIRAI-' || v_date_str || '-%';

  v_order_number := 'NIRAI-' || v_date_str || '-' || lpad(v_order_seq::TEXT, 4, '0');
  v_order_id := 'ord-' || gen_random_uuid()::TEXT;
  v_payment_due := now() + (v_deadline_hours || ' hours')::INTERVAL;

  -- 9. Insert Order
  INSERT INTO public.orders (
    id, order_number, customer_id, customer_name, customer_email, customer_phone,
    items, subtotal, shipping_fee, discount, grand_total,
    status, payment_status, payment_method, shipping_address,
    idempotency_key, payment_due_at, created_at, updated_at
  ) VALUES (
    v_order_id, v_order_number, v_customer_id, v_customer_name, v_customer_email, v_customer_phone,
    v_verified_items, v_subtotal, v_shipping_fee, v_discount, v_grand_total,
    'Pending', 'Awaiting Payment', v_payment_method, v_shipping_address,
    NULLIF(v_idempotency_key, ''), v_payment_due, now(), now()
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'orderId', v_order_id,
    'orderNumber', v_order_number,
    'grandTotal', v_grand_total,
    'paymentDueAt', v_payment_due
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.place_order(JSONB, JSONB, TEXT, TEXT, TEXT) TO anon, authenticated;

COMMIT;
