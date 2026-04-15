'use client'

import { useOptimistic, useTransition, useEffect, useState, useCallback } from 'react'
import PipelineColumn from './PipelineColumn'
import type { LeadCardData } from './LeadCard'
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

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  return (
    <div>
      {/* Live badge */}
      <div className="flex items-center gap-2 mb-3">
        {isLive && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-2.5 py-0.5 text-xs font-medium text-green-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            Ao vivo
          </span>
        )}
      </div>

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
    </div>
  )
}
