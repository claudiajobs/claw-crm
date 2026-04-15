import { NextRequest, NextResponse } from 'next/server'
import { validateSDRRequest } from '@/lib/api/sdr-middleware'
import { createServiceClient } from '@/lib/supabase/service'

// ─── POST /api/sdr/contacts/enrich/[id] ───────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await validateSDRRequest(req, 'contacts', 'write')
  if (auth instanceof NextResponse) return auth

  const { id: contactId } = await params
  const supabase = createServiceClient()

  // Verify contact exists
  const { data: contact } = await supabase
    .from('contacts')
    .select('id')
    .eq('id', contactId)
    .single()

  if (!contact) {
    return NextResponse.json({ erro: 'Contato não encontrado' }, { status: 404 })
  }

  // Check if enrichment already happened in the last 24 hours
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: recentJob } = await supabase
    .from('enrichment_jobs')
    .select('id, status, created_at')
    .eq('contact_id', contactId)
    .in('status', ['pendente', 'rodando', 'concluido'])
    .gte('created_at', twentyFourHoursAgo)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (recentJob) {
    return NextResponse.json(
      {
        erro: 'Enriquecimento já solicitado nas últimas 24 horas',
        job: recentJob,
      },
      { status: 409 }
    )
  }

  // Create new enrichment job
  const { data: job, error } = await supabase
    .from('enrichment_jobs')
    .insert({
      contact_id: contactId,
      status: 'pendente',
      triggered_by: 'robot_sdr',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 })
  }

  return NextResponse.json({ job }, { status: 202 })
}
