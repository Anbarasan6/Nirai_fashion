-- ==============================================================================
-- Migration: 20261018000003_auth_helper_functions_and_rls.sql
-- Description:
--   1. Helper functions: current_user_role(), is_admin(), is_staff_or_admin() (SECURITY DEFINER, STABLE)
--   2. Strict permission revoke from anon/authenticated, granting least privilege
--   3. Comprehensive Row Level Security (RLS) policies on all tables
--   4. public_settings view exposing non-sensitive store settings to public/customers
--   5. Super-admin protections for suppliers, content, and private settings
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. HELPER FUNCTIONS (SECURITY DEFINER, STABLE)
-- ------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role
  FROM public.profiles
  WHERE id = auth.uid() AND is_active = true;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin') AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('staff', 'admin', 'super_admin') AND is_active = true
  );
$$;

-- ------------------------------------------------------------------------------
-- 2. REVOKE ALL FROM ANON AND AUTHENTICATED (Principle of Least Privilege)
-- ------------------------------------------------------------------------------

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;

-- Allow schema usage and execution of public helper functions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff_or_admin() TO anon, authenticated;

-- Enable RLS on all existing public tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 3. PRODUCTS & CATEGORIES RLS
-- Public can read active products/categories; staff/admin can manage
-- ------------------------------------------------------------------------------

GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;

GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;

-- Products Policies
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Staff and admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Staff and admins can update products" ON public.products;
DROP POLICY IF EXISTS "Staff and admins can delete products" ON public.products;

CREATE POLICY "Public can view active products" ON public.products
  FOR SELECT USING (is_active = true OR public.is_staff_or_admin());

CREATE POLICY "Staff and admins can insert products" ON public.products
  FOR INSERT WITH CHECK (public.is_staff_or_admin());

CREATE POLICY "Staff and admins can update products" ON public.products
  FOR UPDATE USING (public.is_staff_or_admin());

CREATE POLICY "Staff and admins can delete products" ON public.products
  FOR DELETE USING (public.is_staff_or_admin());

-- Categories Policies
DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Staff and admins can insert categories" ON public.categories;
DROP POLICY IF EXISTS "Staff and admins can update categories" ON public.categories;
DROP POLICY IF EXISTS "Staff and admins can delete categories" ON public.categories;

CREATE POLICY "Public can view active categories" ON public.categories
  FOR SELECT USING (is_active = true OR public.is_staff_or_admin());

CREATE POLICY "Staff and admins can insert categories" ON public.categories
  FOR INSERT WITH CHECK (public.is_staff_or_admin());

CREATE POLICY "Staff and admins can update categories" ON public.categories
  FOR UPDATE USING (public.is_staff_or_admin());

CREATE POLICY "Staff and admins can delete categories" ON public.categories
  FOR DELETE USING (public.is_staff_or_admin());

-- ------------------------------------------------------------------------------
-- 4. ORDERS RLS
-- NO anon select or insert! Customers see only their own orders. Staff/Admin see all.
-- ------------------------------------------------------------------------------

GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
-- Note: anon has NO permissions granted on public.orders!

DROP POLICY IF EXISTS "Anyone can create order" ON public.orders;
DROP POLICY IF EXISTS "Users view own orders or admin all" ON public.orders;
DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
DROP POLICY IF EXISTS "Customers view own orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users create own order" ON public.orders;

CREATE POLICY "Customers view own orders" ON public.orders
  FOR SELECT USING (
    customer_id = auth.uid() OR public.is_staff_or_admin()
  );

CREATE POLICY "Authenticated users create own order" ON public.orders
  FOR INSERT WITH CHECK (
    customer_id = auth.uid() OR public.is_staff_or_admin()
  );

CREATE POLICY "Staff and admin can update orders" ON public.orders
  FOR UPDATE USING (public.is_staff_or_admin());

-- ------------------------------------------------------------------------------
-- 5. PROFILES & ADDRESSES RLS
-- Users see and edit own rows only; Admins can read all.
-- ------------------------------------------------------------------------------

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;

-- Profiles Policies
DROP POLICY IF EXISTS "Profiles self or admin read" ON public.profiles;
DROP POLICY IF EXISTS "Profiles self or admin update" ON public.profiles;

CREATE POLICY "Profiles self or admin read" ON public.profiles
  FOR SELECT USING (
    id = auth.uid() OR public.is_admin()
  );

CREATE POLICY "Profiles self or admin update" ON public.profiles
  FOR UPDATE USING (
    id = auth.uid() OR public.is_admin()
  );

-- Addresses Policies
DROP POLICY IF EXISTS "Addresses self or admin select" ON public.addresses;
DROP POLICY IF EXISTS "Addresses self insert" ON public.addresses;
DROP POLICY IF EXISTS "Addresses self update" ON public.addresses;
DROP POLICY IF EXISTS "Addresses self delete" ON public.addresses;

CREATE POLICY "Addresses self or admin select" ON public.addresses
  FOR SELECT USING (
    user_id = auth.uid() OR public.is_admin()
  );

CREATE POLICY "Addresses self insert" ON public.addresses
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

CREATE POLICY "Addresses self update" ON public.addresses
  FOR UPDATE USING (
    user_id = auth.uid() OR public.is_admin()
  );

CREATE POLICY "Addresses self delete" ON public.addresses
  FOR DELETE USING (
    user_id = auth.uid() OR public.is_admin()
  );

-- ------------------------------------------------------------------------------
-- 6. COUPONS RLS
-- No public select! Admin only.
-- ------------------------------------------------------------------------------

GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;

DROP POLICY IF EXISTS "Public can view active coupons" ON public.coupons;
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;

CREATE POLICY "Admins only coupons access" ON public.coupons
  FOR ALL USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 7. SETTINGS & PUBLIC_SETTINGS VIEW
-- Expose only public non-sensitive fields to public/customers.
-- Bank/UPI/private data are admin-only. Writes are super_admin only.
-- ------------------------------------------------------------------------------

GRANT SELECT, INSERT, UPDATE ON public.settings TO authenticated;

DROP POLICY IF EXISTS "Public can view store settings" ON public.settings;
DROP POLICY IF EXISTS "Admins can update store settings" ON public.settings;

-- Settings table: direct access restricted to admin
CREATE POLICY "Admins can read settings" ON public.settings
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Super admin can write settings" ON public.settings
  FOR ALL USING (public.current_user_role() = 'super_admin');

-- View for public non-sensitive settings (Store name, announcements, banners, shipping fees)
CREATE OR REPLACE VIEW public.public_settings AS
SELECT
  id,
  store_name,
  tagline_en,
  tagline_ta,
  logo,
  hero_slides,
  promo_banner,
  homepage_sections,
  free_shipping_threshold,
  standard_shipping_fee,
  shipping_rules,
  announcement_en,
  announcement_ta,
  is_announcement_active,
  created_at,
  updated_at
FROM public.settings;

-- Grant public view permissions
GRANT SELECT ON public.public_settings TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 8. SUPPLIERS RLS (Super-admin only)
-- ------------------------------------------------------------------------------

GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;

DROP POLICY IF EXISTS "Admins can manage suppliers" ON public.suppliers;

CREATE POLICY "Super admin only suppliers access" ON public.suppliers
  FOR ALL USING (public.current_user_role() = 'super_admin');

-- ------------------------------------------------------------------------------
-- 9. COURIER PARTNERS & STOCK MOVEMENTS RLS
-- ------------------------------------------------------------------------------

GRANT SELECT, INSERT, UPDATE, DELETE ON public.courier_partners TO authenticated;
GRANT SELECT, INSERT ON public.stock_movements TO authenticated;

DROP POLICY IF EXISTS "Admins can manage couriers" ON public.courier_partners;
DROP POLICY IF EXISTS "Admins can view stock audit" ON public.stock_movements;

CREATE POLICY "Staff and admin can view couriers" ON public.courier_partners
  FOR SELECT USING (public.is_staff_or_admin());

CREATE POLICY "Admins can manage couriers" ON public.courier_partners
  FOR ALL USING (public.is_admin());

CREATE POLICY "Staff and admin can view stock movements" ON public.stock_movements
  FOR SELECT USING (public.is_staff_or_admin());

CREATE POLICY "Staff and admin can log stock movements" ON public.stock_movements
  FOR INSERT WITH CHECK (public.is_staff_or_admin());
