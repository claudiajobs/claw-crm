'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type ContactChannel = 'whatsapp' | 'instagram' | 'telefone'
type ContactType =
  | 'pintor_autonomo'
  | 'empreiteiro'
  | 'engenheiro'
  | 'arquiteto'
  | 'distribuidor'
  | 'construtora'

export interface CreateContactInput {
  first_name: string
  last_name?: string
  whatsapp_number?: string
  instagram_handle?: string
  preferred_channel?: ContactChannel
  type?: ContactType
  territory?: string
}

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
  const type = (formData.get('type') as ContactType | null) || undefined
  const territory = (formData.get('territory') as string | null)?.trim() || undefined

  // Validações
  if (!first_name) {
    redirect('/contacts/novo?erro=Nome+é+obrigatório')
  }

  if (!whatsapp_number && !instagram_handle) {
    redirect('/contacts/novo?erro=Informe+WhatsApp+ou+Instagram+(ao+menos+um+é+obrigatório)')
  }

  const { error } = await supabase.from('contacts').insert({
    first_name,
    last_name,
    whatsapp_number,
    instagram_handle,
    preferred_channel,
    type,
    territory,
    owner_id: user.id,
    created_by: user.id,
    source: 'manual',
    status: 'lead',
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
    type?: ContactType
    territory?: string
    notes?: string
    job_title?: string
    phone?: string
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
