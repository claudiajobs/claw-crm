-- =============================================================
-- TABELA: activities
-- Registro de todas as interações (humanas e robôs)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.activities (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  type                text        NOT NULL
                                  CHECK (type IN (
                                    'nota',
                                    'ligacao',
                                    'reuniao',
                                    'tarefa',
                                    'instagram_dm_enviado',
                                    'instagram_dm_recebido',
                                    'whatsapp_enviado',
                                    'whatsapp_recebido',
                                    'acao_sdr'
                                  )),
  subject             text,
  body                text,
  outcome             text,
  performed_by        uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  performed_by_robot  text,
  contact_id          uuid        NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  lead_id             uuid        REFERENCES public.leads(id) ON DELETE SET NULL,
  account_id          uuid        REFERENCES public.accounts(id) ON DELETE SET NULL,
  scheduled_at        timestamptz,
  completed_at        timestamptz,
  metadata            jsonb       DEFAULT '{}'::jsonb,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT activities_performer_check
    CHECK (performed_by IS NOT NULL OR performed_by_robot IS NOT NULL)
);

CREATE INDEX activities_contact_id_idx    ON public.activities (contact_id);
CREATE INDEX activities_lead_id_idx       ON public.activities (lead_id) WHERE lead_id IS NOT NULL;
CREATE INDEX activities_performed_by_idx  ON public.activities (performed_by) WHERE performed_by IS NOT NULL;
CREATE INDEX activities_type_idx          ON public.activities (type);
CREATE INDEX activities_created_at_idx    ON public.activities (created_at DESC);

-- RLS
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activities: rep vê atividades de seus contatos"
  ON public.activities FOR SELECT
  USING (
    performed_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.contacts c
      WHERE c.id = contact_id AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY "activities: admin vê todas"
  ON public.activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "activities: rep registra atividades em seus contatos"
  ON public.activities FOR INSERT
  WITH CHECK (
    performed_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.contacts c
      WHERE c.id = contact_id AND c.owner_id = auth.uid()
    )
  );

CREATE POLICY "activities: admin gerencia todas"
  ON public.activities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE TRIGGER activities_updated_at
  BEFORE UPDATE ON public.activities
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
