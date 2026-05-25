import { NextRequest, NextResponse } from 'next/server'
import { validateSDRRequest } from '@/lib/api/sdr-middleware'
import { createServiceClient } from '@/lib/supabase/service'
import { getPriceTable } from '@/lib/pricing'

// ─── GET /api/sdr/products?tier= — List products + pricing ──────────────────
export async function GET(req: NextRequest) {
  const auth = await validateSDRRequest(req, 'products', 'read')
  if (auth instanceof NextResponse) return auth

  const tier = req.nextUrl.searchParams.get('tier')
  const supabase = createServiceClient()

  const { data: products, error } = await supabase
    .from('products')
    .select(
      `
      id, name, slug, description, active,
      category:product_categories(id, name, slug),
      variants:product_variants(id, sku, name, unit, weight_kg, volume_l, active)
      `
    )
    .eq('active', true)
    .order('name')

  if (error) {
    return NextResponse.json(
      { erro: `Erro ao carregar produtos: ${error.message}` },
      { status: 500 }
    )
  }

  // If tier is specified, attach pricing info
  let priceMap: Map<string, number> | null = null
  if (tier) {
    try {
      const priceTable = await getPriceTable(tier)
      priceMap = new Map(priceTable.map((p) => [p.variantId, p.price]))
    } catch {
      // Tier may not exist — return products without pricing
    }
  }

  const result = (products ?? []).map((product) => {
    const variants = Array.isArray(product.variants) ? product.variants : []
    return {
      ...product,
      variants: variants
        .filter((v) => v.active)
        .map((v) => ({
          ...v,
          price: priceMap?.get(v.id) ?? null,
        })),
    }
  })

  return NextResponse.json({ products: result })
}
