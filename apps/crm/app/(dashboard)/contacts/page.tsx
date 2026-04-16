import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ContactSearch from '@/components/crm/contacts/ContactSearch'

const STATUS_LABEL: Record<string, string> = {
  lead: 'Lead',
  prospecto: 'Prospecto',
  cliente: 'Cliente',
  inativo: 'Inativo',
}

const STATUS_COLOR: Record<string, string> = {
  lead: 'bg-blue-100 text-blue-700',
  prospecto: 'bg-yellow-100 text-yellow-700',
  cliente: 'bg-green-100 text-green-700',
  inativo: 'bg-gray-100 text-gray-500',
}

const TYPE_LABEL: Record<string, string> = {
  pintor_autonomo: 'Pintor Autônomo',
  empreiteiro: 'Empreiteiro',
  engenheiro: 'Engenheiro',
  arquiteto: 'Arquiteto',
  distribuidor: 'Distribuidor',
  construtora: 'Construtora',
  loja_materiais: 'Loja de Materiais',
}

const ENTITY_LABEL: Record<string, string> = {
  individual: 'Pessoa',
  company: 'Empresa',
}

const PAGE_SIZE = 25

interface CursorData {
  created_at: string
  id: string
}

interface ContactsPageProps {
  searchParams: Promise<{ cursor?: string; q?: string }>
}

export default async function ContactsPage({ searchParams }: ContactsPageProps) {
  const supabase = await createClient()
  const { cursor, q } = await searchParams
  const searchQuery = q?.trim() ?? ''

  let parsedCursor: CursorData | null = null
  if (cursor) {
    try {
      parsedCursor = JSON.parse(decodeURIComponent(cursor)) as CursorData
    } catch {
      // invalid cursor — ignore
    }
  }

  let query = supabase
    .from('contacts')
    .select('id, first_name, last_name, whatsapp_number, instagram_handle, preferred_channel, classification, status, territory, entity_type, created_at')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(PAGE_SIZE + 1)

  // Full-text search or ilike fallback
  if (searchQuery) {
    query = query.or(
      `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`
    )
  }

  if (parsedCursor) {
    query = query.or(
      `created_at.lt.${parsedCursor.created_at},and(created_at.eq.${parsedCursor.created_at},id.lt.${parsedCursor.id})`
    )
  }

  const { data: rows, error } = await query

  const contacts = rows ?? []
  const hasMore = contacts.length > PAGE_SIZE
  const page = hasMore ? contacts.slice(0, PAGE_SIZE) : contacts
  const lastItem = page[page.length - 1]
  const nextCursor =
    hasMore && lastItem
      ? JSON.stringify({ created_at: lastItem.created_at, id: lastItem.id })
      : null

  const buildHref = (params: Record<string, string | null>) => {
    const sp = new URLSearchParams()
    if (searchQuery && params.cursor !== undefined) sp.set('q', searchQuery)
    if (params.q) sp.set('q', params.q)
    if (params.cursor) sp.set('cursor', params.cursor)
    const qs = sp.toString()
    return `/contacts${qs ? `?${qs}` : ''}`
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Contatos</h1>
        <Link
          href="/contacts/novo"
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm
                     font-semibold text-white hover:bg-red-700 transition-colors"
        >
          + Novo contato
        </Link>
      </div>

      {/* Search */}
      <div className="mb-4">
        <ContactSearch defaultValue={searchQuery} />
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 mb-4">
          <p className="text-sm text-red-700">Erro ao carregar contatos: {error.message}</p>
        </div>
      )}

      {/* Table */}
      {page.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center">
          <p className="text-gray-400 text-sm">
            {searchQuery ? 'Nenhum contato encontrado para a busca.' : 'Nenhum contato encontrado.'}
          </p>
          {!searchQuery && (
            <Link
              href="/contacts/novo"
              className="mt-4 inline-block text-sm text-red-600 hover:underline"
            >
              Criar primeiro contato
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Canal
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Território
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {page.map((contact) => {
                const fullName = [contact.first_name, contact.last_name]
                  .filter(Boolean)
                  .join(' ')

                const channelDisplay = contact.whatsapp_number
                  ? `WhatsApp ${contact.whatsapp_number}`
                  : contact.instagram_handle
                  ? `Instagram ${contact.instagram_handle}`
                  : '\u2014'

                return (
                  <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <Link
                        href={`/contacts/${contact.id}`}
                        className="hover:text-red-600 transition-colors"
                      >
                        {fullName}
                      </Link>
                      {contact.entity_type === 'company' && (
                        <span className="ml-2 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-purple-100 text-purple-700">
                          Empresa
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{channelDisplay}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {contact.classification ? TYPE_LABEL[contact.classification] ?? contact.classification : '\u2014'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                          ${STATUS_COLOR[contact.status] ?? 'bg-gray-100 text-gray-500'}`}
                      >
                        {STATUS_LABEL[contact.status] ?? contact.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {contact.territory ?? '\u2014'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {(cursor || hasMore) && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              {cursor ? (
                <Link
                  href={buildHref({ cursor: null })}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  &larr; Primeira página
                </Link>
              ) : (
                <span />
              )}

              {nextCursor && (
                <Link
                  href={buildHref({ cursor: encodeURIComponent(nextCursor) })}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Próxima página &rarr;
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
