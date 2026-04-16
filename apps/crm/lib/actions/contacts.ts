'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type ContactChannel = 'whatsapp' | 'instagram' | 'telefone'
type EntityType = 'individual' | 'company'

export async function createContact(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const first_name = (formData.get('first_name') as string).trim()
  const last_name = (formData.get('last_name') as string | null)?.trim() || undefined
  const whatsapp_number = (formData.get('whatsapp_number') as string | null)?.trim() || undefined
  const instagram_handle = (formData.get('instagram_handle') as string | null)?.trim() || undefined
  const preferred_channel = (formData.get('preferred_channel') as ContactChannel | null) || undefined
  const classification = (formData.get('classification') as string | null)?.trim() || undefined
  const territory = (formData.get('territory') as string | null)?.trim() || undefined
  const entity_type = ((formData.get('entity_type') as string | null)?.trim() || 'individual') as EntityType

  // Validations
  if (!first_name) {
    redirect('/contacts/novo?erro=Nome+é+obrigatório')
  }

  if (!whatsapp_number && !instagram_handle) {
    redirect('/contacts/novo?erro=Informe+WhatsApp+ou+Instagram+(ao+menos+um+é+obrigatório)')
  }

  // Build details jsonb for company contacts
  let details: Record<string, unknown> = {}
  if (entity_type === 'company') {
    const cnpj = (formData.get('cnpj') as string | null)?.trim() || null
    const razao_social = (formData.get('razao_social') as string | null)?.trim() || null
    const responsible_name = (formData.get('responsible_name') as string | null)?.trim() || null
    const responsible_whatsapp = (formData.get('responsible_whatsapp') as string | null)?.trim() || null
    const region = (formData.get('region') as string | null)?.trim() || null
    const payment_terms = (formData.get('payment_terms') as string | null)?.trim() || null
    const rawCredit = formData.get('credit_limit') as string | null
    const credit_limit = rawCredit ? Number(rawCredit) : null
    const rawVolume = formData.get('annual_volume_liters') as string | null
    const annual_volume_liters = rawVolume ? Number(rawVolume) : null

    details = {
      cnpj,
      razao_social,
      responsible_name,
      responsible_whatsapp,
      payment_terms,
      credit_limit,
      annual_volume_liters,
      region,
    }
  }

  const { error } = await supabase.from('contacts').insert({
    first_name,
    last_name: entity_type === 'individual' ? last_name : undefined,
    whatsapp_number,
    instagram_handle,
    preferred_channel,
    classification,
    territory,
    entity_type,
    details,
    owner_id: user.id,
    created_by: user.id,
    source: 'manual',
    status: entity_type === 'company' ? 'cliente' : 'lead',
  })

  if (error) {
    redirect(`/contacts/novo?erro=${encodeURIComponent('Erro ao criar contato: ' + error.message)}`)
  }

  revalidatePath('/contacts')
  redirect('/contacts')
}

export async function updateContact(
  contactId: string,
  fields: {
    first_name?: string
    last_name?: string
    whatsapp_number?: string
    instagram_handle?: string
    preferred_channel?: ContactChannel
    classification?: string
    territory?: string
    notes?: string
    job_title?: string
    phone?: string
    details?: Record<string, unknown>
  }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('contacts')
    .update(fields)
    .eq('id', contactId)

  if (error) return { error: error.message }

  revalidatePath(`/contacts/${contactId}`)
  revalidatePath('/contacts')
  return { success: true }
}
