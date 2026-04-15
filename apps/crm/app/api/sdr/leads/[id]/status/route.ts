import { NextRequest, NextResponse } from 'next/server'
import { validateSDRRequest } from '@/lib/api/sdr-middleware'
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

const VALID_STATUSES: LeadStatus[] = [
  'novo',
  'contatado',
  'qualificado',
  'proposta',
  'negociacao',
  'ganho',
  'perdido',
]

// ─── PATCH /api/sdr/leads/[id]/status ─────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await validateSDRRequest(req, 'leads', 'write')
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const supabase = createServiceClient()

  let body: { status?: string }
  try {
    body = (await req.json()) as { status?: string }
  } catch {
    return NextResponse.json({ erro: 'Corpo da requisição inválido' }, { status: 400 })
  }

  const { status } = body
  if (!status || !VALID_STATUSES.includes(status as LeadStatus)) {
    return NextResponse.json(
      {
        erro: `Status inválido. Valores aceitos: ${VALID_STATUSES.join(', ')}`,
      },
      { status: 400 }
    )
  }

  const { data: lead, error: updateError } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', id)
    .select('contact_id, estimated_volume_liters, decision_timeline, project_type')
    .single()

  if (updateError || !lead) {
    return NextResponse.json({ erro: 'Lead não encontrado' }, { status: 404 })
  }

  // Recalculate score
  const { data: lastActivity } = await supabase
    .from('activities')
    .select('created_at')
    .eq('lead_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const { data: contact } = await supabase
    .from('contacts')
    .select('whatsapp_number, instagram_handle, monthly_volume_liters, account_id')
    .eq('id', lead.contact_id)
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
      last_activity_at: lastActivity?.created_at ?? null,
    },
    account,
  }
  const { score } = computeLeadScore(scoringInput)
  await supabase.from('leads').update({ score }).eq('id', id)

  return NextResponse.json({ id, status, score })
}
