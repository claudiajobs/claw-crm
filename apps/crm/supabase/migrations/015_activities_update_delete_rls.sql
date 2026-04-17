-- =============================================================
-- RLS: permitir rep atualizar/deletar atividades próprias
-- =============================================================

CREATE POLICY "activities: rep atualiza atividades próprias"
  ON public.activities FOR UPDATE
  USING (performed_by = auth.uid())
  WITH CHECK (performed_by = auth.uid());

CREATE POLICY "activities: rep deleta atividades próprias"
  ON public.activities FOR DELETE
  USING (performed_by = auth.uid());
