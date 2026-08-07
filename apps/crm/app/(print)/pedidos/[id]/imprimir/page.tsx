import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'
import PrintButton from './PrintButton'

const STATUS_LABEL: Record<string, string> = {
  draft: 'Rascunho',
  pending_approval: 'Aguardando aprovação',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  cancelled: 'Cancelado',
}

interface ImprimirPageProps {
  params: Promise<{ id: string }>
}

export default async function ImprimirPage({ params }: ImprimirPageProps) {
  const { id } = await params
  const svc = createServiceClient()

  const { data: pedido } = await svc
    .from('pedidos')
    .select(
      `
      *,
      contact:contacts(id, first_name, last_name, membership_tier)
      `
    )
    .eq('id', id)
    .single()

  if (!pedido) notFound()

  // Fetch creator name
  let creatorName: string | null = null
  if (pedido.owner_id) {
    const { data: creator } = await svc
      .from('users')
      .select('name')
      .eq('id', pedido.owner_id)
      .single()
    creatorName = creator?.name ?? null
  }

  // Fetch approver name (if approved_by is set and not already joined)
  let approverName: string | null = null
  if (pedido.approved_by) {
    const { data: approverUser } = await svc
      .from('users')
      .select('name')
      .eq('id', pedido.approved_by)
      .single()
    approverName = approverUser?.name ?? null
  }

  const { data: items } = await svc
    .from('pedido_items')
    .select(
      `
      id, quantity, unit_price, discount_pct, total,
      variant:product_variants(id, sku, name, products(name))
      `
    )
    .eq('pedido_id', id)
    .order('created_at', { ascending: true })

  const contact = Array.isArray(pedido.contact) ? pedido.contact[0] : pedido.contact
  const contactName = contact
    ? [contact.first_name, contact.last_name].filter(Boolean).join(' ')
    : '—'

  const allItems = items ?? []
  const subtotal = allItems.reduce((s, i) => s + Number(i.total), 0)
  const discountAmount = Number(pedido.discount_amount) || 0
  const grandTotal = Number(pedido.total)

  const fmt = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const now = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              @page { margin: 0; }
              body { margin: 1.5cm !important; padding: 0 !important; }
              .no-print { display: none !important; }
            }
            .print-page { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #222; padding: 32px; max-width: 800px; margin: 0 auto; }
            .print-page h1 { font-size: 20px; font-weight: 700; }
            .print-page h2 { font-size: 14px; font-weight: 700; margin-bottom: 8px; }
            .print-header { text-align: center; border-bottom: 2px solid #222; padding-bottom: 16px; margin-bottom: 24px; }
            .print-header p { font-size: 11px; color: #555; margin-top: 4px; }
            .print-meta { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
            .print-meta h1 { margin-bottom: 4px; }
            .print-badge { display: inline-block; font-size: 11px; font-weight: 700; padding: 2px 10px; border-radius: 4px; border: 1px solid #ccc; background: #f5f5f5; }
            .print-customer { margin-bottom: 24px; padding: 12px 16px; background: #f9f9f9; border-radius: 6px; border: 1px solid #e5e5e5; }
            .print-customer p { margin-top: 2px; }
            .print-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
            .print-table th { text-align: left; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #666; padding: 8px 10px; border-bottom: 2px solid #ddd; }
            .print-table td { padding: 8px 10px; border-bottom: 1px solid #eee; }
            .text-right { text-align: right; }
            .print-totals { margin-left: auto; width: 280px; }
            .print-totals tr td { padding: 6px 10px; }
            .print-totals .grand td { font-weight: 700; font-size: 15px; border-top: 2px solid #222; }
            .print-notes, .print-address { margin-bottom: 24px; padding: 12px 16px; background: #fffbe6; border: 1px solid #ffe082; border-radius: 6px; }
            .print-footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 11px; color: #888; text-align: center; }
            .print-btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; font-size: 14px; font-weight: 600; background: #222; color: #fff; border: none; border-radius: 6px; cursor: pointer; margin-bottom: 24px; }
            .print-btn:hover { background: #444; }
          `,
        }}
      />

      <div className="print-page">
        <PrintButton />

        <div className="print-header">
          <h1>Goodtime do Brasil</h1>
          <p>Rua 446, nº 659 — Morretes, Itapema/SC | (47) 99737-9299 | CNPJ: 60.330.989/0001-23</p>
        </div>

        <div className="print-meta">
          <div>
            <h1>Pedido #{id.slice(0, 8)}</h1>
            <p style={{ color: '#555', fontSize: 11 }}>
              Criado {creatorName ? `por ${creatorName} ` : ''}em{' '}
              {new Date(pedido.created_at).toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            {pedido.status === 'approved' && (
              <p style={{ color: '#555', fontSize: 11 }}>
                {pedido.approved_by
                  ? `Revisado por ${approverName ?? '—'}`
                  : '⚙️ Revisado automaticamente'}
              </p>
            )}
          </div>
          <span className="print-badge">{STATUS_LABEL[pedido.status] ?? pedido.status}</span>
        </div>

        <div className="print-customer">
          <h2>Cliente</h2>
          <p style={{ fontWeight: 600 }}>{contactName}</p>
          {contact?.membership_tier && (
            <p style={{ fontSize: 12, color: '#666' }}>Tier: {contact.membership_tier}</p>
          )}
        </div>

        <table className="print-table">
          <thead>
            <tr>
              <th>Produto</th>
              <th>Qtd</th>
              <th className="text-right">Preço un.</th>
              <th className="text-right">Desc. %</th>
              <th className="text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {allItems.map((item) => {
              const variant = Array.isArray(item.variant) ? item.variant[0] : item.variant
              const product = variant
                ? (Array.isArray(variant.products) ? variant.products[0] : variant.products)
                : null
              return (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600 }}>
                    {product?.name ?? '—'}
                    {variant?.sku ? (
                      <span style={{ display: 'block', fontSize: 11, color: '#888', fontWeight: 400 }}>{variant.sku}</span>
                    ) : null}
                  </td>
                  <td>{item.quantity}</td>
                  <td className="text-right">{fmt(Number(item.unit_price))}</td>
                  <td className="text-right">{Number(item.discount_pct) > 0 ? `${item.discount_pct}%` : '—'}</td>
                  <td className="text-right" style={{ fontWeight: 600 }}>{fmt(Number(item.total))}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <table className="print-totals">
          <tbody>
            <tr>
              <td>Subtotal</td>
              <td className="text-right">{fmt(subtotal)}</td>
            </tr>
            {discountAmount > 0 && (
              <tr>
                <td>Desconto</td>
                <td className="text-right" style={{ color: '#C44040' }}>-{fmt(discountAmount)}</td>
              </tr>
            )}
            <tr className="grand">
              <td>Total</td>
              <td className="text-right">{fmt(grandTotal)}</td>
            </tr>
          </tbody>
        </table>

        {pedido.delivery_address && (
          <div className="print-address">
            <h2>Endereço de entrega</h2>
            <p style={{ whiteSpace: 'pre-wrap' }}>{pedido.delivery_address}</p>
          </div>
        )}

        {pedido.notes && (
          <div className="print-notes">
            <h2>Observações</h2>
            <p>{pedido.notes}</p>
          </div>
        )}

        <div className="print-footer">
          Gerado em {now}
        </div>
      </div>
    </>
  )
}
