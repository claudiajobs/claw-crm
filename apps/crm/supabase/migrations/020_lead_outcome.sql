-- =============================================================
-- Migration 020: Lead outcome — close leads with outcome tracking
-- =============================================================

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS outcome        text,
  ADD COLUMN IF NOT EXISTS outcome_reason  text,
  ADD COLUMN IF NOT EXISTS outcome_at      timestamptz;
