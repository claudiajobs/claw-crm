import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { IconArrowLeft } from '@tabler/icons-react'
import PedidoForm from '@/components/crm/pedidos/PedidoForm'

interface NewPedidoPageProps {
  searchParams: Promise<{ contact_id?: string; lead_id?: string }>
}

export default async function NewPedidoPage({ searchParams }: NewPedidoPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { contact_id, lead_id } = await searchParams

  const svc = createServiceClient()

  // Pre-fill contact info if provided
  let prefillContact: { id: string; name: string } | null = null
  if (contact_id) {
    const { data: contact } = await supabase
      .from('contacts')
      .select('id, first_name, last_name')
      .eq('id', contact_id)
      .single()
    if (contact) {
      prefillContact = {
        id: contact.id,
        name: [contact.first_name, contact.last_name].filter(Boolean).join(' '),
      }
    }
  }

  // Pre-fill lead info if provided
  let prefillLead: { id: string; title: string; contactId: string; contactName: string } | null = null
  if (lead_id) {
    const { data: lead } = await supabase
      .from('leads')
      .select('id, title, contact_id, contacts(first_name, last_name)')
      .eq('id', lead_id)
      .single()
    if (lead) {
      const leadContact = Array.isArray(lead.contacts) ? lead.contacts[0] : lead.contacts
      prefillLead = {
        id: lead.id,
        title: lead.title,
        contactId: lead.contact_id,
        contactName: leadContact
          ? [leadContact.first_name, leadContact.last_name].filter(Boolean).join(' ')
          : '',
      }
    }
  }

  // Prefetch all data in parallel for instant client-side filtering
  const [tiersRes, contactsRes, variantsRes, pricingRes] = await Promise.all([
    supabase
      .from('membership_tiers')
      .select('slug, name')
      .order('sort_order'),
    svc
      .from('contacts')
      .select('id, first_name, last_name, whatsapp_number, instagram_handle, membership_tier')
      .order('first_name'),
    svc
      .from('product_variants')
      .select('id, name, sku, unit, product_id, products(name)')
      .eq('active', true)
      .order('name'),
    svc
      .from('product_pricing')
      .select('variant_id, tier_slug, price, valid_from, valid_until')
      .lte('valid_from', new Date().toISOString())
      .or(`valid_until.is.null,valid_until.gt.${new Date().toISOString()}`)
      .order('valid_from', { ascending: false }),
  ])

  const tiers = tiersRes.data ?? []

  const allContacts = (contactsRes.data ?? []).map((c) => ({
    id: c.id as string,
    first_name: (c.first_name ?? '') as string,
    last_name: (c.last_name ?? '') as string,
    phone: (c.whatsapp_number ?? c.instagram_handle ?? '') as string,
    membership_tier: c.membership_tier as string | null,
  }))

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

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Link
          href="/pedidos"
          className="md:hidden"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--color-primary)', fontWeight: 500, textDecoration: 'none', marginBottom: 8 }}
        >
          <IconArrowLeft size={14} stroke={1.5} aria-hidden />
          Voltar para Pedidos
        </Link>
        <div className="hidden md:flex" style={{ alignItems: 'center', gap: 12 }}>
          <Link href="/pedidos" style={{ fontSize: 12, color: 'var(--color-gray-400)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <IconArrowLeft size={14} stroke={1.5} aria-hidden />
            Pedidos
          </Link>
          <span style={{ color: 'var(--color-gray-200)' }}>/</span>
          <h1 className="topbar-title">Novo pedido</h1>
        </div>
        <h1 className="topbar-title md:hidden">Novo pedido</h1>
      </div>

      <PedidoForm
        userId={user.id}
        prefillContact={prefillContact}
        prefillLead={prefillLead}
        tiers={tiers}
        allContacts={allContacts}
        allVariants={allVariants}
        priceMap={priceMap}
      />
    </div>
  )
}
