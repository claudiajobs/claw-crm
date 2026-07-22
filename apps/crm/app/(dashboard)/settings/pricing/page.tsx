import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getPricingGrid } from '@/lib/actions/pricing'
import PricingGrid from '@/components/crm/settings/PricingGrid'

export default async function PricingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Use service client for the profile check — avoids RLS issues with cookies
  const serviceClient = createServiceClient()
  const { data: profile } = await serviceClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/pipeline')
  }

  const grid = await getPricingGrid()

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 className="topbar-title">Tabela de Preços</h1>
        <p className="topbar-sub">
          Edite os preços por faixa e ative ou desative produtos. Cada alteração
          de preço preserva o histórico anterior.
        </p>
      </div>

      <PricingGrid grid={grid} />
    </div>
  )
}
