import LeadCard, { type LeadCardData } from './LeadCard'

const STATUS_COLORS: Record<string, { dot: string; light: string; text: string }> = {
  novo:        { dot: 'var(--stage-prosp)',  light: 'var(--stage-prosp-light)',  text: 'var(--stage-prosp-text)' },
  contatado:   { dot: 'var(--stage-qual)',   light: 'var(--stage-qual-light)',   text: 'var(--stage-qual-text)' },
  qualificado: { dot: 'var(--color-info)',   light: 'var(--color-info-light)',   text: '#1A5FAD' },
  proposta:    { dot: 'var(--stage-prop)',    light: 'var(--stage-prop-light)',   text: 'var(--stage-prop-text)' },
  negociacao:  { dot: 'var(--stage-neg)',     light: 'var(--stage-neg-light)',    text: 'var(--stage-neg-text)' },
  ganho:       { dot: 'var(--stage-won)',     light: 'var(--stage-won-light)',    text: 'var(--stage-won-text)' },
  perdido:     { dot: 'var(--stage-lost)',    light: 'var(--stage-lost-light)',   text: 'var(--stage-lost-text)' },
}

interface PipelineColumnProps {
  status: string
  label: string
  leads: LeadCardData[]
  onDrop: (leadId: string, targetStatus: string) => void
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void
}

export default function PipelineColumn({
  status,
  label,
  leads,
  onDrop,
  onDragOver,
}: PipelineColumnProps) {
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.novo

  return (
    <div className="kanban-col">
      {/* Column header */}
      <div className="kanban-col-header">
        <div className="kanban-col-dot" style={{ background: colors.dot }} />
        <span className="kanban-col-title">{label}</span>
        <span
          className="kanban-col-count"
          style={{ background: colors.light, color: colors.text }}
        >
          {leads.length}
        </span>
      </div>

      {/* Drop zone */}
      <div
        className="kanban-drop-zone"
        onDragOver={onDragOver}
        onDrop={(e) => {
          e.preventDefault()
          const leadId = e.dataTransfer.getData('leadId')
          if (leadId) onDrop(leadId, status)
        }}
      >
        {leads.map((lead) => (
          <div
            key={lead.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('leadId', lead.id)
              e.dataTransfer.effectAllowed = 'move'
            }}
          >
            <LeadCard lead={lead} />
          </div>
        ))}
        {leads.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 48, fontSize: 11, color: 'var(--color-gray-400)' }}>
            Solte aqui
          </div>
        )}
      </div>
    </div>
  )
}
