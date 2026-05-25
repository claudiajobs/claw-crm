-- =============================================================
-- Migration 019: Pedidos — orders, items, coupons
-- =============================================================

-- ─── pedidos ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pedidos (
  id              uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id      uuid           NOT NULL REFERENCES public.contacts(id) ON DELETE RESTRICT,
  lead_id         uuid           REFERENCES public.leads(id) ON DELETE SET NULL,
  owner_id        uuid           NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  status          text           NOT NULL DEFAULT 'draft'
                                 CHECK (status IN (
                                   'draft',
                                   'pending_approval',
                                   'approved',
                                   'rejected',
                                   'cancelled'
                                 )),
  total           numeric(12, 2) NOT NULL DEFAULT 0,
  discount_pct    numeric(5, 2)  NOT NULL DEFAULT 0,
  discount_amount numeric(12, 2) NOT NULL DEFAULT 0,
  coupon_id       uuid,
  notes           text,
  approved_by     uuid           REFERENCES public.users(id),
  approved_at     timestamptz,
  rejected_by     uuid           REFERENCES public.users(id),
  rejected_at     timestamptz,
  rejected_reason text,
  created_at      timestamptz    NOT NULL DEFAULT now(),
  updated_at      timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX pedidos_contact_id_idx ON public.pedidos (contact_id);
CREATE INDEX pedidos_lead_id_idx    ON public.pedidos (lead_id);
CREATE INDEX pedidos_owner_id_idx   ON public.pedidos (owner_id);
CREATE INDEX pedidos_status_idx     ON public.pedidos (status);

ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pedidos: authenticated read"
  ON public.pedidos FOR SELECT
  TO authenticated
  USING (true);

CREATE TRIGGER pedidos_updated_at
  BEFORE UPDATE ON public.pedidos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── pedido_items ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pedido_items (
  id              uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id       uuid           NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  variant_id      uuid           NOT NULL REFERENCES public.product_variants(id) ON DELETE RESTRICT,
  quantity        integer        NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price      numeric(10, 2) NOT NULL,
  discount_pct    numeric(5, 2)  NOT NULL DEFAULT 0,
  total           numeric(12, 2) NOT NULL,
  created_at      timestamptz    NOT NULL DEFAULT now(),
  updated_at      timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX pedido_items_pedido_id_idx  ON public.pedido_items (pedido_id);
CREATE INDEX pedido_items_variant_id_idx ON public.pedido_items (variant_id);

ALTER TABLE public.pedido_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pedido_items: authenticated read"
  ON public.pedido_items FOR SELECT
  TO authenticated
  USING (true);

CREATE TRIGGER pedido_items_updated_at
  BEFORE UPDATE ON public.pedido_items
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── discount_coupons ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.discount_coupons (
  id          uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  code        text           NOT NULL UNIQUE,
  description text,
  discount_pct numeric(5, 2) NOT NULL CHECK (discount_pct > 0 AND discount_pct <= 100),
  max_uses    integer,
  used_count  integer        NOT NULL DEFAULT 0,
  valid_from  timestamptz    NOT NULL DEFAULT now(),
  valid_until timestamptz,
  active      boolean        NOT NULL DEFAULT true,
  created_at  timestamptz    NOT NULL DEFAULT now(),
  updated_at  timestamptz    NOT NULL DEFAULT now()
);

CREATE INDEX discount_coupons_code_idx ON public.discount_coupons (code);

ALTER TABLE public.discount_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "discount_coupons: authenticated read"
  ON public.discount_coupons FOR SELECT
  TO authenticated
  USING (true);

CREATE TRIGGER discount_coupons_updated_at
  BEFORE UPDATE ON public.discount_coupons
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── Add FK from contact_memberships to pedidos ─────────────────────────────

ALTER TABLE public.contact_memberships
  ADD CONSTRAINT contact_memberships_pedido_id_fk
  FOREIGN KEY (pedido_id) REFERENCES public.pedidos(id) ON DELETE SET NULL;

CREATE INDEX contact_memberships_pedido_id_idx ON public.contact_memberships (pedido_id);

-- ─── Add FK from pedidos to discount_coupons ────────────────────────────────

ALTER TABLE public.pedidos
  ADD CONSTRAINT pedidos_coupon_id_fk
  FOREIGN KEY (coupon_id) REFERENCES public.discount_coupons(id) ON DELETE SET NULL;
