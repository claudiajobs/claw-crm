import Sidebar from '@/components/crm/layout/Sidebar'
import Header from '@/components/crm/layout/Header'
import MobileSidebar from '@/components/crm/layout/MobileSidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="app-shell">
      {/* Desktop sidebar — hidden on mobile via Sidebar's own className */}
      <Sidebar />

      {/* Mobile sidebar (hamburger + slide-in overlay) */}
      <MobileSidebar />

      <div className="main-area">
        <Header />
        <main className="content-area">{children}</main>
      </div>
    </div>
  )
}
