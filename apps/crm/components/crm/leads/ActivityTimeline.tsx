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

interface Activity {
  id: string
  type: string
  subject: string | null
  body: string | null
  outcome: string | null
  created_at: string
  performed_by_robot: string | null
  users: { first_name: string; last_name: string | null } | null
}

interface ActivityTimelineProps {
  activities: Activity[]
}

export default function ActivityTimeline({ activities }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <p className="text-sm text-gray-400 py-4 text-center">
        Nenhuma atividade registrada ainda.
      </p>
    )
  }

  return (
    <ol className="space-y-4">
      {activities.map((act) => {
        const performedBy = act.performed_by_robot
          ? `🤖 ${act.performed_by_robot}`
          : act.users
          ? [act.users.first_name, act.users.last_name].filter(Boolean).join(' ')
          : '—'

        return (
          <li key={act.id} className="flex gap-3">
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
                <p className="mt-0.5 text-xs text-gray-500">
                  <span className="font-medium">Resultado:</span> {act.outcome}
                </p>
              )}
              <p className="mt-0.5 text-xs text-gray-400">{performedBy}</p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
