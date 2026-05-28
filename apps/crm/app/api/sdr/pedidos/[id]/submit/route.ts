import { NextRequest, NextResponse } from 'next/server'
import { validateSDRRequest } from '@/lib/api/sdr-middleware'
import { submitPedido } from '@/lib/actions/pedidos'

// ─── PATCH /api/sdr/pedidos/[id]/submit — Submit for approval ───────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await validateSDRRequest(req, 'pedidos', 'write')
  if (auth instanceof NextResponse) return auth

  const { id } = await params

  try {
    const result = await submitPedido(id)
    return NextResponse.json({ pedido_id: id, status: result.status })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    return NextResponse.json({ erro: message }, { status: 400 })
  }
}
