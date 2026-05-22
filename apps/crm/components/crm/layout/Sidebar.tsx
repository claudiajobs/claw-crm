import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  IconTimeline,
  IconBriefcase,
  IconUsers,
  IconCheckbox,
  IconSettings,
  IconKey,
} from '@tabler/icons-react'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { href: '/pipeline', label: 'Pipeline', icon: <IconTimeline size={17} stroke={1.5} aria-hidden /> },
  { href: '/leads', label: 'Leads', icon: <IconBriefcase size={17} stroke={1.5} aria-hidden /> },
  { href: '/contacts', label: 'Contatos', icon: <IconUsers size={17} stroke={1.5} aria-hidden /> },
  { href: '/tasks', label: 'Tarefas', icon: <IconCheckbox size={17} stroke={1.5} aria-hidden /> },
  { href: '/settings', label: 'Configurações', icon: <IconSettings size={17} stroke={1.5} aria-hidden /> },
  { href: '/settings/users', label: 'Usuários', icon: <IconKey size={17} stroke={1.5} aria-hidden />, adminOnly: true },
]

export default async function Sidebar() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isAdmin = false
  let userName = 'Usuário'
  let userRole = 'Representante'
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role, name')
      .eq('id', user.id)
      .single()
    isAdmin = profile?.role === 'admin'
    userName = profile?.name ?? user.email ?? 'Usuário'
    const ROLE_LABELS: Record<string, string> = {
      admin: 'Admin',
      editor: 'Editor',
      vendedor: 'Vendedor',
      sdr: 'SDR',
    }
    userRole = profile?.role ? (ROLE_LABELS[profile.role] ?? profile.role) : 'Representante'
  }

  const visibleItems = navItems.filter((item) => !item.adminOnly || isAdmin)

  const initials = userName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <aside className="sidebar hidden md:flex">
      {/* Logo */}
      <div className="sb-logo">
        <div className="sb-mark">S</div>
        <span className="sb-wordmark">sevende</span>
      </div>

      {/* Section label */}
      <div className="sb-section-label">Menu</div>

      {/* Navigation */}
      <nav style={{ flex: 1 }}>
        {visibleItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="nav-item"
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User */}
      <div className="sb-user">
        <div className="avatar avatar-sm avatar-purple">{initials}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-gray-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {userName}
          </div>
          <div style={{ fontSize: 10, color: 'var(--color-gray-400)' }}>{userRole}</div>
        </div>
      </div>
    </aside>
  )
}
