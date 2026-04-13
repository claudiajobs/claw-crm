-- =============================================================
-- TABELA: users
-- Espelha auth.users do Supabase com campos de perfil CRM
-- =============================================================

CREATE TABLE IF NOT EXISTS public.users (
  id            uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text        NOT NULL,
  name          text        NOT NULL,
  role          text        NOT NULL DEFAULT 'sales_rep'
                            CHECK (role IN ('admin', 'sales_rep')),
  territory     text,
  avatar_url    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users: rep vê apenas seu próprio registro"
  ON public.users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "users: admin vê todos"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "users: rep atualiza próprio registro"
  ON public.users FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "users: admin atualiza qualquer registro"
  ON public.users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Trigger para manter updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
