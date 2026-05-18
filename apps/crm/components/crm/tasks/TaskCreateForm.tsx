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

  return (
    <form ref={formRef} action={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-gray-800)' }}>Nova tarefa</h3>

      {error && (
        <p className="field-error" style={{ background: 'var(--color-danger-light)', padding: '6px 12px', borderRadius: 'var(--radius-xs)' }}>{error}</p>
      )}

      <div className="form-grid-2">
        <div className="field col-span-2">
          <label htmlFor="task-title" className="field-label">Título <span className="req">*</span></label>
          <input id="task-title" name="title" type="text" required placeholder="Ex: Ligar para cliente" className="input" />
        </div>

        <div className="field col-span-2">
          <label htmlFor="task-description" className="field-label">Descrição</label>
          <textarea id="task-description" name="description" rows={2} placeholder="Detalhes opcionais..." className="input" />
        </div>

        <div className="field">
          <label htmlFor="task-due" className="field-label">Data/hora limite <span className="req">*</span></label>
          <input id="task-due" name="due_at" type="datetime-local" required className="input" />
        </div>

        <div className="field">
          <label htmlFor="task-priority" className="field-label">Prioridade</label>
          <select id="task-priority" name="priority" defaultValue="medio" className="input">
            <option value="baixo">Baixa</option>
            <option value="medio">Média</option>
            <option value="alto">Alta</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="task-lead" className="field-label">Associar a lead</label>
          <select id="task-lead" name="lead_id" defaultValue="" className="input">
            <option value="">Nenhum</option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>{l.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="task-contact" className="field-label">Associar a contato</label>
          <select id="task-contact" name="contact_id" defaultValue="" className="input">
            <option value="">Nenhum</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <input type="hidden" name="_revalidate" value="/tasks" />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 8 }}>
        <button type="submit" disabled={isPending} className="btn btn-primary" style={{ opacity: isPending ? 0.5 : 1 }}>
          {isPending ? 'Salvando...' : 'Salvar'}
        </button>
        <button type="button" onClick={onClose} disabled={isPending} className="btn btn-ghost">
          Cancelar
        </button>
      </div>
    </form>
  )
}
