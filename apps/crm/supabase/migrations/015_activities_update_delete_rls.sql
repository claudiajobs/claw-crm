-- =============================================================
-- RLS: permitir rep atualizar/deletar atividades próprias
-- =============================================================

CREATE POLICY "activities: rep atualiza atividades próprias"
  ON public.activities FOR UPDATE
  USING (performed_by = auth.uid() OR public.is_admin() OR public.user_role() = 'editor')
  WITH CHECK (performed_by = auth.uid() OR public.is_admin() OR public.user_role() = 'editor');

CREATE POLICY "activities: rep deleta atividades próprias"
  ON public.activities FOR DELETE
  USING (performed_by = auth.uid() OR public.is_admin() OR public.user_role() = 'editor');
