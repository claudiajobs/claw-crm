import { NextRequest, NextResponse } from 'next/server'
import { validateSDRRequest } from '@/lib/api/sdr-middleware'
import { createServiceClient } from '@/lib/supabase/service'

// ─── POST /api/sdr/contacts ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const auth = await validateSDRRequest(req, 'contacts', 'write')
  if (auth instanceof NextResponse) return auth

  const supabase = createServiceClient()

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ erro: 'Corpo da requisição inválido' }, { status: 400 })
  }

  const {
    first_name,
    last_name,
    whatsapp_number,
    instagram_handle,
    preferred_channel,
    type: contactType,
    territory,
  } = body

  if (!first_name || typeof first_name !== 'string' || !first_name.trim()) {
    return NextResponse.json({ erro: 'Campo obrigatório: first_name' }, { status: 400 })
  }
  if (!whatsapp_number && !instagram_handle) {
    return NextResponse.json(
      { erro: 'Obrigatório: whatsapp_number ou instagram_handle' },
      { status: 400 }
    )
  }

  const { data: contact, error } = await supabase
    .from('contacts')
    .insert({
      first_name: (first_name as string).trim(),
      last_name: (last_name as string | undefined)?.trim() ?? null,
      whatsapp_number: (whatsapp_number as string | undefined) ?? null,
      instagram_handle: (instagram_handle as string | undefined) ?? null,
      preferred_channel:
        (preferred_channel as string | undefined) ??
        (whatsapp_number ? 'whatsapp' : 'instagram'),
      type: (contactType as string | undefined) ?? null,
      territory: (territory as string | undefined) ?? null,
      source: 'robot_sdr',
      status: 'lead',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 })
  }

  return NextResponse.json({ contact }, { status: 201 })
}
