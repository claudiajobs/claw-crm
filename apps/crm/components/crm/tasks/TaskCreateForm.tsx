'use client'

import { useRef, useState, useTransition } from 'react'
import { createQuickTask } from '@/lib/actions/tasks'

interface Option {
  id: string
  label: string
}

interface TaskCreateFormProps {
  leads: Option[]
  contacts: Option[]
  onClose: () => void
}

export default function TaskCreateForm({ leads, contacts, onClose }: TaskCreateFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await createQuickTask(formData)
      if (result.error) {
        setError(result.error)
      } else {
        formRef.current?.reset()
        onClose()
      }
    })
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent'

  return (
    <form ref={formRef} action={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Nova tarefa</h3>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label htmlFor="task-title" className="block text-xs font-medium text-gray-700 mb-1">
            Título *
          </label>
          <input
            id="task-title"
            name="title"
            type="text"
            required
            placeholder="Ex: Ligar para cliente"
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="task-description" className="block text-xs font-medium text-gray-700 mb-1">
            Descrição
          </label>
          <textarea
            id="task-description"
            name="description"
            rows={2}
            placeholder="Detalhes opcionais..."
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="task-due" className="block text-xs font-medium text-gray-700 mb-1">
            Data/hora limite *
          </label>
          <input
            id="task-due"
            name="due_at"
            type="datetime-local"
            required
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="task-priority" className="block text-xs font-medium text-gray-700 mb-1">
            Prioridade
          </label>
          <select id="task-priority" name="priority" defaultValue="medio" className={inputClass}>
            <option value="baixo">Baixa</option>
            <option value="medio">Média</option>
            <option value="alto">Alta</option>
          </select>
        </div>

        <div>
          <label htmlFor="task-lead" className="block text-xs font-medium text-gray-700 mb-1">
            Associar a lead
          </label>
          <select id="task-lead" name="lead_id" defaultValue="" className={inputClass}>
            <option value="">Nenhum</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>{l.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="task-contact" className="block text-xs font-medium text-gray-700 mb-1">
            Associar a contato
          </label>
          <select id="task-contact" name="contact_id" defaultValue="" className={inputClass}>
            <option value="">Nenhum</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <input type="hidden" name="_revalidate" value="/tasks" />

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 active:bg-red-800 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Salvando...' : 'Salvar'}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="inline-flex items-center rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
