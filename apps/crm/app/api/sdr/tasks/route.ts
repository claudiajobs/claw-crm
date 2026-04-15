import { NextRequest, NextResponse } from 'next/server'
import { validateSDRRequest } from '@/lib/api/sdr-middleware'
import { createServiceClient } from '@/lib/supabase/service'

// ─── POST /api/sdr/tasks ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const auth = await validateSDRRequest(req, 'tasks', 'write')
  if (auth instanceof NextResponse) return auth

  const supabase = createServiceClient()

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ erro: 'Corpo da requisição inválido' }, { status: 400 })
  }

  const { title, description, due_at, contact_id, lead_id, priority } = body

  if (!title || typeof title !== 'string' || !title.trim()) {
    return NextResponse.json({ erro: 'Campo obrigatório: title' }, { status: 400 })
  }
  if (!lead_id && !contact_id) {
    return NextResponse.json(
      { erro: 'Obrigatório: lead_id ou contact_id' },
      { status: 400 }
    )
  }

  // Determine assigned_to from lead owner
  let assignedTo: string | null = null
  if (lead_id) {
    const { data: lead } = await supabase
      .from('leads')
      .select('owner_id')
      .eq('id', lead_id as string)
      .single()
    assignedTo = lead?.owner_id ?? null
  }

  if (!assignedTo && contact_id) {
    const { data: contact } = await supabase
      .from('contacts')
      .select('owner_id')
      .eq('id', contact_id as string)
      .single()
    assignedTo = contact?.owner_id ?? null
  }

  if (!assignedTo) {
    return NextResponse.json(
      { erro: 'Não foi possível determinar o responsável pela tarefa' },
      { status: 422 }
    )
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      title: (title as string).trim(),
      description: (description as string | undefined)?.trim() ?? null,
      due_at: (due_at as string | undefined) ?? null,
      contact_id: (contact_id as string | undefined) ?? null,
      lead_id: (lead_id as string | undefined) ?? null,
      priority: (priority as string | undefined) ?? 'medio',
      assigned_to: assignedTo,
      created_by: assignedTo, // robot creates on behalf of owner
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ erro: error.message }, { status: 500 })
  }

  return NextResponse.json({ task }, { status: 201 })
}
