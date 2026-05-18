import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ApiKeyList from '@/components/crm/settings/ApiKeyList'

export default async function ApiKeysPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return (
      <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--color-gray-400)' }}>
          Apenas administradores podem gerenciar chaves de API.
        </p>
      </div>
    )
  }

  const { data: keys } = await supabase
    .from('api_keys')
    .select('id, label, permissions, last_used_at, revoked_at, created_at')
    .order('created_at', { ascending: false })

  return (
    <ApiKeyList
      initialKeys={(keys ?? []) as Parameters<typeof ApiKeyList>[0]['initialKeys']}
    />
  )
}
