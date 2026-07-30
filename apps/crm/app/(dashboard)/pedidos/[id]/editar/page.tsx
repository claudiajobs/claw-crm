import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { IconArrowLeft } from '@tabler/icons-react'
import PedidoEditForm from '@/components/crm/pedidos/PedidoEditForm'
import type { CartItem } from '@/components/crm/pedidos/PedidoForm'

interface EditPedidoPageProps {
  params: Promise<{ id: string }>
}

export default async function EditPedidoPage({ params }: EditPedidoPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const svc = createServiceClient()

  const { data: pedido } = await svc
    .from('pedidos')
    .select('id, status, owner_id, notes, contact:contacts(id, first_name, last_name, membership_tier)')
    .eq('id', id)
    .single()

  if (!pedido) notFound()

  // Access guard: only the owner or an admin may edit, and never a cancelled pedido
  const { data: profile } = await svc
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  const isAdmin = profile?.role === 'admin'

  if (!isAdmin && pedido.owner_id !== user.id) redirect(`/pedidos/${id}`)
  if (pedido.status === 'cancelled') redirect(`/pedidos/${id}`)

  // Prefetch tiers, active variants, current prices and existing items in parallel
  const [tiersRes, variantsRes, pricingRes, itemsRes] = await Promise.all([
    supabase
      .from('membership_tiers')
      .select('slug, name')
      .order('sort_order'),
    svc
      .from('product_variants')
      // Inner join so variants of deactivated products drop out of the form
      .select('id, name, sku, unit, product_id, products!inner(name, active)')
      .eq('active', true)
      .eq('products.active', true)
      .order('name'),
    svc
      .from('product_pricing')
      .select('variant_id, tier_slug, price, valid_from, valid_until')
      .lte('valid_from', new Date().toISOString())
      .or(`valid_until.is.null,valid_until.gt.${new Date().toISOString()}`)
      .order('valid_from', { ascending: false }),
    svc
      .from('pedido_items')
      .select(
        `
        id, quantity, unit_price, discount_pct, price_mode, tier_slug,
        variant:product_variants(id, sku, name, unit, products(name))
        `
      )
      .eq('pedido_id', id),
  ])

  const tiers = tiersRes.data ?? []

  const allVariants = (variantsRes.data ?? []).map((v) => {
    const product = Array.isArray(v.products) ? v.products[0] : v.products
    const productName = (product as { name: string } | null)?.name ?? ''
    return {
      id: v.id as string,
      sku: v.sku as string,
      name: v.name as string,
      unit: v.unit as string,
      productName,
    }
  })

  // Build price map: { `${variant_id}:${tier_slug}` → price } (latest price per combo)
  const priceMap: Record<string, number> = {}
  for (const row of pricingRes.data ?? []) {
    const key = `${row.variant_id}:${row.tier_slug}`
    if (!(key in priceMap)) {
      priceMap[key] = Number(row.price)
    }
  }

  const contactRow = Array.isArray(pedido.contact) ? pedido.contact[0] : pedido.contact
  const contact = contactRow
    ? {
        name: [contactRow.first_name, contactRow.last_name].filter(Boolean).join(' '),
        tier: (contactRow.membership_tier ?? null) as string | null,
      }
    : null

  const fallbackTier =
    contact?.tier ??
    (itemsRes.data ?? []).find((r) => r.tier_slug)?.tier_slug ??
    tiers[0]?.slug ??
    null

  const initialItems: CartItem[] = (itemsRes.data ?? []).map((row) => {
    const variant = Array.isArray(row.variant) ? row.variant[0] : row.variant
    const product = variant
      ? (Array.isArray(variant.products) ? variant.products[0] : variant.products)
      : null
    const tierSlug = (row.tier_slug ?? fallbackTier) as string
    const priceMode = (row.price_mode ?? 'tier') as 'tier' | 'override'
    // Tier items show the CURRENT tier price (saving re-runs the pricing
    // engine, so this is what will actually be persisted)
    const currentTierPrice = priceMap[`${variant?.id}:${tierSlug}`]
    return {
      variantId: (variant?.id ?? '') as string,
      variantName: (variant?.name ?? '') as string,
      productName: (product as { name: string } | null)?.name ?? '',
      sku: (variant?.sku ?? '') as string,
      quantity: Number(row.quantity),
      unit: (variant?.unit ?? '') as string,
      unitPrice:
        priceMode === 'tier' && currentTierPrice !== undefined
          ? currentTierPrice
          : Number(row.unit_price),
      discountPct: Number(row.discount_pct),
      priceMode,
      tierSlug,
    }
  })

  const title = contact ? `Editar pedido — ${contact.name}` : 'Editar pedido'

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Link
          href={`/pedidos/${id}`}
          className="md:hidden"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--color-primary)', fontWeight: 500, textDecoration: 'none', marginBottom: 8 }}
        >
          <IconArrowLeft size={14} stroke={1.5} aria-hidden />
          Voltar para o pedido
        </Link>
        <div className="hidden md:flex" style={{ alignItems: 'center', gap: 12 }}>
          <Link href={`/pedidos/${id}`} style={{ fontSize: 12, color: 'var(--color-gray-400)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <IconArrowLeft size={14} stroke={1.5} aria-hidden />
            Pedido
          </Link>
          <span style={{ color: 'var(--color-gray-200)' }}>/</span>
          <h1 className="topbar-title">{title}</h1>
        </div>
        <h1 className="topbar-title md:hidden">{title}</h1>
      </div>

      <PedidoEditForm
        pedidoId={id}
        contact={contact}
        initialNotes={pedido.notes ?? ''}
        initialItems={initialItems}
        initialTier={fallbackTier}
        tiers={tiers}
        allVariants={allVariants}
        priceMap={priceMap}
        isAdmin={isAdmin}
      />
    </div>
  )
}
