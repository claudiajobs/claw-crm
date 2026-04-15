-- Allow reps to create enrichment jobs for their own contacts
CREATE POLICY "enrichment_jobs: rep cria jobs de seus contatos"
  ON public.enrichment_jobs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.contacts c
      WHERE c.id = contact_id AND c.owner_id = auth.uid()
    )
  );
