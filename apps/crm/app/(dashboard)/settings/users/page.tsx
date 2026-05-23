import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import UserList from '@/components/crm/settings/UserList'

export default async function UsersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Use service client for profile check too — avoids RLS issues with session cookies
  const serviceClient = createServiceClient()
  const { data: profile } = await serviceClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/pipeline')
  }

  const { data: usersRows, error: usersError } = await serviceClient
    .from('users')
    .select('id, name, email, role, status, created_at')
    .order('created_at', { ascending: false })

  const users = (usersRows ?? []).map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status ?? 'active',
    created_at: u.created_at,
  }))

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 className="topbar-title">Gestao de Usuarios</h1>
        <p className="topbar-sub">
          Aprove, suspenda ou reative usuarios do sistema.
        </p>
      </div>

      <UserList users={users} />
    </div>
  )
}
