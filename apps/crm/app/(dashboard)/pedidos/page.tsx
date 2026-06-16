import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { IconPlus, IconShare } from '@tabler/icons-react'

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

type Tab = 'mine' | 'shared' | 'all'
const VALID_TABS: Tab[] = ['mine', 'shared', 'all']

const TAB_LABEL: Record<Tab, string> = {
  mine: 'Meus pedidos',
  shared: 'Compartilhado comigo',
  all: 'Todos',
}

interface PedidosPageProps {
  searchParams: Promise<{ cursor?: string; status?: string; tab?: string }>
}

export default async function PedidosPage({ searchParams }: PedidosPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { cursor, status, tab: rawTab } = await searchParams

  // Resolve user role
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  const role = profile?.role ?? 'vendedor'
  const isPrivileged = role === 'admin' || role === 'editor'

  // Resolve active tab — vendedor cannot use "all"
  let activeTab: Tab = VALID_TABS.includes(rawTab as Tab) ? (rawTab as Tab) : 'mine'
  if (activeTab === 'all' && !isPrivileged) {
    redirect('/pedidos?tab=mine')
  }

  let parsedCursor: { created_at: string; id: string } | null = null
  if (cursor) {
    try {
      parsedCursor = JSON.parse(decodeURIComponent(cursor))
    } catch {
      // invalid cursor
    }
  }

  const activeStatus = ALL_STATUSES.includes(status ?? '') ? status : undefined

  // ─── Build query based on tab ─────────────────────────────────────────────

  if (activeTab === 'shared') {
    // Fetch pedido IDs shared with current user
    const serviceClient = createServiceClient()
    const { data: shareRows } = await serviceClient
      .from('pedido_shares')
      .select('pedido_id, shared_by, sharer:users!pedido_shares_shared_by_fkey(name)')
      .eq('shared_with', user.id)

    const shareMap = new Map<string, string>()
    for (const row of shareRows ?? []) {
      const sharer = Array.isArray(row.sharer) ? row.sharer[0] : row.sharer
      shareMap.set(row.pedido_id, sharer?.name ?? '—')
    }

    const sharedPedidoIds = Array.from(shareMap.keys())
    if (sharedPedidoIds.length === 0) {
      return (
        <div>
          <PageHeader activeTab={activeTab} isPrivileged={isPrivileged} />
          <TabBar activeTab={activeTab} activeStatus={activeStatus} isPrivileged={isPrivileged} />
          <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--color-gray-400)' }}>Nenhum pedido compartilhado com você.</p>
          </div>
        </div>
      )
    }

    let query = supabase
      .from('pedidos')
      .select('id, status, total, discount_pct, created_at, contact_id, owner_id, contacts(first_name, last_name)')
      .in('id', sharedPedidoIds)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(PAGE_SIZE + 1)

    if (activeStatus) query = query.eq('status', activeStatus)
    if (parsedCursor) {
      query = query.or(
        `created_at.lt.${parsedCursor.created_at},and(created_at.eq.${parsedCursor.created_at},id.lt.${parsedCursor.id})`
      )
    }

    const { data: rows, error } = await query
    const pedidos = (rows ?? []).map((p) => ({ ...p, _sharedBy: shareMap.get(p.id) ?? null, _isShared: true }))

    return (
      <div>
        <PageHeader activeTab={activeTab} isPrivileged={isPrivileged} />
        <TabBar activeTab={activeTab} activeStatus={activeStatus} isPrivileged={isPrivileged} />
        <StatusFilter activeTab={activeTab} activeStatus={activeStatus} />
        {error && <ErrorBanner message={error.message} />}
        <PedidoList pedidos={pedidos} cursor={cursor} activeTab={activeTab} activeStatus={activeStatus} pageSize={PAGE_SIZE} showSharedBy />
      </div>
    )
  }

  // ─── "mine" and "all" tabs ────────────────────────────────────────────────

  let query = supabase
    .from('pedidos')
    .select('id, status, total, discount_pct, created_at, contact_id, owner_id, contacts(first_name, last_name)')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(PAGE_SIZE + 1)

  if (activeTab === 'mine') {
    query = query.eq('owner_id', user.id)
  }
  // "all" — no owner filter (RLS handles visibility)

  if (activeStatus) query = query.eq('status', activeStatus)
  if (parsedCursor) {
    query = query.or(
      `created_at.lt.${parsedCursor.created_at},and(created_at.eq.${parsedCursor.created_at},id.lt.${parsedCursor.id})`
    )
  }

  const { data: rows, error } = await query

  // Fetch share counts for the fetched pedidos
  const pedidoIds = (rows ?? []).map((p) => p.id)
  let shareCountMap = new Map<string, number>()
  if (pedidoIds.length > 0) {
    const serviceClient = createServiceClient()
    const { data: shareCounts } = await serviceClient
      .from('pedido_shares')
      .select('pedido_id')
      .in('pedido_id', pedidoIds)

    for (const row of shareCounts ?? []) {
      shareCountMap.set(row.pedido_id, (shareCountMap.get(row.pedido_id) ?? 0) + 1)
    }
  }

  const pedidos = (rows ?? []).map((p) => ({
    ...p,
    _sharedBy: null as string | null,
    _isShared: (shareCountMap.get(p.id) ?? 0) > 0,
  }))

  return (
    <div>
      <PageHeader activeTab={activeTab} isPrivileged={isPrivileged} />
      <TabBar activeTab={activeTab} activeStatus={activeStatus} isPrivileged={isPrivileged} />
      <StatusFilter activeTab={activeTab} activeStatus={activeStatus} />
      {error && <ErrorBanner message={error.message} />}
      <PedidoList pedidos={pedidos} cursor={cursor} activeTab={activeTab} activeStatus={activeStatus} pageSize={PAGE_SIZE} />
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function PageHeader({ activeTab, isPrivileged }: { activeTab: Tab; isPrivileged: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
      <h1 className="topbar-title">Pedidos</h1>
      <Link href="/pedidos/new" className="btn btn-primary">
        <IconPlus size={14} stroke={1.5} aria-hidden />
        Novo pedido
      </Link>
    </div>
  )
}

function TabBar({ activeTab, activeStatus, isPrivileged }: { activeTab: Tab; activeStatus?: string; isPrivileged: boolean }) {
  const tabs: Tab[] = isPrivileged ? ['mine', 'shared', 'all'] : ['mine', 'shared']
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--color-gray-100)', paddingBottom: 0 }}>
      {tabs.map((t) => (
        <Link
          key={t}
          href={`/pedidos?tab=${t}`}
          style={{
            fontSize: 13, fontWeight: activeTab === t ? 700 : 500,
            color: activeTab === t ? 'var(--color-primary)' : 'var(--color-gray-500)',
            textDecoration: 'none', padding: '8px 14px',
            borderBottom: activeTab === t ? '2px solid var(--color-primary)' : '2px solid transparent',
            marginBottom: -1,
          }}
        >
          {TAB_LABEL[t]}
        </Link>
      ))}
    </div>
  )
}

function StatusFilter({ activeTab, activeStatus }: { activeTab: Tab; activeStatus?: string }) {
  const buildUrl = (s?: string) => {
    const parts: string[] = [`tab=${activeTab}`]
    if (s) parts.push(`status=${s}`)
    return `/pedidos?${parts.join('&')}`
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
      <Link
        href={buildUrl()}
        className={!activeStatus ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-ghost'}
      >
        Todos
      </Link>
      {ALL_STATUSES.map((s) => (
        <Link
          key={s}
          href={buildUrl(s)}
          className={activeStatus === s ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-ghost'}
        >
          {STATUS_LABEL[s]}
        </Link>
      ))}
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="card" style={{ borderLeft: '3px solid var(--color-danger)', marginBottom: 16 }}>
      <p style={{ fontSize: 13, color: '#C44040' }}>Erro ao carregar pedidos: {message}</p>
    </div>
  )
}

interface PedidoRow {
  id: string
  status: string
  total: number
  discount_pct: number
  created_at: string
  contact_id: string | null
  owner_id: string
  contacts: { first_name: string | null; last_name: string | null } | { first_name: string | null; last_name: string | null }[] | null
  _sharedBy: string | null
  _isShared: boolean
}

function PedidoList({
  pedidos, cursor, activeTab, activeStatus, pageSize, showSharedBy,
}: {
  pedidos: PedidoRow[]
  cursor?: string
  activeTab: Tab
  activeStatus?: string
  pageSize: number
  showSharedBy?: boolean
}) {
  const hasMore = pedidos.length > pageSize
  const page = hasMore ? pedidos.slice(0, pageSize) : pedidos
  const lastItem = page[page.length - 1]
  const nextCursor =
    hasMore && lastItem
      ? JSON.stringify({ created_at: lastItem.created_at, id: lastItem.id })
      : null

  const buildUrl = (params: Record<string, string | undefined>) => {
    const parts: string[] = [`tab=${activeTab}`]
    if (params.status) parts.push(`status=${params.status}`)
    if (params.cursor) parts.push(`cursor=${encodeURIComponent(params.cursor)}`)
    return `/pedidos?${parts.join('&')}`
  }

  if (page.length === 0) {
    return (
      <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--color-gray-400)' }}>Nenhum pedido encontrado.</p>
        <Link
          href="/pedidos/new"
          style={{ marginTop: 16, display: 'inline-block', fontSize: 13, color: 'var(--color-primary)' }}
        >
          Criar primeiro pedido
        </Link>
      </div>
    )
  }

  return (
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
                  {pedido._isShared && !showSharedBy && (
                    <span className="badge badge-sq badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <IconShare size={10} stroke={2} aria-hidden />
                      Compartilhado
                    </span>
                  )}
                  {showSharedBy && pedido._sharedBy && (
                    <span style={{ fontSize: 11, color: 'var(--color-gray-400)' }}>
                      Compartilhado por {pedido._sharedBy}
                    </span>
                  )}
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
            {showSharedBy && <th>Compartilhado por</th>}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className={STATUS_BADGE[pedido.status] ?? 'badge badge-sq badge-gray'}>
                      {STATUS_LABEL[pedido.status] ?? pedido.status}
                    </span>
                    {pedido._isShared && !showSharedBy && (
                      <span className="badge badge-sq badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        <IconShare size={10} stroke={2} aria-hidden />
                        Compartilhado
                      </span>
                    )}
                  </div>
                </td>
                <td style={{ color: 'var(--color-gray-600)' }}>
                  {Number(pedido.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
                <td style={{ color: 'var(--color-gray-600)' }}>
                  {Number(pedido.discount_pct) > 0 ? `${pedido.discount_pct}%` : '—'}
                </td>
                {showSharedBy && (
                  <td style={{ color: 'var(--color-gray-500)', fontSize: 12 }}>
                    {pedido._sharedBy ?? '—'}
                  </td>
                )}
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
  )
}
