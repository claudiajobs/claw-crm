import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LeadDetail from '@/components/crm/leads/LeadDetail'
import { computeLeadScore } from '@/lib/scoring/scoring-engine'
import type { LeadScoringInput } from '@/lib/scoring/scoring-rules.config'
import { MAX_SCORE } from '@/lib/scoring/scoring-rules.config'

interface LeadPageProps {
  params: Promise<{ id: string }>
}

export default async function LeadPage({ params }: LeadPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: lead } = await supabase
    .from('leads')
    .select(
      'id, title, status, score, value, product_interest, project_type, decision_timeline, estimated_volume_liters, created_at, created_by, contact_id, contacts(first_name, last_name, preferred_channel, whatsapp_number, instagram_handle, monthly_volume_liters, account_id)'
    )
    .eq('id', id)
    .single()

  if (!lead) notFound()

  // Fetch account (company contact) for scoring
  const contactData = Array.isArray(lead.contacts) ? lead.contacts[0] : lead.contacts
  let accountData: { type: string | null; payment_terms: string | null } | null = null
  if (contactData?.account_id) {
    const { data } = await supabase
      .from('contacts')
      .select('classification, details')
      .eq('id', contactData.account_id)
      .eq('entity_type', 'company')
      .single()
    if (data) {
      const details = (data.details ?? {}) as Record<string, unknown>
      accountData = {
        type: data.classification,
        payment_terms: (details.payment_terms as string) ?? null,
      }
    }
  }

  // Fetch latest activity for scoring
  const { data: lastActivity } = await supabase
    .from('activities')
    .select('created_at')
    .eq('lead_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  const scoringInput: LeadScoringInput = {
    contact: {
      whatsapp_number: contactData?.whatsapp_number ?? null,
      instagram_handle: contactData?.instagram_handle ?? null,
      monthly_volume_liters: contactData?.monthly_volume_liters
        ? Number(contactData.monthly_volume_liters)
        : null,
    },
    lead: {
      estimated_volume_liters: lead.estimated_volume_liters
        ? Number(lead.estimated_volume_liters)
        : null,
      decision_timeline: lead.decision_timeline,
      project_type: lead.project_type,
      last_activity_at: lastActivity?.created_at ?? null,
    },
    account: accountData,
  }
  const { matchedRules } = computeLeadScore(scoringInput)

  // Fetch creator info
  let creatorLabel: string | null = null
  if (lead.created_by) {
    const { data: creator } = await supabase
      .from('users')
      .select('name, role')
      .eq('id', lead.created_by)
      .single()
    if (creator) {
      creatorLabel = creator.role === 'sdr'
        ? `SDR ${creator.name}`
        : creator.name
    }
  }

  // Fetch activities timeline
  const { data: activitiesRows } = await supabase
    .from('activities')
    .select(
      'id, type, subject, body, outcome, created_at, performed_by_robot, users(first_name, last_name)'
    )
    .eq('lead_id', id)
    .order('created_at', { ascending: false })

  const activities = (activitiesRows ?? []).map((a) => ({
    id: a.id,
    type: a.type,
    subject: a.subject,
    body: a.body,
    outcome: a.outcome,
    created_at: a.created_at,
    performed_by_robot: a.performed_by_robot,
    users: Array.isArray(a.users) ? (a.users[0] ?? null) : (a.users ?? null),
  }))

  const leadForDetail = {
    id: lead.id,
    title: lead.title,
    status: lead.status,
    score: lead.score ?? 0,
    value: lead.value != null ? Number(lead.value) : null,
    product_interest: lead.product_interest ?? [],
    project_type: lead.project_type,
    decision_timeline: lead.decision_timeline,
    estimated_volume_liters: lead.estimated_volume_liters
      ? Number(lead.estimated_volume_liters)
      : null,
    created_at: lead.created_at,
    created_by_label: creatorLabel,
    contacts: contactData
      ? {
          first_name: contactData.first_name,
          last_name: contactData.last_name ?? null,
          preferred_channel: contactData.preferred_channel ?? null,
        }
      : null,
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/leads" className="text-sm text-gray-500 hover:text-gray-700">
          ← Leads
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-semibold text-gray-900 truncate">{lead.title}</h1>
      </div>

      <LeadDetail
        lead={leadForDetail}
        activities={activities}
        matchedRules={matchedRules}
        maxScore={MAX_SCORE}
      />
    </div>
  )
}
