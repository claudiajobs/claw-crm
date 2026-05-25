-- =============================================================
-- Migration 018: Memberships — memberships + contact_memberships
-- =============================================================

-- ─── memberships ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.memberships (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  tier_slug   text        NOT NULL REFERENCES public.membership_tiers(slug) ON DELETE RESTRICT,
  description text,
  active      boolean     NOT NULL DEFAULT true,
  metadata    jsonb       DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX memberships_tier_slug_idx ON public.memberships (tier_slug);

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "memberships: authenticated read"
  ON public.memberships FOR SELECT
  TO authenticated
  USING (true);

CREATE TRIGGER memberships_updated_at
  BEFORE UPDATE ON public.memberships
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── contact_memberships ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.contact_memberships (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id    uuid        NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  membership_id uuid        NOT NULL REFERENCES public.memberships(id) ON DELETE RESTRICT,
  pedido_id     uuid,       -- FK added in 019_pedidos after pedidos table exists
  status        text        NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'expired', 'cancelled')),
  starts_at     timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX contact_memberships_contact_id_idx    ON public.contact_memberships (contact_id);
CREATE INDEX contact_memberships_membership_id_idx ON public.contact_memberships (membership_id);
CREATE INDEX contact_memberships_status_idx        ON public.contact_memberships (status) WHERE status = 'active';

ALTER TABLE public.contact_memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contact_memberships: authenticated read"
  ON public.contact_memberships FOR SELECT
  TO authenticated
  USING (true);

CREATE TRIGGER contact_memberships_updated_at
  BEFORE UPDATE ON public.contact_memberships
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ─── Add membership_tier to contacts ────────────────────────────────────────

ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS membership_tier text REFERENCES public.membership_tiers(slug);
