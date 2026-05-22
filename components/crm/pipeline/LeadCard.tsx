'use client'

import Link from 'next/link'
import LeadScoreBadge from '@/components/crm/leads/LeadScoreBadge'

const CHANNEL_ICON: Record<string, string> = {
  whatsapp: '💬',
  instagram: '📸',
  telefone: '📞',
}

const ALL_STATUSES = [
  { value: 'novo',        label: 'Novo' },
  { value: 'contatado',   label: 'Contatado' },
  { value: 'qualificado', label: 'Qualificado' },
  { value: 'proposta',    label: 'Proposta' },
  { value: 'negociacao',  label: 'Negociação' },
  { value: 'ganho',       label: 'Ganho' },
  { value: 'perdido',     label: 'Perdido' },
]

export interface LeadCardData {
  id: string
  title: string
  score: number
  value: number | null
  contact_name: string
  preferred_channel: string | null
  status: string
}

interface LeadCardProps {
  lead: LeadCardData
  onStatusChange?: (leadId: string, newStatus: string) => void
}

export default function LeadCard({ lead, onStatusChange }: LeadCardProps) {
  return (
    <div
      draggable
      data-lead-id={lead.id}
      className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm
                 hover:border-gray-300 hover:shadow transition-all cursor-grab active:cursor-grabbing
                 md:select-none"
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/leads/${lead.id}`}
          className="text-sm font-medium text-gray-900 hover:text-red-600 leading-snug line-clamp-2"
          onClick={(e) => e.stopPropagation()}
        >
          {lead.title}
        </Link>
        <LeadScoreBadge score={lead.score} />
      </div>

      <div className="mt-2 flex items-center gap-1.5">
        {lead.preferred_channel && (
          <span className="text-xs">{CHANNEL_ICON[lead.preferred_channel] ?? ''}</span>
        )}
        <span className="text-xs text-gray-500 truncate">{lead.contact_name}</span>
      </div>

      {lead.value != null && (
        <p className="mt-1.5 text-xs font-medium text-gray-700">
          {Number(lead.value).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            maximumFractionDigits: 0,
          })}
        </p>
      )}

      {/* Mobile-only status changer — hidden on md+ where DnD works */}
      {onStatusChange && (
        <div className="mt-2 md:hidden">
          <select
            value={lead.status}
            onChange={(e) => {
              e.stopPropagation()
              onStatusChange(lead.id, e.target.value)
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5
                       bg-gray-50 text-gray-700 focus:outline-none focus:ring-2
                       focus:ring-red-500 focus:border-transparent"
            aria-label="Mover lead para"
            style={{ fontSize: '16px' }} // prevent iOS Safari zoom
          >
            {ALL_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
