'use client'

import { useOptimistic, useRef, useState, useTransition } from 'react'
import { completeTask, createQuickTask } from '@/lib/actions/tasks'
import { IconCircleCheck, IconPlus } from '@tabler/icons-react'

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

export interface TaskItem {
  id: string
  title: string
  due_at: string | null
  priority: string
  status: string
}

interface TaskSectionProps {
  tasks: TaskItem[]
  entityType: 'lead' | 'contact'
  entityId: string
  revalidatePath: string
}

export default function TaskSection({ tasks, entityType, entityId, revalidatePath: revalidate }: TaskSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const [optimisticTasks, updateOptimistic] = useOptimistic(
    tasks,
    (state: TaskItem[], action: { type: 'complete'; id: string } | { type: 'add'; task: TaskItem }) => {
      if (action.type === 'complete') {
        return state.filter((t) => t.id !== action.id)
      }
      return [action.task, ...state]
    }
  )

  function handleComplete(taskId: string) {
    startTransition(async () => {
      updateOptimistic({ type: 'complete', id: taskId })
      await completeTask(taskId, revalidate)
    })
  }

  function handleCreate(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const title = (formData.get('title') as string)?.trim() ?? ''
      updateOptimistic({
        type: 'add',
        task: {
          id: `optimistic-${Date.now()}`,
          title,
          due_at: formData.get('due_at') as string,
          priority: (formData.get('priority') as string) ?? 'medio',
          status: 'pendente',
        },
      })

      const result = await createQuickTask(formData)
      if (result.error) {
        setError(result.error)
      } else {
        formRef.current?.reset()
        setShowForm(false)
      }
    })
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-gray-800)' }}>
          Tarefas ({optimisticTasks.length})
        </h3>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <IconPlus size={14} stroke={1.5} aria-hidden />
            Tarefa
          </button>
        )}
      </div>

      {showForm && (
        <form ref={formRef} action={handleCreate} style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 12, border: '0.5px solid var(--color-gray-200)', borderRadius: 'var(--radius-sm)', padding: 16, background: 'var(--color-gray-50)' }}>
          {error && (
            <p className="field-error" style={{ background: 'var(--color-danger-light)', padding: '6px 12px', borderRadius: 'var(--radius-xs)' }}>{error}</p>
          )}

          <div className="field">
            <label htmlFor={`qt-title-${entityId}`} className="field-label">Título <span className="req">*</span></label>
            <input id={`qt-title-${entityId}`} name="title" type="text" required placeholder="Ex: Follow-up com cliente" className="input" />
          </div>

          <div className="form-grid-2">
            <div className="field">
              <label htmlFor={`qt-due-${entityId}`} className="field-label">Prazo <span className="req">*</span></label>
              <input id={`qt-due-${entityId}`} name="due_at" type="datetime-local" required className="input" />
            </div>
            <div className="field">
              <label htmlFor={`qt-priority-${entityId}`} className="field-label">Prioridade</label>
              <select id={`qt-priority-${entityId}`} name="priority" defaultValue="medio" className="input">
                <option value="baixo">Baixa</option>
                <option value="medio">Média</option>
                <option value="alto">Alta</option>
              </select>
            </div>
          </div>

          {entityType === 'lead' && <input type="hidden" name="lead_id" value={entityId} />}
          {entityType === 'contact' && <input type="hidden" name="contact_id" value={entityId} />}
          <input type="hidden" name="_revalidate" value={revalidate} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button type="submit" disabled={isPending} className="btn btn-sm btn-primary" style={{ opacity: isPending ? 0.5 : 1 }}>
              {isPending ? 'Salvando...' : 'Salvar'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setError(null) }} className="btn btn-sm btn-ghost">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {optimisticTasks.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--color-gray-400)' }}>Nenhuma tarefa pendente.</p>
      ) : (
        <div>
          {optimisticTasks.map((task, idx) => {
            const isOverdue = task.due_at && new Date(task.due_at) < new Date()
            return (
              <div key={task.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', gap: 12, borderBottom: idx < optimisticTasks.length - 1 ? '0.5px solid var(--color-gray-100)' : 'none' }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-gray-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span className={PRIORITY_BADGE[task.priority] ?? 'badge badge-gray'}>
                      {PRIORITY_LABEL[task.priority] ?? task.priority}
                    </span>
                    {task.due_at && (
                      <span style={{ fontSize: 11, color: isOverdue ? '#C44040' : 'var(--color-gray-400)', fontWeight: isOverdue ? 600 : 400 }}>
                        {new Date(task.due_at).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleComplete(task.id)}
                  disabled={isPending || task.id.startsWith('optimistic-')}
                  className="btn btn-sm btn-success"
                  style={{ opacity: isPending || task.id.startsWith('optimistic-') ? 0.5 : 1 }}
                >
                  <IconCircleCheck size={14} stroke={1.5} aria-hidden />
                  Concluir
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
