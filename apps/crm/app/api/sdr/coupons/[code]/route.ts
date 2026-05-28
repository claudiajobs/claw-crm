import { NextRequest, NextResponse } from 'next/server'
import { validateSDRRequest } from '@/lib/api/sdr-middleware'
import { createServiceClient } from '@/lib/supabase/service'

// ─── GET /api/sdr/coupons/[code] — Validate coupon ──────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const auth = await validateSDRRequest(req, 'coupons', 'read')
  if (auth instanceof NextResponse) return auth

  const { code } = await params
  const supabase = createServiceClient()
  const now = new Date().toISOString()

  const { data: coupon, error } = await supabase
    .from('discount_coupons')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('active', true)
    .single()

  if (error || !coupon) {
    return NextResponse.json({ erro: 'Cupom não encontrado' }, { status: 404 })
  }

  // Check validity window
  if (coupon.valid_until && coupon.valid_until < now) {
    return NextResponse.json({ erro: 'Cupom expirado' }, { status: 410 })
  }

  // Check usage limit
  if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
    return NextResponse.json(
      { erro: 'Cupom atingiu limite de uso' },
      { status: 410 }
    )
  }

  return NextResponse.json({
    coupon: {
      id: coupon.id,
      code: coupon.code,
      description: coupon.description,
      discount_pct: coupon.discount_pct,
    },
  })
}
