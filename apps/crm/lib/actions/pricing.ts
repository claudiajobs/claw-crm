'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PricingTier {
  slug: string
  name: string
}

export interface PricingVariant {
  id: string
  name: string
  sku: string
  unit: string
  // Current active price per tier slug (null when no price is set yet)
  prices: Record<string, number | null>
}

export interface PricingProduct {
  id: string
  name: string
  active: boolean
  variants: PricingVariant[]
}

export interface PricingCategory {
  id: string
  name: string
  products: PricingProduct[]
}

export interface PricingGrid {
  tiers: PricingTier[]
  categories: PricingCategory[]
}

export interface PriceChange {
  variantId: string
  tierSlug: string
  price: number
}

// ─── Admin guard ─────────────────────────────────────────────────────────────

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceClient = createServiceClient()
  const { data: profile } = await serviceClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/pipeline')
  }
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function getPricingGrid(): Promise<PricingGrid> {
  await requireAdmin()

  const svc = createServiceClient()
  const now = new Date().toISOString()

  const [tiersRes, categoriesRes, productsRes, variantsRes, pricingRes] =
    await Promise.all([
      svc.from('membership_tiers').select('slug, name').order('sort_order'),
      svc.from('product_categories').select('id, name').order('sort_order'),
      // All products (active + inactive) so the toggle can reactivate them
      svc.from('products').select('id, name, active, category_id').order('name'),
      svc
        .from('product_variants')
        .select('id, name, sku, unit, product_id')
        .eq('active', true)
        .order('name'),
      svc
        .from('product_pricing')
        .select('variant_id, tier_slug, price, valid_from, valid_until')
        .lte('valid_from', now)
        .or(`valid_until.is.null,valid_until.gt.${now}`)
        .order('valid_from', { ascending: false }),
    ])

  const tiers: PricingTier[] = (tiersRes.data ?? []).map((t) => ({
    slug: t.slug as string,
    name: t.name as string,
  }))

  // Build price map: `${variant_id}:${tier_slug}` → latest active price
  const priceMap: Record<string, number> = {}
  for (const row of pricingRes.data ?? []) {
    const key = `${row.variant_id}:${row.tier_slug}`
    if (!(key in priceMap)) {
      priceMap[key] = Number(row.price)
    }
  }

  // Group variants by product
  const variantsByProduct = new Map<string, PricingVariant[]>()
  for (const v of variantsRes.data ?? []) {
    const prices: Record<string, number | null> = {}
    for (const tier of tiers) {
      const key = `${v.id}:${tier.slug}`
      prices[tier.slug] = key in priceMap ? priceMap[key] : null
    }
    const list = variantsByProduct.get(v.product_id as string) ?? []
    list.push({
      id: v.id as string,
      name: v.name as string,
      sku: v.sku as string,
      unit: v.unit as string,
      prices,
    })
    variantsByProduct.set(v.product_id as string, list)
  }

  // Group products by category
  const productsByCategory = new Map<string, PricingProduct[]>()
  for (const p of productsRes.data ?? []) {
    const variants = variantsByProduct.get(p.id as string) ?? []
    if (variants.length === 0) continue // no active variants → nothing to price
    const list = productsByCategory.get(p.category_id as string) ?? []
    list.push({
      id: p.id as string,
      name: p.name as string,
      active: Boolean(p.active),
      variants,
    })
    productsByCategory.set(p.category_id as string, list)
  }

  const categories: PricingCategory[] = (categoriesRes.data ?? [])
    .map((c) => ({
      id: c.id as string,
      name: c.name as string,
      products: productsByCategory.get(c.id as string) ?? [],
    }))
    .filter((c) => c.products.length > 0)

  return { tiers, categories }
}

export async function savePricingGrid(changes: PriceChange[]) {
  await requireAdmin()

  if (changes.length === 0) {
    return { success: true, inserted: 0 }
  }

  const svc = createServiceClient()
  const validFrom = new Date().toISOString()

  // Insert a NEW pricing row per changed cell — never update existing rows,
  // so full price history is preserved.
  const rows = changes.map((c) => ({
    variant_id: c.variantId,
    tier_slug: c.tierSlug,
    price: c.price,
    valid_from: validFrom,
  }))

  const { error } = await svc.from('product_pricing').insert(rows)

  if (error) {
    throw new Error(`Failed to save pricing: ${error.message}`)
  }

  revalidatePath('/settings/pricing')
  return { success: true, inserted: rows.length }
}

export async function toggleProductActive(productId: string, active: boolean) {
  await requireAdmin()

  const svc = createServiceClient()
  const { error } = await svc
    .from('products')
    .update({ active })
    .eq('id', productId)

  if (error) {
    throw new Error(`Failed to toggle product: ${error.message}`)
  }

  revalidatePath('/settings/pricing')
  return { success: true }
}
