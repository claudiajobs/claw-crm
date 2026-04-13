'use client'

import { useOptimistic, useTransition } from 'react'
import PipelineColumn from './PipelineColumn'
import type { LeadCardData } from './LeadCard'
import { updateLeadStatus } from '@/lib/actions/leads'

const COLUMNS: Array<{ status: string; label: string }> = [
  { status: 'novo', label: 'Novo' },
  { status: 'contatado', label: 'Contatado' },
  { status: 'qualificado', label: 'Qualificado' },
  { status: 'proposta', label: 'Proposta' },
  { status: 'negociacao', label: 'Negociação' },
  { status: 'ganho', label: 'Ganho' },
  { status: 'perdido', label: 'Perdido' },
]

type LeadWithStatus = LeadCardData & { status: string }

interface PipelineBoardProps {
  leads: LeadWithStatus[]
}

export default function PipelineBoard({ leads }: PipelineBoardProps) {
  const [, startTransition] = useTransition()

  const [optimisticLeads, moveLeadOptimistic] = useOptimistic(
    leads,
    (current, { leadId, newStatus }: { leadId: string; newStatus: string }) =>
      current.map((l) => (l.id === leadId ? { ...l, status: newStatus } : l))
  )

  function handleDrop(leadId: string, targetStatus: string) {
    const lead = optimisticLeads.find((l) => l.id === leadId)
    if (!lead || lead.status === targetStatus) return

    startTransition(async () => {
      moveLeadOptimistic({ leadId, newStatus: targetStatus })
      await updateLeadStatus(
        leadId,
        targetStatus as
          | 'novo'
          | 'contatado'
          | 'qualificado'
          | 'proposta'
          | 'negociacao'
          | 'ganho'
          | 'perdido'
      )
    })
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {COLUMNS.map(({ status, label }) => (
        <PipelineColumn
          key={status}
          status={status}
          label={label}
          leads={optimisticLeads.filter((l) => l.status === status)}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        />
      ))}
    </div>
  )
}
