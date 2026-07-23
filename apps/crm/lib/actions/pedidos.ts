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
}

interface AddItemData {
  variantId: string
  quantity: number
  membershipTier: string
  discountPct?: number
  priceMode?: 'tier' | 'override'
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

  // Check if any item has discount
  const { data: items } = await supabase
    .from('pedido_items')
    .select('discount_pct')
    .eq('pedido_id', pedidoId)

  const hasDiscount = (items ?? []).some((i) => Number(i.discount_pct) > 0)
  const newStatus = hasDiscount ? 'pending_approval' : 'approved'

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
