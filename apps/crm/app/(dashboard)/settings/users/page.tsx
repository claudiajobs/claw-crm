import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import UserList from '@/components/crm/settings/UserList'

export default async function UsersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check admin
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/pipeline')
  }

  const { data: usersRows } = await supabase
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
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Gestao de Usuarios</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Aprove, suspenda ou reative usuarios do sistema.
        </p>
      </div>

      <UserList users={users} />
    </div>
  )
}
