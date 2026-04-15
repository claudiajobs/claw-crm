import Link from 'next/link'

interface NavItem {
  href: string
  label: string
  icon: string
}

const navItems: NavItem[] = [
  { href: '/pipeline', label: 'Pipeline', icon: '📊' },
  { href: '/leads', label: 'Leads', icon: '🎯' },
  { href: '/contacts', label: 'Contatos', icon: '👥' },
  { href: '/accounts', label: 'Contas', icon: '🏢' },
  { href: '/tasks', label: 'Tarefas', icon: '✅' },
  { href: '/settings', label: 'Configurações', icon: '⚙️' },
]

export default function Sidebar() {
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
        {navItems.map((item) => (
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
        <p className="text-xs text-gray-500">v0.4.0 — Sprint 4</p>
      </div>
    </aside>
  )
}
