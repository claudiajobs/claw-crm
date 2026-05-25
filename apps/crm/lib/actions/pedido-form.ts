'use server'

import { createServiceClient } from '@/lib/supabase/service'

// ─── Quick contact creation ─────────────────────────────────────────────────

export async function quickCreateContact(data: {
  first_name: string
  last_name: string
  phone: string
}) {
  const supabase = createServiceClient()

  const { data: contact, error } = await supabase
    .from('contacts')
    .insert({
      first_name: data.first_name,
      last_name: data.last_name || null,
      whatsapp_number: data.phone || null,
    })
    .select('id, first_name, last_name, membership_tier')
    .single()

  if (error || !contact) {
    throw new Error(`Erro ao criar contato: ${error?.message ?? 'unknown'}`)
  }

  return {
    id: contact.id,
    name: [contact.first_name, contact.last_name].filter(Boolean).join(' '),
    tier: contact.membership_tier as string | null,
  }
}
