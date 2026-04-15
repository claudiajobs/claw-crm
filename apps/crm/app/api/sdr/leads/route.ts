import { NextRequest, NextResponse } from 'next/server'
import { validateSDRRequest } from '@/lib/api/sdr-middleware'
import { createServiceClient } from '@/lib/supabase/service'
import { computeLeadScore } from '@/lib/scoring/scoring-engine'
import type { LeadScoringInput } from '@/lib/scoring/scoring-rules.config'

const PAGE_SIZE = 25

// ─── GET /api/sdr/leads ───────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const auth = await validateSDRRequest(req, 'leads', 'read')
  if (auth instanceof NextResponse) return auth

  const supabase = createServiceClient()
  const { searchParams } = new URL(req.url)

  const status = searchParams.get('status')
  const unassigned = searchParams.get('unassigned')
  const robotSdrId = searchParams.get('robot_sdr_id')
  const cursor = searchParams.get('cursor')

  let query = supabase
    .from('leads')
    .select(
      'id, title, status, score, value, contact_id, account_id, owner_id, assigned_to_robot, robot_sdr_id, decision_timeline, estimated_volume_liters, project_type, created_at'
    )
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(PAGE_SIZE + 1)

  if (status) query = query.eq('status', status)
  if (unassigned === 'true') query = query.eq('assigned_to_robot', false)
  if (robotSdrId) query = query.eq('robot_sdr_id', robotSdrId)

  if (cursor) {
    try {
      const { created_at, id } = JSON.parse(decodeURIComponent(cursor)) as {
        created_at: string
        id: string
      }
      query = query.or(
        `created_at.lt.${created_at},and(created_at.eq.${created_at},id.lt.${id})`
      )
    } catch {
      // invalid cursor — ignore
    }
  }

  const { data: rows, error } = await query
  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 })
  }

  const leads = rows ?? []
  const hasMore = leads.length > PAGE_SIZE
  const page = hasMore ? leads.slice(0, PAGE_SIZE) : leads
  const last = page[page.length - 1]
  const nextCursor =
    hasMore && last
      ? encodeURIComponent(JSON.stringify({ created_at: last.created_at, id: last.id }))
      : null

  return NextResponse.json({ leads: page, nextCursor, hasMore })
}

// ─── POST /api/sdr/leads ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const auth = await validateSDRRequest(req, 'leads', 'write')
  if (auth instanceof NextResponse) return auth

  const supabase = createServiceClient()

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ erro: 'Corpo da requisição inválido' }, { status: 400 })
  }

  const { title, contact_id, whatsapp_number, instagram_handle, ...rest } = body

  if (!title || typeof title !== 'string' || !title.trim()) {
    return NextResponse.json({ erro: 'Campo obrigatório: title' }, { status: 400 })
  }

  let resolvedContactId = contact_id as string | undefined

  // Find or create contact by whatsapp or instagram
  if (!resolvedContactId && (whatsapp_number || instagram_handle)) {
    const channel = whatsapp_number ? 'whatsapp_number' : 'instagram_handle'
    const value = (whatsapp_number ?? instagram_handle) as string

    const { data: existingContact } = await supabase
      .from('contacts')
      .select('id')
      .eq(channel, value)
      .single()

    if (existingContact) {
      resolvedContactId = existingContact.id
    } else {
      const { data: newContact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          first_name: (rest.first_name as string | undefined) ?? 'Sem nome',
          whatsapp_number: whatsapp_number as string | undefined,
          instagram_handle: instagram_handle as string | undefined,
          source: 'robot_sdr',
          preferred_channel: whatsapp_number ? 'whatsapp' : 'instagram',
        })
        .select('id')
        .single()

      if (contactError || !newContact) {
        return NextResponse.json({ erro: 'Erro ao criar contato' }, { status: 500 })
      }
      resolvedContactId = newContact.id
    }
  }

  if (!resolvedContactId) {
    return NextResponse.json(
      { erro: 'contact_id ou canal de contato (whatsapp_number ou instagram_handle) é obrigatório' },
      { status: 400 }
    )
  }

  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .insert({
      title: title.trim(),
      contact_id: resolvedContactId,
      status: (rest.status as string | undefined) ?? 'novo',
      value: rest.value != null ? Number(rest.value) : null,
      product_interest: (rest.product_interest as string[] | undefined) ?? [],
      decision_timeline: (rest.decision_timeline as string | undefined) ?? null,
      estimated_volume_liters:
        rest.estimated_volume_liters != null ? Number(rest.estimated_volume_liters) : null,
      project_type: (rest.project_type as string | undefined) ?? null,
      source: 'robot_sdr',
      assigned_to_robot: true,
      robot_sdr_id: auth.context.robotSdrId,
    })
    .select()
    .single()

  if (leadError || !lead) {
    return NextResponse.json(
      { erro: leadError?.message ?? 'Erro ao criar lead' },
      { status: 500 }
    )
  }

  // Compute score
  const { data: contact } = await supabase
    .from('contacts')
    .select('whatsapp_number, instagram_handle, monthly_volume_liters, account_id')
    .eq('id', resolvedContactId)
    .single()

  let account: LeadScoringInput['account'] = null
  if (contact?.account_id) {
    const { data: acc } = await supabase
      .from('accounts')
      .select('type, payment_terms')
      .eq('id', contact.account_id)
      .single()
    account = acc
  }

  const scoringInput: LeadScoringInput = {
    contact: {
      whatsapp_number: contact?.whatsapp_number ?? null,
      instagram_handle: contact?.instagram_handle ?? null,
      monthly_volume_liters: contact?.monthly_volume_liters
        ? Number(contact.monthly_volume_liters)
        : null,
    },
    lead: {
      estimated_volume_liters: lead.estimated_volume_liters
        ? Number(lead.estimated_volume_liters)
        : null,
      decision_timeline: lead.decision_timeline,
      project_type: lead.project_type,
      last_activity_at: null,
    },
    account,
  }
  const { score } = computeLeadScore(scoringInput)
  await supabase.from('leads').update({ score }).eq('id', lead.id)

  return NextResponse.json({ lead: { ...lead, score } }, { status: 201 })
}
