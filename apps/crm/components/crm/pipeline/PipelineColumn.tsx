'use client'

import { useDroppable } from '@dnd-kit/core'
import DraggableLeadCard from './DraggableLeadCard'
import type { LeadCardData } from './LeadCard'

const STATUS_COLORS: Record<string, { dot: string; light: string; text: string }> = {
  novo:        { dot: 'var(--stage-prosp)',  light: 'var(--stage-prosp-light)',  text: 'var(--stage-prosp-text)' },
  contatado:   { dot: 'var(--stage-qual)',   light: 'var(--stage-qual-light)',   text: 'var(--stage-qual-text)' },
  qualificado: { dot: 'var(--color-info)',   light: 'var(--color-info-light)',   text: 'var(--color-info-text)' },
  proposta:    { dot: 'var(--stage-prop)',    light: 'var(--stage-prop-light)',   text: 'var(--stage-prop-text)' },
  negociacao:  { dot: 'var(--stage-neg)',     light: 'var(--stage-neg-light)',    text: 'var(--stage-neg-text)' },
  ganho:       { dot: 'var(--stage-won)',     light: 'var(--stage-won-light)',    text: 'var(--stage-won-text)' },
  perdido:     { dot: 'var(--stage-lost)',    light: 'var(--stage-lost-light)',   text: 'var(--stage-lost-text)' },
}

interface PipelineColumnProps {
  status: string
  label: string
  leads: LeadCardData[]
  activeId: string | null
}

export default function PipelineColumn({
  status,
  label,
  leads,
  activeId,
}: PipelineColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
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
        ref={setNodeRef}
        className={`kanban-drop-zone${isOver ? ' is-over' : ''}`}
      >
        {leads.map((lead) => (
          <DraggableLeadCard
            key={lead.id}
            lead={lead}
            isDragOverlay={lead.id === activeId}
          />
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
