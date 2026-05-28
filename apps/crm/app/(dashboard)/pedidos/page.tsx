import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { IconPlus } from '@tabler/icons-react'

const PAGE_SIZE = 25

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

const ALL_STATUSES = Object.keys(STATUS_LABEL)

interface PedidosPageProps {
  searchParams: Promise<{ cursor?: string; status?: string }>
}

export default async function PedidosPage({ searchParams }: PedidosPageProps) {
  const supabase = await createClient()
  const { cursor, status } = await searchParams

  let parsedCursor: { created_at: string; id: string } | null = null
  if (cursor) {
    try {
      parsedCursor = JSON.parse(decodeURIComponent(cursor))
    } catch {
      // invalid cursor
    }
  }

  const activeStatus = ALL_STATUSES.includes(status ?? '') ? status : undefined

  let query = supabase
    .from('pedidos')
    .select(
      'id, status, total, discount_pct, created_at, contact_id, contacts(first_name, last_name)'
    )
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(PAGE_SIZE + 1)

  if (activeStatus) {
    query = query.eq('status', activeStatus)
  }

  if (parsedCursor) {
    query = query.or(
      `created_at.lt.${parsedCursor.created_at},and(created_at.eq.${parsedCursor.created_at},id.lt.${parsedCursor.id})`
    )
  }

  const { data: rows, error } = await query
  const pedidos = rows ?? []
  const hasMore = pedidos.length > PAGE_SIZE
  const page = hasMore ? pedidos.slice(0, PAGE_SIZE) : pedidos
  const lastItem = page[page.length - 1]
  const nextCursor =
    hasMore && lastItem
      ? JSON.stringify({ created_at: lastItem.created_at, id: lastItem.id })
      : null

  const buildUrl = (params: Record<string, string | undefined>) => {
    const parts: string[] = []
    if (params.status) parts.push(`status=${params.status}`)
    if (params.cursor) parts.push(`cursor=${encodeURIComponent(params.cursor)}`)
    return `/pedidos${parts.length ? `?${parts.join('&')}` : ''}`
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 className="topbar-title">Pedidos</h1>
        <Link href="/pedidos/new" className="btn btn-primary">
          <IconPlus size={14} stroke={1.5} aria-hidden />
          Novo pedido
        </Link>
      </div>

      {/* Status filter chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <Link
          href="/pedidos"
          className={!activeStatus ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-ghost'}
        >
          Todos
        </Link>
        {ALL_STATUSES.map((s) => (
          <Link
            key={s}
            href={buildUrl({ status: s })}
            className={activeStatus === s ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-ghost'}
          >
            {STATUS_LABEL[s]}
          </Link>
        ))}
      </div>

      {error && (
        <div className="card" style={{ borderLeft: '3px solid var(--color-danger)', marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: '#C44040' }}>Erro ao carregar pedidos: {error.message}</p>
        </div>
      )}

      {page.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--color-gray-400)' }}>Nenhum pedido encontrado.</p>
          <Link
            href="/pedidos/new"
            style={{ marginTop: 16, display: 'inline-block', fontSize: 13, color: 'var(--color-primary)' }}
          >
            Criar primeiro pedido
          </Link>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {/* Mobile */}
          <ul className="sm:hidden" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {page.map((pedido) => {
              const contact = Array.isArray(pedido.contacts) ? pedido.contacts[0] : pedido.contacts
              const contactName = contact
                ? [contact.first_name, contact.last_name].filter(Boolean).join(' ')
                : '—'
              return (
                <li key={pedido.id} style={{ borderBottom: '0.5px solid var(--color-gray-100)' }}>
                  <Link
                    href={`/pedidos/${pedido.id}`}
                    style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '14px 16px', textDecoration: 'none', color: 'inherit' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-gray-800)' }}>
                        {contactName}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-gray-700)' }}>
                        {Number(pedido.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={STATUS_BADGE[pedido.status] ?? 'badge badge-sq badge-gray'}>
                        {STATUS_LABEL[pedido.status] ?? pedido.status}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--color-gray-400)' }}>
                        {new Date(pedido.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Desktop */}
          <table className="data-table hidden sm:table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Status</th>
                <th>Total (R$)</th>
                <th>Desconto</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {page.map((pedido) => {
                const contact = Array.isArray(pedido.contacts) ? pedido.contacts[0] : pedido.contacts
                const contactName = contact
                  ? [contact.first_name, contact.last_name].filter(Boolean).join(' ')
                  : '—'
                return (
                  <tr key={pedido.id}>
                    <td style={{ fontWeight: 600 }}>
                      <Link href={`/pedidos/${pedido.id}`} style={{ color: 'var(--color-gray-800)', textDecoration: 'none' }}>
                        {contactName}
                      </Link>
                    </td>
                    <td>
                      <span className={STATUS_BADGE[pedido.status] ?? 'badge badge-sq badge-gray'}>
                        {STATUS_LABEL[pedido.status] ?? pedido.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--color-gray-600)' }}>
                      {Number(pedido.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </td>
                    <td style={{ color: 'var(--color-gray-600)' }}>
                      {Number(pedido.discount_pct) > 0 ? `${pedido.discount_pct}%` : '—'}
                    </td>
                    <td style={{ color: 'var(--color-gray-500)', fontSize: 12 }}>
                      {new Date(pedido.created_at).toLocaleDateString('pt-BR')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {(cursor || hasMore) && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderTop: '0.5px solid var(--color-gray-100)' }}>
              {cursor ? (
                <Link
                  href={buildUrl({ status: activeStatus })}
                  style={{ fontSize: 12, color: 'var(--color-gray-600)', textDecoration: 'none' }}
                >
                  ← Primeira página
                </Link>
              ) : (
                <span />
              )}
              {nextCursor && (
                <Link
                  href={buildUrl({ status: activeStatus, cursor: nextCursor })}
                  style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}
                >
                  Próxima página →
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
