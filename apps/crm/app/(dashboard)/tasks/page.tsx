import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { completeTask } from '@/lib/actions/tasks'
import TaskCreateToggle from '@/components/crm/tasks/TaskCreateToggle'
import { IconCircleCheck } from '@tabler/icons-react'

const PRIORITY_ORDER: Record<string, number> = { alto: 0, medio: 1, baixo: 2 }
const PRIORITY_LABEL: Record<string, string> = {
  alto: 'Alta',
  medio: 'Média',
  baixo: 'Baixa',
}
const PRIORITY_BADGE: Record<string, string> = {
  alto:  'badge badge-coral',
  medio: 'badge badge-amber',
  baixo: 'badge badge-blue',
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

  const [{ data: rows }, { data: leadsRows }, { data: contactsRows }] = await Promise.all([
    supabase
      .from('tasks')
      .select(
        'id, title, description, due_at, priority, status, completed_at, contact_id, lead_id, contacts(first_name, last_name), leads(title)'
      )
      .eq('assigned_to', user.id)
      .in('status', ['pendente'])
      .order('due_at', { ascending: true, nullsFirst: false }),
    supabase
      .from('leads')
      .select('id, title')
      .eq('owner_id', user.id)
      .in('status', ['novo', 'contatado', 'qualificado', 'proposta', 'negociacao'])
      .order('title'),
    supabase
      .from('contacts')
      .select('id, first_name, last_name')
      .eq('created_by', user.id)
      .order('first_name'),
  ])

  const tasks: Task[] = (rows ?? []).map((t) => ({
    ...t,
    contacts: Array.isArray(t.contacts) ? t.contacts[0] ?? null : t.contacts ?? null,
    leads: Array.isArray(t.leads) ? t.leads[0] ?? null : t.leads ?? null,
  }))

  const leadOptions = (leadsRows ?? []).map((l) => ({ id: l.id, label: l.title }))
  const contactOptions = (contactsRows ?? []).map((c) => ({
    id: c.id,
    label: [c.first_name, c.last_name].filter(Boolean).join(' '),
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
      <TaskCreateToggle leads={leadOptions} contacts={contactOptions} />

      {tasks.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--color-gray-400)' }}>Nenhuma tarefa pendente.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {grouped.map(([priority, items]) => (
            <div key={priority}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span className={PRIORITY_BADGE[priority] ?? 'badge badge-gray'}>
                  {PRIORITY_LABEL[priority] ?? priority}
                </span>
                <span style={{ fontSize: 11, color: 'var(--color-gray-400)' }}>{items.length}</span>
              </div>

              <div className="card" style={{ padding: 0 }}>
                {items.map((task, idx) => {
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
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 16px',
                        gap: 16,
                        borderBottom: idx < items.length - 1 ? '0.5px solid var(--color-gray-100)' : 'none',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-gray-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {task.title}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, fontSize: 11, color: 'var(--color-gray-400)' }}>
                          {leadTitle && <span>Lead: {leadTitle}</span>}
                          {contactName && <span>Contato: {contactName}</span>}
                          {task.due_at && (
                            <span style={isOverdue ? { color: '#C44040', fontWeight: 600 } : undefined}>
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
                        <button type="submit" className="btn btn-sm btn-success">
                          <IconCircleCheck size={14} stroke={1.5} aria-hidden />
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
