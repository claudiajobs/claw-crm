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
    <div className="card">
      <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-gray-800)', marginBottom: 16 }}>Registrar atividade</h3>

      <form ref={formRef} action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <input type="hidden" name="contact_id" value={contactId} />
        {leadId && <input type="hidden" name="lead_id" value={leadId} />}

        <div className="field">
          <label htmlFor="activity-type" className="field-label">Tipo</label>
          <select id="activity-type" name="type" required defaultValue="nota" className="input">
            {ACTIVITY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="activity-subject" className="field-label">Assunto</label>
          <input id="activity-subject" name="subject" type="text" placeholder="Ex: Primeiro contato, Follow-up, Proposta enviada" className="input" />
        </div>

        <div className="field">
          <label htmlFor="activity-body" className="field-label">Descrição</label>
          <textarea id="activity-body" name="body" rows={3} placeholder="O que aconteceu? O que foi discutido?" className="input" />
        </div>

        <div className="field">
          <label htmlFor="activity-outcome" className="field-label">Resultado / Próximo passo</label>
          <textarea id="activity-outcome" name="outcome" rows={2} placeholder="Ex: Cliente pediu orçamento para 500L. Ligar na sexta." className="input" />
        </div>

        <div className="field">
          <label htmlFor="activity-scheduled-at" className="field-label">Data e hora</label>
          <input id="activity-scheduled-at" name="scheduled_at" type="datetime-local" defaultValue={toLocalDatetimeString(new Date())} className="input" />
        </div>

        {error && <p className="field-error">{error}</p>}

        <button type="submit" disabled={isPending} className="btn btn-primary" style={{ alignSelf: 'flex-start', opacity: isPending ? 0.5 : 1 }}>
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
// FollowUpTaskLink
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
      <p style={{ marginTop: 12, fontSize: 11, color: '#007A61', background: 'var(--color-success-light)', borderRadius: 'var(--radius-xs)', padding: '6px 12px' }}>
        Tarefa criada com sucesso.{' '}
        <button type="button" onClick={onDismiss} style={{ textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 'inherit' }}>
          Fechar
        </button>
      </p>
    )
  }

  if (!expanded) {
    return (
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          onClick={() => setExpanded(true)}
          style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          + Criar tarefa de follow-up
        </button>
        <button type="button" onClick={onDismiss} style={{ fontSize: 11, color: 'var(--color-gray-400)', background: 'none', border: 'none', cursor: 'pointer' }}>
          Dispensar
        </button>
      </div>
    )
  }

  async function handleCreateTask(formData: FormData) {
    setTaskError(null)
    startTransition(async () => {
      const { createTask } = await import('@/lib/actions/tasks')

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
    <form ref={formRef} action={handleCreateTask} style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--color-gray-50)', borderRadius: 'var(--radius-sm)', padding: 12, border: '0.5px solid var(--color-gray-200)' }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-gray-800)' }}>Criar tarefa de follow-up</p>

      <input name="title" type="text" required placeholder="Título da tarefa (ex: Ligar para João na sexta)" className="input" style={{ height: 34 }} />
      <input name="due_at" type="datetime-local" className="input" style={{ height: 34 }} />

      {taskError && <p style={{ fontSize: 11, color: '#C44040' }}>{taskError}</p>}

      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={isPending} className="btn btn-sm btn-primary" style={{ opacity: isPending ? 0.5 : 1 }}>
          {isPending ? 'Criando...' : 'Criar tarefa'}
        </button>
        <button type="button" onClick={() => { setExpanded(false); onDismiss() }} className="btn btn-sm btn-ghost">
          Cancelar
        </button>
      </div>
    </form>
  )
}
