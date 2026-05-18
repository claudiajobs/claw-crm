import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ContactSearch from '@/components/crm/contacts/ContactSearch'
import { IconPlus } from '@tabler/icons-react'

const STATUS_LABEL: Record<string, string> = {
  lead: 'Lead',
  prospecto: 'Prospecto',
  cliente: 'Cliente',
  inativo: 'Inativo',
}

const STATUS_BADGE: Record<string, string> = {
  lead:      'badge badge-sq badge-blue',
  prospecto: 'badge badge-sq badge-amber',
  cliente:   'badge badge-sq badge-teal',
  inativo:   'badge badge-sq badge-gray',
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h1 className="topbar-title">Contatos</h1>
        <Link href="/contacts/novo" className="btn btn-primary">
          <IconPlus size={14} stroke={1.5} aria-hidden />
          Novo contato
        </Link>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <ContactSearch defaultValue={searchQuery} />
      </div>

      {/* Error */}
      {error && (
        <div className="card" style={{ borderLeft: '3px solid var(--color-danger)', marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: '#C44040' }}>Erro ao carregar contatos: {error.message}</p>
        </div>
      )}

      {/* Table */}
      {page.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--color-gray-400)' }}>
            {searchQuery ? 'Nenhum contato encontrado para a busca.' : 'Nenhum contato encontrado.'}
          </p>
          {!searchQuery && (
            <Link
              href="/contacts/novo"
              style={{ marginTop: 16, display: 'inline-block', fontSize: 13, color: 'var(--color-primary)' }}
            >
              Criar primeiro contato
            </Link>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Canal</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Território</th>
              </tr>
            </thead>
            <tbody>
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
                  <tr key={contact.id}>
                    <td style={{ fontWeight: 600 }}>
                      <Link
                        href={`/contacts/${contact.id}`}
                        style={{ color: 'var(--color-gray-800)', textDecoration: 'none' }}
                      >
                        {fullName}
                      </Link>
                      {contact.entity_type === 'company' && (
                        <span className="badge badge-sq badge-purple" style={{ marginLeft: 8, fontSize: 9 }}>
                          Empresa
                        </span>
                      )}
                    </td>
                    <td style={{ color: 'var(--color-gray-600)' }}>{channelDisplay}</td>
                    <td style={{ color: 'var(--color-gray-600)' }}>
                      {contact.classification ? TYPE_LABEL[contact.classification] ?? contact.classification : '\u2014'}
                    </td>
                    <td>
                      <span className={STATUS_BADGE[contact.status] ?? 'badge badge-sq badge-gray'}>
                        {STATUS_LABEL[contact.status] ?? contact.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--color-gray-400)' }}>
                      {contact.territory ?? '\u2014'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {(cursor || hasMore) && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderTop: '0.5px solid var(--color-gray-100)' }}>
              {cursor ? (
                <Link
                  href={buildHref({ cursor: null })}
                  style={{ fontSize: 12, color: 'var(--color-gray-600)', textDecoration: 'none' }}
                >
                  &larr; Primeira página
                </Link>
              ) : (
                <span />
              )}

              {nextCursor && (
                <Link
                  href={buildHref({ cursor: encodeURIComponent(nextCursor) })}
                  style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}
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
