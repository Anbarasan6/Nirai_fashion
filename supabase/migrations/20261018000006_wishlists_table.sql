-- ==============================================================================
-- Migration: 20261018000006_wishlists_table.sql
-- Description:
--   1. Creates normalized wishlists table for authenticated users
--   2. Provides atomic RPC sync_guest_wishlist for merging guest wishlist on login
--   3. Enforces strict RLS so users manage only their own wishlist items
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_product_wishlist UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_product ON public.wishlists(product_id);

-- ------------------------------------------------------------------------------
-- 1. RPC: Merge guest wishlist with user account on authentication
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_guest_wishlist(p_product_ids TEXT[])
RETURNS TEXT[]
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_pid TEXT;
  v_result TEXT[];
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN ARRAY[]::TEXT[];
  END IF;

  -- Insert guest items for authenticated user
  IF p_product_ids IS NOT NULL AND array_length(p_product_ids, 1) > 0 THEN
    FOREACH v_pid IN ARRAY p_product_ids LOOP
      -- Ensure product exists in catalog before inserting
      IF EXISTS (SELECT 1 FROM public.products WHERE id = v_pid) THEN
        INSERT INTO public.wishlists (user_id, product_id)
        VALUES (auth.uid(), v_pid)
        ON CONFLICT (user_id, product_id) DO NOTHING;
      END IF;
    END LOOP;
  END IF;

  -- Return merged array of product IDs
  SELECT array_agg(product_id ORDER BY created_at DESC)
  INTO v_result
  FROM public.wishlists
  WHERE user_id = auth.uid();

  RETURN COALESCE(v_result, ARRAY[]::TEXT[]);
END;
$$;

-- ------------------------------------------------------------------------------
-- 2. RLS POLICIES FOR WISHLISTS
-- ------------------------------------------------------------------------------

ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON public.wishlists TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_guest_wishlist TO authenticated;

DROP POLICY IF EXISTS "Users view own wishlist" ON public.wishlists;
CREATE POLICY "Users view own wishlist" ON public.wishlists
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users add to own wishlist" ON public.wishlists;
CREATE POLICY "Users add to own wishlist" ON public.wishlists
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users delete from own wishlist" ON public.wishlists;
CREATE POLICY "Users delete from own wishlist" ON public.wishlists
  FOR DELETE USING (user_id = auth.uid());
