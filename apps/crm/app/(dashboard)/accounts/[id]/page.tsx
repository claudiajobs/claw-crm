import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

const TYPE_LABEL: Record<string, string> = {
  distribuidor: 'Distribuidor',
  empreiteiro: 'Empreiteiro',
  construtora: 'Construtora',
  pintor_autonomo: 'Pintor Autônomo',
  loja_materiais: 'Loja de Materiais',
}

const PAYMENT_LABEL: Record<string, string> = {
  avista: 'À Vista',
  '30d': '30 dias',
  '60d': '60 dias',
  '90d': '90 dias',
}

const CONTACT_TYPE_LABEL: Record<string, string> = {
  pintor_autonomo: 'Pintor Autônomo',
  empreiteiro: 'Empreiteiro',
  engenheiro: 'Engenheiro',
  arquiteto: 'Arquiteto',
  distribuidor: 'Distribuidor',
  construtora: 'Construtora',
}

interface AccountDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function AccountDetailPage({ params }: AccountDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: account, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !account) notFound()

  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, type, status, whatsapp_number, instagram_handle')
    .eq('account_id', id)
    .order('created_at', { ascending: false })
    .limit(20)

  const formatBRL = (val: number | null | undefined) =>
    val != null
      ? new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          maximumFractionDigits: 0,
        }).format(Number(val))
      : '—'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/accounts" className="text-sm text-gray-500 hover:text-gray-700">
          ← Contas
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-semibold text-gray-900">{account.name}</h1>
      </div>

      {/* Info card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
          Informações da conta
        </h2>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <div>
            <dt className="text-gray-500">Tipo</dt>
            <dd className="font-medium text-gray-900 mt-0.5">
              {TYPE_LABEL[account.type] ?? account.type}
            </dd>
          </div>
          {account.phone && (
            <div>
              <dt className="text-gray-500">Telefone</dt>
              <dd className="font-medium text-gray-900 mt-0.5">{account.phone}</dd>
            </div>
          )}
          {(account.city || account.state) && (
            <div>
              <dt className="text-gray-500">Cidade / Estado</dt>
              <dd className="font-medium text-gray-900 mt-0.5">
                {[account.city, account.state].filter(Boolean).join(' — ')}
              </dd>
            </div>
          )}
          {account.territory && (
            <div>
              <dt className="text-gray-500">Território</dt>
              <dd className="font-medium text-gray-900 mt-0.5">{account.territory}</dd>
            </div>
          )}
          {account.region && (
            <div>
              <dt className="text-gray-500">Região</dt>
              <dd className="font-medium text-gray-900 mt-0.5">{account.region}</dd>
            </div>
          )}
          {account.payment_terms && (
            <div>
              <dt className="text-gray-500">Condição de pagamento</dt>
              <dd className="font-medium text-gray-900 mt-0.5">
                {PAYMENT_LABEL[account.payment_terms] ?? account.payment_terms}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-gray-500">Limite de crédito</dt>
            <dd className="font-medium text-gray-900 mt-0.5">
              {formatBRL(account.credit_limit)}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Volume anual (L)</dt>
            <dd className="font-medium text-gray-900 mt-0.5">
              {account.annual_volume_liters != null
                ? Number(account.annual_volume_liters).toLocaleString('pt-BR')
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-gray-500">Cadastro</dt>
            <dd className="font-medium text-gray-900 mt-0.5">
              {new Date(account.created_at).toLocaleDateString('pt-BR')}
            </dd>
          </div>
        </dl>
      </div>

      {/* Contacts */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">
            Contatos vinculados ({contacts?.length ?? 0})
          </h2>
          <Link
            href="/contacts/novo"
            className="text-xs text-red-600 hover:text-red-700 font-medium"
          >
            + Novo contato
          </Link>
        </div>

        {!contacts || contacts.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-gray-400">Nenhum contato vinculado a esta conta.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Canal
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {contacts.map((contact) => {
                const fullName = [contact.first_name, contact.last_name]
                  .filter(Boolean)
                  .join(' ')
                const channel = contact.whatsapp_number
                  ? `💬 ${contact.whatsapp_number}`
                  : contact.instagram_handle
                  ? `📸 ${contact.instagram_handle}`
                  : '—'
                return (
                  <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-gray-900">{fullName}</td>
                    <td className="px-6 py-3 text-gray-500">
                      {contact.type ? (CONTACT_TYPE_LABEL[contact.type] ?? contact.type) : '—'}
                    </td>
                    <td className="px-6 py-3 text-gray-500">{channel}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
