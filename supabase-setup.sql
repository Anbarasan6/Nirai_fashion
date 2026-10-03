-- ==========================================
-- NIRAI HANDLOOM SILKS - SUPABASE DATABASE DDL
-- Executing this script drops old tables and creates fresh, normalized schema
-- with Primary Keys, Foreign Keys, JSONB fields, and sample seed data.
-- ==========================================

-- 1. DROP EXISTING TABLES IN REVERSE DEPENDENCY ORDER
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.coupons CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;

-- 2. CREATE CATEGORIES TABLE
CREATE TABLE public.categories (
    id TEXT PRIMARY KEY,
    name_en TEXT NOT NULL,
    name_ta TEXT,
    slug TEXT UNIQUE NOT NULL,
    image_url TEXT,
    description_en TEXT,
    description_ta TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CREATE PRODUCTS TABLE (WITH FK TO CATEGORIES)
CREATE TABLE public.products (
    id TEXT PRIMARY KEY,
    sku TEXT UNIQUE,
    slug TEXT UNIQUE NOT NULL,
    name_en TEXT NOT NULL,
    name_ta TEXT,
    description_en TEXT,
    description_ta TEXT,
    category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
    price NUMERIC NOT NULL,
    discount_price NUMERIC,
    fabric_type TEXT DEFAULT 'Pure Silk',
    is_in_stock BOOLEAN DEFAULT true,
    stock_quantity INTEGER DEFAULT 10,
    is_featured BOOLEAN DEFAULT false,
    is_new_arrival BOOLEAN DEFAULT false,
    images JSONB DEFAULT '[]'::jsonb,
    variants JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. CREATE CUSTOMERS TABLE
CREATE TABLE public.customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT UNIQUE NOT NULL,
    address JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CREATE USERS TABLE
CREATE TABLE public.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer', -- 'admin' or 'customer'
    data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CREATE ORDERS TABLE (WITH FK TO CUSTOMERS)
CREATE TABLE public.orders (
    id TEXT PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL,
    customer_id TEXT REFERENCES public.customers(id) ON DELETE SET NULL,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    shipping_address JSONB NOT NULL,
    items JSONB NOT NULL,
    subtotal NUMERIC NOT NULL,
    discount NUMERIC DEFAULT 0,
    shipping_fee NUMERIC DEFAULT 0,
    total_amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    payment_status TEXT NOT NULL DEFAULT 'UNPAID',
    payment_method TEXT NOT NULL DEFAULT 'UPI_QR',
    utr_number TEXT,
    utr_proof_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. CREATE COUPONS TABLE
CREATE TABLE public.coupons (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL DEFAULT 'percentage',
    discount_value NUMERIC NOT NULL,
    min_order_amount NUMERIC DEFAULT 0,
    max_discount_amount NUMERIC,
    valid_till TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. CREATE SETTINGS TABLE
CREATE TABLE public.settings (
    id TEXT PRIMARY KEY DEFAULT 'store_settings',
    store_name TEXT DEFAULT 'NIRAI Handloom Silks',
    upi_id TEXT DEFAULT 'nirai@upi',
    upi_name TEXT DEFAULT 'NIRAI HANDLOOMS',
    qr_code_url TEXT,
    bank_details JSONB DEFAULT '{
        "bankName": "State Bank of India",
        "accountName": "NIRAI HANDLOOM SILKS",
        "accountNumber": "40982310492",
        "ifscCode": "SBIN0001824",
        "branch": "Elampillai Main Branch"
    }'::jsonb,
    contact_phone TEXT DEFAULT '+91 98765 43210',
    contact_email TEXT DEFAULT 'support@niraifashions.com',
    announcement_en TEXT DEFAULT '✦ Festival Handloom Sale! Flat 15% OFF on orders above ₹4,999 — Code: SILK15 ✦',
    announcement_ta TEXT DEFAULT '✦ பட்டுப் சேலைகளுக்கு சிறப்பு தள்ளுபடி! ₹4,999க்கு மேல் 15% தள்ளுபடி — Code: SILK15 ✦',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. DISABLE RLS FOR ANONYMOUS APP INTEGRATION & GRANT FULL ACCESS
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings DISABLE ROW LEVEL SECURITY;

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

-- ==========================================
-- SEED DATA INJECTION
-- ==========================================

-- Seed Categories
INSERT INTO public.categories (id, name_en, name_ta, slug, image_url, description_en, description_ta) VALUES
('cat_elampillai', 'Elampillai Silks', 'இளம்பிள்ளை பட்டு', 'elampillai-silks', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80', 'Traditional Elampillai soft silks with exquisite zari motifs.', 'நேர்த்தியான ஜரி உருவங்களுடன் பாரம்பரிய இளம்பிள்ளை சாஃப்ட் சில்க்ஸ்.'),
('cat_kanchipuram', 'Kanchipuram Silks', 'காஞ்சிபுரம் பட்டு', 'kanchipuram-silks', 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80', 'Authentic heavy pure silk Kanchipuram bridal heritage sarees.', 'உண்மையான கனரக தூய பட்டு காஞ்சிபுரம் திருமண பட்டு புடவைகள்.'),
('cat_softsilk', 'Soft Silks', 'சாஃப்ட் சில்க்ஸ்', 'soft-silks', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80', 'Lightweight, feather-touch soft silks for modern elegance.', 'நவீன நேர்த்திக்கு இலகுரக, மென்மையான தொடுதல் சாஃப்ட் சில்க்ஸ்.'),
('cat_dhoti', 'Pure Silk Dhotis', 'தூய பட்டு வேஷ்டி', 'silk-dhotis', 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80', 'Traditional Mayilkan zari border pure silk dhotis for weddings.', 'திருமணங்களுக்கு பாரம்பரிய மயில் கண் ஜரி பார்டர் தூய பட்டு வேஷ்டிகள்.');

-- Seed Initial Settings
INSERT INTO public.settings (id, store_name, upi_id, upi_name, qr_code_url, contact_phone, contact_email) VALUES
('store_settings', 'NIRAI Handloom Silks', 'nirai@upi', 'NIRAI HANDLOOMS', 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=400&q=80', '+91 98765 43210', 'support@niraifashions.com')
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Coupons
INSERT INTO public.coupons (id, code, discount_type, discount_value, min_order_amount, is_active) VALUES
('coup_silk15', 'SILK15', 'percentage', 15, 4999, true),
('coup_welcome', 'NIRAI500', 'fixed', 500, 2999, true);

-- Seed Sample Products
INSERT INTO public.products (id, sku, slug, name_en, name_ta, description_en, description_ta, category_id, price, discount_price, fabric_type, is_in_stock, stock_quantity, is_featured, is_new_arrival, images, variants) VALUES
('prod_1', 'NIR-ELM-001', 'royal-maroon-elampillai-soft-silk', 'Royal Maroon Elampillai Soft Silk', 'ராயல் மரூன் இளம்பிள்ளை சாஃப்ட் சில்க்', 'Exquisite maroon soft silk saree with intricate peacock zari weaving and matching blouse piece.', 'சிக்கலான மயில் ஜரி நெசவு மற்றும் பொருத்தமான ரவிக்கை துண்டுடன் கூடிய நேர்த்தியான மரூன் சாஃப்ட் சில்க் சேலை.', 'cat_elampillai', 4999, 3999, 'Elampillai Soft Silk', true, 12, true, true, 
'["https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80", "https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=80"]'::jsonb,
'[{"color": "Royal Maroon", "color_code": "#4A0E17", "stock": 8}, {"color": "Emerald Green", "color_code": "#0B6623", "stock": 4}]'::jsonb),

('prod_2', 'NIR-KNC-002', 'golden-yellow-kanchipuram-bridal-silk', 'Golden Yellow Kanchipuram Bridal Silk', 'கோல்டன் மஞ்சள் காஞ்சிபுரம் பிரைடல் பட்டு', 'Pure 3-ply silk Kanchipuram saree featuring full Korvai borders and rich gold pallu.', 'தூய 3-பிளை சில்க் காஞ்சிபுரம் புடவை, கோர்வை பார்டர்கள் மற்றும் பணக்கார தங்க பல்லு கொண்டது.', 'cat_kanchipuram', 18999, 15999, 'Pure Kanchipuram Silk', true, 5, true, false,
'["https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=80", "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80"]'::jsonb,
'[{"color": "Golden Yellow", "color_code": "#D4AF37", "stock": 3}, {"color": "Crimson Red", "color_code": "#800020", "stock": 2}]'::jsonb),

('prod_3', 'NIR-SFT-003', 'pastel-pink-lightweight-soft-silk', 'Pastel Pink Lightweight Soft Silk', 'பாஸ்டல் பிங்க் லைட்வெயிட் சாஃப்ட் சில்க்', 'Featherlight soft silk saree with subtle silver zari border, perfect for daytime celebrations.', 'நுட்பமான வெள்ளி ஜரி பார்டருடன் கூடிய இறகுப் போன்ற சாஃப்ட் சில்க் சேலை, பகல் நேர கொண்டாட்டங்களுக்கு ஏற்றது.', 'cat_softsilk', 3499, 2799, 'Soft Silk', true, 18, true, true,
'["https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80"]'::jsonb,
'[{"color": "Pastel Pink", "color_code": "#FFB6C1", "stock": 10}, {"color": "Sky Blue", "color_code": "#87CEEB", "stock": 8}]'::jsonb),

('prod_4', 'NIR-DHT-004', 'mayilkan-zari-border-pure-silk-dhoti-set', 'Mayilkan Zari Border Pure Silk Dhoti Set', 'மயில்கண் ஜரி பார்டர் தூய பட்டு வேஷ்டி செட்', 'Pure silk dhoti with matching angavastram towel featuring classic Mayilkan gold zari borders.', 'கிளாசிக் மயில்கண் தங்க ஜரி பார்டர்களுடன் கூடிய தூய பட்டு வேஷ்டி மற்றும் அங்‌கவஸ்திரம் டவல்.', 'cat_dhoti', 2999, 2499, 'Pure Mulberry Silk', true, 20, false, true,
'["https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=1000&q=80"]'::jsonb,
'[{"color": "Off White / Gold", "color_code": "#FDFBF7", "stock": 20}]'::jsonb);
