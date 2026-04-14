-- =============================================================
-- TABELA: tasks
-- Tarefas CRM atribuídas a representantes
-- =============================================================

CREATE TABLE IF NOT EXISTS public.tasks (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text        NOT NULL,
  description text,
  due_at      timestamptz,
  completed_at timestamptz,
  priority    text        NOT NULL DEFAULT 'medio'
                          CHECK (priority IN ('baixo', 'medio', 'alto')),
  status      text        NOT NULL DEFAULT 'pendente'
                          CHECK (status IN ('pendente', 'concluida', 'cancelada')),
  contact_id  uuid        REFERENCES public.contacts(id) ON DELETE SET NULL,
  lead_id     uuid        REFERENCES public.leads(id) ON DELETE SET NULL,
  assigned_to uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_by  uuid        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX tasks_assigned_to_idx ON public.tasks (assigned_to);
CREATE INDEX tasks_status_idx      ON public.tasks (status);
CREATE INDEX tasks_due_at_idx      ON public.tasks (due_at) WHERE due_at IS NOT NULL;
CREATE INDEX tasks_contact_id_idx  ON public.tasks (contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX tasks_lead_id_idx     ON public.tasks (lead_id) WHERE lead_id IS NOT NULL;

-- RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks: rep vê apenas suas tarefas"
  ON public.tasks FOR SELECT
  USING (assigned_to = auth.uid() OR created_by = auth.uid());

CREATE POLICY "tasks: admin vê todas"
  ON public.tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "tasks: rep gerencia suas tarefas"
  ON public.tasks FOR ALL
  USING (assigned_to = auth.uid() OR created_by = auth.uid());

CREATE POLICY "tasks: admin gerencia todas"
  ON public.tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
