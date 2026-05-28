import { NextRequest, NextResponse } from 'next/server'
import { validateSDRRequest } from '@/lib/api/sdr-middleware'
import { createServiceClient } from '@/lib/supabase/service'

// ─── POST /api/sdr/pedidos — Create pedido ───────────────────────────────────
export async function POST(req: NextRequest) {
  const auth = await validateSDRRequest(req, 'pedidos', 'write')
  if (auth instanceof NextResponse) return auth

  const body = await req.json()
  const { contact_id, lead_id, owner_id, notes } = body

  if (!contact_id || !owner_id) {
    return NextResponse.json(
      { erro: 'contact_id e owner_id são obrigatórios' },
      { status: 400 }
    )
  }

  const supabase = createServiceClient()

  const { data: pedido, error } = await supabase
    .from('pedidos')
    .insert({
      contact_id,
      lead_id: lead_id ?? null,
      owner_id,
      status: 'draft',
      notes: notes ?? null,
    })
    .select('*')
    .single()

  if (error) {
    return NextResponse.json(
      { erro: `Erro ao criar pedido: ${error.message}` },
      { status: 500 }
    )
  }

  return NextResponse.json({ pedido }, { status: 201 })
}
