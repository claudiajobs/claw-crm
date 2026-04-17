'use client'

import { useOptimistic, useRef, useState, useTransition } from 'react'
import { completeTask, createQuickTask } from '@/lib/actions/tasks'

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

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent'

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">
          Tarefas ({optimisticTasks.length})
        </h3>
        {!showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
          >
            + Tarefa
          </button>
        )}
      </div>

      {showForm && (
        <form ref={formRef} action={handleCreate} className="mb-4 space-y-3 border border-gray-200 rounded-lg p-4 bg-gray-50">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <div>
            <label htmlFor={`qt-title-${entityId}`} className="block text-xs font-medium text-gray-700 mb-1">
              Título *
            </label>
            <input
              id={`qt-title-${entityId}`}
              name="title"
              type="text"
              required
              placeholder="Ex: Follow-up com cliente"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor={`qt-due-${entityId}`} className="block text-xs font-medium text-gray-700 mb-1">
                Prazo *
              </label>
              <input
                id={`qt-due-${entityId}`}
                name="due_at"
                type="datetime-local"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor={`qt-priority-${entityId}`} className="block text-xs font-medium text-gray-700 mb-1">
                Prioridade
              </label>
              <select id={`qt-priority-${entityId}`} name="priority" defaultValue="medio" className={inputClass}>
                <option value="baixo">Baixa</option>
                <option value="medio">Média</option>
                <option value="alto">Alta</option>
              </select>
            </div>
          </div>

          {entityType === 'lead' && <input type="hidden" name="lead_id" value={entityId} />}
          {entityType === 'contact' && <input type="hidden" name="contact_id" value={entityId} />}
          <input type="hidden" name="_revalidate" value={revalidate} />

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700 active:bg-red-800 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null) }}
              className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {optimisticTasks.length === 0 ? (
        <p className="text-sm text-gray-400">Nenhuma tarefa pendente.</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {optimisticTasks.map((task) => {
            const isOverdue = task.due_at && new Date(task.due_at) < new Date()
            return (
              <div key={task.id} className="flex items-center justify-between py-3 gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold border ${PRIORITY_COLOR[task.priority] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}
                    >
                      {PRIORITY_LABEL[task.priority] ?? task.priority}
                    </span>
                    {task.due_at && (
                      <span className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                        {new Date(task.due_at).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleComplete(task.id)}
                  disabled={isPending || task.id.startsWith('optimistic-')}
                  className="inline-flex items-center rounded-lg border border-green-200 bg-green-50
                             px-3 py-1.5 text-xs font-semibold text-green-700
                             hover:bg-green-100 disabled:opacity-50 transition-colors"
                >
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
