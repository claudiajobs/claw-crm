'use client'

import { useOptimistic, useTransition, useEffect, useState, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import PipelineColumn from './PipelineColumn'
import LeadCard, { type LeadCardData } from './LeadCard'
import { updateLeadStatus } from '@/lib/actions/leads'
import { createClient } from '@/lib/supabase/client'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

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

interface LeadPayload {
  id: string
  title: string
  status: string
  score: number | null
  value: number | null
}

export default function PipelineBoard({ leads: initialLeads }: PipelineBoardProps) {
  const [, startTransition] = useTransition()
  const [liveLeads, setLiveLeads] = useState(initialLeads)
  const [isLive, setIsLive] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  // Sync server-rendered leads on navigation
  useEffect(() => {
    setLiveLeads(initialLeads)
  }, [initialLeads])

  const handleRealtimeChange = useCallback(
    (payload: RealtimePostgresChangesPayload<LeadPayload>) => {
      if (payload.eventType === 'INSERT') {
        const row = payload.new
        setLiveLeads((prev) => {
          if (prev.some((l) => l.id === row.id)) return prev
          return [
            ...prev,
            {
              id: row.id,
              title: row.title,
              status: row.status,
              score: row.score ?? 0,
              value: row.value != null ? Number(row.value) : null,
              contact_name: '\u2014',
              preferred_channel: null,
            },
          ]
        })
      } else if (payload.eventType === 'UPDATE') {
        const row = payload.new
        setLiveLeads((prev) =>
          prev.map((l) =>
            l.id === row.id
              ? { ...l, status: row.status, score: row.score ?? l.score, value: row.value != null ? Number(row.value) : l.value }
              : l
          )
        )
      }
    },
    []
  )

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('leads-realtime')
      .on<LeadPayload>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'leads' },
        handleRealtimeChange
      )
      .on<LeadPayload>(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'leads' },
        handleRealtimeChange
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [handleRealtimeChange])

  const [optimisticLeads, moveLeadOptimistic] = useOptimistic(
    liveLeads,
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

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over) return
    handleDrop(active.id as string, over.id as string)
  }

  const activeLead = activeId
    ? optimisticLeads.find((l) => l.id === activeId) ?? null
    : null

  return (
    <div>
      {/* Live badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        {isLive && (
          <span className="badge badge-teal" style={{ gap: 6 }}>
            <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8 }}>
              <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--color-success)', opacity: 0.4, animation: 'pulse 1.5s infinite' }} />
              <span style={{ position: 'relative', display: 'inline-flex', width: 8, height: 8, borderRadius: '50%', background: 'var(--color-success)' }} />
            </span>
            Ao vivo
          </span>
        )}
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="kanban-board">
          {COLUMNS.map(({ status, label }) => (
            <PipelineColumn
              key={status}
              status={status}
              label={label}
              leads={optimisticLeads.filter((l) => l.status === status)}
              activeId={activeId}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {activeLead ? (
            <div style={{ width: 220, opacity: 0.9 }}>
              <LeadCard lead={activeLead} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
