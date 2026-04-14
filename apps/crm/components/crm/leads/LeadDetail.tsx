import LeadScoreBadge from './LeadScoreBadge'
import ActivityTimeline from './ActivityTimeline'
import type { MatchedRule } from '@/lib/scoring/scoring-engine'

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

interface Activity {
  id: string
  type: string
  subject: string | null
  body: string | null
  outcome: string | null
  created_at: string
  performed_by_robot: string | null
  users: { first_name: string; last_name: string | null } | null
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
    contacts: { first_name: string; last_name: string | null; preferred_channel: string | null } | null
  }
  activities: Activity[]
  matchedRules: MatchedRule[]
  maxScore: number
}

export default function LeadDetail({ lead, activities, matchedRules, maxScore }: LeadDetailProps) {
  const contactName = lead.contacts
    ? [lead.contacts.first_name, lead.contacts.last_name].filter(Boolean).join(' ')
    : '—'

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{lead.title}</h2>
            <p className="text-sm text-gray-500 mt-0.5">Contato: {contactName}</p>
          </div>
          <LeadScoreBadge score={lead.score ?? 0} />
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-gray-500">Status</dt>
            <dd className="mt-0.5 text-sm font-medium text-gray-900">
              {STATUS_LABEL[lead.status] ?? lead.status}
            </dd>
          </div>
          {lead.value != null && (
            <div>
              <dt className="text-xs text-gray-500">Valor</dt>
              <dd className="mt-0.5 text-sm font-medium text-gray-900">
                {Number(lead.value).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </dd>
            </div>
          )}
          {lead.decision_timeline && (
            <div>
              <dt className="text-xs text-gray-500">Prazo de decisão</dt>
              <dd className="mt-0.5 text-sm font-medium text-gray-900">
                {TIMELINE_LABEL[lead.decision_timeline] ?? lead.decision_timeline}
              </dd>
            </div>
          )}
          {lead.estimated_volume_liters != null && (
            <div>
              <dt className="text-xs text-gray-500">Volume estimado</dt>
              <dd className="mt-0.5 text-sm font-medium text-gray-900">
                {Number(lead.estimated_volume_liters).toLocaleString('pt-BR')} L
              </dd>
            </div>
          )}
          {lead.project_type && (
            <div>
              <dt className="text-xs text-gray-500">Tipo de projeto</dt>
              <dd className="mt-0.5 text-sm font-medium text-gray-900 capitalize">
                {lead.project_type}
              </dd>
            </div>
          )}
          {lead.product_interest?.length > 0 && (
            <div>
              <dt className="text-xs text-gray-500">Interesse em produto</dt>
              <dd className="mt-0.5 text-sm font-medium text-gray-900">
                {lead.product_interest.join(', ')}
              </dd>
            </div>
          )}
          <div>
            <dt className="text-xs text-gray-500">Criado em</dt>
            <dd className="mt-0.5 text-sm text-gray-700">
              {new Date(lead.created_at).toLocaleDateString('pt-BR')}
            </dd>
          </div>
        </dl>
      </div>

      {/* Score breakdown */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Score breakdown — {lead.score ?? 0}/{maxScore} pts
        </h3>
        {matchedRules.length === 0 ? (
          <p className="text-sm text-gray-400">Nenhuma regra ativa para este lead.</p>
        ) : (
          <ul className="space-y-2">
            {matchedRules.map((rule) => (
              <li key={rule.id} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{rule.description}</span>
                <span className="text-xs font-semibold text-green-700 bg-green-50 rounded-full px-2 py-0.5">
                  +{rule.points}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Timeline de atividades */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Atividades</h3>
        <ActivityTimeline activities={activities} />
      </div>
    </div>
  )
}
