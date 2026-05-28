-- =============================================================
-- Migration 017: Pricing — membership tiers + product pricing
-- =============================================================

-- ─── membership_tiers ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.membership_tiers (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text        NOT NULL UNIQUE,
  name        text        NOT NULL,
  description text,
  sort_order  integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX membership_tiers_slug_idx ON public.membership_tiers (slug);

ALTER TABLE public.membership_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "membership_tiers: authenticated read"
  ON public.membership_tiers FOR SELECT
  TO authenticated
  USING (true);

CREATE TRIGGER membership_tiers_updated_at
  BEFORE UPDATE ON public.membership_tiers
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── product_pricing ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.product_pricing (
  id          uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  variant_id  uuid           NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  tier_slug   text           NOT NULL REFERENCES public.membership_tiers(slug) ON DELETE RESTRICT,
  price       numeric(10, 2) NOT NULL,
  valid_from  timestamptz    NOT NULL DEFAULT now(),
  valid_until timestamptz,
  created_at  timestamptz    NOT NULL DEFAULT now(),
  updated_at  timestamptz    NOT NULL DEFAULT now(),

  CONSTRAINT product_pricing_price_positive CHECK (price >= 0)
);

CREATE INDEX product_pricing_variant_id_idx ON public.product_pricing (variant_id);
CREATE INDEX product_pricing_tier_slug_idx  ON public.product_pricing (tier_slug);
CREATE INDEX product_pricing_lookup_idx     ON public.product_pricing (variant_id, tier_slug, valid_from DESC);

ALTER TABLE public.product_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_pricing: authenticated read"
  ON public.product_pricing FOR SELECT
  TO authenticated
  USING (true);

CREATE TRIGGER product_pricing_updated_at
  BEFORE UPDATE ON public.product_pricing
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
