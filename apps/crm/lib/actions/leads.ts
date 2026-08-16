'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { computeLeadScore } from '@/lib/scoring/scoring-engine'
import type { LeadScoringInput } from '@/lib/scoring/scoring-rules.config'

type LeadStatus =
  | 'novo'
  | 'contatado'
  | 'qualificado'
  | 'proposta'
  | 'negociacao'
  | 'ganho'
  | 'perdido'

// ─── helpers ──────────────────────────────────────────────────────────────────

async function fetchScoringInput(
  supabase: Awaited<ReturnType<typeof createClient>>,
  contactId: string,
  lead: LeadScoringInput['lead']
): Promise<LeadScoringInput> {
  const { data: contact } = await supabase
    .from('contacts')
    .select('whatsapp_number, instagram_handle, monthly_volume_liters, account_id')
    .eq('id', contactId)
    .single()

  let account: LeadScoringInput['account'] = null
  if (contact?.account_id) {
    // accounts is now a view over contacts WHERE entity_type='company'
    const { data } = await supabase
      .from('contacts')
      .select('classification, details')
      .eq('id', contact.account_id)
      .eq('entity_type', 'company')
      .single()
    if (data) {
      const details = (data.details ?? {}) as Record<string, unknown>
      account = {
        type: data.classification,
        payment_terms: (details.payment_terms as string) ?? null,
      }
    }
  }

  return {
    contact: {
      whatsapp_number: contact?.whatsapp_number ?? null,
      instagram_handle: contact?.instagram_handle ?? null,
      monthly_volume_liters: contact?.monthly_volume_liters
        ? Number(contact.monthly_volume_liters)
        : null,
    },
    lead,
    account,
  }
}

// ─── actions ──────────────────────────────────────────────────────────────────

export async function createLead(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const title = (formData.get('title') as string | null)?.trim() ?? ''
  let contact_id = (formData.get('contact_id') as string | null)?.trim() ?? ''
  const status = (formData.get('status') as LeadStatus | null) ?? 'novo'
  const rawValue = formData.get('value') as string | null
  const value = rawValue ? Number(rawValue) : null
  const rawProductInterest = formData.get('product_interest') as string | null
  const product_interest = rawProductInterest?.trim()
    ? [rawProductInterest.trim()]
    : []
  const decision_timeline = (formData.get('decision_timeline') as string | null) || null
  const rawVolume = formData.get('estimated_volume_liters') as string | null
  const estimated_volume_liters = rawVolume ? Number(rawVolume) : null
  const project_type = (formData.get('project_type') as string | null) || null

  // Quick contact creation fields
  const quickContactName = (formData.get('quick_contact_name') as string | null)?.trim() ?? ''
  const quickContactChannel = (formData.get('quick_contact_channel') as string | null)?.trim() ?? ''

  if (!title) redirect('/leads/new?erro=Título+é+obrigatório')

  // If no contact selected, try quick-create
  if (!contact_id) {
    if (!quickContactName || !quickContactChannel) {
      redirect('/leads/new?erro=Selecione+um+contato+ou+preencha+o+contato+rápido+(nome+e+canal)')
    }
    // Determine channel type
    const isWhatsApp = quickContactChannel.startsWith('+') || /^\d/.test(quickContactChannel)
    const { data: newContact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        first_name: quickContactName,
        whatsapp_number: isWhatsApp ? quickContactChannel : undefined,
        instagram_handle: !isWhatsApp ? quickContactChannel : undefined,
        preferred_channel: isWhatsApp ? 'whatsapp' : 'instagram',
        owner_id: user.id,
        created_by: user.id,
        source: 'manual',
        status: 'lead',
      })
      .select('id')
      .single()

    if (contactError || !newContact) {
      redirect(`/leads/new?erro=${encodeURIComponent('Erro ao criar contato rápido: ' + (contactError?.message ?? 'desconhecido'))}`)
    }
    contact_id = newContact.id
  }

  const { data: lead, error } = await supabase
    .from('leads')
    .insert({
      title,
      contact_id,
      status,
      value,
      product_interest,
      decision_timeline,
      estimated_volume_liters,
      project_type,
      owner_id: user.id,
      created_by: user.id,
      source: 'manual',
    })
    .select()
    .single()

  if (error || !lead) {
    redirect(
      `/leads/new?erro=${encodeURIComponent('Erro ao criar lead: ' + (error?.message ?? 'desconhecido'))}`
    )
  }

  const scoringInput = await fetchScoringInput(supabase, contact_id, {
    estimated_volume_liters: lead.estimated_volume_liters
      ? Number(lead.estimated_volume_liters)
      : null,
    decision_timeline: lead.decision_timeline,
    project_type: lead.project_type,
    last_activity_at: null,
  })
  const { score } = computeLeadScore(scoringInput)
  await supabase.from('leads').update({ score }).eq('id', lead.id)

  revalidatePath('/leads')
  redirect('/leads')
}

export async function createLeadFromPedido(
  pedidoId: string
): Promise<{ leadId: string }> {
  // Auth client (not service) — criar lead exige um chamador autenticado
  const auth = await createClient()
  const {
    data: { user },
  } = await auth.auth.getUser()
  if (!user) {
    throw new Error('Não autenticado')
  }

  const supabase = createServiceClient()

  const { data: pedido, error: fetchError } = await supabase
    .from('pedidos')
    .select(
      'id, contact_id, lead_id, owner_id, total, status, contact:contacts(first_name, last_name)'
    )
    .eq('id', pedidoId)
    .single()

  if (fetchError || !pedido) {
    throw new Error('Pedido não encontrado')
  }
  if (pedido.lead_id) {
    throw new Error('Este pedido já tem um lead.')
  }
  if (!pedido.contact_id) {
    throw new Error('Pedido sem cliente — não é possível criar lead.')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  const isAdmin = profile?.role === 'admin'

  if (!isAdmin && pedido.owner_id !== user.id) {
    throw new Error('Você não tem permissão para criar um lead a partir deste pedido.')
  }

  const contact = Array.isArray(pedido.contact) ? pedido.contact[0] : pedido.contact
  const contactName =
    [contact?.first_name, contact?.last_name].filter(Boolean).join(' ') || 'cliente'

  const { data: lead, error: insertError } = await supabase
    .from('leads')
    .insert({
      title: `Pedido — ${contactName}`,
      contact_id: pedido.contact_id,
      status: 'novo',
      value: Number(pedido.total),
      product_interest: [],
      owner_id: pedido.owner_id,
      created_by: user.id,
      source: 'pedido',
    })
    .select('id')
    .single()

  if (insertError || !lead) {
    console.error('createLeadFromPedido: insert failed:', insertError?.message)
    throw new Error('Erro ao criar o lead. Tente novamente.')
  }

  // Vínculo condicional: se outro clique já ligou um lead a este pedido, a
  // atualização não casa nenhuma linha e o lead recém-criado é descartado.
  const { data: linked, error: linkError } = await supabase
    .from('pedidos')
    .update({ lead_id: lead.id })
    .eq('id', pedidoId)
    .is('lead_id', null)
    .select('id')

  if (linkError || !linked || linked.length === 0) {
    await supabase.from('leads').delete().eq('id', lead.id)
    if (linkError) {
      console.error('createLeadFromPedido: link failed:', linkError.message)
      throw new Error('Erro ao criar o lead. Tente novamente.')
    }
    throw new Error('Este pedido já tem um lead.')
  }

  const scoringInput = await fetchScoringInput(auth, pedido.contact_id, {
    estimated_volume_liters: null,
    decision_timeline: null,
    project_type: null,
    last_activity_at: null,
  })
  const { score } = computeLeadScore(scoringInput)
  await supabase.from('leads').update({ score }).eq('id', lead.id)

  revalidatePath(`/pedidos/${pedidoId}`)
  revalidatePath('/pedidos')
  revalidatePath('/leads')
  revalidatePath('/pipeline')

  return { leadId: lead.id }
}

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: lead } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', leadId)
    .select('contact_id, estimated_volume_liters, decision_timeline, project_type')
    .single()

  if (!lead) return

  // Fetch last activity timestamp for scoring
  const { data: lastActivity } = await supabase
    .from('activities')
    .select('created_at')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const scoringInput = await fetchScoringInput(supabase, lead.contact_id, {
    estimated_volume_liters: lead.estimated_volume_liters
      ? Number(lead.estimated_volume_liters)
      : null,
    decision_timeline: lead.decision_timeline,
    project_type: lead.project_type,
    last_activity_at: lastActivity?.created_at ?? null,
  })
  const { score } = computeLeadScore(scoringInput)
  await supabase.from('leads').update({ score }).eq('id', leadId)

  revalidatePath('/leads')
  revalidatePath('/pipeline')
  revalidatePath(`/leads/${leadId}`)
}

export async function assignLead(leadId: string, userId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('leads')
    .update({ owner_id: userId, assigned_to_robot: false, robot_sdr_id: null })
    .eq('id', leadId)

  revalidatePath(`/leads/${leadId}`)
  revalidatePath('/leads')
  revalidatePath('/pipeline')
}

export async function updateLeadFields(
  leadId: string,
  fields: {
    title?: string
    value?: number | null
    product_interest?: string[]
    decision_timeline?: string | null
    estimated_volume_liters?: number | null
    project_type?: string | null
    expected_close_date?: string | null
    lost_reason?: string | null
  }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: lead } = await supabase
    .from('leads')
    .update(fields)
    .eq('id', leadId)
    .select('contact_id, estimated_volume_liters, decision_timeline, project_type')
    .single()

  if (!lead) return

  const { data: lastActivity } = await supabase
    .from('activities')
    .select('created_at')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const scoringInput = await fetchScoringInput(supabase, lead.contact_id, {
    estimated_volume_liters: lead.estimated_volume_liters
      ? Number(lead.estimated_volume_liters)
      : null,
    decision_timeline: lead.decision_timeline,
    project_type: lead.project_type,
    last_activity_at: lastActivity?.created_at ?? null,
  })
  const { score } = computeLeadScore(scoringInput)
  await supabase.from('leads').update({ score }).eq('id', leadId)

  revalidatePath(`/leads/${leadId}`)
  revalidatePath('/leads')
}
