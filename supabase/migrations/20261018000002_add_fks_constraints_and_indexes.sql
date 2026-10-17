-- ==============================================================================
-- Migration: 20261018000002_add_fks_constraints_and_indexes.sql
-- Description:
--   1. Adds foreign keys: products.category_id -> categories.id
--      categories.parent_id -> categories.id
--      orders.customer_id -> auth.users.id
--   2. Adds CHECK constraints for orders.status and orders.payment_status
--   3. Adds performance and lookup indexes for category_id, customer_id, status,
--      created_at, is_active, and slug across core tables
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. FOREIGN KEY CONSTRAINTS
-- ------------------------------------------------------------------------------

-- Ensure products.category_id references categories(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_products_category' AND table_name = 'products'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT fk_products_category
      FOREIGN KEY (category_id) REFERENCES public.categories(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Ensure categories.parent_id references parent category
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_categories_parent' AND table_name = 'categories'
  ) THEN
    ALTER TABLE public.categories
      ADD CONSTRAINT fk_categories_parent
      FOREIGN KEY (parent_id) REFERENCES public.categories(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- Normalize orders.customer_id to UUID and reference auth.users(id)
DO $$
BEGIN
  -- Convert column type to UUID safely if it was TEXT
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'customer_id' AND data_type = 'text'
  ) THEN
    ALTER TABLE public.orders
      ALTER COLUMN customer_id TYPE UUID USING (
        CASE
          WHEN customer_id ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
          THEN customer_id::UUID
          ELSE NULL
        END
      );
  END IF;

  -- Add FK to auth.users
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_orders_customer' AND table_name = 'orders'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT fk_orders_customer
      FOREIGN KEY (customer_id) REFERENCES auth.users(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 2. CHECK CONSTRAINTS ON ORDERS
-- ------------------------------------------------------------------------------

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS chk_orders_status;
ALTER TABLE public.orders ADD CONSTRAINT chk_orders_status
  CHECK (status IN ('Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'));

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS chk_orders_payment_status;
ALTER TABLE public.orders ADD CONSTRAINT chk_orders_payment_status
  CHECK (payment_status IN ('Pending', 'Paid', 'Failed', 'Refunded', 'PENDING_VERIFICATION'));

-- ------------------------------------------------------------------------------
-- 3. INDEXES: category_id, customer_id, status, created_at, is_active, slug
-- ------------------------------------------------------------------------------

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON public.products(created_at DESC);

-- Categories indexes
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON public.categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
