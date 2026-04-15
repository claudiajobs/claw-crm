'use client'

import { useState, useTransition } from 'react'
import { triggerEnrichment } from '@/lib/actions/enrichment'

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
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">
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
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-1.5 text-xs font-medium text-yellow-700">
        Enriquecimento solicitado
      </span>
    )
  }

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white
                   px-3 py-1.5 text-xs font-semibold text-gray-700
                   hover:bg-gray-50 disabled:opacity-50 transition-colors"
      >
        {isPending ? 'Enriquecendo...' : 'Enriquecer contato'}
      </button>
      {result?.error && (
        <span className="text-xs text-red-600">{result.error}</span>
      )}
    </div>
  )
}
