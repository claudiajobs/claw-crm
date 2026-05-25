'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { approvePedido, rejectPedido } from '@/lib/actions/pedidos'

interface PedidoActionsProps {
  pedidoId: string
  userId: string
}

export default function PedidoActions({ pedidoId, userId }: PedidoActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleApprove() {
    setError(null)
    startTransition(async () => {
      try {
        await approvePedido(pedidoId, userId)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao aprovar')
      }
    })
  }

  function handleReject() {
    if (!rejectReason.trim()) {
      setError('Informe o motivo da rejeição')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await rejectPedido(pedidoId, userId, rejectReason.trim())
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao rejeitar')
      }
    })
  }

  return (
    <div className="card">
      <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-gray-800)', marginBottom: 12 }}>
        Ações de aprovação
      </h3>

      {error && (
        <p style={{ fontSize: 13, color: '#C44040', marginBottom: 12 }}>{error}</p>
      )}

      {!showRejectForm ? (
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="button"
            className="btn btn-primary"
            disabled={isPending}
            onClick={handleApprove}
          >
            {isPending ? 'Aprovando...' : 'Aprovar pedido'}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={isPending}
            onClick={() => setShowRejectForm(true)}
            style={{ color: 'var(--color-danger)' }}
          >
            Rejeitar
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <textarea
            className="input"
            placeholder="Motivo da rejeição..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
            style={{ resize: 'vertical' }}
          />
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={isPending}
              onClick={handleReject}
              style={{ color: 'var(--color-danger)' }}
            >
              {isPending ? 'Rejeitando...' : 'Confirmar rejeição'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={isPending}
              onClick={() => { setShowRejectForm(false); setRejectReason('') }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
