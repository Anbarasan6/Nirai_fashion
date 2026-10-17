-- ==============================================================================
-- Migration: 20261018000004_suppliers_couriers_stock_media.sql
-- Description:
--   1. Ensures tables for suppliers, courier_partners, stock_movements, and media_library
--   2. Enforces stock movement tracking strictly via DB triggers & RPC (no client writes)
--   3. Sets up RLS policies for staff/admin role permissions
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SUPPLIERS & COURIER PARTNERS TABLES
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.suppliers (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  city TEXT,
  state TEXT,
  lead_time_days INTEGER DEFAULT 7,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.courier_partners (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. MEDIA LIBRARY TABLE
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  secure_url TEXT NOT NULL,
  public_id TEXT NOT NULL UNIQUE,
  folder TEXT DEFAULT 'nirai/media',
  category TEXT DEFAULT 'general' CHECK (category IN ('all', 'logos', 'hero', 'categories', 'products', 'promotions', 'general')),
  alt_text TEXT,
  width INTEGER,
  height INTEGER,
  format TEXT,
  bytes INTEGER,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_media_category ON public.media_library(category);
CREATE INDEX IF NOT EXISTS idx_media_created ON public.media_library(created_at DESC);

-- ------------------------------------------------------------------------------
-- 3. STOCK MOVEMENTS TABLE & AUDIT TRIGGER / RPC
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  change_amount INTEGER NOT NULL DEFAULT 0,
  previous_stock INTEGER NOT NULL DEFAULT 0,
  new_stock INTEGER NOT NULL DEFAULT 0,
  reason TEXT DEFAULT 'Manual adjustment',
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Harmonize legacy columns if table was created in an earlier migration
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'stock_movements' AND column_name = 'timestamp'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'stock_movements' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.stock_movements RENAME COLUMN "timestamp" TO created_at;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'stock_movements' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.stock_movements ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'stock_movements' AND column_name = 'quantity_delta'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'stock_movements' AND column_name = 'change_amount'
  ) THEN
    ALTER TABLE public.stock_movements RENAME COLUMN quantity_delta TO change_amount;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'stock_movements' AND column_name = 'change_amount'
  ) THEN
    ALTER TABLE public.stock_movements ADD COLUMN change_amount INTEGER DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_stock_prod_id ON public.stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_created_at ON public.stock_movements(created_at DESC);

-- Trigger: Automatically write stock movement audit whenever products.stock changes
CREATE OR REPLACE FUNCTION public.trg_audit_stock_movement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.stock IS DISTINCT FROM OLD.stock THEN
    INSERT INTO public.stock_movements (
      product_id,
      change_amount,
      previous_stock,
      new_stock,
      reason,
      performed_by
    ) VALUES (
      NEW.id,
      NEW.stock - OLD.stock,
      OLD.stock,
      NEW.stock,
      'Catalog stock modification',
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_product_stock ON public.products;
CREATE TRIGGER trg_audit_product_stock
  AFTER UPDATE OF stock ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.trg_audit_stock_movement();

-- RPC: Secure atomic stock adjustment callable by staff/admin
CREATE OR REPLACE FUNCTION public.adjust_product_stock(
  p_product_id TEXT,
  p_delta INTEGER,
  p_reason TEXT DEFAULT 'Inventory restock'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_old_stock INTEGER;
  v_new_stock INTEGER;
  v_record RECORD;
BEGIN
  IF NOT (public.is_staff_or_admin()) THEN
    RAISE EXCEPTION 'Access Denied: Staff or Administrator role required to adjust stock.';
  END IF;

  SELECT stock INTO v_old_stock
  FROM public.products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found with id %', p_product_id;
  END IF;

  v_new_stock := GREATEST(0, v_old_stock + p_delta);

  UPDATE public.products
  SET stock = v_new_stock,
      updated_at = NOW()
  WHERE id = p_product_id;

  INSERT INTO public.stock_movements (
    product_id,
    change_amount,
    previous_stock,
    new_stock,
    reason,
    performed_by
  ) VALUES (
    p_product_id,
    p_delta,
    v_old_stock,
    v_new_stock,
    COALESCE(p_reason, 'Stock Adjustment'),
    auth.uid()
  ) RETURNING * INTO v_record;

  RETURN jsonb_build_object(
    'product_id', p_product_id,
    'previous_stock', v_old_stock,
    'new_stock', v_new_stock,
    'delta', p_delta
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 4. RLS POLICIES (Staff / Admin Only)
-- ------------------------------------------------------------------------------

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courier_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_library TO authenticated;
GRANT SELECT ON public.media_library TO anon;
GRANT EXECUTE ON FUNCTION public.adjust_product_stock TO authenticated;

-- Media Library Policies
DROP POLICY IF EXISTS "Public can view media items" ON public.media_library;
CREATE POLICY "Public can view media items" ON public.media_library
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Staff and admin manage media" ON public.media_library;
CREATE POLICY "Staff and admin manage media" ON public.media_library
  FOR ALL USING (public.is_staff_or_admin());

-- Stock Movements: Direct INSERT revoked from all clients! Only DB triggers and RPC write rows.
REVOKE INSERT, UPDATE, DELETE ON public.stock_movements FROM anon, authenticated;
GRANT SELECT ON public.stock_movements TO authenticated;

DROP POLICY IF EXISTS "Staff and admin view stock movements" ON public.stock_movements;
CREATE POLICY "Staff and admin view stock movements" ON public.stock_movements
  FOR SELECT USING (public.is_staff_or_admin());
