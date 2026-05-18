'use client'

import { useDraggable } from '@dnd-kit/core'
import LeadCard, { type LeadCardData } from './LeadCard'

interface DraggableLeadCardProps {
  lead: LeadCardData
  isDragOverlay: boolean
}

export default function DraggableLeadCard({ lead, isDragOverlay }: DraggableLeadCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: lead.id,
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        opacity: isDragging || isDragOverlay ? 0.45 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
    >
      <LeadCard lead={lead} />
    </div>
  )
}
