/**
 * Sprint 4 Seed Script — Products, Membership Tiers & Pricing
 *
 * Usage: npx tsx supabase/seed/sprint4-seed.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.
 * Upsert-safe — can be re-run without duplicating data.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const seedDataDir = resolve(__dirname, '../../../../tasks/seed-data')

const tiers = JSON.parse(
  readFileSync(resolve(seedDataDir, 'membership-tiers.json'), 'utf-8')
) as Array<{ slug: string; name: string; sort_order: number }>

const catalog = JSON.parse(
  readFileSync(resolve(seedDataDir, 'catalog-may-2026.json'), 'utf-8')
) as {
  categories: Array<{ name: string; slug: string; sort_order: number }>
  products: Array<{
    category_slug: string
    name: string
    slug: string
    unit: string
    yield_estimate: string | null
    yield_note: string | null
    variants: Array<{
      sku: string
      size_label: string
      color: string | null
      standard_price: number
    }>
  }>
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function seed() {
  console.log('Sprint 4 seed — starting...')

  // 1. Membership tiers
  console.log('  → Upserting membership tiers...')
  const { error: tiersError } = await supabase
    .from('membership_tiers')
    .upsert(
      tiers.map((t) => ({
        slug: t.slug,
        name: t.name,
        sort_order: t.sort_order,
      })),
      { onConflict: 'slug' }
    )
  if (tiersError) throw new Error(`Tiers upsert failed: ${tiersError.message}`)

  // 2. Product categories
  console.log('  → Upserting product categories...')
  const { error: catError } = await supabase
    .from('product_categories')
    .upsert(
      catalog.categories.map((c) => ({
        slug: c.slug,
        name: c.name,
        sort_order: c.sort_order,
      })),
      { onConflict: 'slug' }
    )
  if (catError) throw new Error(`Categories upsert failed: ${catError.message}`)

  // 3. Products + Variants
  console.log('  → Upserting products and variants...')

  // Build category slug → id map
  const { data: catRows } = await supabase
    .from('product_categories')
    .select('id, slug')
  const catMap = new Map((catRows ?? []).map((c) => [c.slug, c.id]))

  for (const product of catalog.products) {
    const categoryId = catMap.get(product.category_slug)
    if (!categoryId) {
      console.warn(`  ! Category not found: ${product.category_slug} — skipping ${product.name}`)
      continue
    }

    const { data: productRow, error: prodError } = await supabase
      .from('products')
      .upsert(
        {
          slug: product.slug,
          name: product.name,
          category_id: categoryId,
          metadata: {
            unit: product.unit,
            yield_estimate: product.yield_estimate,
            yield_note: product.yield_note,
          },
        },
        { onConflict: 'slug' }
      )
      .select('id')
      .single()

    if (prodError || !productRow) {
      console.error(`  x Product upsert failed: ${product.slug} — ${prodError?.message}`)
      continue
    }

    for (const variant of product.variants) {
      const variantName = [
        product.name,
        variant.size_label,
        variant.color,
      ]
        .filter(Boolean)
        .join(' — ')

      const { data: variantRow, error: varError } = await supabase
        .from('product_variants')
        .upsert(
          {
            sku: variant.sku,
            product_id: productRow.id,
            name: variantName,
            unit: product.unit,
          },
          { onConflict: 'sku' }
        )
        .select('id')
        .single()

      if (varError || !variantRow) {
        console.error(`  x Variant upsert failed: ${variant.sku} — ${varError?.message}`)
        continue
      }

      // 4. Pricing — all tiers get the standard_price initially
      for (const tier of tiers) {
        // Check if pricing already exists
        const { data: existing } = await supabase
          .from('product_pricing')
          .select('id')
          .eq('variant_id', variantRow.id)
          .eq('tier_slug', tier.slug)
          .limit(1)
          .single()

        if (!existing) {
          const { error: insertError } = await supabase
            .from('product_pricing')
            .insert({
              variant_id: variantRow.id,
              tier_slug: tier.slug,
              price: variant.standard_price,
              valid_from: '2026-01-01T00:00:00Z',
            })
          if (insertError) {
            console.error(`  x Pricing insert failed: ${variant.sku}/${tier.slug} — ${insertError.message}`)
          }
        }
      }
    }
  }

  console.log('Sprint 4 seed complete!')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
