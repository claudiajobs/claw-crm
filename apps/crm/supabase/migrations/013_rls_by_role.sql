-- Migration 013: RLS policies by role
-- Admin: sees/edits everything
-- Editor: sees/edits all contacts and leads
-- Vendedor: sees/edits only own records (owner_id = auth.uid())
-- SDR: API-only via service role (sdr-middleware)

BEGIN;

-- ─── 1. Helper function: get current user role ──────────────────────────────

CREATE OR REPLACE FUNCTION public.user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$;

-- ─── 2. Update contacts SELECT policy ───────────────────────────────────────

DROP POLICY IF EXISTS "Reps see own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Admins see all contacts" ON public.contacts;
DROP POLICY IF EXISTS "Role-based contacts select" ON public.contacts;

CREATE POLICY "Role-based contacts select"
  ON public.contacts FOR SELECT
  USING (
    public.is_admin()
    OR public.user_role() = 'editor'
    OR (public.user_role() = 'vendedor' AND owner_id = auth.uid())
  );

-- ─── 3. Update contacts INSERT policy ───────────────────────────────────────

DROP POLICY IF EXISTS "Users create own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Role-based contacts insert" ON public.contacts;

CREATE POLICY "Role-based contacts insert"
  ON public.contacts FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR public.user_role() = 'editor'
    OR (public.user_role() = 'vendedor' AND owner_id = auth.uid())
  );

-- ─── 4. Update contacts UPDATE policy ───────────────────────────────────────

DROP POLICY IF EXISTS "Users update own contacts" ON public.contacts;
DROP POLICY IF EXISTS "Admins manage all contacts" ON public.contacts;
DROP POLICY IF EXISTS "Role-based contacts update" ON public.contacts;

CREATE POLICY "Role-based contacts update"
  ON public.contacts FOR UPDATE
  USING (
    public.is_admin()
    OR public.user_role() = 'editor'
    OR (public.user_role() = 'vendedor' AND owner_id = auth.uid())
  );

-- ─── 5. Update contacts DELETE policy ───────────────────────────────────────

DROP POLICY IF EXISTS "Admins delete contacts" ON public.contacts;
DROP POLICY IF EXISTS "Role-based contacts delete" ON public.contacts;

CREATE POLICY "Role-based contacts delete"
  ON public.contacts FOR DELETE
  USING (
    public.is_admin()
  );

-- ─── 6. Update leads SELECT policy ─────────────────────────────────────────

DROP POLICY IF EXISTS "Reps see own leads" ON public.leads;
DROP POLICY IF EXISTS "Admins see all leads" ON public.leads;
DROP POLICY IF EXISTS "Role-based leads select" ON public.leads;

CREATE POLICY "Role-based leads select"
  ON public.leads FOR SELECT
  USING (
    public.is_admin()
    OR public.user_role() = 'editor'
    OR (public.user_role() = 'vendedor' AND owner_id = auth.uid())
  );

-- ─── 7. Update leads INSERT policy ─────────────────────────────────────────

DROP POLICY IF EXISTS "Users create own leads" ON public.leads;
DROP POLICY IF EXISTS "Role-based leads insert" ON public.leads;

CREATE POLICY "Role-based leads insert"
  ON public.leads FOR INSERT
  WITH CHECK (
    public.is_admin()
    OR public.user_role() = 'editor'
    OR (public.user_role() = 'vendedor' AND owner_id = auth.uid())
  );

-- ─── 8. Update leads UPDATE policy ─────────────────────────────────────────

DROP POLICY IF EXISTS "Users update own leads" ON public.leads;
DROP POLICY IF EXISTS "Admins manage all leads" ON public.leads;
DROP POLICY IF EXISTS "Role-based leads update" ON public.leads;

CREATE POLICY "Role-based leads update"
  ON public.leads FOR UPDATE
  USING (
    public.is_admin()
    OR public.user_role() = 'editor'
    OR (public.user_role() = 'vendedor' AND owner_id = auth.uid())
  );

-- ─── 9. Update leads DELETE policy ──────────────────────────────────────────

DROP POLICY IF EXISTS "Admins delete leads" ON public.leads;
DROP POLICY IF EXISTS "Role-based leads delete" ON public.leads;

CREATE POLICY "Role-based leads delete"
  ON public.leads FOR DELETE
  USING (
    public.is_admin()
  );

-- ─── 10. Update users policies for management ──────────────────────────────

DROP POLICY IF EXISTS "Admins manage all users" ON public.users;
DROP POLICY IF EXISTS "Role-based users update" ON public.users;

CREATE POLICY "Role-based users update"
  ON public.users FOR UPDATE
  USING (
    public.is_admin()
    OR id = auth.uid()
  );

COMMIT;
