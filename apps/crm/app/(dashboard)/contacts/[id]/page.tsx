import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import EnrichButton from '@/components/crm/contacts/EnrichButton'
import ActivityTimelineSection from '@/components/crm/leads/ActivityTimelineSection'

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

const CHANNEL_LABEL: Record<string, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  telefone: 'Telefone',
}

const LEAD_STATUS_LABEL: Record<string, string> = {
  novo: 'Novo',
  contatado: 'Contatado',
  qualificado: 'Qualificado',
  proposta: 'Proposta',
  negociacao: 'Negociação',
  ganho: 'Ganho',
  perdido: 'Perdido',
}

function CompanyDetails({ details: d }: { details: Record<string, string | number | null> }) {
  const fields: Array<{ key: string; label: string; format?: 'currency' | 'volume' }> = [
    { key: 'cnpj', label: 'CNPJ' },
    { key: 'razao_social', label: 'Razao social' },
    { key: 'responsible_name', label: 'Responsavel' },
    { key: 'responsible_whatsapp', label: 'WhatsApp responsavel' },
    { key: 'payment_terms', label: 'Prazo de pagamento' },
    { key: 'credit_limit', label: 'Limite de credito', format: 'currency' },
    { key: 'annual_volume_liters', label: 'Volume anual', format: 'volume' },
    { key: 'region', label: 'Regiao' },
  ]

  const visible = fields.filter((f) => d[f.key] != null && d[f.key] !== '')
  if (visible.length === 0) return null

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">Dados da empresa</h3>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
        {visible.map((f) => {
          let display: string
          if (f.format === 'currency') {
            display = Number(d[f.key]).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
          } else if (f.format === 'volume') {
            display = `${Number(d[f.key]).toLocaleString('pt-BR')} L`
          } else {
            display = String(d[f.key])
          }
          return (
            <div key={f.key}>
              <dt className="text-xs text-gray-500">{f.label}</dt>
              <dd className="mt-0.5 text-sm font-medium text-gray-900">{display}</dd>
            </div>
          )
        })}
      </dl>
    </div>
  )
}

interface ContactPageProps {
  params: Promise<{ id: string }>
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: contact } = await supabase
    .from('contacts')
    .select(
      'id, first_name, last_name, job_title, whatsapp_number, instagram_handle, phone, preferred_channel, classification, status, source, territory, tags, notes, enriched_at, entity_type, details, created_by, account_id, created_at'
    )
    .eq('id', id)
    .single()

  if (!contact) notFound()

  // Fetch leads for this contact
  const { data: leadsRows } = await supabase
    .from('leads')
    .select('id, title, status, score, value, created_at')
    .eq('contact_id', id)
    .order('created_at', { ascending: false })

  const leads = leadsRows ?? []

  // Fetch activity timeline
  const { data: activitiesRows } = await supabase
    .from('activities')
    .select(
      'id, type, subject, body, outcome, created_at, performed_by, performed_by_robot, users(first_name, last_name)'
    )
    .eq('contact_id', id)
    .order('created_at', { ascending: false })
    .limit(30)

  const activities = (activitiesRows ?? []).map((a) => ({
    id: a.id,
    type: a.type,
    subject: a.subject,
    body: a.body,
    outcome: a.outcome,
    created_at: a.created_at,
    performed_by: a.performed_by,
    performed_by_robot: a.performed_by_robot,
    users: Array.isArray(a.users) ? a.users[0] ?? null : a.users ?? null,
  }))

  // Fetch current user name for ActivityForm
  const { data: currentUserRow } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single()
  const currentUserName = currentUserRow?.name ?? 'Usuário'

  // Fetch creator info
  let creatorLabel: string | null = null
  if (contact.created_by) {
    const { data: creator } = await supabase
      .from('users')
      .select('name, role')
      .eq('id', contact.created_by)
      .single()
    if (creator) {
      creatorLabel = creator.role === 'sdr'
        ? `SDR ${creator.name}`
        : creator.name
    }
  }

  // Fetch associated company contact if account_id exists
  let accountName: string | null = null
  let accountId: string | null = null
  if (contact.account_id) {
    const { data: acct } = await supabase
      .from('contacts')
      .select('id, first_name')
      .eq('id', contact.account_id)
      .eq('entity_type', 'company')
      .single()
    if (acct) {
      accountName = acct.first_name
      accountId = acct.id
    }
  }

  const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(' ')

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/contacts" className="text-sm text-gray-500 hover:text-gray-700">
          &larr; Contatos
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-semibold text-gray-900 truncate">{fullName}</h1>
      </div>

      <div className="space-y-6">
        {/* Contact info card */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{fullName}</h2>
              {contact.job_title && (
                <p className="text-sm text-gray-500 mt-0.5">{contact.job_title}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                  ${STATUS_COLOR[contact.status] ?? 'bg-gray-100 text-gray-500'}`}
              >
                {STATUS_LABEL[contact.status] ?? contact.status}
              </span>
              <EnrichButton contactId={contact.id} enrichedAt={contact.enriched_at} />
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
            {contact.whatsapp_number && (
              <div>
                <dt className="text-xs text-gray-500">WhatsApp</dt>
                <dd className="mt-0.5 text-sm font-medium text-gray-900">
                  {contact.whatsapp_number}
                </dd>
              </div>
            )}
            {contact.instagram_handle && (
              <div>
                <dt className="text-xs text-gray-500">Instagram</dt>
                <dd className="mt-0.5 text-sm font-medium text-gray-900">
                  {contact.instagram_handle}
                </dd>
              </div>
            )}
            {contact.phone && (
              <div>
                <dt className="text-xs text-gray-500">Telefone</dt>
                <dd className="mt-0.5 text-sm font-medium text-gray-900">{contact.phone}</dd>
              </div>
            )}
            {contact.preferred_channel && (
              <div>
                <dt className="text-xs text-gray-500">Canal preferido</dt>
                <dd className="mt-0.5 text-sm font-medium text-gray-900">
                  {CHANNEL_LABEL[contact.preferred_channel] ?? contact.preferred_channel}
                </dd>
              </div>
            )}
            {contact.classification && (
              <div>
                <dt className="text-xs text-gray-500">Tipo</dt>
                <dd className="mt-0.5 text-sm font-medium text-gray-900">
                  {TYPE_LABEL[contact.classification] ?? contact.classification}
                </dd>
              </div>
            )}
            {contact.territory && (
              <div>
                <dt className="text-xs text-gray-500">Território</dt>
                <dd className="mt-0.5 text-sm font-medium text-gray-900">
                  {contact.territory}
                </dd>
              </div>
            )}
            {contact.source && (
              <div>
                <dt className="text-xs text-gray-500">Origem</dt>
                <dd className="mt-0.5 text-sm text-gray-700 capitalize">{contact.source}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs text-gray-500">Criado em</dt>
              <dd className="mt-0.5 text-sm text-gray-700">
                {new Date(contact.created_at).toLocaleDateString('pt-BR')}
              </dd>
            </div>
            {creatorLabel && (
              <div>
                <dt className="text-xs text-gray-500">Criado por</dt>
                <dd className="mt-0.5 text-sm text-gray-700">{creatorLabel}</dd>
              </div>
            )}
          </dl>

          {contact.notes && (
            <div className="mt-5 pt-4 border-t border-gray-100">
              <dt className="text-xs text-gray-500 mb-1">Notas</dt>
              <dd className="text-sm text-gray-700 whitespace-pre-wrap">{contact.notes}</dd>
            </div>
          )}
        </div>

        {/* Company details */}
        {contact.entity_type === 'company' && contact.details != null && (
          <CompanyDetails details={contact.details as Record<string, string | number | null>} />
        )}

        {/* Associated company */}
        {accountName && accountId && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Empresa associada</h3>
            <Link
              href={`/contacts/${accountId}`}
              className="text-sm text-red-600 hover:underline font-medium"
            >
              {accountName}
            </Link>
          </div>
        )}

        {/* Leads */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Leads ({leads.length})
          </h3>
          {leads.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhum lead associado.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {leads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between py-3 gap-4">
                  <div className="min-w-0">
                    <Link
                      href={`/leads/${lead.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-red-600 truncate block"
                    >
                      {lead.title}
                    </Link>
                    <span className="text-xs text-gray-500">
                      {LEAD_STATUS_LABEL[lead.status] ?? lead.status}
                      {lead.value != null &&
                        ` \u2014 ${Number(lead.value).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}`}
                    </span>
                  </div>
                  {lead.score != null && lead.score > 0 && (
                    <span className="text-xs font-semibold text-green-700 bg-green-50 rounded-full px-2 py-0.5">
                      {lead.score} pts
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity timeline + form */}
        <ActivityTimelineSection
          activities={activities}
          contactId={id}
          currentUserId={user.id}
          currentUserName={currentUserName}
        />
      </div>
    </div>
  )
}
