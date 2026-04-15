import { NextRequest, NextResponse } from 'next/server'
import { validateSDRRequest } from '@/lib/api/sdr-middleware'
import { createServiceClient } from '@/lib/supabase/service'

type ActivityType =
  | 'nota'
  | 'ligacao'
  | 'reuniao'
  | 'tarefa'
  | 'instagram_dm_enviado'
  | 'instagram_dm_recebido'
  | 'whatsapp_enviado'
  | 'whatsapp_recebido'
  | 'acao_sdr'

const VALID_TYPES: ActivityType[] = [
  'nota',
  'ligacao',
  'reuniao',
  'tarefa',
  'instagram_dm_enviado',
  'instagram_dm_recebido',
  'whatsapp_enviado',
  'whatsapp_recebido',
  'acao_sdr',
]

// ─── POST /api/sdr/leads/[id]/activities ──────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await validateSDRRequest(req, 'activities', 'write')
  if (auth instanceof NextResponse) return auth

  const { id: leadId } = await params
  const supabase = createServiceClient()

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ erro: 'Corpo da requisição inválido' }, { status: 400 })
  }

  const { type, subject, body: activityBody, outcome, metadata } = body

  if (!type || !VALID_TYPES.includes(type as ActivityType)) {
    return NextResponse.json(
      { erro: `Tipo inválido. Valores aceitos: ${VALID_TYPES.join(', ')}` },
      { status: 400 }
    )
  }

  // Fetch lead to get contact_id
  const { data: lead } = await supabase
    .from('leads')
    .select('id, contact_id')
    .eq('id', leadId)
    .single()

  if (!lead) {
    return NextResponse.json({ erro: 'Lead não encontrado' }, { status: 404 })
  }

  const { data: activity, error } = await supabase
    .from('activities')
    .insert({
      lead_id: leadId,
      contact_id: lead.contact_id,
      type: type as ActivityType,
      subject: (subject as string | undefined) ?? null,
      body: (activityBody as string | undefined) ?? null,
      outcome: (outcome as string | undefined) ?? null,
      metadata:
        metadata && typeof metadata === 'object'
          ? (metadata as Record<string, unknown>)
          : {},
      performed_by_robot: auth.context.robotSdrId,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 })
  }

  return NextResponse.json({ activity }, { status: 201 })
}
