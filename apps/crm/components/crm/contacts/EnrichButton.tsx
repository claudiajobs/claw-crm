'use client'

import { useState, useTransition } from 'react'
import { triggerEnrichment } from '@/lib/actions/enrichment'
import { IconSparkles, IconCheck, IconClock } from '@tabler/icons-react'

interface EnrichButtonProps {
  contactId: string
  enrichedAt: string | null
}

export default function EnrichButton({ contactId, enrichedAt }: EnrichButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null)

  if (enrichedAt) {
    const date = new Date(enrichedAt).toLocaleDateString('pt-BR')
    return (
      <span className="badge badge-teal" style={{ gap: 6, padding: '4px 10px' }}>
        <IconCheck size={12} stroke={1.5} aria-hidden />
        Enriquecido em {date}
      </span>
    )
  }

  function handleClick() {
    startTransition(async () => {
      const res = await triggerEnrichment(contactId)
      setResult(res)
    })
  }

  if (result?.success) {
    return (
      <span className="badge badge-amber" style={{ gap: 6, padding: '4px 10px' }}>
        <IconClock size={12} stroke={1.5} aria-hidden />
        Enriquecimento solicitado
      </span>
    )
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="btn btn-sm btn-ghost"
        style={{ opacity: isPending ? 0.5 : 1 }}
      >
        <IconSparkles size={14} stroke={1.5} aria-hidden />
        {isPending ? 'Enriquecendo...' : 'Enriquecer contato'}
      </button>
      {result?.error && (
        <span style={{ fontSize: 11, color: '#C44040' }}>{result.error}</span>
      )}
    </div>
  )
}
