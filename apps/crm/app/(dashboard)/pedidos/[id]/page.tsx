import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { IconArrowLeft } from '@tabler/icons-react'
import PedidoActions from '@/components/crm/pedidos/PedidoActions'

const STATUS_LABEL: Record<string, string> = {
  draft: 'Rascunho',
  pending_approval: 'Aguardando aprovação',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  cancelled: 'Cancelado',
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'badge badge-sq badge-gray',
  pending_approval: 'badge badge-sq badge-amber',
  approved: 'badge badge-sq badge-teal',
  rejected: 'badge badge-sq badge-coral',
  cancelled: 'badge badge-sq badge-gray',
}

interface PedidoPageProps {
  params: Promise<{ id: string }>
}

export default async function PedidoPage({ params }: PedidoPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: pedido } = await supabase
    .from('pedidos')
    .select(
      `
      *,
      contact:contacts(id, first_name, last_name, whatsapp_number, membership_tier),
      lead:leads(id, title),
      approver:users!pedidos_approved_by_fkey(name),
      rejector:users!pedidos_rejected_by_fkey(name)
      `
    )
    .eq('id', id)
    .single()

  if (!pedido) notFound()

  const { data: items } = await supabase
    .from('pedido_items')
    .select(
      `
      id, quantity, unit_price, discount_pct, total,
      variant:product_variants(id, sku, name, products(name))
      `
    )
    .eq('pedido_id', id)

  // Check if current user is admin (can approve/reject)
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  const isAdmin = profile?.role === 'admin'

  const contact = Array.isArray(pedido.contact) ? pedido.contact[0] : pedido.contact
  const lead = Array.isArray(pedido.lead) ? pedido.lead[0] : pedido.lead
  const approver = Array.isArray(pedido.approver) ? pedido.approver[0] : pedido.approver
  const rejector = Array.isArray(pedido.rejector) ? pedido.rejector[0] : pedido.rejector
  const contactName = contact
    ? [contact.first_name, contact.last_name].filter(Boolean).join(' ')
    : '—'

  const dtStyle = { fontSize: 10, fontWeight: 700 as const, color: 'var(--color-gray-400)', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }
  const ddStyle = { marginTop: 2, fontSize: 13, fontWeight: 600 as const, color: 'var(--color-gray-800)' }

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
          <h1 className="topbar-title">Pedido — {contactName}</h1>
        </div>
        <h1 className="topbar-title md:hidden">Pedido — {contactName}</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Summary card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-gray-800)' }}>
                Pedido para {contactName}
              </h2>
              {lead && (
                <p style={{ fontSize: 12, color: 'var(--color-gray-400)', marginTop: 2 }}>
                  Lead: <Link href={`/leads/${lead.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>{lead.title}</Link>
                </p>
              )}
            </div>
            <span className={STATUS_BADGE[pedido.status] ?? 'badge badge-sq badge-gray'}>
              {STATUS_LABEL[pedido.status] ?? pedido.status}
            </span>
          </div>

          <dl style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px 24px' }}>
            <div>
              <dt style={dtStyle}>Total</dt>
              <dd style={ddStyle}>
                {Number(pedido.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </dd>
            </div>
            {Number(pedido.discount_pct) > 0 && (
              <div>
                <dt style={dtStyle}>Desconto máx</dt>
                <dd style={ddStyle}>{pedido.discount_pct}%</dd>
              </div>
            )}
            <div>
              <dt style={dtStyle}>Criado em</dt>
              <dd style={{ marginTop: 2, fontSize: 13, color: 'var(--color-gray-600)' }}>
                {new Date(pedido.created_at).toLocaleDateString('pt-BR')}
              </dd>
            </div>
            {pedido.approved_at && approver && (
              <div>
                <dt style={dtStyle}>Aprovado por</dt>
                <dd style={{ marginTop: 2, fontSize: 13, color: 'var(--color-gray-600)' }}>
                  {approver.name} em {new Date(pedido.approved_at).toLocaleDateString('pt-BR')}
                </dd>
              </div>
            )}
            {pedido.rejected_at && rejector && (
              <div>
                <dt style={dtStyle}>Rejeitado por</dt>
                <dd style={{ marginTop: 2, fontSize: 13, color: '#C44040' }}>
                  {rejector.name} em {new Date(pedido.rejected_at).toLocaleDateString('pt-BR')}
                </dd>
              </div>
            )}
            {pedido.rejected_reason && (
              <div>
                <dt style={dtStyle}>Motivo rejeição</dt>
                <dd style={{ marginTop: 2, fontSize: 13, color: '#C44040' }}>{pedido.rejected_reason}</dd>
              </div>
            )}
            {pedido.notes && (
              <div style={{ gridColumn: '1 / -1' }}>
                <dt style={dtStyle}>Observações</dt>
                <dd style={{ marginTop: 2, fontSize: 13, color: 'var(--color-gray-600)' }}>{pedido.notes}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Items */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 16px 8px' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-gray-800)' }}>
              Itens ({(items ?? []).length})
            </h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>SKU</th>
                <th>Qtd</th>
                <th>Preço un.</th>
                <th>Desc.</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {(items ?? []).map((item) => {
                const variant = Array.isArray(item.variant) ? item.variant[0] : item.variant
                const product = variant
                  ? (Array.isArray(variant.products) ? variant.products[0] : variant.products)
                  : null
                return (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{product?.name ?? '—'}</td>
                    <td style={{ color: 'var(--color-gray-500)', fontSize: 12 }}>{variant?.sku ?? '—'}</td>
                    <td>{item.quantity}</td>
                    <td>{Number(item.unit_price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td>{Number(item.discount_pct) > 0 ? `${item.discount_pct}%` : '—'}</td>
                    <td style={{ fontWeight: 600 }}>
                      {Number(item.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Approval actions */}
        {isAdmin && pedido.status === 'pending_approval' && (
          <PedidoActions pedidoId={pedido.id} userId={user.id} />
        )}
      </div>
    </div>
  )
}
