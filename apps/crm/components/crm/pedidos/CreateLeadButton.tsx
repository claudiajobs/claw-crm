'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { IconTargetArrow } from '@tabler/icons-react'
import { createLeadFromPedido } from '@/lib/actions/leads'

interface CreateLeadButtonProps {
  pedidoId: string
}

export default function CreateLeadButton({ pedidoId }: CreateLeadButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    setError(null)
    startTransition(async () => {
      try {
        const { leadId } = await createLeadFromPedido(pedidoId)
        router.push(`/leads/${leadId}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao criar lead')
      }
    })
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost"
        disabled={isPending}
        onClick={handleClick}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
      >
        <IconTargetArrow size={16} stroke={1.5} aria-hidden />
        {isPending ? 'Criando lead...' : 'Criar lead'}
      </button>

      {error && (
        <p style={{ fontSize: 13, color: '#C44040' }}>{error}</p>
      )}
    </>
  )
}
