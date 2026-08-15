-- =============================================================
-- Migration 025: Pedido delivery address
-- =============================================================
-- Single free-text delivery address on the pedido. Nullable with no
-- default — existing pedidos keep NULL and render no address block.

ALTER TABLE public.pedidos
  ADD COLUMN IF NOT EXISTS delivery_address text;
