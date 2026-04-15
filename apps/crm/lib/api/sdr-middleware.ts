import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createServiceClient } from '@/lib/supabase/service'

export interface SDRContext {
  apiKeyId: string
  label: string
  permissions: Record<string, string[]>
  robotSdrId: string
}

interface ValidateSuccess {
  context: SDRContext
}

export async function validateSDRRequest(
  req: NextRequest,
  resource: string,
  action: string
): Promise<ValidateSuccess | NextResponse> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { erro: 'Chave de API ausente ou inválida' },
      { status: 401 }
    )
  }

  const rawKey = authHeader.slice(7).trim()
  if (!rawKey) {
    return NextResponse.json(
      { erro: 'Chave de API ausente ou inválida' },
      { status: 401 }
    )
  }

  const keyHash = createHash('sha256').update(rawKey).digest('hex')
  const supabase = createServiceClient()

  const { data: apiKey } = await supabase
    .from('api_keys')
    .select('id, label, permissions, revoked_at')
    .eq('key_hash', keyHash)
    .is('revoked_at', null)
    .single()

  if (!apiKey) {
    return NextResponse.json(
      { erro: 'Chave de API inválida ou revogada' },
      { status: 401 }
    )
  }

  const permissions = apiKey.permissions as Record<string, string[]>
  if (!permissions[resource]?.includes(action)) {
    return NextResponse.json({ erro: 'Permissão negada' }, { status: 403 })
  }

  // Fire-and-forget: update last_used_at without blocking response
  void supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', apiKey.id)

  return {
    context: {
      apiKeyId: apiKey.id,
      label: apiKey.label,
      permissions,
      robotSdrId: apiKey.id, // use key id as robot identifier
    },
  }
}
