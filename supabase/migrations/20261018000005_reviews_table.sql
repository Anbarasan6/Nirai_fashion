-- ==============================================================================
-- Migration: 20261018000005_reviews_table.sql
-- Description:
--   1. Creates normalized reviews table replacing JSONB storage in products
--   2. Enforces verified purchase verification server-side from delivered orders
--   3. Automatically updates products.rating and products.review_count via trigger
--   4. RLS policies allowing public reads and verified customer writes
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT NOT NULL,
  verified_purchase BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_product_user_review UNIQUE (product_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- ------------------------------------------------------------------------------
-- 1. TRIGGER: Verify delivered purchase before inserting review
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_verify_review_purchase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_has_delivered BOOLEAN;
  v_user_email TEXT;
BEGIN
  -- Obtain reviewer email
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = NEW.user_id;

  -- Verify delivered order containing this product
  SELECT EXISTS (
    SELECT 1
    FROM public.orders o,
         jsonb_array_elements(o.items) AS item
    WHERE (o.customer_id = NEW.user_id OR o.customer_email = v_user_email)
      AND o.status = 'Delivered'
      AND (item->>'id' = NEW.product_id OR item->>'productId' = NEW.product_id)
  ) INTO v_has_delivered;

  IF NOT v_has_delivered THEN
    -- Admin bypass allows administrative seeding/moderation
    IF NOT (public.is_admin()) THEN
      RAISE EXCEPTION 'Access Denied: Only customers with verified delivered orders can review this product.';
    END IF;
  END IF;

  NEW.verified_purchase := true;

  -- Populate reviewer display name if blank
  IF NEW.user_name IS NULL OR TRIM(NEW.user_name) = '' THEN
    SELECT COALESCE(name, split_part(v_user_email, '@', 1)) INTO NEW.user_name
    FROM public.profiles
    WHERE id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_review_purchase ON public.reviews;
CREATE TRIGGER trg_check_review_purchase
  BEFORE INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.trg_verify_review_purchase();

-- ------------------------------------------------------------------------------
-- 2. TRIGGER: Keep products.rating and products.review_count in sync
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_sync_product_reviews()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_target_product TEXT;
  v_avg NUMERIC(3, 1);
  v_count INTEGER;
BEGIN
  v_target_product := COALESCE(NEW.product_id, OLD.product_id);

  SELECT
    COALESCE(ROUND(AVG(rating), 1), 5.0),
    COUNT(*)
  INTO v_avg, v_count
  FROM public.reviews
  WHERE product_id = v_target_product;

  UPDATE public.products
  SET
    rating = v_avg,
    review_count = v_count,
    updated_at = NOW()
  WHERE id = v_target_product;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_after_review_change ON public.reviews;
CREATE TRIGGER trg_after_review_change
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.trg_sync_product_reviews();

-- ------------------------------------------------------------------------------
-- 3. RLS POLICIES FOR REVIEWS
-- ------------------------------------------------------------------------------

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON public.reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.reviews TO authenticated;

-- Public can read all reviews
DROP POLICY IF EXISTS "Public can view reviews" ON public.reviews;
CREATE POLICY "Public can view reviews" ON public.reviews
  FOR SELECT USING (true);

-- Authenticated customers can insert their own review
DROP POLICY IF EXISTS "Customers can create own review" ON public.reviews;
CREATE POLICY "Customers can create own review" ON public.reviews
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Customers can update their own review; admins can moderate
DROP POLICY IF EXISTS "Customers update own review or admin" ON public.reviews;
CREATE POLICY "Customers update own review or admin" ON public.reviews
  FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());

-- Customers can delete their own review; admins can moderate
DROP POLICY IF EXISTS "Customers delete own review or admin" ON public.reviews;
CREATE POLICY "Customers delete own review or admin" ON public.reviews
  FOR DELETE USING (user_id = auth.uid() OR public.is_admin());
