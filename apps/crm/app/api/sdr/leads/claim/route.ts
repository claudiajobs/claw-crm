import { NextRequest, NextResponse } from 'next/server'
import { validateSDRRequest } from '@/lib/api/sdr-middleware'
import { createServiceClient } from '@/lib/supabase/service'

// ─── POST /api/sdr/leads/claim ────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const auth = await validateSDRRequest(req, 'leads', 'write')
  if (auth instanceof NextResponse) return auth

  const supabase = createServiceClient()

  let body: { lead_id?: string; robot_sdr_id?: string }
  try {
    body = (await req.json()) as { lead_id?: string; robot_sdr_id?: string }
  } catch {
    return NextResponse.json({ erro: 'Corpo da requisição inválido' }, { status: 400 })
  }

  const { lead_id, robot_sdr_id } = body

  if (!lead_id) {
    return NextResponse.json({ erro: 'Campo obrigatório: lead_id' }, { status: 400 })
  }
  if (!robot_sdr_id) {
    return NextResponse.json({ erro: 'Campo obrigatório: robot_sdr_id' }, { status: 400 })
  }

  const { data, error } = await supabase.rpc('claim_lead_for_robot', {
    p_lead_id: lead_id,
    p_robot_sdr_id: robot_sdr_id,
  })

  if (error) {
    if (error.message?.includes('lead_not_available')) {
      return NextResponse.json(
        { erro: 'Lead já foi reivindicado ou não está disponível' },
        { status: 409 }
      )
    }
    return NextResponse.json({ erro: error.message }, { status: 500 })
  }

  return NextResponse.json({ lead: data }, { status: 200 })
}
