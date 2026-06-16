-- =============================================================
-- Migration 022: Pedido shares — order sharing between users
-- =============================================================

-- ─── pedido_shares ─────────────────────────────────────────────────────────

CREATE TABLE public.pedido_shares (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id   uuid        NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  shared_with uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  shared_by   uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pedido_id, shared_with)
);

CREATE INDEX pedido_shares_pedido_id_idx   ON public.pedido_shares (pedido_id);
CREATE INDEX pedido_shares_shared_with_idx ON public.pedido_shares (shared_with);

ALTER TABLE public.pedido_shares ENABLE ROW LEVEL SECURITY;

-- User sees shares they received or created
CREATE POLICY "pedido_shares_access" ON public.pedido_shares
  FOR ALL USING (
    shared_with = auth.uid()
    OR shared_by = auth.uid()
    OR public.is_admin()
  );

-- ─── Update pedidos SELECT policy ──────────────────────────────────────────

DROP POLICY IF EXISTS "pedidos: authenticated read" ON public.pedidos;
DROP POLICY IF EXISTS "pedidos_select" ON public.pedidos;
DROP POLICY IF EXISTS "reps_own_pedidos" ON public.pedidos;

CREATE POLICY "pedidos_select" ON public.pedidos FOR SELECT
  USING (
    public.is_admin()
    OR public.user_role() = 'editor'
    OR owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.pedido_shares ps
      WHERE ps.pedido_id = id AND ps.shared_with = auth.uid()
    )
  );
