import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LeadScoreBadge from '@/components/crm/leads/LeadScoreBadge'

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

const STATUS_COLOR: Record<string, string> = {
  novo: 'bg-blue-100 text-blue-700',
  contatado: 'bg-indigo-100 text-indigo-700',
  qualificado: 'bg-purple-100 text-purple-700',
  proposta: 'bg-yellow-100 text-yellow-700',
  negociacao: 'bg-orange-100 text-orange-700',
  ganho: 'bg-green-100 text-green-700',
  perdido: 'bg-gray-100 text-gray-500',
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
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Leads</h1>
        <Link
          href="/leads/new"
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm
                     font-semibold text-white hover:bg-red-700 transition-colors"
        >
          + Novo lead
        </Link>
      </div>

      {/* Filtros de status */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Link
          href="/leads"
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors
            ${!activeStatus
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        >
          Todos
        </Link>
        {ALL_STATUSES.map((s) => (
          <Link
            key={s}
            href={buildUrl({ status: s })}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors
              ${activeStatus === s
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {STATUS_LABEL[s]}
          </Link>
        ))}
      </div>

      {/* Erro */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 mb-4">
          <p className="text-sm text-red-700">Erro ao carregar leads: {error.message}</p>
        </div>
      )}

      {/* Tabela */}
      {page.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center">
          <p className="text-gray-400 text-sm">Nenhum lead encontrado.</p>
          <Link
            href="/leads/new"
            className="mt-4 inline-block text-sm text-red-600 hover:underline"
          >
            Criar primeiro lead
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Título
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Valor (R$)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {page.map((lead) => {
                const contact = Array.isArray(lead.contacts)
                  ? lead.contacts[0]
                  : lead.contacts
                const contactName = contact
                  ? [contact.first_name, contact.last_name].filter(Boolean).join(' ')
                  : '—'

                return (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <Link href={`/leads/${lead.id}`} className="hover:text-red-600 hover:underline">
                        {lead.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{contactName}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                          ${STATUS_COLOR[lead.status] ?? 'bg-gray-100 text-gray-500'}`}
                      >
                        {STATUS_LABEL[lead.status] ?? lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <LeadScoreBadge score={lead.score ?? 0} />
                    </td>
                    <td className="px-6 py-4 text-gray-600">
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

          {/* Paginação cursor-based */}
          {(cursor || hasMore) && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              {cursor ? (
                <Link
                  href={buildUrl({ status: activeStatus })}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  ← Primeira página
                </Link>
              ) : (
                <span />
              )}
              {nextCursor && (
                <Link
                  href={buildUrl({ status: activeStatus, cursor: nextCursor })}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
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
