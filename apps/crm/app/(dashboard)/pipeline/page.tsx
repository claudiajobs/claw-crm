import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PipelineBoard from '@/components/crm/pipeline/PipelineBoard'

export default async function PipelinePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rows } = await supabase
    .from('leads')
    .select(
      'id, title, status, score, value, contacts(first_name, last_name, preferred_channel)'
    )
    .order('score', { ascending: false })

  const leads = (rows ?? []).map((lead) => {
    const contact = Array.isArray(lead.contacts) ? lead.contacts[0] : lead.contacts
    return {
      id: lead.id,
      title: lead.title,
      status: lead.status,
      score: lead.score ?? 0,
      value: lead.value != null ? Number(lead.value) : null,
      contact_name: contact
        ? [contact.first_name, contact.last_name].filter(Boolean).join(' ')
        : '—',
      preferred_channel: contact?.preferred_channel ?? null,
    }
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Pipeline</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Arraste os cards entre colunas para atualizar o status do lead.
        </p>
      </div>

      <PipelineBoard leads={leads} />
    </div>
  )
}
