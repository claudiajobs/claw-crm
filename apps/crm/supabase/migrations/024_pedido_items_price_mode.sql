-- =============================================================
-- Migration 024: Pedido items price mode — tier vs manual override
-- =============================================================
-- Adds price_mode to distinguish tier-priced items from manually
-- overridden prices, and records which tier was applied (null when
-- the price was set manually).

ALTER TABLE public.pedido_items
  ADD COLUMN IF NOT EXISTS price_mode text NOT NULL DEFAULT 'tier'
    CHECK (price_mode IN ('tier', 'override')),
  ADD COLUMN IF NOT EXISTS tier_slug text;
