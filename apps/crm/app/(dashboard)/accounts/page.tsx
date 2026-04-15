import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const TYPE_LABEL: Record<string, string> = {
  distribuidor: 'Distribuidor',
  empreiteiro: 'Empreiteiro',
  construtora: 'Construtora',
  pintor_autonomo: 'Pintor Autônomo',
  loja_materiais: 'Loja de Materiais',
}

const PAGE_SIZE = 25

interface CursorData {
  created_at: string
  id: string
}

interface AccountsPageProps {
  searchParams: Promise<{ cursor?: string }>
}

export default async function AccountsPage({ searchParams }: AccountsPageProps) {
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
    .from('accounts')
    .select('id, name, type, city, state, territory, payment_terms, credit_limit, created_at')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(PAGE_SIZE + 1)

  if (parsedCursor) {
    query = query.or(
      `created_at.lt.${parsedCursor.created_at},and(created_at.eq.${parsedCursor.created_at},id.lt.${parsedCursor.id})`
    )
  }

  const { data: rows, error } = await query

  const accounts = rows ?? []
  const hasMore = accounts.length > PAGE_SIZE
  const page = hasMore ? accounts.slice(0, PAGE_SIZE) : accounts
  const lastItem = page[page.length - 1]
  const nextCursor =
    hasMore && lastItem
      ? JSON.stringify({ created_at: lastItem.created_at, id: lastItem.id })
      : null

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Contas</h1>
        <Link
          href="/accounts/new"
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm
                     font-semibold text-white hover:bg-red-700 transition-colors"
        >
          + Nova conta
        </Link>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 mb-4">
          <p className="text-sm text-red-700">Erro ao carregar contas: {error.message}</p>
        </div>
      )}

      {page.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center">
          <p className="text-gray-400 text-sm">Nenhuma conta encontrada.</p>
          <Link
            href="/accounts/new"
            className="mt-4 inline-block text-sm text-red-600 hover:underline"
          >
            Criar primeira conta
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
                  Tipo
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Localização
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Pagamento
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Crédito
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {page.map((account) => {
                const location = [account.city, account.state].filter(Boolean).join(' — ')
                return (
                  <tr key={account.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <Link
                        href={`/accounts/${account.id}`}
                        className="font-medium text-gray-900 hover:text-red-600 transition-colors"
                      >
                        {account.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {TYPE_LABEL[account.type] ?? account.type}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {location || account.territory || '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {account.payment_terms ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {account.credit_limit != null
                        ? new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            maximumFractionDigits: 0,
                          }).format(Number(account.credit_limit))
                        : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          {(cursor || hasMore) && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
              {cursor ? (
                <Link href="/accounts" className="text-sm text-gray-600 hover:text-gray-900">
                  ← Primeira página
                </Link>
              ) : (
                <span />
              )}
              {nextCursor && (
                <Link
                  href={`/accounts?cursor=${encodeURIComponent(nextCursor)}`}
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
