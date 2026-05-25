import { createServiceClient } from '@/lib/supabase/service'

// ─── Public API — nothing outside this module computes prices ────────────────

export async function getPrice(
  variantId: string,
  membershipTier: string,
  date?: Date
): Promise<number> {
  const supabase = createServiceClient()
  const asOf = (date ?? new Date()).toISOString()

  const { data, error } = await supabase
    .from('product_pricing')
    .select('price')
    .eq('variant_id', variantId)
    .eq('tier_slug', membershipTier)
    .lte('valid_from', asOf)
    .or(`valid_until.is.null,valid_until.gt.${asOf}`)
    .order('valid_from', { ascending: false })
    .limit(1)
    .single()

  if (error || !data) {
    throw new Error(
      `Price not found for variant=${variantId} tier=${membershipTier}`
    )
  }

  return Number(data.price)
}

export async function getPriceTable(
  membershipTier: string
): Promise<Array<{ variantId: string; price: number }>> {
  const supabase = createServiceClient()
  const now = new Date().toISOString()

  // Get latest price per variant for the given tier
  const { data, error } = await supabase
    .from('product_pricing')
    .select('variant_id, price, valid_from')
    .eq('tier_slug', membershipTier)
    .lte('valid_from', now)
    .or(`valid_until.is.null,valid_until.gt.${now}`)
    .order('valid_from', { ascending: false })

  if (error) {
    throw new Error(`Failed to load price table for tier=${membershipTier}`)
  }

  // Deduplicate: keep only the latest price per variant
  const seen = new Set<string>()
  const result: Array<{ variantId: string; price: number }> = []

  for (const row of data ?? []) {
    if (!seen.has(row.variant_id)) {
      seen.add(row.variant_id)
      result.push({ variantId: row.variant_id, price: Number(row.price) })
    }
  }

  return result
}

export type DiscountValidationResult = {
  status: 'requires_approval'
  reason: string
}

export async function validateDiscount(
  variantId: string,
  membershipTier: string,
  discountPct: number
): Promise<DiscountValidationResult> {
  // All discounts require manager approval for now
  return {
    status: 'requires_approval',
    reason: `Desconto de ${discountPct}% requer aprovação do gerente`,
  }
}
