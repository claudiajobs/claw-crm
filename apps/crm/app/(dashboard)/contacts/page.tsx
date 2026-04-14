import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

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
}

const PAGE_SIZE = 25

interface CursorData {
  created_at: string
  id: string
}

interface ContactsPageProps {
  searchParams: Promise<{ cursor?: string }>
}

export default async function ContactsPage({ searchParams }: ContactsPageProps) {
  const supabase = await createClient()
  const { cursor } = await searchParams

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
    .select('id, first_name, last_name, whatsapp_number, instagram_handle, preferred_channel, type, status, territory, created_at')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(PAGE_SIZE + 1)

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

  return (
    <div>
      {/* Cabeçalho da página */}
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

      {/* Erro de carregamento */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 mb-4">
          <p className="text-sm text-red-700">Erro ao carregar contatos: {error.message}</p>
        </div>
      )}

      {/* Tabela */}
      {page.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center">
          <p className="text-gray-400 text-sm">Nenhum contato encontrado.</p>
          <Link
            href="/contacts/novo"
            className="mt-4 inline-block text-sm text-red-600 hover:underline"
          >
            Criar primeiro contato
          </Link>
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
                  ? `💬 ${contact.whatsapp_number}`
                  : contact.instagram_handle
                  ? `📸 ${contact.instagram_handle}`
                  : '—'

                return (
                  <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{fullName}</td>
                    <td className="px-6 py-4 text-gray-600">{channelDisplay}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {contact.type ? TYPE_LABEL[contact.type] ?? contact.type : '—'}
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
                      {contact.territory ?? '—'}
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
                  href="/contacts"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  ← Primeira página
                </Link>
              ) : (
                <span />
              )}

              {nextCursor && (
                <Link
                  href={`/contacts?cursor=${encodeURIComponent(nextCursor)}`}
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
