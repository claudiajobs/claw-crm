'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { randomUUID, randomBytes, createHash } from 'crypto'
import { createClient } from '@/lib/supabase/server'

export interface GenerateApiKeyResult {
  id: string
  label: string
  plainKey: string
  permissions: Record<string, string[]>
  createdAt: string
}

// ─── generateApiKey ────────────────────────────────────────────────────────────
export async function generateApiKey(
  label: string,
  permissions: Record<string, string[]>
): Promise<GenerateApiKeyResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Generate random key: UUID + 16 random bytes → hex
  const plainKey = `claw_${randomUUID().replace(/-/g, '')}${randomBytes(16).toString('hex')}`
  const keyHash = createHash('sha256').update(plainKey).digest('hex')

  const { data: apiKey, error } = await supabase
    .from('api_keys')
    .insert({
      key_hash: keyHash,
      label: label.trim(),
      owner_id: user.id,
      permissions,
    })
    .select('id, label, permissions, created_at')
    .single()

  if (error || !apiKey) {
    throw new Error(error?.message ?? 'Erro ao gerar chave de API')
  }

  revalidatePath('/settings/api-keys')

  return {
    id: apiKey.id,
    label: apiKey.label,
    plainKey,
    permissions: apiKey.permissions as Record<string, string[]>,
    createdAt: apiKey.created_at,
  }
}

// ─── revokeApiKey ──────────────────────────────────────────────────────────────
export async function revokeApiKey(keyId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', keyId)

  revalidatePath('/settings/api-keys')
}
