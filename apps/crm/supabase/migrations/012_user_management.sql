-- Migration 012: User management with approval flow
-- Adds status, expanded roles, approved_by, approved_at to users

BEGIN;

-- ─── 1. Add status column ────────────────────────────────────────────────────

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('pending', 'active', 'suspended'));

-- ─── 2. Update role constraint ───────────────────────────────────────────────

-- Drop old role constraint if it exists
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;

-- Add new role constraint with expanded values
ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
    CHECK (role IN ('admin', 'editor', 'vendedor', 'sdr'));

-- ─── 3. Add approval tracking columns ────────────────────────────────────────

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES public.users(id);

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- ─── 4. Set existing users as active ─────────────────────────────────────────

UPDATE public.users SET status = 'active' WHERE status IS NULL OR status = 'active';

COMMIT;
