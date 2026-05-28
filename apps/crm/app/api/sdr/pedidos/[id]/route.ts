import { NextRequest, NextResponse } from 'next/server'
import { validateSDRRequest } from '@/lib/api/sdr-middleware'
import { createServiceClient } from '@/lib/supabase/service'

// ─── GET /api/sdr/pedidos/[id] — Get pedido + items ─────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await validateSDRRequest(req, 'pedidos', 'read')
  if (auth instanceof NextResponse) return auth

  const { id } = await params
  const supabase = createServiceClient()

  const { data: pedido, error } = await supabase
    .from('pedidos')
    .select(
      `
      *,
      contact:contacts(id, first_name, last_name, whatsapp_number, membership_tier),
      items:pedido_items(
        id, variant_id, quantity, unit_price, discount_pct, total,
        variant:product_variants(id, sku, name, product_id, products(name))
      )
      `
    )
    .eq('id', id)
    .single()

  if (error || !pedido) {
    return NextResponse.json({ erro: 'Pedido não encontrado' }, { status: 404 })
  }

  return NextResponse.json({ pedido })
}
