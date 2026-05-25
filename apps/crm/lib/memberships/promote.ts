import { createServiceClient } from '@/lib/supabase/service'

export async function promoteMembership(
  contactId: string,
  membershipId: string,
  pedidoId: string
): Promise<void> {
  const supabase = createServiceClient()

  // 1. Insert row in contact_memberships (status='active', starts_at=now)
  const { error: insertError } = await supabase
    .from('contact_memberships')
    .insert({
      contact_id: contactId,
      membership_id: membershipId,
      pedido_id: pedidoId,
      status: 'active',
      starts_at: new Date().toISOString(),
    })

  if (insertError) {
    throw new Error(`Failed to create contact membership: ${insertError.message}`)
  }

  // 2. Find best active tier for contact (highest sort_order among active memberships)
  const { data: activeMemberships, error: queryError } = await supabase
    .from('contact_memberships')
    .select('membership_id, memberships(tier_slug, membership_tiers(sort_order))')
    .eq('contact_id', contactId)
    .eq('status', 'active')

  if (queryError) {
    throw new Error(`Failed to query contact memberships: ${queryError.message}`)
  }

  let bestTier: string | null = null
  let bestOrder = -1

  for (const cm of activeMemberships ?? []) {
    const membership = Array.isArray(cm.memberships)
      ? cm.memberships[0]
      : cm.memberships
    if (!membership) continue

    const tierInfo = Array.isArray(membership.membership_tiers)
      ? membership.membership_tiers[0]
      : membership.membership_tiers
    if (!tierInfo) continue

    if (tierInfo.sort_order > bestOrder) {
      bestOrder = tierInfo.sort_order
      bestTier = membership.tier_slug
    }
  }

  // 3. UPDATE contacts SET membership_tier = bestTier
  if (bestTier) {
    const { error: updateError } = await supabase
      .from('contacts')
      .update({ membership_tier: bestTier })
      .eq('id', contactId)

    if (updateError) {
      throw new Error(`Failed to update contact membership tier: ${updateError.message}`)
    }
  }
}
