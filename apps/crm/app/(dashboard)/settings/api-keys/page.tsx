import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ApiKeyList from '@/components/crm/settings/ApiKeyList'

export default async function ApiKeysPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Only admins can manage API keys
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center">
        <p className="text-gray-500 text-sm">
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
