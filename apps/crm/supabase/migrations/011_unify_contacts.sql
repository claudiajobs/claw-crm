-- Migration 011: Unify contacts + accounts into a single contacts table
-- Adds entity_type, details jsonb, created_by; migrates accounts → contacts; drops accounts table

BEGIN;

-- ─── 1. Add new columns to contacts ──────────────────────────────────────────

-- Drop old type constraint (was an enum of specific contact types)
ALTER TABLE public.contacts DROP CONSTRAINT IF EXISTS contacts_type_check;

-- Add entity_type: individual or company
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS entity_type text NOT NULL DEFAULT 'individual'
    CHECK (entity_type IN ('individual', 'company'));

-- Add details jsonb for type-specific data
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS details jsonb DEFAULT '{}'::jsonb;

-- Add created_by to track who created the contact
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users(id);

-- ─── 2. Migrate accounts → contacts with ID mapping ──────────────────────────

-- Temp table to map old account IDs → new contact IDs
CREATE TEMP TABLE _account_id_map (
  old_account_id uuid PRIMARY KEY,
  new_contact_id uuid NOT NULL
);

-- Insert accounts as company contacts, capturing old→new ID mapping
WITH inserted AS (
  INSERT INTO public.contacts (
    first_name,
    last_name,
    entity_type,
    type,
    phone,
    territory,
    owner_id,
    source,
    status,
    details,
    created_at,
    updated_at
  )
  SELECT
    a.name,
    NULL,
    'company',
    a.type,
    a.phone,
    a.territory,
    a.owner_id,
    'manual',
    'cliente',
    jsonb_build_object(
      'cnpj', NULL,
      'razao_social', a.name,
      'responsible_name', NULL,
      'responsible_whatsapp', NULL,
      'payment_terms', a.payment_terms,
      'credit_limit', a.credit_limit,
      'annual_volume_liters', a.annual_volume_liters,
      'annual_paint_spend_brl', a.annual_paint_spend_brl,
      'region', a.region,
      'competitor_brands', a.competitor_brands,
      'preferred_brands', a.preferred_brands,
      'account_number', a.account_number,
      'address', a.address,
      'city', a.city,
      'state', a.state,
      'website', a.website
    ),
    a.created_at,
    a.updated_at
  FROM public.accounts a
  ORDER BY a.created_at
  RETURNING id AS new_contact_id, first_name, created_at
)
INSERT INTO _account_id_map (old_account_id, new_contact_id)
SELECT a.id, i.new_contact_id
FROM public.accounts a
JOIN inserted i ON i.first_name = a.name AND i.created_at = a.created_at;

-- ─── 3. Update foreign key references ────────────────────────────────────────

-- Update contacts.account_id to point to new contact IDs
UPDATE public.contacts c
SET account_id = m.new_contact_id
FROM _account_id_map m
WHERE c.account_id = m.old_account_id;

-- Update leads.account_id to point to new contact IDs
UPDATE public.leads l
SET account_id = m.new_contact_id
FROM _account_id_map m
WHERE l.account_id = m.old_account_id;

-- Update activities.account_id to point to new contact IDs
UPDATE public.activities a
SET account_id = m.new_contact_id
FROM _account_id_map m
WHERE a.account_id = m.old_account_id;

-- ─── 4. Drop FK constraints to accounts table ───────────────────────────────

ALTER TABLE public.contacts DROP CONSTRAINT IF EXISTS contacts_account_id_fkey;
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_account_id_fkey;
ALTER TABLE public.activities DROP CONSTRAINT IF EXISTS activities_account_id_fkey;

-- ─── 5. Drop accounts table ─────────────────────────────────────────────────

DROP TABLE IF EXISTS public.accounts CASCADE;

-- Clean up temp table
DROP TABLE IF EXISTS _account_id_map;

-- ─── 6. Create backward-compat view ─────────────────────────────────────────

CREATE OR REPLACE VIEW public.accounts AS
  SELECT
    id,
    first_name AS name,
    type,
    phone,
    (details->>'address')::text AS address,
    (details->>'city')::text AS city,
    (details->>'state')::text AS state,
    territory,
    (details->>'account_number')::text AS account_number,
    (details->>'payment_terms')::text AS payment_terms,
    (details->>'credit_limit')::numeric AS credit_limit,
    (details->>'annual_volume_liters')::numeric AS annual_volume_liters,
    (details->>'annual_paint_spend_brl')::numeric AS annual_paint_spend_brl,
    (details->>'region')::text AS region,
    (details->>'website')::text AS website,
    owner_id,
    created_at,
    updated_at
  FROM public.contacts
  WHERE entity_type = 'company';

COMMIT;
