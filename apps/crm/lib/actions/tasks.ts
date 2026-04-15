'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type TaskPriority = 'baixo' | 'medio' | 'alto'

export async function createTask(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const title = (formData.get('title') as string | null)?.trim() ?? ''
  const description = (formData.get('description') as string | null)?.trim() || null
  const due_at = (formData.get('due_at') as string | null) || null
  const priority = (formData.get('priority') as TaskPriority | null) ?? 'medio'
  const contact_id = (formData.get('contact_id') as string | null) || null
  const lead_id = (formData.get('lead_id') as string | null) || null

  if (!title) {
    redirect('/tasks?erro=Título+é+obrigatório')
  }

  const { error } = await supabase.from('tasks').insert({
    title,
    description,
    due_at,
    priority,
    contact_id,
    lead_id,
    assigned_to: user.id,
    created_by: user.id,
  })

  if (error) {
    redirect(`/tasks?erro=${encodeURIComponent('Erro ao criar tarefa: ' + error.message)}`)
  }

  revalidatePath('/tasks')
  redirect('/tasks')
}

export async function completeTask(taskId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('tasks')
    .update({ status: 'concluida', completed_at: new Date().toISOString() })
    .eq('id', taskId)
    .eq('assigned_to', user.id)

  if (error) return

  revalidatePath('/tasks')
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId)
    .eq('assigned_to', user.id)

  revalidatePath('/tasks')
}
