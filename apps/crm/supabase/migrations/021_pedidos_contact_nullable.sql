-- Allow pedidos to be created without a contact (sem cliente)
ALTER TABLE public.pedidos ALTER COLUMN contact_id DROP NOT NULL;
