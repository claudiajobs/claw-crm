import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { completeTask } from '@/lib/actions/tasks'

const PRIORITY_ORDER: Record<string, number> = { alto: 0, medio: 1, baixo: 2 }
const PRIORITY_LABEL: Record<string, string> = {
  alto: 'Alta',
  medio: 'Média',
  baixo: 'Baixa',
}
const PRIORITY_COLOR: Record<string, string> = {
  alto: 'bg-red-100 text-red-700 border-red-200',
  medio: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  baixo: 'bg-blue-100 text-blue-700 border-blue-200',
}

const STATUS_LABEL: Record<string, string> = {
  pendente: 'Pendente',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
}

interface Task {
  id: string
  title: string
  description: string | null
  due_at: string | null
  priority: string
  status: string
  completed_at: string | null
  contact_id: string | null
  lead_id: string | null
  contacts: { first_name: string; last_name: string | null } | null
  leads: { title: string } | null
}

export default async function TasksPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: rows } = await supabase
    .from('tasks')
    .select(
      'id, title, description, due_at, priority, status, completed_at, contact_id, lead_id, contacts(first_name, last_name), leads(title)'
    )
    .eq('assigned_to', user.id)
    .in('status', ['pendente'])
    .order('due_at', { ascending: true, nullsFirst: false })

  const tasks: Task[] = (rows ?? []).map((t) => ({
    ...t,
    contacts: Array.isArray(t.contacts) ? t.contacts[0] ?? null : t.contacts ?? null,
    leads: Array.isArray(t.leads) ? t.leads[0] ?? null : t.leads ?? null,
  }))

  const grouped = Object.entries(
    tasks.reduce<Record<string, Task[]>>((acc, task) => {
      const p = task.priority ?? 'medio'
      if (!acc[p]) acc[p] = []
      acc[p].push(task)
      return acc
    }, {})
  ).sort(([a], [b]) => (PRIORITY_ORDER[a] ?? 9) - (PRIORITY_ORDER[b] ?? 9))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Tarefas</h1>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center">
          <p className="text-gray-400 text-sm">Nenhuma tarefa pendente.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([priority, items]) => (
            <div key={priority}>
              <h2 className="flex items-center gap-2 mb-3">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${PRIORITY_COLOR[priority] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}
                >
                  {PRIORITY_LABEL[priority] ?? priority}
                </span>
                <span className="text-xs text-gray-400">{items.length}</span>
              </h2>

              <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
                {items.map((task) => {
                  const contactName = task.contacts
                    ? [task.contacts.first_name, task.contacts.last_name]
                        .filter(Boolean)
                        .join(' ')
                    : null
                  const leadTitle = task.leads?.title ?? null
                  const isOverdue =
                    task.due_at && new Date(task.due_at) < new Date()

                  return (
                    <div
                      key={task.id}
                      className="flex items-center justify-between px-5 py-4 gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {task.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          {leadTitle && <span>Lead: {leadTitle}</span>}
                          {contactName && <span>Contato: {contactName}</span>}
                          {task.due_at && (
                            <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                              Vence: {new Date(task.due_at).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                          <span>{STATUS_LABEL[task.status] ?? task.status}</span>
                        </div>
                      </div>

                      <form
                        action={async () => {
                          'use server'
                          await completeTask(task.id)
                        }}
                      >
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50
                                     px-3 py-1.5 text-xs font-semibold text-green-700
                                     hover:bg-green-100 transition-colors"
                        >
                          Concluir
                        </button>
                      </form>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
