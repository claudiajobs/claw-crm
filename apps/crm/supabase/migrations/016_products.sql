-- =============================================================
-- Migration 016: Products — categories, products, variants
-- =============================================================

-- ─── product_categories ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.product_categories (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  slug        text        NOT NULL UNIQUE,
  description text,
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX product_categories_slug_idx ON public.product_categories (slug);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_categories: authenticated read"
  ON public.product_categories FOR SELECT
  TO authenticated
  USING (true);

CREATE TRIGGER product_categories_updated_at
  BEFORE UPDATE ON public.product_categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── products ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.products (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  slug        text        NOT NULL UNIQUE,
  description text,
  category_id uuid        NOT NULL REFERENCES public.product_categories(id) ON DELETE RESTRICT,
  active      boolean     NOT NULL DEFAULT true,
  metadata    jsonb       DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX products_slug_idx        ON public.products (slug);
CREATE INDEX products_category_id_idx ON public.products (category_id);
CREATE INDEX products_active_idx      ON public.products (active) WHERE active = true;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products: authenticated read"
  ON public.products FOR SELECT
  TO authenticated
  USING (true);

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── product_variants ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.product_variants (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  uuid        NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku         text        NOT NULL UNIQUE,
  name        text        NOT NULL,
  unit        text        NOT NULL DEFAULT 'un',
  weight_kg   numeric(10, 3),
  volume_l    numeric(10, 3),
  active      boolean     NOT NULL DEFAULT true,
  metadata    jsonb       DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX product_variants_product_id_idx ON public.product_variants (product_id);
CREATE INDEX product_variants_sku_idx        ON public.product_variants (sku);
CREATE INDEX product_variants_active_idx     ON public.product_variants (active) WHERE active = true;

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_variants: authenticated read"
  ON public.product_variants FOR SELECT
  TO authenticated
  USING (true);

CREATE TRIGGER product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
