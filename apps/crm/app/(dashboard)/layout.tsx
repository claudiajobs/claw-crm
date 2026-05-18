import Sidebar from '@/components/crm/layout/Sidebar'
import Header from '@/components/crm/layout/Header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="app-shell">
      <Sidebar />

      <div className="main-area">
        <Header />
        <main className="content-area">{children}</main>
      </div>
    </div>
  )
}
