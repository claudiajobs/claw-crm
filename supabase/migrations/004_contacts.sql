-- =============================================================
-- TABELA: contacts
-- Pessoas físicas — SEM campo email (canal principal: WhatsApp/Instagram)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.contacts (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name              text        NOT NULL,
  last_name               text,
  job_title               text,
  whatsapp_number         text,
  instagram_handle        text,
  phone                   text,
  preferred_channel       text        CHECK (preferred_channel IN (
                                        'whatsapp',
                                        'instagram',
                                        'telefone'
                                      )),
  type                    text        CHECK (type IN (
                                        'pintor_autonomo',
                                        'empreiteiro',
                                        'engenheiro',
                                        'arquiteto',
                                        'distribuidor',
                                        'construtora'
                                      )),
  status                  text        NOT NULL DEFAULT 'lead'
                                      CHECK (status IN (
                                        'lead',
                                        'prospecto',
                                        'cliente',
                                        'inativo'
                                      )),
  source                  text        CHECK (source IN (
                                        'manual',
                                        'formulario_inbound',
                                        'robot_sdr',
                                        'importacao_csv',
                                        'enriquecido'
                                      )),
  trade_type              text,
  license_number          text,
  preferred_product_lines text[]      DEFAULT '{}',
  monthly_volume_liters   numeric(15, 3),
  price_sensitivity       text,
  territory               text,
  tags                    text[]      DEFAULT '{}',
  account_id              uuid        REFERENCES public.accounts(id) ON DELETE SET NULL,
  owner_id                uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  enriched_at             timestamptz,
  enrichment_data         jsonb       DEFAULT '{}'::jsonb,
  notes                   text,
  custom_fields           jsonb       DEFAULT '{}'::jsonb,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

-- Índices simples
CREATE INDEX contacts_owner_id_idx         ON public.contacts (owner_id);
CREATE INDEX contacts_account_id_idx       ON public.contacts (account_id);
CREATE INDEX contacts_whatsapp_number_idx  ON public.contacts (whatsapp_number) WHERE whatsapp_number IS NOT NULL;
CREATE INDEX contacts_instagram_handle_idx ON public.contacts (instagram_handle) WHERE instagram_handle IS NOT NULL;
CREATE INDEX contacts_status_idx           ON public.contacts (status);

-- Índice GIN para busca full-text em português
CREATE INDEX contacts_fts_idx ON public.contacts
  USING GIN (to_tsvector('portuguese', first_name || ' ' || coalesce(last_name, '')));

-- RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contacts: rep vê apenas seus contatos"
  ON public.contacts FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "contacts: admin vê todos"
  ON public.contacts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "contacts: rep gerencia seus contatos"
  ON public.contacts FOR ALL
  USING (owner_id = auth.uid());

CREATE POLICY "contacts: admin gerencia todos"
  ON public.contacts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE TRIGGER contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
