import { NextRequest, NextResponse } from 'next/server'
import { validateSDRRequest } from '@/lib/api/sdr-middleware'
import { createServiceClient } from '@/lib/supabase/service'

// ─── POST /api/sdr/leads/inbound ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const auth = await validateSDRRequest(req, 'leads', 'write')
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
    territory,
    type: contactType,
    title,
    message,
  } = body

  if (!first_name || typeof first_name !== 'string') {
    return NextResponse.json({ erro: 'Campo obrigatório: first_name' }, { status: 400 })
  }
  if (!whatsapp_number && !instagram_handle) {
    return NextResponse.json(
      { erro: 'Obrigatório: whatsapp_number ou instagram_handle' },
      { status: 400 }
    )
  }

  // Find or create contact
  const channel = whatsapp_number ? 'whatsapp_number' : 'instagram_handle'
  const channelValue = (whatsapp_number ?? instagram_handle) as string

  let contactId: string

  const { data: existing } = await supabase
    .from('contacts')
    .select('id')
    .eq(channel, channelValue)
    .single()

  if (existing) {
    contactId = existing.id
  } else {
    const { data: newContact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        first_name: (first_name as string).trim(),
        last_name: (last_name as string | undefined)?.trim() ?? null,
        whatsapp_number: (whatsapp_number as string | undefined) ?? null,
        instagram_handle: (instagram_handle as string | undefined) ?? null,
        preferred_channel: (preferred_channel as string | undefined) ?? (whatsapp_number ? 'whatsapp' : 'instagram'),
        territory: (territory as string | undefined) ?? null,
        type: (contactType as string | undefined) ?? null,
        source: 'formulario_inbound',
        status: 'lead',
      })
      .select('id')
      .single()

    if (contactError || !newContact) {
      return NextResponse.json({ erro: 'Erro ao criar contato' }, { status: 500 })
    }
    contactId = newContact.id
  }

  const leadTitle =
    typeof title === 'string' && title.trim()
      ? title.trim()
      : `Inbound — ${first_name}`

  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .insert({
      title: leadTitle,
      contact_id: contactId,
      status: 'novo',
      source: 'formulario_inbound',
    })
    .select()
    .single()

  if (leadError || !lead) {
    return NextResponse.json(
      { erro: leadError?.message ?? 'Erro ao criar lead' },
      { status: 500 }
    )
  }

  // Log initial activity if message provided
  if (message && typeof message === 'string' && message.trim()) {
    await supabase.from('activities').insert({
      lead_id: lead.id,
      contact_id: contactId,
      type: 'nota',
      subject: 'Mensagem inicial',
      body: message.trim(),
      performed_by_robot: auth.context.robotSdrId,
    })
  }

  return NextResponse.json({ lead, contactId }, { status: 201 })
}
