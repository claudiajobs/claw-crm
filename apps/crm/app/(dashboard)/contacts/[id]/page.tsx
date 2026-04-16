import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import EnrichButton from '@/components/crm/contacts/EnrichButton'

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

const ACTIVITY_TYPE_LABEL: Record<string, string> = {
  nota: 'Nota',
  ligacao: 'Ligação',
  reuniao: 'Reunião',
  tarefa: 'Tarefa',
  instagram_dm_enviado: 'DM Instagram enviado',
  instagram_dm_recebido: 'DM Instagram recebido',
  whatsapp_enviado: 'WhatsApp enviado',
  whatsapp_recebido: 'WhatsApp recebido',
  acao_sdr: 'Ação SDR',
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
      'id, first_name, last_name, job_title, whatsapp_number, instagram_handle, phone, preferred_channel, type, status, source, territory, tags, notes, enriched_at, entity_type, details, created_by, account_id, created_at'
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
      'id, type, subject, body, outcome, created_at, performed_by_robot, users(first_name, last_name)'
    )
    .eq('contact_id', id)
    .order('created_at', { ascending: false })
    .limit(30)

  const activities = (activitiesRows ?? []).map((a) => ({
    ...a,
    users: Array.isArray(a.users) ? a.users[0] ?? null : a.users ?? null,
  }))

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
            {contact.type && (
              <div>
                <dt className="text-xs text-gray-500">Tipo</dt>
                <dd className="mt-0.5 text-sm font-medium text-gray-900">
                  {TYPE_LABEL[contact.type] ?? contact.type}
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
          </dl>

          {contact.notes && (
            <div className="mt-5 pt-4 border-t border-gray-100">
              <dt className="text-xs text-gray-500 mb-1">Notas</dt>
              <dd className="text-sm text-gray-700 whitespace-pre-wrap">{contact.notes}</dd>
            </div>
          )}
        </div>

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

        {/* Activity timeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Atividades</h3>
          {activities.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhuma atividade registrada.</p>
          ) : (
            <div className="space-y-4">
              {activities.map((activity) => {
                const performer = activity.performed_by_robot
                  ? `Robot ${activity.performed_by_robot.slice(0, 8)}`
                  : activity.users
                  ? [activity.users.first_name, activity.users.last_name].filter(Boolean).join(' ')
                  : 'Sistema'

                return (
                  <div key={activity.id} className="flex gap-3">
                    <div className="w-1.5 rounded-full bg-gray-200 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="font-medium text-gray-700">
                          {ACTIVITY_TYPE_LABEL[activity.type] ?? activity.type}
                        </span>
                        <span>&middot;</span>
                        <span>{performer}</span>
                        <span>&middot;</span>
                        <span>
                          {new Date(activity.created_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {activity.subject && (
                        <p className="text-sm text-gray-900 mt-0.5">{activity.subject}</p>
                      )}
                      {activity.body && (
                        <p className="text-sm text-gray-600 mt-0.5 line-clamp-3">
                          {activity.body}
                        </p>
                      )}
                      {activity.outcome && (
                        <p className="text-xs text-gray-500 mt-1">
                          Resultado: {activity.outcome}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
