'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { IconBan } from '@tabler/icons-react'
import { cancelPedido } from '@/lib/actions/pedidos'

interface CancelPedidoButtonProps {
  pedidoId: string
}

export default function CancelPedidoButton({ pedidoId }: CancelPedidoButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleConfirm() {
    setError(null)
    startTransition(async () => {
      try {
        await cancelPedido(pedidoId)
        setShowConfirm(false)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao cancelar pedido')
      }
    })
  }

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => { setError(null); setShowConfirm(true) }}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-danger)' }}
      >
        <IconBan size={16} stroke={1.5} aria-hidden />
        Cancelar pedido
      </button>

      {showConfirm && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isPending) setShowConfirm(false)
          }}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.4)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: 16,
          }}
        >
          <div className="card" style={{ width: '100%', maxWidth: 420 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-gray-800)', marginBottom: 8 }}>
              Cancelar pedido?
            </h3>
            <p style={{ fontSize: 13, color: 'var(--color-gray-600)', marginBottom: 16 }}>
              O pedido será marcado como cancelado e a aprovação será removida.
              Esta ação não pode ser desfeita.
            </p>
            {error && (
              <p style={{ fontSize: 13, color: '#C44040', marginBottom: 12 }}>{error}</p>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                className="btn btn-ghost"
                disabled={isPending}
                onClick={() => setShowConfirm(false)}
              >
                Voltar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={isPending}
                onClick={handleConfirm}
              >
                {isPending ? 'Cancelando...' : 'Sim, cancelar pedido'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
