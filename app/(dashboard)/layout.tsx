import Sidebar from '@/components/crm/layout/Sidebar'
import Header from '@/components/crm/layout/Header'
import MobileSidebar from '@/components/crm/layout/MobileSidebar'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar — hidden on mobile via Sidebar's own className */}
      <Sidebar />

      {/* Mobile sidebar (hamburger + slide-in overlay) */}
      <MobileSidebar />

      <div className="flex flex-col flex-1 min-w-0">
        <Header />
        <main className="flex-1 p-4 md:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
