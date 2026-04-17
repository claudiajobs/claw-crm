'use client'

import { useOptimistic, useState, useTransition } from 'react'
import { updateActivity, deleteActivity } from '@/lib/actions/activities'
import type { ActivityType } from '@/lib/actions/activities'

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

const TYPE_ICON: Record<string, string> = {
  nota: '📝',
  ligacao: '📞',
  reuniao: '🗓',
  tarefa: '✅',
  instagram_dm_enviado: '📸',
  instagram_dm_recebido: '📸',
  whatsapp_enviado: '💬',
  whatsapp_recebido: '💬',
  acao_sdr: '🤖',
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
      <p className="text-sm text-gray-400 py-4 text-center">
        Nenhuma atividade ainda. Registre a primeira abaixo.
      </p>
    )
  }

  return (
    <ol className="space-y-4">
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
// ActivityItem — single activity row with edit/delete
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

  // Edit state
  const [editType, setEditType] = useState(act.type)
  const [editSubject, setEditSubject] = useState(act.subject ?? '')
  const [editBody, setEditBody] = useState(act.body ?? '')
  const [editOutcome, setEditOutcome] = useState(act.outcome ?? '')

  const performedBy = act.performed_by_robot
    ? `🤖 ${act.performed_by_robot}`
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
      addOptimistic({
        type: 'update',
        id: act.id,
        fields,
      })
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
      <li className="flex gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
        <div className="mt-0.5 flex-shrink-0 text-lg leading-none">
          {TYPE_ICON[editType] ?? '📋'}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <select
            value={editType}
            onChange={(e) => setEditType(e.target.value)}
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-red-500 focus:ring-1 focus:ring-red-500"
          >
            {EDITABLE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={editSubject}
            onChange={(e) => setEditSubject(e.target.value)}
            placeholder="Assunto"
            className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
          />

          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            rows={3}
            placeholder="Descrição"
            className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
          />

          <textarea
            value={editOutcome}
            onChange={(e) => setEditOutcome(e.target.value)}
            rows={2}
            placeholder="Resultado / Próximo passo"
            className="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500"
          />

          {error && <p className="text-xs text-red-600">{error}</p>}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              Salvar
            </button>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      </li>
    )
  }

  // ---- View mode ----
  return (
    <li className="flex gap-3">
      <div className="mt-0.5 flex-shrink-0 text-lg leading-none">
        {TYPE_ICON[act.type] ?? '📋'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-gray-700">
            {TYPE_LABEL[act.type] ?? act.type}
          </span>
          {act.subject && (
            <span className="text-xs text-gray-500">— {act.subject}</span>
          )}
          <span className="ml-auto text-xs text-gray-400">
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
          <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{act.body}</p>
        )}

        {act.outcome && (
          <p className="mt-1 text-xs text-emerald-700 bg-emerald-50 rounded px-2 py-1 inline-block">
            <span className="font-medium">Resultado:</span> {act.outcome}
          </p>
        )}

        <div className="mt-1 flex items-center gap-3 flex-wrap">
          <p className="text-xs text-gray-400">{performedBy}</p>

          {isOwner && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleStartEdit}
                className="text-xs text-gray-400 hover:text-gray-700"
              >
                ✏️ Editar
              </button>

              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="text-xs text-gray-400 hover:text-red-600"
                >
                  🗑 Deletar
                </button>
              ) : (
                <span className="text-xs text-gray-600">
                  Tem certeza?{' '}
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isPending}
                    className="font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    Sim
                  </button>
                  {' / '}
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="font-medium text-gray-600 hover:text-gray-800"
                  >
                    Não
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
    </li>
  )
}
