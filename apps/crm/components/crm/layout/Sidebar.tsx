import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

interface NavItem {
  href: string
  label: string
  icon: string
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { href: '/pipeline', label: 'Pipeline', icon: '📊' },
  { href: '/leads', label: 'Leads', icon: '🎯' },
  { href: '/contacts', label: 'Contatos', icon: '👥' },
  { href: '/tasks', label: 'Tarefas', icon: '✅' },
  { href: '/settings', label: 'Configurações', icon: '⚙️' },
  { href: '/settings/users', label: 'Usuários', icon: '🔑', adminOnly: true },
]

export default async function Sidebar() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isAdmin = false
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.role === 'admin'
  }

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin)

  return (
    <aside className="w-60 min-h-screen bg-gray-900 flex flex-col">
      {/* Marca */}
      <div className="px-6 py-5 border-b border-gray-700">
        <span className="text-white font-bold text-lg tracking-tight">
          CLAW CRM
        </span>
      </div>

      {/* Navegação */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {visibleItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                       text-gray-300 hover:bg-gray-800 hover:text-white
                       transition-colors"
          >
            <span className="text-base leading-none">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Rodapé */}
      <div className="px-6 py-4 border-t border-gray-700">
        <p className="text-xs text-gray-500">v0.5.0 — Sprint 5</p>
      </div>
    </aside>
  )
}
