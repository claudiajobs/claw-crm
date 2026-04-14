-- =============================================================
-- TABELA: leads
-- Oportunidades de negócio associadas a contatos
-- =============================================================

CREATE TABLE IF NOT EXISTS public.leads (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 text        NOT NULL,
  status                text        NOT NULL DEFAULT 'novo'
                                    CHECK (status IN (
                                      'novo',
                                      'contatado',
                                      'qualificado',
                                      'proposta',
                                      'negociacao',
                                      'ganho',
                                      'perdido'
                                    )),
  stage                 text,
  score                 integer     NOT NULL DEFAULT 0,
  value                 numeric(15, 2),
  currency              text        NOT NULL DEFAULT 'BRL',
  product_interest      text[]      DEFAULT '{}',
  project_type          text        CHECK (project_type IN (
                                      'residencial',
                                      'comercial',
                                      'industrial',
                                      'infraestrutura'
                                    )),
  project_size_m2       numeric(10, 2),
  estimated_volume_liters numeric(15, 3),
  decision_timeline     text        CHECK (decision_timeline IN (
                                      'imediato',
                                      '1-3m',
                                      '3-6m',
                                      '6m+'
                                    )),
  contact_id            uuid        NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  account_id            uuid        REFERENCES public.accounts(id) ON DELETE SET NULL,
  owner_id              uuid        REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_to_robot     boolean     NOT NULL DEFAULT false,
  robot_sdr_id          text,
  source                text,
  lost_reason           text,
  expected_close_date   date,
  closed_at             timestamptz,
  custom_fields         jsonb       DEFAULT '{}'::jsonb,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX leads_owner_id_idx        ON public.leads (owner_id);
CREATE INDEX leads_status_idx          ON public.leads (status);
CREATE INDEX leads_contact_id_idx      ON public.leads (contact_id);
CREATE INDEX leads_robot_idx           ON public.leads (assigned_to_robot, robot_sdr_id)
  WHERE assigned_to_robot = true;
CREATE INDEX leads_score_idx           ON public.leads (score DESC);

-- RPC atômica: robot SDR reivindica um lead com SKIP LOCKED (sem dead-lock)
CREATE OR REPLACE FUNCTION public.claim_lead_for_robot(
  p_lead_id      uuid,
  p_robot_sdr_id text
)
RETURNS public.leads AS $$
DECLARE
  v_lead public.leads;
BEGIN
  SELECT * INTO v_lead
  FROM public.leads
  WHERE id = p_lead_id
    AND assigned_to_robot = false
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'lead_not_available';
  END IF;

  UPDATE public.leads
  SET
    assigned_to_robot = true,
    robot_sdr_id      = p_robot_sdr_id,
    updated_at        = now()
  WHERE id = p_lead_id
  RETURNING * INTO v_lead;

  RETURN v_lead;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads: rep vê apenas seus leads"
  ON public.leads FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "leads: admin vê todos"
  ON public.leads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "leads: rep gerencia seus leads"
  ON public.leads FOR ALL
  USING (owner_id = auth.uid());

CREATE POLICY "leads: admin gerencia todos"
  ON public.leads FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
