'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { getPrice } from '@/lib/pricing'

// ─── Contact search ─────────────────────────────────────────────────────────

export async function searchContacts(query: string) {
  if (!query || query.length < 2) return []

  const supabase = createServiceClient()
  const pattern = `%${query}%`

  const { data, error } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, membership_tier')
    .or(`first_name.ilike.${pattern},last_name.ilike.${pattern}`)
    .limit(10)

  if (error) return []

  return (data ?? []).map((c) => ({
    id: c.id,
    name: [c.first_name, c.last_name].filter(Boolean).join(' '),
    tier: c.membership_tier as string | null,
  }))
}

// ─── Quick contact creation ─────────────────────────────────────────────────

export async function quickCreateContact(data: {
  first_name: string
  last_name: string
  phone: string
}) {
  const supabase = createServiceClient()

  const { data: contact, error } = await supabase
    .from('contacts')
    .insert({
      first_name: data.first_name,
      last_name: data.last_name || null,
      whatsapp_number: data.phone || null,
    })
    .select('id, first_name, last_name, membership_tier')
    .single()

  if (error || !contact) {
    throw new Error(`Erro ao criar contato: ${error?.message ?? 'unknown'}`)
  }

  return {
    id: contact.id,
    name: [contact.first_name, contact.last_name].filter(Boolean).join(' '),
    tier: contact.membership_tier as string | null,
  }
}

// ─── Product/variant search ─────────────────────────────────────────────────

export async function searchVariants(query: string) {
  if (!query || query.length < 2) return []

  const supabase = createServiceClient()
  const pattern = `%${query}%`

  // Search variants by name or SKU
  const { data: variants, error } = await supabase
    .from('product_variants')
    .select('id, name, sku, unit, product_id, products(name)')
    .eq('active', true)
    .or(`name.ilike.${pattern},sku.ilike.${pattern}`)
    .limit(15)

  if (error) return []

  // Also search by product name
  const { data: byProduct } = await supabase
    .from('product_variants')
    .select('id, name, sku, unit, product_id, products!inner(name)')
    .eq('active', true)
    .ilike('products.name', pattern)
    .limit(15)

  // Merge and deduplicate
  const all = [...(variants ?? []), ...(byProduct ?? [])]
  const seen = new Set<string>()
  const results: Array<{
    id: string
    label: string
    sku: string
    unit: string
    productName: string
    variantName: string
  }> = []

  for (const v of all) {
    if (seen.has(v.id)) continue
    seen.add(v.id)
    const product = Array.isArray(v.products) ? v.products[0] : v.products
    const productName = (product as { name: string } | null)?.name ?? ''
    results.push({
      id: v.id,
      label: `${productName} — ${v.name}`,
      sku: v.sku,
      unit: v.unit,
      productName,
      variantName: v.name,
    })
  }

  return results.slice(0, 15)
}

// ─── Fetch price for variant + tier ─────────────────────────────────────────

export async function fetchVariantPrice(variantId: string, tier: string) {
  try {
    const price = await getPrice(variantId, tier || 'standard')
    return { price }
  } catch {
    return { price: null }
  }
}
