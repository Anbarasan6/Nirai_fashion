-- ==============================================================================
-- NIRAI HANDLOOM SILKS - SUPABASE DATABASE SETUP & RLS CONFIGURATION SCRIPT
-- Copy and paste this script into your Supabase Project -> SQL Editor and click RUN.
-- ==============================================================================

-- 1. Create CATEGORIES Table
CREATE TABLE IF NOT EXISTS public.categories (
    id TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_ta TEXT,
    slug TEXT UNIQUE NOT NULL,
    image_url TEXT,
    description_en TEXT,
    description_ta TEXT,
    is_active BOOLEAN DEFAULT true,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Create PRODUCTS Table
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    sku TEXT,
    slug TEXT,
    name_en TEXT,
    name_ta TEXT,
    description_en TEXT,
    description_ta TEXT,
    category_id TEXT,
    price NUMERIC,
    discount_price NUMERIC,
    fabric_type TEXT DEFAULT 'Pure Silk',
    is_in_stock BOOLEAN DEFAULT true,
    stock_quantity INTEGER DEFAULT 10,
    is_featured BOOLEAN DEFAULT false,
    is_new_arrival BOOLEAN DEFAULT false,
    images JSONB DEFAULT '[]'::jsonb,
    variants JSONB DEFAULT '[]'::jsonb,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Create USERS Table
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT,
    name TEXT,
    username TEXT,
    password TEXT,
    phone TEXT,
    role TEXT DEFAULT 'customer',
    is_active BOOLEAN DEFAULT true,
    addresses JSONB,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Create CUSTOMERS Table
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    username TEXT,
    password TEXT,
    phone TEXT,
    role TEXT DEFAULT 'customer',
    is_active BOOLEAN DEFAULT true,
    address JSONB,
    addresses JSONB,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Create ORDERS Table
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    order_number TEXT,
    customer_id TEXT,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    phone TEXT,
    email TEXT,
    shipping_address JSONB,
    items JSONB,
    subtotal NUMERIC,
    discount_amount NUMERIC,
    discount NUMERIC DEFAULT 0,
    coupon_code TEXT,
    shipping_fee NUMERIC DEFAULT 0,
    free_shipping_applied BOOLEAN DEFAULT false,
    grand_total NUMERIC,
    total NUMERIC,
    total_amount NUMERIC,
    status TEXT DEFAULT 'PENDING',
    payment_status TEXT DEFAULT 'UNPAID',
    payment_method TEXT DEFAULT 'UPI_QR',
    upi_txn_ref TEXT,
    utr_number TEXT,
    payment_screenshot_url TEXT,
    utr_proof_url TEXT,
    shipping_details JSONB,
    tracking_number TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    data JSONB
);

-- Idempotent column additions for orders (if table pre-existed)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total NUMERIC;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_amount NUMERIC;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS upi_txn_ref TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS utr_number TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS utr_proof_url TEXT;

-- 6. Create COUPONS Table
CREATE TABLE IF NOT EXISTS public.coupons (
    id TEXT PRIMARY KEY,
    code TEXT,
    discount_type TEXT DEFAULT 'percentage',
    discount_value NUMERIC,
    min_order_amount NUMERIC DEFAULT 0,
    max_discount_amount NUMERIC,
    valid_till TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. Create SETTINGS Table
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY DEFAULT 'store_settings',
    store_name TEXT DEFAULT 'NIRAI Handloom Silks',
    upi_id TEXT DEFAULT 'nirai@upi',
    upi_name TEXT DEFAULT 'NIRAI HANDLOOMS',
    qr_code_url TEXT,
    bank_details JSONB,
    contact_phone TEXT DEFAULT '+91 98765 43210',
    contact_email TEXT DEFAULT 'support@niraifashions.com',
    announcement_en TEXT,
    announcement_ta TEXT,
    data JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. Create SUPPLIERS Table
CREATE TABLE IF NOT EXISTS public.suppliers (
    id TEXT PRIMARY KEY,
    name TEXT,
    code TEXT,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 9. Create COURIERS Table
CREATE TABLE IF NOT EXISTS public.couriers (
    id TEXT PRIMARY KEY,
    name TEXT,
    code TEXT,
    tracking_url_template TEXT,
    is_active BOOLEAN DEFAULT true,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 10. Create STOCK_MOVEMENTS Table
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id TEXT PRIMARY KEY,
    product_id TEXT,
    product_name TEXT,
    sku TEXT,
    type TEXT,
    quantity_delta NUMERIC,
    previous_stock NUMERIC,
    new_stock NUMERIC,
    reason TEXT,
    performed_by TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    data JSONB
);

-- 11. Create MEDIA Table
CREATE TABLE IF NOT EXISTS public.media (
    id TEXT PRIMARY KEY,
    url TEXT,
    name TEXT,
    type TEXT,
    size NUMERIC,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- DISABLE ROW LEVEL SECURITY (RLS) FOR ALL STORE TABLES TO ALLOW ANON CLIENT ACCESS
-- ==============================================================================

ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.couriers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.media DISABLE ROW LEVEL SECURITY;

-- Grant FULL permissions to anon, authenticated, and service_role
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;

-- ==============================================================================
-- SEED DATA INJECTION (Idempotent using ON CONFLICT DO NOTHING)
-- ==============================================================================

-- Seed Categories
INSERT INTO public.categories (id, name_en, name_ta, slug, image_url, description_en, description_ta) VALUES
('cat_elampillai', 'Elampillai Silks', 'இளம்பிள்ளை பட்டு', 'elampillai-silks', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80', 'Traditional Elampillai soft silks with exquisite zari motifs.', 'நேர்த்தியான ஜரி உருவங்களுடன் பாரம்பரிய இளம்பிள்ளை சாஃப்ட் சில்க்ஸ்.'),
('cat_kanchipuram', 'Kanchipuram Silks', 'காஞ்சிபுரம் பட்டு', 'kanchipuram-silks', 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80', 'Authentic heavy pure silk Kanchipuram bridal heritage sarees.', 'உண்மையான கனரக தூய பட்டு காஞ்சிபுரம் திருமண பட்டு புடவைகள்.'),
('cat_softsilk', 'Soft Silks', 'சாஃப்ட் சில்க்ஸ்', 'soft-silks', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80', 'Lightweight, feather-touch soft silks for modern elegance.', 'நவீன நேர்த்திக்கு இலகுரக, மென்மையான தொடுதல் சாஃப்ட் சில்க்ஸ்.'),
('cat_dhoti', 'Pure Silk Dhotis', 'தூய பட்டு வேஷ்டி', 'silk-dhotis', 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80', 'Traditional Mayilkan zari border pure silk dhotis for weddings.', 'திருமணங்களுக்கு பாரம்பரிய மயில் கண் ஜரி பார்டர் தூய பட்டு வேஷ்டிகள்.')
ON CONFLICT (id) DO NOTHING;

-- Seed Store Settings
INSERT INTO public.settings (id, store_name, upi_id, upi_name, qr_code_url, contact_phone, contact_email) VALUES
('store_settings', 'NIRAI Handloom Silks', 'nirai@upi', 'NIRAI HANDLOOMS', 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=400&q=80', '+91 98765 43210', 'support@niraifashions.com')
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Coupons
INSERT INTO public.coupons (id, code, discount_type, discount_value, min_order_amount, is_active) VALUES
('coup_silk15', 'SILK15', 'percentage', 15, 4999, true),
('coup_welcome', 'NIRAI500', 'fixed', 500, 2999, true)
ON CONFLICT (id) DO NOTHING;
