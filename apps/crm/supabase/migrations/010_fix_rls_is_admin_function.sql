-- =============================================================
-- FIX: RLS infinite recursion on users table
-- Replace direct subquery admin checks with SECURITY DEFINER function
-- =============================================================

-- Create is_admin() helper to avoid recursive RLS policies
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Drop old recursive admin policies
DROP POLICY IF EXISTS "accounts: admin gerencia todos" ON public.accounts;
DROP POLICY IF EXISTS "contacts: admin gerencia todos" ON public.contacts;
DROP POLICY IF EXISTS "leads: admin gerencia todos" ON public.leads;
DROP POLICY IF EXISTS "activities: admin gerencia todas" ON public.activities;
DROP POLICY IF EXISTS "activities: admin vê todas" ON public.activities;
DROP POLICY IF EXISTS "tasks: admin gerencia todas" ON public.tasks;
DROP POLICY IF EXISTS "tasks: admin vê todas" ON public.tasks;
DROP POLICY IF EXISTS "enrichment_jobs: admin gerencia todos" ON public.enrichment_jobs;
DROP POLICY IF EXISTS "enrichment_jobs: admin vê todos" ON public.enrichment_jobs;
DROP POLICY IF EXISTS "admins_manage_api_keys" ON public.api_keys;

-- Recreate using is_admin()
CREATE POLICY "accounts_admin" ON public.accounts FOR ALL USING (public.is_admin());
CREATE POLICY "contacts_admin" ON public.contacts FOR ALL USING (public.is_admin());
CREATE POLICY "leads_admin" ON public.leads FOR ALL USING (public.is_admin());
CREATE POLICY "activities_admin" ON public.activities FOR ALL USING (public.is_admin());
CREATE POLICY "tasks_admin" ON public.tasks FOR ALL USING (public.is_admin());
CREATE POLICY "enrichment_admin" ON public.enrichment_jobs FOR ALL USING (public.is_admin());
CREATE POLICY "api_keys_admin" ON public.api_keys FOR ALL USING (public.is_admin());
