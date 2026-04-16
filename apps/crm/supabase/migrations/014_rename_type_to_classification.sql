-- Migration 014: Rename contacts.type → contacts.classification
-- Resolves ambiguity between 'type' (professional classification) and 'entity_type' (individual/company)

BEGIN;

-- Rename the column
ALTER TABLE public.contacts RENAME COLUMN type TO classification;

-- Recreate the backward-compat accounts view with the new column name
CREATE OR REPLACE VIEW public.accounts AS
  SELECT
    id,
    first_name AS name,
    classification AS type,
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
