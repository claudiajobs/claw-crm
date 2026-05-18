import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import EnrichButton from '@/components/crm/contacts/EnrichButton'
import ActivityTimelineSection from '@/components/crm/leads/ActivityTimelineSection'
import TaskSection from '@/components/crm/tasks/TaskSection'
import { IconArrowLeft } from '@tabler/icons-react'

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
    <div className="card">
      <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-gray-800)', marginBottom: 12 }}>Dados da empresa</h3>
      <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px 24px' }}>
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
              <dt style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{f.label}</dt>
              <dd style={{ marginTop: 2, fontSize: 13, fontWeight: 600, color: 'var(--color-gray-800)' }}>{display}</dd>
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

  const { data: leadsRows } = await supabase
    .from('leads')
    .select('id, title, status, score, value, created_at')
    .eq('contact_id', id)
    .order('created_at', { ascending: false })

  const leads = leadsRows ?? []

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

  const { data: taskRows } = await supabase
    .from('tasks')
    .select('id, title, due_at, priority, status')
    .eq('contact_id', id)
    .eq('assigned_to', user.id)
    .in('status', ['pendente'])
    .order('due_at', { ascending: true, nullsFirst: false })

  const tasks = (taskRows ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    due_at: t.due_at,
    priority: t.priority,
    status: t.status,
  }))

  const { data: currentUserRow } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single()
  const currentUserName = currentUserRow?.name ?? 'Usuário'

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

  // Avatar initials
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Link href="/contacts" style={{ fontSize: 12, color: 'var(--color-gray-400)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <IconArrowLeft size={14} stroke={1.5} aria-hidden />
          Contatos
        </Link>
        <span style={{ color: 'var(--color-gray-200)' }}>/</span>
        <h1 className="topbar-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fullName}</h1>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Contact info card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="avatar avatar-lg avatar-purple">{initials}</div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-gray-800)' }}>{fullName}</h2>
                {contact.job_title && (
                  <p style={{ fontSize: 12, color: 'var(--color-gray-400)', marginTop: 2 }}>{contact.job_title}</p>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className={STATUS_BADGE[contact.status] ?? 'badge badge-sq badge-gray'}>
                {STATUS_LABEL[contact.status] ?? contact.status}
              </span>
              <EnrichButton contactId={contact.id} enrichedAt={contact.enriched_at} />
            </div>
          </div>

          <dl style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px 24px' }}>
            {contact.whatsapp_number && (
              <div>
                <dt style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>WhatsApp</dt>
                <dd style={{ marginTop: 2, fontSize: 13, fontWeight: 600, color: 'var(--color-gray-800)' }}>
                  {contact.whatsapp_number}
                </dd>
              </div>
            )}
            {contact.instagram_handle && (
              <div>
                <dt style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Instagram</dt>
                <dd style={{ marginTop: 2, fontSize: 13, fontWeight: 600, color: 'var(--color-gray-800)' }}>
                  {contact.instagram_handle}
                </dd>
              </div>
            )}
            {contact.phone && (
              <div>
                <dt style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Telefone</dt>
                <dd style={{ marginTop: 2, fontSize: 13, fontWeight: 600, color: 'var(--color-gray-800)' }}>{contact.phone}</dd>
              </div>
            )}
            {contact.preferred_channel && (
              <div>
                <dt style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Canal preferido</dt>
                <dd style={{ marginTop: 2, fontSize: 13, fontWeight: 600, color: 'var(--color-gray-800)' }}>
                  {CHANNEL_LABEL[contact.preferred_channel] ?? contact.preferred_channel}
                </dd>
              </div>
            )}
            {contact.classification && (
              <div>
                <dt style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Tipo</dt>
                <dd style={{ marginTop: 2, fontSize: 13, fontWeight: 600, color: 'var(--color-gray-800)' }}>
                  {TYPE_LABEL[contact.classification] ?? contact.classification}
                </dd>
              </div>
            )}
            {contact.territory && (
              <div>
                <dt style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Território</dt>
                <dd style={{ marginTop: 2, fontSize: 13, fontWeight: 600, color: 'var(--color-gray-800)' }}>
                  {contact.territory}
                </dd>
              </div>
            )}
            {contact.source && (
              <div>
                <dt style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Origem</dt>
                <dd style={{ marginTop: 2, fontSize: 13, color: 'var(--color-gray-600)', textTransform: 'capitalize' }}>{contact.source}</dd>
              </div>
            )}
            <div>
              <dt style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Criado em</dt>
              <dd style={{ marginTop: 2, fontSize: 13, color: 'var(--color-gray-600)' }}>
                {new Date(contact.created_at).toLocaleDateString('pt-BR')}
              </dd>
            </div>
            {creatorLabel && (
              <div>
                <dt style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Criado por</dt>
                <dd style={{ marginTop: 2, fontSize: 13, color: 'var(--color-gray-600)' }}>{creatorLabel}</dd>
              </div>
            )}
          </dl>

          {contact.notes && (
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '0.5px solid var(--color-gray-100)' }}>
              <dt style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Notas</dt>
              <dd style={{ fontSize: 13, color: 'var(--color-gray-600)', whiteSpace: 'pre-wrap' }}>{contact.notes}</dd>
            </div>
          )}
        </div>

        {/* Company details */}
        {contact.entity_type === 'company' && contact.details != null && (
          <CompanyDetails details={contact.details as Record<string, string | number | null>} />
        )}

        {/* Associated company */}
        {accountName && accountId && (
          <div className="card">
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-gray-800)', marginBottom: 8 }}>Empresa associada</h3>
            <Link
              href={`/contacts/${accountId}`}
              style={{ fontSize: 13, color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}
            >
              {accountName}
            </Link>
          </div>
        )}

        {/* Leads */}
        <div className="card">
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-gray-800)', marginBottom: 12 }}>
            Leads ({leads.length})
          </h3>
          {leads.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--color-gray-400)' }}>Nenhum lead associado.</p>
          ) : (
            <div>
              {leads.map((lead, idx) => (
                <div key={lead.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', gap: 16, borderBottom: idx < leads.length - 1 ? '0.5px solid var(--color-gray-100)' : 'none' }}>
                  <div style={{ minWidth: 0 }}>
                    <Link
                      href={`/leads/${lead.id}`}
                      style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-gray-800)', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {lead.title}
                    </Link>
                    <span style={{ fontSize: 11, color: 'var(--color-gray-400)' }}>
                      {LEAD_STATUS_LABEL[lead.status] ?? lead.status}
                      {lead.value != null &&
                        ` \u2014 ${Number(lead.value).toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}`}
                    </span>
                  </div>
                  {lead.score != null && lead.score > 0 && (
                    <span className="badge badge-teal">
                      {lead.score} pts
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tasks */}
        <TaskSection
          tasks={tasks}
          entityType="contact"
          entityId={id}
          revalidatePath={`/contacts/${id}`}
        />

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
