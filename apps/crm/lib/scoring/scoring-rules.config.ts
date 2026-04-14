// Lead Scoring — config only, no business logic

export interface LeadScoringInput {
  contact: {
    whatsapp_number?: string | null
    instagram_handle?: string | null
    monthly_volume_liters?: number | null
  }
  lead: {
    estimated_volume_liters?: number | null
    decision_timeline?: string | null
    project_type?: string | null
    last_activity_at?: string | null
  }
  account?: {
    type?: string | null
    payment_terms?: string | null
  } | null
}

export interface ScoringRule {
  id: string
  description: string
  points: number
  condition: (input: LeadScoringInput) => boolean
}

export const SCORING_RULES: ScoringRule[] = [
  {
    id: 'trade_distributor',
    description: 'Conta do tipo distribuidor',
    points: 30,
    condition: (i) => i.account?.type === 'distribuidor',
  },
  {
    id: 'has_whatsapp',
    description: 'Contato tem WhatsApp',
    points: 10,
    condition: (i) => !!i.contact.whatsapp_number,
  },
  {
    id: 'has_instagram',
    description: 'Contato tem Instagram',
    points: 5,
    condition: (i) => !!i.contact.instagram_handle,
  },
  {
    id: 'high_estimated_volume',
    description: 'Volume estimado acima de 1.000 litros',
    points: 20,
    condition: (i) => (i.lead.estimated_volume_liters ?? 0) > 1000,
  },
  {
    id: 'very_high_estimated_volume',
    description: 'Volume estimado acima de 5.000 litros',
    points: 30,
    condition: (i) => (i.lead.estimated_volume_liters ?? 0) > 5000,
  },
  {
    id: 'recent_activity',
    description: 'Atividade nos últimos 7 dias',
    points: 15,
    condition: (i) => {
      if (!i.lead.last_activity_at) return false
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      return new Date(i.lead.last_activity_at) >= sevenDaysAgo
    },
  },
  {
    id: 'decision_immediate',
    description: 'Decisão imediata',
    points: 25,
    condition: (i) => i.lead.decision_timeline === 'imediato',
  },
  {
    id: 'decision_1_3m',
    description: 'Decisão em 1 a 3 meses',
    points: 10,
    condition: (i) => i.lead.decision_timeline === '1-3m',
  },
  {
    id: 'commercial_project',
    description: 'Projeto comercial ou industrial',
    points: 15,
    condition: (i) => ['comercial', 'industrial'].includes(i.lead.project_type ?? ''),
  },
  {
    id: 'good_payment_terms',
    description: 'Condições de pagamento favoráveis (à vista ou 30d)',
    points: 10,
    condition: (i) => ['avista', '30d'].includes(i.account?.payment_terms ?? ''),
  },
  {
    id: 'high_monthly_volume',
    description: 'Volume mensal do contato acima de 500 litros',
    points: 15,
    condition: (i) => (i.contact.monthly_volume_liters ?? 0) > 500,
  },
]

export const MAX_SCORE = SCORING_RULES.reduce((sum, r) => sum + r.points, 0)
