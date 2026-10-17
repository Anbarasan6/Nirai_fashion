-- ====================================================================
-- NIRAI E-COMMERCE PLATFORM — SUPABASE DATABASE SETUP & SCHEMA
-- Project URL: https://lqzrahjmgzdsbosywjju.supabase.co
-- Run this in Supabase SQL Editor to initialize or reset tables
-- ====================================================================

-- 1. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  sku TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_ta TEXT,
  slug TEXT UNIQUE NOT NULL,
  description_en TEXT,
  description_ta TEXT,
  short_desc_en TEXT,
  short_desc_ta TEXT,
  category_id TEXT,
  sub_category_id TEXT,
  brand TEXT DEFAULT 'Nirai',
  fabric TEXT,
  material TEXT,
  style TEXT,
  care_instructions_en TEXT,
  care_instructions_ta TEXT,
  base_price NUMERIC NOT NULL DEFAULT 0,
  regular_discount NUMERIC DEFAULT 0,
  special_discount NUMERIC DEFAULT 0,
  final_price NUMERIC NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  is_featured BOOLEAN DEFAULT false,
  is_new_arrival BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  images JSONB DEFAULT '[]'::jsonb,
  variants JSONB DEFAULT '[]'::jsonb,
  rating NUMERIC DEFAULT 5.0,
  review_count INTEGER DEFAULT 0,
  reviews JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_ta TEXT,
  level INTEGER DEFAULT 1,
  parent_id TEXT,
  image TEXT,
  description_en TEXT,
  description_ta TEXT,
  is_active BOOLEAN DEFAULT true,
  item_count INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_id TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  shipping_fee NUMERIC NOT NULL DEFAULT 0,
  discount NUMERIC NOT NULL DEFAULT 0,
  grand_total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Pending',
  payment_status TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION',
  payment_method TEXT NOT NULL DEFAULT 'ONLINE_UPI',
  payment_details JSONB DEFAULT '{}'::jsonb,
  shipping_details JSONB DEFAULT '{}'::jsonb,
  shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. USERS TABLE (Also mirrored to customers)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer',
  password TEXT,
  addresses JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CUSTOMERS VIEW / TABLE (for seamless schema fallback)
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer',
  password TEXT,
  addresses JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. COUPONS TABLE
CREATE TABLE IF NOT EXISTS public.coupons (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage',
  discount_value NUMERIC NOT NULL DEFAULT 0,
  min_order_amount NUMERIC DEFAULT 0,
  max_discount NUMERIC,
  expiry_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT PRIMARY KEY DEFAULT 'nirai_main_settings',
  store_name TEXT DEFAULT 'Nirai',
  tagline_en TEXT,
  tagline_ta TEXT,
  logo JSONB DEFAULT '{}'::jsonb,
  hero_slides JSONB DEFAULT '[]'::jsonb,
  promo_banner JSONB DEFAULT '{}'::jsonb,
  homepage_sections JSONB DEFAULT '[]'::jsonb,
  free_shipping_threshold NUMERIC DEFAULT 1500,
  standard_shipping_fee NUMERIC DEFAULT 120,
  shipping_rules JSONB DEFAULT '{"tamilNaduStandard": 80, "tamilNaduExpress": 160, "indiaStandard": 120, "indiaExpress": 220}'::jsonb,
  announcement_en TEXT,
  announcement_ta TEXT,
  is_announcement_active BOOLEAN DEFAULT true,
  bank_details JSONB DEFAULT '{"bankName": "HDFC Bank", "accountName": "NIRAI HANDLOOMS", "accountNumber": "50200088992211", "ifscCode": "HDFC0001244", "branch": "Cathedral Road, Chennai"}'::jsonb,
  upi_details JSONB DEFAULT '{"upiId": "niraihandlooms@hdfcbank", "merchantName": "Nirai Handlooms", "qrCodeNote": "Scan & Pay with GPay, PhonePe or Paytm"}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. SUPPLIERS TABLE (Admin Sourcing)
CREATE TABLE IF NOT EXISTS public.suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  city TEXT,
  state TEXT,
  lead_time_days INTEGER DEFAULT 7,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. COURIER PARTNERS TABLE
CREATE TABLE IF NOT EXISTS public.courier_partners (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  phone TEXT,
  email TEXT,
  delivery_days TEXT,
  coverage TEXT,
  tracking_url_template TEXT,
  badge_text TEXT,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. STOCK MOVEMENTS AUDIT LOG
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  product_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  type TEXT NOT NULL, -- RECEIPT, SALE, ADJUSTMENT, DAMAGE, RETURN
  quantity_delta INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reason TEXT,
  performed_by TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 11. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_movements_prod ON public.stock_movements(product_id);

-- 12. PERMISSIONS & ROW LEVEL SECURITY (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Products: Public can browse active products; Authenticated staff/admins can manage
CREATE POLICY "Public can view active products" ON public.products
  FOR SELECT USING (is_active = true OR auth.role() = 'authenticated');

CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL USING (auth.role() = 'authenticated');

-- Categories: Public can view active categories
CREATE POLICY "Public can view active categories" ON public.categories
  FOR SELECT USING (is_active = true OR auth.role() = 'authenticated');

CREATE POLICY "Admins can manage categories" ON public.categories
  FOR ALL USING (auth.role() = 'authenticated');

-- Settings: Public can view settings; Admins can update
CREATE POLICY "Public can view store settings" ON public.settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can update store settings" ON public.settings
  FOR ALL USING (auth.role() = 'authenticated');

-- Coupons: Public can view active coupons; Admins can manage
CREATE POLICY "Public can view active coupons" ON public.coupons
  FOR SELECT USING (is_active = true OR auth.role() = 'authenticated');

CREATE POLICY "Admins can manage coupons" ON public.coupons
  FOR ALL USING (auth.role() = 'authenticated');

-- Orders: Anyone can insert (checkout); Customers view own; Admins view all
CREATE POLICY "Anyone can create order" ON public.orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users view own orders or admin all" ON public.orders
  FOR SELECT USING (
    auth.role() = 'authenticated' OR
    (customer_id IS NOT NULL AND customer_id = auth.uid()::text)
  );

CREATE POLICY "Admins can update orders" ON public.orders
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Users & Customers: Self access or admin
CREATE POLICY "Users can manage own record" ON public.users
  FOR ALL USING (id = auth.uid()::text OR auth.role() = 'authenticated');

CREATE POLICY "Customers can manage own record" ON public.customers
  FOR ALL USING (id = auth.uid()::text OR auth.role() = 'authenticated');

-- Internal: Suppliers, Couriers & Stock Movements for authenticated personnel
CREATE POLICY "Admins can manage suppliers" ON public.suppliers
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage couriers" ON public.courier_partners
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can view stock audit" ON public.stock_movements
  FOR ALL USING (auth.role() = 'authenticated');
