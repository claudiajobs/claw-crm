'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type ActivityType =
  | 'nota'
  | 'ligacao'
  | 'reuniao'
  | 'whatsapp_enviado'
  | 'whatsapp_recebido'
  | 'instagram_dm_enviado'
  | 'instagram_dm_recebido'

const VALID_TYPES: ActivityType[] = [
  'nota',
  'ligacao',
  'reuniao',
  'whatsapp_enviado',
  'whatsapp_recebido',
  'instagram_dm_enviado',
  'instagram_dm_recebido',
]

// ---------------------------------------------------------------------------
// logActivity — cria uma nova atividade humana
// ---------------------------------------------------------------------------
export async function logActivity(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const contact_id = formData.get('contact_id') as string | null
  const lead_id = (formData.get('lead_id') as string | null) || null
  const type = formData.get('type') as string | null
  const subject = (formData.get('subject') as string | null)?.trim() || null
  const body = (formData.get('body') as string | null)?.trim() || null
  const outcome = (formData.get('outcome') as string | null)?.trim() || null
  const scheduled_at_raw = (formData.get('scheduled_at') as string | null) || null

  if (!contact_id) {
    return { error: 'contact_id é obrigatório.' }
  }
  if (!type || !VALID_TYPES.includes(type as ActivityType)) {
    return { error: 'Tipo de atividade inválido.' }
  }

  const scheduled_at = scheduled_at_raw
    ? new Date(scheduled_at_raw).toISOString()
    : new Date().toISOString()

  const { data, error } = await supabase
    .from('activities')
    .insert({
      contact_id,
      lead_id,
      type,
      subject,
      body,
      outcome,
      scheduled_at,
      performed_by: user.id,
    })
    .select('id, type, subject, body, outcome, created_at, performed_by, performed_by_robot')
    .single()

  if (error) {
    return { error: `Erro ao registrar atividade: ${error.message}` }
  }

  if (lead_id) revalidatePath(`/leads/${lead_id}`)
  revalidatePath(`/contacts/${contact_id}`)

  return { data }
}

// ---------------------------------------------------------------------------
// updateActivity — edita atividade própria
// ---------------------------------------------------------------------------
export async function updateActivity(
  activityId: string,
  fields: {
    type?: ActivityType
    subject?: string | null
    body?: string | null
    outcome?: string | null
  }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Apenas o dono pode editar
  const { data: existing } = await supabase
    .from('activities')
    .select('id, performed_by, contact_id, lead_id')
    .eq('id', activityId)
    .single()

  if (!existing) return { error: 'Atividade não encontrada.' }
  if (existing.performed_by !== user.id) {
    return { error: 'Você só pode editar suas próprias atividades.' }
  }

  if (fields.type && !VALID_TYPES.includes(fields.type)) {
    return { error: 'Tipo de atividade inválido.' }
  }

  const { error } = await supabase
    .from('activities')
    .update(fields)
    .eq('id', activityId)
    .eq('performed_by', user.id)

  if (error) {
    return { error: `Erro ao atualizar: ${error.message}` }
  }

  if (existing.lead_id) revalidatePath(`/leads/${existing.lead_id}`)
  revalidatePath(`/contacts/${existing.contact_id}`)

  return { success: true }
}

// ---------------------------------------------------------------------------
// deleteActivity — deleta atividade própria
// ---------------------------------------------------------------------------
export async function deleteActivity(activityId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: existing } = await supabase
    .from('activities')
    .select('id, performed_by, contact_id, lead_id')
    .eq('id', activityId)
    .single()

  if (!existing) return { error: 'Atividade não encontrada.' }
  if (existing.performed_by !== user.id) {
    return { error: 'Você só pode deletar suas próprias atividades.' }
  }

  const { error } = await supabase
    .from('activities')
    .delete()
    .eq('id', activityId)
    .eq('performed_by', user.id)

  if (error) {
    return { error: `Erro ao deletar: ${error.message}` }
  }

  if (existing.lead_id) revalidatePath(`/leads/${existing.lead_id}`)
  revalidatePath(`/contacts/${existing.contact_id}`)

  return { success: true }
}
