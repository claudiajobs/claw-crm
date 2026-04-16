import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LeadForm from '@/components/crm/leads/LeadForm'

interface NewLeadPageProps {
  searchParams: Promise<{ erro?: string }>
}

export default async function NewLeadPage({ searchParams }: NewLeadPageProps) {
  const { erro } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: contactRows } = await supabase
    .from('contacts')
    .select('id, first_name, last_name')
    .order('first_name', { ascending: true })

  const contacts = (contactRows ?? []).map((c) => ({
    id: c.id,
    first_name: c.first_name,
    last_name: c.last_name ?? null,
  }))

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Novo Lead</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Apenas o título é obrigatório. Selecione um contato ou crie um rapidamente.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <LeadForm erro={erro} contacts={contacts} />
      </div>
    </div>
  )
}
