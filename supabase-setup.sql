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
  bank_details JSONB DEFAULT '{"bankName": "HDFC Bank", "accountName": "NIRAI HANDLOOMS PRIVATE LIMITED", "accountNumber": "50200088992211", "ifscCode": "HDFC0001244", "branch": "Cathedral Road, Chennai"}'::jsonb,
  upi_details JSONB DEFAULT '{"upiId": "niraihandlooms@hdfcbank", "merchantName": "Nirai Handlooms", "qrCodeNote": "Scan & Pay with GPay, PhonePe or Paytm"}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PERMISSIONS & ROW LEVEL SECURITY
-- Disable RLS to allow direct anon client operations
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;

-- Grant broad privileges to anon & authenticated roles for client sync
GRANT ALL ON TABLE public.products TO anon, authenticated;
GRANT ALL ON TABLE public.categories TO anon, authenticated;
GRANT ALL ON TABLE public.orders TO anon, authenticated;
GRANT ALL ON TABLE public.users TO anon, authenticated;
GRANT ALL ON TABLE public.customers TO anon, authenticated;
GRANT ALL ON TABLE public.coupons TO anon, authenticated;
GRANT ALL ON TABLE public.settings TO anon, authenticated;
