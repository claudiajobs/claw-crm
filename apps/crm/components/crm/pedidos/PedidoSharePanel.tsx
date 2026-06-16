'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { IconShare, IconX, IconPlus, IconSearch } from '@tabler/icons-react'
import { sharePedido, unsharePedido } from '@/lib/actions/pedido-shares'

interface Share {
  id: string
  sharedWith: string
  userName: string
  userEmail: string
}

interface User {
  id: string
  name: string | null
  email: string
}

interface PedidoSharePanelProps {
  pedidoId: string
  shares: Share[]
  allUsers: User[]
  ownerId: string
}

export default function PedidoSharePanel({ pedidoId, shares, allUsers, ownerId }: PedidoSharePanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

  const sharedIds = new Set(shares.map((s) => s.sharedWith))

  const available = useMemo(() => {
    const candidates = allUsers.filter(
      (u) => !sharedIds.has(u.id) && u.id !== ownerId
    )
    if (!search.trim()) return candidates
    const q = search.toLowerCase()
    return candidates.filter(
      (u) =>
        (u.name?.toLowerCase().includes(q)) ||
        u.email.toLowerCase().includes(q)
    )
  }, [allUsers, sharedIds, ownerId, search])

  function handleAdd(userId: string) {
    setError(null)
    startTransition(async () => {
      try {
        await sharePedido(pedidoId, [userId])
        setSearch('')
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao compartilhar')
      }
    })
  }

  function handleRemove(userId: string) {
    setError(null)
    startTransition(async () => {
      try {
        await unsharePedido(pedidoId, userId)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao remover')
      }
    })
  }

  if (!open) {
    return (
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => setOpen(true)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
      >
        <IconShare size={16} stroke={1.5} aria-hidden />
        Compartilhar
        {shares.length > 0 && (
          <span className="badge badge-purple" style={{ marginLeft: 4 }}>
            {shares.length}
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-gray-800)' }}>
          Compartilhar pedido
        </h3>
        <button
          type="button"
          className="btn btn-icon btn-ghost"
          onClick={() => { setOpen(false); setSearch(''); setError(null) }}
          aria-label="Fechar"
        >
          <IconX size={16} stroke={1.5} />
        </button>
      </div>

      {error && (
        <p style={{ fontSize: 13, color: '#C44040', marginBottom: 12 }}>{error}</p>
      )}

      {/* Current shares */}
      {shares.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
            Com acesso
          </p>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {shares.map((s) => (
              <li key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '6px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'var(--color-primary-light)', color: 'var(--color-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, flexShrink: 0,
                    }}
                  >
                    {(s.userName[0] ?? '?').toUpperCase()}
                  </span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-gray-800)', lineHeight: 1.2 }}>
                      {s.userName}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--color-gray-400)', lineHeight: 1.2 }}>
                      {s.userEmail}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-ghost"
                  disabled={isPending}
                  onClick={() => handleRemove(s.sharedWith)}
                  style={{ color: 'var(--color-danger)', flexShrink: 0 }}
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Add user */}
      <div>
        <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-gray-400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
          Adicionar pessoa
        </p>
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <IconSearch
            size={14} stroke={1.5}
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-400)', pointerEvents: 'none' }}
          />
          <input
            className="input"
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 30, fontSize: 13 }}
          />
        </div>

        {available.length === 0 ? (
          <p style={{ fontSize: 12, color: 'var(--color-gray-400)', padding: '8px 0' }}>
            {search.trim() ? 'Nenhum usuário encontrado.' : 'Todos os usuários já têm acesso.'}
          </p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {available.slice(0, 10).map((u) => (
              <li
                key={u.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                  padding: '6px 8px', borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'var(--color-gray-100)', color: 'var(--color-gray-500)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, flexShrink: 0,
                    }}
                  >
                    {((u.name?.[0]) ?? u.email[0] ?? '?').toUpperCase()}
                  </span>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-gray-800)', lineHeight: 1.2 }}>
                      {u.name ?? u.email}
                    </p>
                    {u.name && (
                      <p style={{ fontSize: 11, color: 'var(--color-gray-400)', lineHeight: 1.2 }}>
                        {u.email}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  disabled={isPending}
                  onClick={() => handleAdd(u.id)}
                  style={{ flexShrink: 0 }}
                >
                  <IconPlus size={12} stroke={2} aria-hidden />
                  Adicionar
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
