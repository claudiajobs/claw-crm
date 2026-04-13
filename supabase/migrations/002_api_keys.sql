-- =============================================================
-- TABELA: api_keys
-- Chaves de API para robot SDRs e integrações externas
-- key_hash armazena SHA-256 da chave (nunca a chave bruta)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.api_keys (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash      text        NOT NULL UNIQUE,   -- SHA-256 hex da chave bruta
  label         text        NOT NULL,
  owner_id      uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  permissions   jsonb       NOT NULL DEFAULT '[]'::jsonb,
  last_used_at  timestamptz,
  revoked_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX api_keys_owner_id_idx ON public.api_keys (owner_id);
CREATE INDEX api_keys_key_hash_idx ON public.api_keys (key_hash) WHERE revoked_at IS NULL;

-- RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "api_keys: rep vê apenas suas chaves"
  ON public.api_keys FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "api_keys: admin vê todas"
  ON public.api_keys FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "api_keys: rep gerencia suas próprias chaves"
  ON public.api_keys FOR ALL
  USING (owner_id = auth.uid());

CREATE POLICY "api_keys: admin gerencia todas"
  ON public.api_keys FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE TRIGGER api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
