-- =============================================================
-- TABELA: enrichment_jobs
-- Fila de enriquecimento de dados de contatos via provedores externos
-- =============================================================

CREATE TABLE IF NOT EXISTS public.enrichment_jobs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id    uuid        NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  status        text        NOT NULL DEFAULT 'pendente'
                            CHECK (status IN ('pendente', 'rodando', 'concluido', 'falhou')),
  provider      text        CHECK (provider IN ('apollo', 'hunter', 'proxycurl')),
  raw_response  jsonb,
  error         text,
  triggered_by  text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX enrichment_jobs_contact_id_idx ON public.enrichment_jobs (contact_id);
CREATE INDEX enrichment_jobs_status_idx     ON public.enrichment_jobs (status)
  WHERE status IN ('pendente', 'rodando');

-- RLS
ALTER TABLE public.enrichment_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enrichment_jobs: rep vê jobs de seus contatos"
  ON public.enrichment_jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.contacts c
      WHERE c.id = contact_id AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY "enrichment_jobs: admin vê todos"
  ON public.enrichment_jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "enrichment_jobs: admin gerencia todos"
  ON public.enrichment_jobs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE TRIGGER enrichment_jobs_updated_at
  BEFORE UPDATE ON public.enrichment_jobs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
