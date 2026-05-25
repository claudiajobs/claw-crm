import Link from 'next/link'
import LeadScoreBadge from './LeadScoreBadge'
import LeadOutcome from './LeadOutcome'
import ActivityTimelineSection from './ActivityTimelineSection'
import TaskSection from '@/components/crm/tasks/TaskSection'
import type { TaskItem } from '@/components/crm/tasks/TaskSection'
import type { MatchedRule } from '@/lib/scoring/scoring-engine'
import type { Activity } from './ActivityTimeline'

const STATUS_LABEL: Record<string, string> = {
  novo: 'Novo',
  contatado: 'Contatado',
  qualificado: 'Qualificado',
  proposta: 'Proposta',
  negociacao: 'Negociação',
  ganho: 'Ganho',
  perdido: 'Perdido',
}

const TIMELINE_LABEL: Record<string, string> = {
  imediato: 'Imediato',
  '1-3m': '1 a 3 meses',
  '3-6m': '3 a 6 meses',
  '6m+': 'Mais de 6 meses',
}

interface PedidoSummary {
  id: string
  status: string
  total: number
  created_at: string
}

const PEDIDO_STATUS_LABEL: Record<string, string> = {
  draft: 'Rascunho',
  pending_approval: 'Aguardando aprovação',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  cancelled: 'Cancelado',
}

const PEDIDO_STATUS_BADGE: Record<string, string> = {
  draft: 'badge badge-sq badge-gray',
  pending_approval: 'badge badge-sq badge-amber',
  approved: 'badge badge-sq badge-teal',
  rejected: 'badge badge-sq badge-coral',
  cancelled: 'badge badge-sq badge-gray',
}

interface LeadDetailProps {
  lead: {
    id: string
    title: string
    status: string
    score: number
    value: number | null
    product_interest: string[]
    project_type: string | null
    decision_timeline: string | null
    estimated_volume_liters: number | null
    created_at: string
    created_by_label: string | null
    contact_id: string
    contacts: { first_name: string; last_name: string | null; preferred_channel: string | null } | null
  }
  activities: Activity[]
  matchedRules: MatchedRule[]
  maxScore: number
  currentUserId: string
  currentUserName: string
  tasks: TaskItem[]
  pedidos?: PedidoSummary[]
}

export default function LeadDetail({ lead, activities, matchedRules, maxScore, currentUserId, currentUserName, tasks, pedidos }: LeadDetailProps) {
  const contactName = lead.contacts
    ? [lead.contacts.first_name, lead.contacts.last_name].filter(Boolean).join(' ')
    : '—'

  const dtStyle = { fontSize: 10, fontWeight: 700 as const, color: 'var(--color-gray-400)', textTransform: 'uppercase' as const, letterSpacing: '0.06em' }
  const ddStyle = { marginTop: 2, fontSize: 13, fontWeight: 600 as const, color: 'var(--color-gray-800)' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-gray-800)' }}>{lead.title}</h2>
            <p style={{ fontSize: 12, color: 'var(--color-gray-400)', marginTop: 2 }}>Contato: {contactName}</p>
          </div>
          <LeadScoreBadge score={lead.score ?? 0} />
        </div>

        <dl style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px 24px' }}>
          <div>
            <dt style={dtStyle}>Status</dt>
            <dd style={ddStyle}>{STATUS_LABEL[lead.status] ?? lead.status}</dd>
          </div>
          {lead.value != null && (
            <div>
              <dt style={dtStyle}>Valor</dt>
              <dd style={ddStyle}>
                {Number(lead.value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </dd>
            </div>
          )}
          {lead.decision_timeline && (
            <div>
              <dt style={dtStyle}>Prazo de decisão</dt>
              <dd style={ddStyle}>{TIMELINE_LABEL[lead.decision_timeline] ?? lead.decision_timeline}</dd>
            </div>
          )}
          {lead.estimated_volume_liters != null && (
            <div>
              <dt style={dtStyle}>Volume estimado</dt>
              <dd style={ddStyle}>{Number(lead.estimated_volume_liters).toLocaleString('pt-BR')} L</dd>
            </div>
          )}
          {lead.project_type && (
            <div>
              <dt style={dtStyle}>Tipo de projeto</dt>
              <dd style={{ ...ddStyle, textTransform: 'capitalize' }}>{lead.project_type}</dd>
            </div>
          )}
          {lead.product_interest?.length > 0 && (
            <div>
              <dt style={dtStyle}>Interesse em produto</dt>
              <dd style={ddStyle}>{lead.product_interest.join(', ')}</dd>
            </div>
          )}
          <div>
            <dt style={dtStyle}>Criado em</dt>
            <dd style={{ marginTop: 2, fontSize: 13, color: 'var(--color-gray-600)' }}>
              {new Date(lead.created_at).toLocaleDateString('pt-BR')}
            </dd>
          </div>
          {lead.created_by_label && (
            <div>
              <dt style={dtStyle}>Criado por</dt>
              <dd style={{ marginTop: 2, fontSize: 13, color: 'var(--color-gray-600)' }}>{lead.created_by_label}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Score breakdown */}
      <div className="card">
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-gray-800)', marginBottom: 12 }}>
          Score breakdown — {lead.score ?? 0}/{maxScore} pts
        </h3>
        {matchedRules.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--color-gray-400)' }}>Nenhuma regra ativa para este lead.</p>
        ) : (
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, listStyle: 'none' }}>
            {matchedRules.map((rule) => (
              <li key={rule.id} className="flex items-center gap-3 justify-between min-w-0" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="min-w-0 truncate" style={{ fontSize: 13, color: 'var(--color-gray-600)' }}>{rule.description}</span>
                <span className="badge badge-teal flex-shrink-0">+{rule.points}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Lead outcome actions — only for open leads */}
      {!['ganho', 'perdido'].includes(lead.status) && (
        <LeadOutcome leadId={lead.id} />
      )}

      {/* Pedidos for this lead */}
      {pedidos && pedidos.length > 0 && (
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-gray-800)' }}>
              Pedidos ({pedidos.length})
            </h3>
            <Link
              href={`/pedidos/new?lead_id=${lead.id}`}
              style={{ fontSize: 12, color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}
            >
              + Novo pedido
            </Link>
          </div>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, listStyle: 'none' }}>
            {pedidos.map((p) => (
              <li key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <Link href={`/pedidos/${p.id}`} style={{ fontSize: 13, color: 'var(--color-primary)', textDecoration: 'none' }}>
                  {new Date(p.created_at).toLocaleDateString('pt-BR')} — {Number(p.total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </Link>
                <span className={PEDIDO_STATUS_BADGE[p.status] ?? 'badge badge-sq badge-gray'}>
                  {PEDIDO_STATUS_LABEL[p.status] ?? p.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tasks */}
      <TaskSection
        tasks={tasks}
        entityType="lead"
        entityId={lead.id}
        revalidatePath={`/leads/${lead.id}`}
      />

      {/* Timeline + Form */}
      <ActivityTimelineSection
        activities={activities}
        contactId={lead.contact_id}
        leadId={lead.id}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
      />
    </div>
  )
}
