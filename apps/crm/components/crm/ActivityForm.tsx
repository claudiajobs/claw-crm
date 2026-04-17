'use client'

import { useRef, useState, useTransition } from 'react'
import { logActivity } from '@/lib/actions/activities'
import type { ActivityType } from '@/lib/actions/activities'
import type { Activity } from '@/components/crm/leads/ActivityTimeline'

const ACTIVITY_TYPES: { value: ActivityType; label: string }[] = [
  { value: 'nota', label: 'Nota' },
  { value: 'ligacao', label: 'Ligação' },
  { value: 'reuniao', label: 'Reunião' },
  { value: 'whatsapp_enviado', label: 'WhatsApp (enviado)' },
  { value: 'whatsapp_recebido', label: 'WhatsApp (recebido)' },
  { value: 'instagram_dm_enviado', label: 'DM Instagram (enviado)' },
  { value: 'instagram_dm_recebido', label: 'DM Instagram (recebido)' },
]

interface ActivityFormProps {
  contactId: string
  leadId?: string | null
  currentUserId: string
  currentUserName: string
  onActivityCreated?: (activity: Activity) => void
}

function toLocalDatetimeString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export default function ActivityForm({
  contactId,
  leadId,
  currentUserId,
  currentUserName,
  onActivityCreated,
}: ActivityFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showFollowUp, setShowFollowUp] = useState(false)
  const [lastCreatedActivity, setLastCreatedActivity] = useState<{ contactId: string; leadId?: string | null } | null>(null)

  function handleSubmit(formData: FormData) {
    setError(null)
    const type = formData.get('type') as string
    const subject = (formData.get('subject') as string)?.trim() || null
    const body = (formData.get('body') as string)?.trim() || null
    const outcome = (formData.get('outcome') as string)?.trim() || null
    const scheduledAt = formData.get('scheduled_at') as string

    // Build optimistic activity
    const optimisticActivity: Activity = {
      id: `temp-${Date.now()}`,
      type,
      subject,
      body,
      outcome,
      created_at: scheduledAt ? new Date(scheduledAt).toISOString() : new Date().toISOString(),
      performed_by: currentUserId,
      performed_by_robot: null,
      users: {
        first_name: currentUserName.split(' ')[0],
        last_name: currentUserName.split(' ').slice(1).join(' ') || null,
      },
    }

    startTransition(async () => {
      onActivityCreated?.(optimisticActivity)
      formRef.current?.reset()

      const result = await logActivity(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setLastCreatedActivity({ contactId, leadId })
        setShowFollowUp(true)
      }
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Registrar atividade</h3>

      <form ref={formRef} action={handleSubmit} className="space-y-4">
        <input type="hidden" name="contact_id" value={contactId} />
        {leadId && <input type="hidden" name="lead_id" value={leadId} />}

        {/* Tipo */}
        <div>
          <label htmlFor="activity-type" className="block text-xs font-medium text-gray-700 mb-1">
            Tipo
          </label>
          <select
            id="activity-type"
            name="type"
            required
            defaultValue="nota"
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-red-500 focus:ring-1 focus:ring-red-500"
          >
            {ACTIVITY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Assunto */}
        <div>
          <label htmlFor="activity-subject" className="block text-xs font-medium text-gray-700 mb-1">
            Assunto
          </label>
          <input
            id="activity-subject"
            name="subject"
            type="text"
            placeholder="Ex: Primeiro contato, Follow-up, Proposta enviada"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
          />
        </div>

        {/* Descrição */}
        <div>
          <label htmlFor="activity-body" className="block text-xs font-medium text-gray-700 mb-1">
            Descrição
          </label>
          <textarea
            id="activity-body"
            name="body"
            rows={3}
            placeholder="O que aconteceu? O que foi discutido?"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
          />
        </div>

        {/* Resultado / Próximo passo */}
        <div>
          <label htmlFor="activity-outcome" className="block text-xs font-medium text-gray-700 mb-1">
            Resultado / Próximo passo
          </label>
          <textarea
            id="activity-outcome"
            name="outcome"
            rows={2}
            placeholder="Ex: Cliente pediu orçamento para 500L. Ligar na sexta."
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
          />
        </div>

        {/* Data e hora */}
        <div>
          <label htmlFor="activity-scheduled-at" className="block text-xs font-medium text-gray-700 mb-1">
            Data e hora
          </label>
          <input
            id="activity-scheduled-at"
            name="scheduled_at"
            type="datetime-local"
            defaultValue={toLocalDatetimeString(new Date())}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-red-500 focus:ring-1 focus:ring-red-500"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {isPending ? 'Registrando...' : 'Registrar atividade'}
        </button>
      </form>

      {/* Follow-up task link */}
      {showFollowUp && lastCreatedActivity && (
        <FollowUpTaskLink
          contactId={lastCreatedActivity.contactId}
          leadId={lastCreatedActivity.leadId}
          onDismiss={() => setShowFollowUp(false)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// FollowUpTaskLink — quick inline task creation after logging activity
// ---------------------------------------------------------------------------
function FollowUpTaskLink({
  contactId,
  leadId,
  onDismiss,
}: {
  contactId: string
  leadId?: string | null
  onDismiss: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [taskError, setTaskError] = useState<string | null>(null)
  const [created, setCreated] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  if (created) {
    return (
      <p className="mt-3 text-xs text-green-700 bg-green-50 rounded px-3 py-2">
        Tarefa criada com sucesso.{' '}
        <button type="button" onClick={onDismiss} className="underline">
          Fechar
        </button>
      </p>
    )
  }

  if (!expanded) {
    return (
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="text-xs font-medium text-red-600 hover:text-red-800"
        >
          + Criar tarefa de follow-up
        </button>
        <button type="button" onClick={onDismiss} className="text-xs text-gray-400 hover:text-gray-600">
          Dispensar
        </button>
      </div>
    )
  }

  async function handleCreateTask(formData: FormData) {
    setTaskError(null)
    startTransition(async () => {
      const { createTask } = await import('@/lib/actions/tasks')

      // Inject contact_id and lead_id
      formData.set('contact_id', contactId)
      if (leadId) formData.set('lead_id', leadId)
      formData.set('priority', 'medio')

      try {
        await createTask(formData)
        setCreated(true)
      } catch {
        setTaskError('Erro ao criar tarefa.')
      }
    })
  }

  return (
    <form ref={formRef} action={handleCreateTask} className="mt-3 space-y-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
      <p className="text-xs font-medium text-gray-700">Criar tarefa de follow-up</p>

      <input
        name="title"
        type="text"
        required
        placeholder="Título da tarefa (ex: Ligar para João na sexta)"
        className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
      />

      <input
        name="due_at"
        type="datetime-local"
        className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-red-500 focus:ring-1 focus:ring-red-500"
      />

      {taskError && <p className="text-xs text-red-600">{taskError}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {isPending ? 'Criando...' : 'Criar tarefa'}
        </button>
        <button
          type="button"
          onClick={() => { setExpanded(false); onDismiss() }}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
