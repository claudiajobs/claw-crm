import Sidebar from '@/components/crm/layout/Sidebar'
import Header from '@/components/crm/layout/Header'
import MobileSidebar from '@/components/crm/layout/MobileSidebar'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.role === 'admin'
  }

  return (
    <div className="app-shell">
      {/* Desktop sidebar — hidden on mobile via Sidebar's own className */}
      <Sidebar />

      {/* Mobile sidebar (hamburger + slide-in overlay) */}
      <MobileSidebar isAdmin={isAdmin} />

      <div className="main-area">
        <Header />
        <main className="content-area">{children}</main>
      </div>
    </div>
  )
}
