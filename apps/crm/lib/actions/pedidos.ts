'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getPrice } from '@/lib/pricing'
import { promoteMembership } from '@/lib/memberships/promote'

// ─── Types ───────────────────────────────────────────────────────────────────

interface CreatePedidoData {
  contactId: string | null
  leadId?: string
  ownerId: string
  notes?: string
  deliveryAddress?: string
}

interface AddItemData {
  variantId: string
  quantity: number
  membershipTier: string
  discountPct?: number
  priceMode?: 'tier' | 'override'
  overridePrice?: number
}

interface UpdatePedidoItemData {
  variantId: string
  quantity: number
  membershipTier: string
  discountPct?: number
  priceMode: 'tier' | 'override'
  overridePrice?: number
}

// ─── WhatsApp notification hook ──────────────────────────────────────────────

async function notifyPendingApproval(pedido: {
  id: string
  contactName: string
  total: number
  discountPct: number
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://crm.sevende.com.br'
  const link = `${baseUrl}/pedidos/${pedido.id}`
  const message = [
    '📋 Novo pedido aguardando aprovação',
    `Cliente: ${pedido.contactName}`,
    `Total: R$ ${pedido.total.toFixed(2)}`,
    `Desconto: ${pedido.discountPct}%`,
    `Ver: ${link}`,
  ].join('\n')

  // Log the notification intent — actual WhatsApp delivery via bot infrastructure
  // will be wired in when the bot webhook endpoint is available
  console.log('[WhatsApp Hook] pending_approval notification:', message)
}

// ─── Admin guard ─────────────────────────────────────────────────────────────

// Throws when the authenticated caller is not an admin. Used to gate manual
// price overrides so they can never be set by a non-admin calling the action
// directly. Throws (rather than redirects) because it runs inside item inserts
// where a redirect would silently swallow the rejection.
async function requireAdmin() {
  const auth = await createClient()
  const {
    data: { user },
  } = await auth.auth.getUser()
  if (!user) {
    throw new Error('Não autenticado')
  }

  const svc = createServiceClient()
  const { data: profile } = await svc
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('Apenas administradores podem definir preço manual')
  }
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function createPedido(data: CreatePedidoData) {
  const supabase = createServiceClient()

  const { data: pedido, error } = await supabase
    .from('pedidos')
    .insert({
      contact_id: data.contactId ?? undefined,
      lead_id: data.leadId ?? null,
      owner_id: data.ownerId,
      status: 'draft',
      notes: data.notes ?? null,
      delivery_address: data.deliveryAddress ?? null,
    })
    .select('id')
    .single()

  if (error || !pedido) {
    throw new Error(`Failed to create pedido: ${error?.message ?? 'unknown'}`)
  }

  revalidatePath('/pedidos')
  return pedido
}

export async function addItem(pedidoId: string, item: AddItemData) {
  const supabase = createServiceClient()

  // The UI only offers active products, but a vendedor could call this action
  // directly with a deactivated product's variant — enforce it server-side.
  const { data: variantRow, error: variantError } = await supabase
    .from('product_variants')
    .select('active, products(active)')
    .eq('id', item.variantId)
    .single()

  const variantProduct = Array.isArray(variantRow?.products)
    ? variantRow?.products[0]
    : variantRow?.products
  if (variantError || !variantRow || !variantRow.active || !variantProduct?.active) {
    throw new Error('Este produto não está mais disponível.')
  }

  const priceMode = item.priceMode ?? 'tier'

  // Price: manual override skips the pricing engine; tier mode looks it up.
  let unitPrice: number
  if (priceMode === 'override') {
    // Manual override is admin-only. The client UI already hides it for
    // non-admins, but a vendedor could call this action directly — enforce
    // it server-side. Non-admin callers are rejected outright.
    await requireAdmin()

    unitPrice = item.overridePrice ?? 0
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new Error('Preço manual inválido')
    }
  } else {
    unitPrice = await getPrice(item.variantId, item.membershipTier)
  }

  const discountPct = item.discountPct ?? 0
  const lineTotal = item.quantity * unitPrice * (1 - discountPct / 100)

  const { data: pedidoItem, error } = await supabase
    .from('pedido_items')
    .insert({
      pedido_id: pedidoId,
      variant_id: item.variantId,
      quantity: item.quantity,
      unit_price: unitPrice,
      discount_pct: discountPct,
      total: Math.round(lineTotal * 100) / 100,
      price_mode: priceMode,
      tier_slug: priceMode === 'override' ? null : item.membershipTier,
    })
    .select('id')
    .single()

  if (error || !pedidoItem) {
    throw new Error(`Failed to add item: ${error?.message ?? 'unknown'}`)
  }

  // Recalculate pedido total
  await recalculatePedidoTotal(pedidoId)

  revalidatePath(`/pedidos/${pedidoId}`)
  return pedidoItem
}

export async function submitPedido(pedidoId: string) {
  const supabase = createServiceClient()

  // Check if any item has discount or a price override
  const { data: items } = await supabase
    .from('pedido_items')
    .select('discount_pct, price_mode')
    .eq('pedido_id', pedidoId)

  const hasDiscount = (items ?? []).some((i) => Number(i.discount_pct) > 0)
  const hasPriceOverride = (items ?? []).some((i) => i.price_mode === 'override')
  const newStatus = hasDiscount || hasPriceOverride ? 'pending_approval' : 'approved'

  const { error } = await supabase
    .from('pedidos')
    .update({ status: newStatus })
    .eq('id', pedidoId)
    .eq('status', 'draft') // Only submit drafts

  if (error) {
    throw new Error(`Failed to submit pedido: ${error.message}`)
  }

  // If pending approval, trigger WhatsApp notification
  if (newStatus === 'pending_approval') {
    const { data: pedido } = await supabase
      .from('pedidos')
      .select('id, total, discount_pct, contact_id, contacts(first_name, last_name)')
      .eq('id', pedidoId)
      .single()

    if (pedido) {
      const contact = Array.isArray(pedido.contacts)
        ? pedido.contacts[0]
        : pedido.contacts
      const contactName = contact
        ? [contact.first_name, contact.last_name].filter(Boolean).join(' ')
        : 'Desconhecido'

      void notifyPendingApproval({
        id: pedido.id,
        contactName,
        total: Number(pedido.total),
        discountPct: Number(pedido.discount_pct),
      })
    }
  }

  revalidatePath(`/pedidos/${pedidoId}`)
  revalidatePath('/pedidos')
  return { status: newStatus }
}

export async function approvePedido(pedidoId: string, userId: string) {
  const supabase = createServiceClient()

  const { data: pedido, error } = await supabase
    .from('pedidos')
    .update({
      status: 'approved',
      approved_by: userId,
      approved_at: new Date().toISOString(),
    })
    .eq('id', pedidoId)
    .in('status', ['pending_approval'])
    .select('id, contact_id, lead_id')
    .single()

  if (error || !pedido) {
    throw new Error(`Failed to approve pedido: ${error?.message ?? 'not found or wrong status'}`)
  }

  // Check if any item is a membership product and trigger promotion
  const { data: items } = await supabase
    .from('pedido_items')
    .select('variant_id, product_variants(product_id, products(metadata))')
    .eq('pedido_id', pedidoId)

  for (const item of items ?? []) {
    const variant = Array.isArray(item.product_variants)
      ? item.product_variants[0]
      : item.product_variants
    if (!variant) continue

    const product = Array.isArray(variant.products)
      ? variant.products[0]
      : variant.products
    if (!product) continue

    const metadata = product.metadata as Record<string, unknown> | null
    if (metadata?.membership_id) {
      await promoteMembership(
        pedido.contact_id,
        metadata.membership_id as string,
        pedidoId
      )
    }
  }

  revalidatePath(`/pedidos/${pedidoId}`)
  revalidatePath('/pedidos')
  return pedido
}

export async function rejectPedido(
  pedidoId: string,
  userId: string,
  reason: string
) {
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('pedidos')
    .update({
      status: 'rejected',
      rejected_by: userId,
      rejected_at: new Date().toISOString(),
      rejected_reason: reason,
    })
    .eq('id', pedidoId)
    .in('status', ['pending_approval'])

  if (error) {
    throw new Error(`Failed to reject pedido: ${error.message}`)
  }

  revalidatePath(`/pedidos/${pedidoId}`)
  revalidatePath('/pedidos')
}

export async function cancelPedido(pedidoId: string): Promise<void> {
  // Auth client (not service) — cancellation requires an authenticated caller
  const auth = await createClient()
  const {
    data: { user },
  } = await auth.auth.getUser()
  if (!user) {
    throw new Error('Não autenticado')
  }

  const supabase = createServiceClient()

  const { data: pedido, error: fetchError } = await supabase
    .from('pedidos')
    .select('id, status, owner_id')
    .eq('id', pedidoId)
    .single()

  if (fetchError || !pedido) {
    throw new Error('Pedido não encontrado')
  }
  if (pedido.status === 'cancelled') {
    throw new Error('Este pedido já foi cancelado')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  const isAdmin = profile?.role === 'admin'

  if (!isAdmin && pedido.owner_id !== user.id) {
    throw new Error('Você não tem permissão para cancelar este pedido.')
  }

  const { error } = await supabase
    .from('pedidos')
    .update({
      status: 'cancelled',
      approved_by: null,
      approved_at: null,
      rejected_by: null,
      rejected_at: null,
      rejected_reason: null,
    })
    .eq('id', pedidoId)
    .neq('status', 'cancelled')

  if (error) {
    console.error('cancelPedido: update failed:', error.message)
    throw new Error('Erro ao cancelar o pedido. Tente novamente.')
  }

  revalidatePath(`/pedidos/${pedidoId}`)
  revalidatePath('/pedidos')
}

export async function updatePedido(
  pedidoId: string,
  data: {
    notes?: string
    deliveryAddress?: string
    items: UpdatePedidoItemData[]
  }
): Promise<{ status: string }> {
  // Auth client (not service) — we need the caller's identity for the
  // owner/admin check
  const auth = await createClient()
  const {
    data: { user },
  } = await auth.auth.getUser()
  if (!user) {
    throw new Error('Não autenticado')
  }

  const supabase = createServiceClient()

  const { data: pedido, error: fetchError } = await supabase
    .from('pedidos')
    .select('id, status, owner_id, contact_id, contacts(first_name, last_name)')
    .eq('id', pedidoId)
    .single()

  if (fetchError || !pedido) {
    throw new Error('Pedido não encontrado')
  }
  if (pedido.status === 'cancelled') {
    throw new Error('Pedidos cancelados não podem ser editados')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  const isAdmin = profile?.role === 'admin'

  if (!isAdmin && pedido.owner_id !== user.id) {
    throw new Error('Apenas o dono do pedido ou um administrador pode editá-lo')
  }

  if (data.items.length === 0) {
    throw new Error('O pedido precisa de pelo menos um item')
  }

  // Same server-side guard as addItem — reject variants of deactivated products
  const variantIds = [...new Set(data.items.map((i) => i.variantId))]
  const { data: variantRows, error: variantError } = await supabase
    .from('product_variants')
    .select('id, active, products(active)')
    .in('id', variantIds)

  if (variantError) {
    console.error('updatePedido: variant validation failed:', variantError.message)
    throw new Error('Erro ao validar os itens do pedido.')
  }

  const activeVariantIds = new Set(
    (variantRows ?? [])
      .filter((v) => {
        const product = Array.isArray(v.products) ? v.products[0] : v.products
        return v.active && product?.active
      })
      .map((v) => v.id)
  )

  // Validate and price every item BEFORE deleting the existing ones, so a
  // pricing or permission failure can't leave the pedido stripped of items.
  const rows: Array<{
    pedido_id: string
    variant_id: string
    quantity: number
    unit_price: number
    discount_pct: number
    total: number
    price_mode: string
    tier_slug: string | null
  }> = []
  for (const item of data.items) {
    if (!activeVariantIds.has(item.variantId)) {
      throw new Error('Um dos produtos não está mais disponível.')
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw new Error('Quantidade inválida')
    }

    const discountPct = item.discountPct ?? 0
    if (!Number.isFinite(discountPct) || discountPct < 0 || discountPct > 100) {
      throw new Error('Desconto inválido')
    }

    let unitPrice: number
    if (item.priceMode === 'override') {
      // Manual override is admin-only — enforce server-side
      if (!isAdmin) {
        throw new Error('Apenas administradores podem definir preço manual')
      }
      unitPrice = item.overridePrice ?? 0
      if (!Number.isFinite(unitPrice) || unitPrice < 0) {
        throw new Error('Preço manual inválido')
      }
    } else {
      unitPrice = await getPrice(item.variantId, item.membershipTier)
    }

    const lineTotal = item.quantity * unitPrice * (1 - discountPct / 100)
    rows.push({
      pedido_id: pedidoId,
      variant_id: item.variantId,
      quantity: item.quantity,
      unit_price: unitPrice,
      discount_pct: discountPct,
      total: Math.round(lineTotal * 100) / 100,
      price_mode: item.priceMode,
      tier_slug: item.priceMode === 'override' ? null : item.membershipTier,
    })
  }

  // Replace all items
  const { error: deleteError } = await supabase
    .from('pedido_items')
    .delete()
    .eq('pedido_id', pedidoId)
  if (deleteError) {
    console.error('updatePedido: item delete failed:', deleteError.message)
    throw new Error('Erro ao atualizar os itens. Tente novamente.')
  }

  const { error: insertError } = await supabase.from('pedido_items').insert(rows)
  if (insertError) {
    console.error('updatePedido: item insert failed:', insertError.message)
    throw new Error('Erro ao atualizar os itens. Tente novamente.')
  }

  // Approval algorithm — same rule as submitPedido, re-run from scratch
  const hasDiscount = rows.some((r) => r.discount_pct > 0)
  const hasPriceOverride = rows.some((r) => r.price_mode === 'override')
  const newStatus = hasDiscount || hasPriceOverride ? 'pending_approval' : 'approved'

  const pedidoUpdate: Record<string, unknown> = {
    status: newStatus,
    approved_by: null,
    approved_at: null,
    rejected_by: null,
    rejected_at: null,
    rejected_reason: null,
  }
  if (data.notes !== undefined) {
    pedidoUpdate.notes = data.notes.trim() || null
  }
  if (data.deliveryAddress !== undefined) {
    pedidoUpdate.delivery_address = data.deliveryAddress.trim() || null
  }

  // The cancelled check above ran before the item rewrite — a concurrent
  // cancelPedido could have landed since. The status filter here makes the
  // write itself refuse to resurrect a cancelled pedido.
  const { data: updatedRows, error: updateError } = await supabase
    .from('pedidos')
    .update(pedidoUpdate)
    .eq('id', pedidoId)
    .neq('status', 'cancelled')
    .select('id')
  if (updateError) {
    console.error('updatePedido: pedido update failed:', updateError.message)
    throw new Error('Erro ao salvar o pedido. Tente novamente.')
  }
  if (!updatedRows || updatedRows.length === 0) {
    throw new Error('Este pedido foi cancelado e não pode ser editado.')
  }

  await recalculatePedidoTotal(pedidoId)

  if (newStatus === 'pending_approval') {
    const { data: updated } = await supabase
      .from('pedidos')
      .select('total, discount_pct')
      .eq('id', pedidoId)
      .single()

    const contact = Array.isArray(pedido.contacts)
      ? pedido.contacts[0]
      : pedido.contacts
    const contactName = contact
      ? [contact.first_name, contact.last_name].filter(Boolean).join(' ')
      : 'Desconhecido'

    void notifyPendingApproval({
      id: pedidoId,
      contactName,
      total: Number(updated?.total ?? 0),
      discountPct: Number(updated?.discount_pct ?? 0),
    })
  }

  revalidatePath(`/pedidos/${pedidoId}`)
  revalidatePath('/pedidos')
  return { status: newStatus }
}

export async function closeLeadOutcome(
  leadId: string,
  outcome: string,
  reason: string
) {
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('leads')
    .update({
      outcome,
      outcome_reason: reason,
      outcome_at: new Date().toISOString(),
      status: outcome === 'ganho' ? 'ganho' : 'perdido',
    })
    .eq('id', leadId)

  if (error) {
    throw new Error(`Failed to close lead outcome: ${error.message}`)
  }

  revalidatePath(`/leads/${leadId}`)
  revalidatePath('/leads')
  revalidatePath('/pipeline')
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function recalculatePedidoTotal(pedidoId: string) {
  const supabase = createServiceClient()

  const { data: items } = await supabase
    .from('pedido_items')
    .select('total, discount_pct')
    .eq('pedido_id', pedidoId)

  const total = (items ?? []).reduce((sum, i) => sum + Number(i.total), 0)
  const maxDiscount = Math.max(
    0,
    ...(items ?? []).map((i) => Number(i.discount_pct))
  )

  await supabase
    .from('pedidos')
    .update({
      total: Math.round(total * 100) / 100,
      discount_pct: maxDiscount,
    })
    .eq('id', pedidoId)
}
