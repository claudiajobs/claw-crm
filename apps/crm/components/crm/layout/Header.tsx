import { logout } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/server'
import { IconLogout } from '@tabler/icons-react'

export default async function Header() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase
        .from('users')
        .select('name, role')
        .eq('id', user.id)
        .single()
    : { data: null }

  const displayName = profile?.name ?? user?.email ?? 'Usuário'
  const ROLE_LABELS: Record<string, string> = {
    admin: 'Admin',
    editor: 'Editor',
    vendedor: 'Vendedor',
    sdr: 'SDR',
  }
  const roleLabel = profile?.role ? (ROLE_LABELS[profile.role] ?? profile.role) : 'Representante'

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((w: string) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header className="topbar">
      {/* Page title slot */}
      <div id="page-title" />

      {/* User + logout */}
      <div className="topbar-actions">
        <div style={{ textAlign: 'right', marginRight: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-gray-800)', lineHeight: 1.2 }}>
            {displayName}
          </p>
          <p style={{ fontSize: 10, color: 'var(--color-gray-400)', marginTop: 1 }}>{roleLabel}</p>
        </div>

        <div className="avatar avatar-sm avatar-purple">{initials}</div>

        <form action={logout}>
          <button
            type="submit"
            className="btn btn-ghost btn-sm"
            aria-label="Sair"
          >
            <IconLogout size={14} stroke={1.5} aria-hidden />
            Sair
          </button>
        </form>
      </div>
    </header>
  )
}
