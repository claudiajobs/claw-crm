import Link from 'next/link'
import LeadScoreBadge from '@/components/crm/leads/LeadScoreBadge'
import { IconBrandWhatsapp, IconBrandInstagram, IconPhone } from '@tabler/icons-react'

const CHANNEL_ICON: Record<string, React.ReactNode> = {
  whatsapp: <IconBrandWhatsapp size={14} stroke={1.5} aria-hidden style={{ color: 'var(--color-success)' }} />,
  instagram: <IconBrandInstagram size={14} stroke={1.5} aria-hidden style={{ color: 'var(--color-primary)' }} />,
  telefone: <IconPhone size={14} stroke={1.5} aria-hidden style={{ color: 'var(--color-gray-400)' }} />,
}

export interface LeadCardData {
  id: string
  title: string
  score: number
  value: number | null
  contact_name: string
  preferred_channel: string | null
}

interface LeadCardProps {
  lead: LeadCardData
}

export default function LeadCard({ lead }: LeadCardProps) {
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

      {lead.value != null && (
        <p style={{ marginTop: 6, fontSize: 13, fontWeight: 700, color: 'var(--color-gray-800)', letterSpacing: '-0.02em' }}>
          {Number(lead.value).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            maximumFractionDigits: 0,
          })}
        </p>
      )}
    </div>
  )
}
