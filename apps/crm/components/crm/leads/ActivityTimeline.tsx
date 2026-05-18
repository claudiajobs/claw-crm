'use client'

import { useOptimistic, useState, useTransition } from 'react'
import { updateActivity, deleteActivity } from '@/lib/actions/activities'
import type { ActivityType } from '@/lib/actions/activities'
import {
  IconNote, IconPhone, IconCalendar, IconCheckbox,
  IconBrandInstagram, IconBrandWhatsapp, IconRobot, IconClipboard,
  IconEdit, IconTrash,
} from '@tabler/icons-react'

// ---------------------------------------------------------------------------
// Maps
// ---------------------------------------------------------------------------
const TYPE_LABEL: Record<string, string> = {
  nota: 'Nota',
  ligacao: 'Ligação',
  reuniao: 'Reunião',
  tarefa: 'Tarefa',
  instagram_dm_enviado: 'DM Instagram (enviado)',
  instagram_dm_recebido: 'DM Instagram (recebido)',
  whatsapp_enviado: 'WhatsApp (enviado)',
  whatsapp_recebido: 'WhatsApp (recebido)',
  acao_sdr: 'Ação SDR',
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  nota: <IconNote size={16} stroke={1.5} aria-hidden />,
  ligacao: <IconPhone size={16} stroke={1.5} aria-hidden />,
  reuniao: <IconCalendar size={16} stroke={1.5} aria-hidden />,
  tarefa: <IconCheckbox size={16} stroke={1.5} aria-hidden />,
  instagram_dm_enviado: <IconBrandInstagram size={16} stroke={1.5} aria-hidden />,
  instagram_dm_recebido: <IconBrandInstagram size={16} stroke={1.5} aria-hidden />,
  whatsapp_enviado: <IconBrandWhatsapp size={16} stroke={1.5} aria-hidden />,
  whatsapp_recebido: <IconBrandWhatsapp size={16} stroke={1.5} aria-hidden />,
  acao_sdr: <IconRobot size={16} stroke={1.5} aria-hidden />,
}

const EDITABLE_TYPES: { value: ActivityType; label: string }[] = [
  { value: 'nota', label: 'Nota' },
  { value: 'ligacao', label: 'Ligação' },
  { value: 'reuniao', label: 'Reunião' },
  { value: 'whatsapp_enviado', label: 'WhatsApp (enviado)' },
  { value: 'whatsapp_recebido', label: 'WhatsApp (recebido)' },
  { value: 'instagram_dm_enviado', label: 'DM Instagram (enviado)' },
  { value: 'instagram_dm_recebido', label: 'DM Instagram (recebido)' },
]

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface Activity {
  id: string
  type: string
  subject: string | null
  body: string | null
  outcome: string | null
  created_at: string
  performed_by: string | null
  performed_by_robot: string | null
  users: { first_name: string; last_name: string | null } | null
}

interface ActivityTimelineProps {
  activities: Activity[]
  currentUserId: string
}

type OptimisticAction =
  | { type: 'delete'; id: string }
  | { type: 'update'; id: string; fields: Partial<Activity> }
  | { type: 'add'; activity: Activity }

function reduceActivities(state: Activity[], action: OptimisticAction): Activity[] {
  switch (action.type) {
    case 'delete':
      return state.filter((a) => a.id !== action.id)
    case 'update':
      return state.map((a) =>
        a.id === action.id ? { ...a, ...action.fields } : a
      )
    case 'add':
      return [action.activity, ...state]
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function ActivityTimeline({ activities, currentUserId }: ActivityTimelineProps) {
  const [optimisticActivities, addOptimistic] = useOptimistic(activities, reduceActivities)

  if (optimisticActivities.length === 0) {
    return (
      <p style={{ fontSize: 13, color: 'var(--color-gray-400)', padding: '16px 0', textAlign: 'center' }}>
        Nenhuma atividade ainda. Registre a primeira abaixo.
      </p>
    )
  }

  return (
    <ol style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {optimisticActivities.map((act) => (
        <ActivityItem
          key={act.id}
          activity={act}
          currentUserId={currentUserId}
          addOptimistic={addOptimistic}
        />
      ))}
    </ol>
  )
}

// ---------------------------------------------------------------------------
// ActivityItem
// ---------------------------------------------------------------------------
function ActivityItem({
  activity: act,
  currentUserId,
  addOptimistic,
}: {
  activity: Activity
  currentUserId: string
  addOptimistic: (action: OptimisticAction) => void
}) {
  const isOwner = act.performed_by === currentUserId
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [editType, setEditType] = useState(act.type)
  const [editSubject, setEditSubject] = useState(act.subject ?? '')
  const [editBody, setEditBody] = useState(act.body ?? '')
  const [editOutcome, setEditOutcome] = useState(act.outcome ?? '')

  const performedBy = act.performed_by_robot
    ? `${act.performed_by_robot}`
    : act.users
    ? [act.users.first_name, act.users.last_name].filter(Boolean).join(' ')
    : '—'

  function handleStartEdit() {
    setEditType(act.type)
    setEditSubject(act.subject ?? '')
    setEditBody(act.body ?? '')
    setEditOutcome(act.outcome ?? '')
    setEditing(true)
    setError(null)
  }

  function handleCancelEdit() {
    setEditing(false)
    setError(null)
  }

  function handleSave() {
    const fields = {
      type: editType as ActivityType,
      subject: editSubject.trim() || null,
      body: editBody.trim() || null,
      outcome: editOutcome.trim() || null,
    }

    startTransition(async () => {
      addOptimistic({ type: 'update', id: act.id, fields })
      setEditing(false)

      const result = await updateActivity(act.id, fields)
      if (result.error) {
        setError(result.error)
        setEditing(true)
      }
    })
  }

  function handleDelete() {
    startTransition(async () => {
      addOptimistic({ type: 'delete', id: act.id })
      setConfirmDelete(false)

      const result = await deleteActivity(act.id)
      if (result.error) {
        setError(result.error)
      }
    })
  }

  // ---- Edit mode ----
  if (editing) {
    return (
      <li style={{ display: 'flex', gap: 12, background: 'var(--color-gray-50)', borderRadius: 'var(--radius-sm)', padding: 12, border: '0.5px solid var(--color-gray-200)', listStyle: 'none' }}>
        <div style={{ marginTop: 2, flexShrink: 0, color: 'var(--color-gray-400)' }}>
          {TYPE_ICON[editType] ?? <IconClipboard size={16} stroke={1.5} aria-hidden />}
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <select value={editType} onChange={(e) => setEditType(e.target.value)} className="input" style={{ height: 34 }}>
            {EDITABLE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <input type="text" value={editSubject} onChange={(e) => setEditSubject(e.target.value)} placeholder="Assunto" className="input" style={{ height: 34 }} />
          <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={3} placeholder="Descrição" className="input" />
          <textarea value={editOutcome} onChange={(e) => setEditOutcome(e.target.value)} rows={2} placeholder="Resultado / Próximo passo" className="input" />

          {error && <p style={{ fontSize: 11, color: '#C44040' }}>{error}</p>}

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={handleSave} disabled={isPending} className="btn btn-sm btn-primary" style={{ opacity: isPending ? 0.5 : 1 }}>
              Salvar
            </button>
            <button type="button" onClick={handleCancelEdit} className="btn btn-sm btn-ghost">
              Cancelar
            </button>
          </div>
        </div>
      </li>
    )
  }

  // ---- View mode ----
  return (
    <li style={{ display: 'flex', gap: 12, listStyle: 'none' }}>
      <div style={{ marginTop: 2, flexShrink: 0, color: 'var(--color-gray-400)' }}>
        {TYPE_ICON[act.type] ?? <IconClipboard size={16} stroke={1.5} aria-hidden />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-gray-800)' }}>
            {TYPE_LABEL[act.type] ?? act.type}
          </span>
          {act.subject && (
            <span style={{ fontSize: 11, color: 'var(--color-gray-400)' }}>— {act.subject}</span>
          )}
          <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--color-gray-400)' }}>
            {new Date(act.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {act.body && (
          <p style={{ marginTop: 4, fontSize: 13, color: 'var(--color-gray-600)', whiteSpace: 'pre-wrap' }}>{act.body}</p>
        )}

        {act.outcome && (
          <p style={{ marginTop: 4, fontSize: 11, color: '#007A61', background: 'var(--color-success-light)', borderRadius: 'var(--radius-xs)', padding: '4px 8px', display: 'inline-block' }}>
            <span style={{ fontWeight: 600 }}>Resultado:</span> {act.outcome}
          </p>
        )}

        <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 11, color: 'var(--color-gray-400)' }}>
            {act.performed_by_robot && <IconRobot size={12} stroke={1.5} aria-hidden style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />}
            {performedBy}
          </p>

          {isOwner && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button type="button" onClick={handleStartEdit} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--color-gray-400)', background: 'none', border: 'none', cursor: 'pointer' }}>
                <IconEdit size={12} stroke={1.5} aria-hidden /> Editar
              </button>

              {!confirmDelete ? (
                <button type="button" onClick={() => setConfirmDelete(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--color-gray-400)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <IconTrash size={12} stroke={1.5} aria-hidden /> Deletar
                </button>
              ) : (
                <span style={{ fontSize: 11, color: 'var(--color-gray-600)' }}>
                  Tem certeza?{' '}
                  <button type="button" onClick={handleDelete} disabled={isPending} style={{ fontWeight: 600, color: '#C44040', background: 'none', border: 'none', cursor: 'pointer', opacity: isPending ? 0.5 : 1 }}>
                    Sim
                  </button>
                  {' / '}
                  <button type="button" onClick={() => setConfirmDelete(false)} style={{ fontWeight: 600, color: 'var(--color-gray-600)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    Não
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {error && <p style={{ marginTop: 4, fontSize: 11, color: '#C44040' }}>{error}</p>}
      </div>
    </li>
  )
}
