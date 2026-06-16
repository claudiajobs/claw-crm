'use client'

import Link from 'next/link'
import LeadScoreBadge from '@/components/crm/leads/LeadScoreBadge'
import { IconBrandWhatsapp, IconBrandInstagram, IconPhone } from '@tabler/icons-react'

const CHANNEL_ICON: Record<string, React.ReactNode> = {
  whatsapp: <IconBrandWhatsapp size={14} stroke={1.5} aria-hidden style={{ color: 'var(--color-success)' }} />,
  instagram: <IconBrandInstagram size={14} stroke={1.5} aria-hidden style={{ color: 'var(--color-primary)' }} />,
  telefone: <IconPhone size={14} stroke={1.5} aria-hidden style={{ color: 'var(--color-gray-400)' }} />,
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
  owner_name: string | null
}

interface LeadCardProps {
  lead: LeadCardData
  onStatusChange?: (leadId: string, newStatus: string) => void
}

export default function LeadCard({ lead, onStatusChange }: LeadCardProps) {
  return (
    <div className="deal-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <Link
          href={`/leads/${lead.id}`}
          style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-gray-800)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textDecoration: 'none' }}
          onClick={(e) => e.stopPropagation()}
        >
          {lead.title}
        </Link>
        <LeadScoreBadge score={lead.score} />
      </div>

      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
        {lead.preferred_channel && CHANNEL_ICON[lead.preferred_channel]}
        <span style={{ fontSize: 11, color: 'var(--color-gray-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {lead.contact_name}
        </span>
      </div>

      <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
        {lead.owner_name ? (
          <>
            <div
              className="avatar avatar-purple"
              style={{ width: 20, height: 20, fontSize: 8 }}
              title={lead.owner_name}
            >
              {lead.owner_name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()}
            </div>
            <span style={{ fontSize: 10, color: 'var(--color-gray-400)' }}>{lead.owner_name}</span>
          </>
        ) : (
          <span style={{ fontSize: 10, color: 'var(--color-gray-300)' }}>—</span>
        )}
      </div>

      {lead.value != null && (
        <p style={{ marginTop: 6, fontSize: 13, fontWeight: 700, color: 'var(--color-gray-800)', letterSpacing: '-0.02em' }}>
          {Number(lead.value).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            maximumFractionDigits: 0,
          })}
        </p>
      )}

      {/* Mobile: status dropdown */}
      {onStatusChange && (
        <select
          className="mt-2 w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 md:hidden"
          value={lead.status}
          onChange={(e) => onStatusChange(lead.id, e.target.value)}
        >
          {ALL_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      )}
    </div>
  )
}
