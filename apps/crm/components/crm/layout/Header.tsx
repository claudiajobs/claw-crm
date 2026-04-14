import { logout } from '@/lib/actions/auth'
import { createClient } from '@/lib/supabase/server'

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
  const roleLabel = profile?.role === 'admin' ? 'Admin' : 'Representante'

  return (
    <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-6">
      {/* Breadcrumb / título — preenchido por cada página via slot */}
      <div id="page-title" />

      {/* Usuário + logout */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900 leading-none">
            {displayName}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{roleLabel}</p>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors
                       border border-gray-200 rounded-lg px-3 py-1.5 hover:border-gray-300"
          >
            Sair
          </button>
        </form>
      </div>
    </header>
  )
}
