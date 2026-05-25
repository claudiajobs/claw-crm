import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
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

  // Load membership tiers for pricing
  const { data: tiers } = await supabase
    .from('membership_tiers')
    .select('slug, name')
    .order('sort_order')

  // Products are now searched on-demand via server action (searchVariants)
  // No need to preload them all

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
        tiers={tiers ?? []}
        products={[]}
      />
    </div>
  )
}
