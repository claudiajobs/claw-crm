import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LeadScoreBadge from '@/components/crm/leads/LeadScoreBadge'
import { IconPlus } from '@tabler/icons-react'

const PAGE_SIZE = 25

const STATUS_LABEL: Record<string, string> = {
  novo: 'Novo',
  contatado: 'Contatado',
  qualificado: 'Qualificado',
  proposta: 'Proposta',
  negociacao: 'Negociação',
  ganho: 'Ganho',
  perdido: 'Perdido',
}

const STATUS_BADGE: Record<string, string> = {
  novo:        'badge badge-sq badge-purple',
  contatado:   'badge badge-sq badge-blue',
  qualificado: 'badge badge-sq badge-blue',
  proposta:    'badge badge-sq badge-amber',
  negociacao:  'badge badge-sq badge-coral',
  ganho:       'badge badge-sq badge-teal',
  perdido:     'badge badge-sq badge-gray',
}

const ALL_STATUSES = Object.keys(STATUS_LABEL)

interface CursorData {
  created_at: string
  id: string
}

interface LeadsPageProps {
  searchParams: Promise<{ cursor?: string; status?: string }>
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const supabase = await createClient()
  const { cursor, status } = await searchParams

  let parsedCursor: CursorData | null = null
  if (cursor) {
    try {
      parsedCursor = JSON.parse(decodeURIComponent(cursor)) as CursorData
    } catch {
      // invalid cursor — ignore
    }
  }

  const activeStatus = ALL_STATUSES.includes(status ?? '') ? status : undefined

  let query = supabase
    .from('leads')
    .select(
      'id, title, status, score, value, contact_id, created_at, contacts(first_name, last_name, preferred_channel)'
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

  const leads = rows ?? []
  const hasMore = leads.length > PAGE_SIZE
  const page = hasMore ? leads.slice(0, PAGE_SIZE) : leads
  const lastItem = page[page.length - 1]
  const nextCursor =
    hasMore && lastItem
      ? JSON.stringify({ created_at: lastItem.created_at, id: lastItem.id })
      : null

  const buildUrl = (params: Record<string, string | undefined>) => {
    const parts: string[] = []
    if (params.status) parts.push(`status=${params.status}`)
    if (params.cursor) parts.push(`cursor=${encodeURIComponent(params.cursor)}`)
    return `/leads${parts.length ? `?${parts.join('&')}` : ''}`
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 className="topbar-title">Leads</h1>
        <Link href="/leads/new" className="btn btn-primary">
          <IconPlus size={14} stroke={1.5} aria-hidden />
          Novo lead
        </Link>
      </div>

      {/* Status filter chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <Link
          href="/leads"
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

      {/* Error */}
      {error && (
        <div className="card" style={{ borderLeft: '3px solid var(--color-danger)', marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: '#C44040' }}>Erro ao carregar leads: {error.message}</p>
        </div>
      )}

      {/* Table */}
      {page.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--color-gray-400)' }}>Nenhum lead encontrado.</p>
          <Link
            href="/leads/new"
            style={{ marginTop: 16, display: 'inline-block', fontSize: 13, color: 'var(--color-primary)' }}
          >
            Criar primeiro lead
          </Link>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Contato</th>
                <th>Status</th>
                <th>Score</th>
                <th>Valor (R$)</th>
              </tr>
            </thead>
            <tbody>
              {page.map((lead) => {
                const contact = Array.isArray(lead.contacts)
                  ? lead.contacts[0]
                  : lead.contacts
                const contactName = contact
                  ? [contact.first_name, contact.last_name].filter(Boolean).join(' ')
                  : '—'

                return (
                  <tr key={lead.id}>
                    <td style={{ fontWeight: 600 }}>
                      <Link href={`/leads/${lead.id}`} style={{ color: 'var(--color-gray-800)', textDecoration: 'none' }}>
                        {lead.title}
                      </Link>
                    </td>
                    <td style={{ color: 'var(--color-gray-600)' }}>{contactName}</td>
                    <td>
                      <span className={STATUS_BADGE[lead.status] ?? 'badge badge-sq badge-gray'}>
                        {STATUS_LABEL[lead.status] ?? lead.status}
                      </span>
                    </td>
                    <td>
                      <LeadScoreBadge score={lead.score ?? 0} />
                    </td>
                    <td style={{ color: 'var(--color-gray-600)' }}>
                      {lead.value != null
                        ? Number(lead.value).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })
                        : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Cursor pagination */}
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
