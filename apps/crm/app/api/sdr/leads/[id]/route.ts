import { NextRequest, NextResponse } from 'next/server'
import { validateSDRRequest } from '@/lib/api/sdr-middleware'
import { createServiceClient } from '@/lib/supabase/service'

// ─── GET /api/sdr/leads/[id] ──────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await validateSDRRequest(req, 'leads', 'read')
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const supabase = createServiceClient()

  const { data: lead, error } = await supabase
    .from('leads')
    .select(
      `
      *,
      contact:contacts(*),
      account:accounts(id, name, type, payment_terms, territory)
      `
    )
    .eq('id', id)
    .single()

  if (error || !lead) {
    return NextResponse.json({ erro: 'Lead não encontrado' }, { status: 404 })
  }

  const { data: activities } = await supabase
    .from('activities')
    .select('id, type, subject, body, outcome, performed_by, performed_by_robot, created_at')
    .eq('lead_id', id)
    .order('created_at', { ascending: false })
    .limit(5)

  return NextResponse.json({ lead, recentActivities: activities ?? [] })
}
