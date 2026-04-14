-- =============================================================
-- TABELA: accounts
-- Empresas / contas comerciais do CRM
-- =============================================================

CREATE TABLE IF NOT EXISTS public.accounts (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                    text        NOT NULL,
  type                    text        NOT NULL
                                      CHECK (type IN (
                                        'distribuidor',
                                        'empreiteiro',
                                        'construtora',
                                        'pintor_autonomo',
                                        'loja_materiais'
                                      )),
  phone                   text,
  address                 text,
  city                    text,
  state                   text,
  zip                     text,
  website                 text,
  territory               text,
  account_number          text,
  credit_limit            numeric(15, 2),
  payment_terms           text        CHECK (payment_terms IN ('avista', '30d', '60d', '90d')),
  annual_volume_liters    numeric(15, 3),
  annual_paint_spend_brl  numeric(15, 2),
  preferred_brands        text[]      DEFAULT '{}',
  competitor_brands       text[]      DEFAULT '{}',
  region                  text        CHECK (region IN (
                                        'Norte',
                                        'Nordeste',
                                        'Centro-Oeste',
                                        'Sudeste',
                                        'Sul'
                                      )),
  tags                    text[]      DEFAULT '{}',
  enrichment_data         jsonb       DEFAULT '{}'::jsonb,
  owner_id                uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  custom_fields           jsonb       DEFAULT '{}'::jsonb,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX accounts_owner_id_idx  ON public.accounts (owner_id);
CREATE INDEX accounts_type_idx      ON public.accounts (type);
CREATE INDEX accounts_region_idx    ON public.accounts (region);
CREATE INDEX accounts_tags_idx      ON public.accounts USING GIN (tags);

-- RLS
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "accounts: rep vê apenas suas contas"
  ON public.accounts FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "accounts: admin vê todas"
  ON public.accounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "accounts: rep gerencia suas contas"
  ON public.accounts FOR ALL
  USING (owner_id = auth.uid());

CREATE POLICY "accounts: admin gerencia todas"
  ON public.accounts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE TRIGGER accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
