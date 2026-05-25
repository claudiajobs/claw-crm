'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { closeLeadOutcome } from '@/lib/actions/pedidos'

interface LeadOutcomeProps {
  leadId: string
}

export default function LeadOutcome({ leadId }: LeadOutcomeProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showModal, setShowModal] = useState<'ganho' | 'perdido' | null>(null)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleClose() {
    if (!showModal) return
    if (showModal === 'perdido' && !reason.trim()) {
      setError('Informe o motivo')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await closeLeadOutcome(leadId, showModal, reason.trim())
        setShowModal(null)
        setReason('')
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao fechar lead')
      }
    })
  }

  return (
    <div className="card">
      <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-gray-800)', marginBottom: 12 }}>
        Fechar lead
      </h3>

      {error && (
        <p style={{ fontSize: 13, color: '#C44040', marginBottom: 12 }}>{error}</p>
      )}

      {!showModal ? (
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowModal('ganho')}
          >
            Fechar como Ganho
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setShowModal('perdido')}
            style={{ color: 'var(--color-danger)' }}
          >
            Fechar como Perdido
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: showModal === 'ganho' ? 'var(--color-teal)' : 'var(--color-danger)' }}>
            {showModal === 'ganho' ? 'Fechar como Ganho' : 'Fechar como Perdido'}
          </p>
          <textarea
            className="input"
            placeholder={showModal === 'ganho' ? 'Motivo (opcional)' : 'Motivo da perda...'}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            style={{ resize: 'vertical' }}
          />
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              className="btn btn-primary"
              disabled={isPending}
              onClick={handleClose}
            >
              {isPending ? 'Salvando...' : 'Confirmar'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={isPending}
              onClick={() => { setShowModal(null); setReason(''); setError(null) }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
