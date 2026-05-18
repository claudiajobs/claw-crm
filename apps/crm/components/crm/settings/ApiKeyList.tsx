'use client'

import { useState, useTransition } from 'react'
import { revokeApiKey } from '@/lib/actions/api-keys'
import CreateApiKeyModal from './CreateApiKeyModal'
import { IconPlus } from '@tabler/icons-react'

interface ApiKey {
  id: string
  label: string
  permissions: Record<string, string[]>
  last_used_at: string | null
  revoked_at: string | null
  created_at: string
}

interface ApiKeyListProps {
  initialKeys: ApiKey[]
}

export default function ApiKeyList({ initialKeys }: ApiKeyListProps) {
  const [keys, setKeys] = useState(initialKeys)
  const [showModal, setShowModal] = useState(false)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function handleRevoke(keyId: string, label: string) {
    if (!confirm(`Revogar a chave "${label}"? Esta ação não pode ser desfeita.`)) return

    setRevokingId(keyId)
    startTransition(async () => {
      await revokeApiKey(keyId)
      setKeys((prev) =>
        prev.map((k) =>
          k.id === keyId ? { ...k, revoked_at: new Date().toISOString() } : k
        )
      )
      setRevokingId(null)
    })
  }

  function handleKeyCreated() {
    // Optimistic: modal will close and page re-renders via revalidatePath
  }

  function formatDate(iso: string | null) {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const activeKeys = keys.filter((k) => !k.revoked_at)
  const revokedKeys = keys.filter((k) => k.revoked_at)

  return (
    <>
      {showModal && (
        <CreateApiKeyModal
          onClose={() => setShowModal(false)}
          onCreated={handleKeyCreated}
        />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 className="topbar-title">Chaves de API</h1>
          <p className="topbar-sub">
            Chaves usadas por robot SDRs e integrações externas
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <IconPlus size={14} stroke={1.5} aria-hidden />
          Nova chave
        </button>
      </div>

      {/* Active keys */}
      {activeKeys.length === 0 ? (
        <div className="card" style={{ padding: '48px 24px', textAlign: 'center', marginBottom: 24 }}>
          <p style={{ fontSize: 13, color: 'var(--color-gray-400)' }}>Nenhuma chave de API ativa.</p>
          <button
            onClick={() => setShowModal(true)}
            style={{ marginTop: 16, fontSize: 13, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            Criar primeira chave
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Permissões</th>
                <th>Último uso</th>
                <th>Criado em</th>
                <th style={{ width: 80 }} />
              </tr>
            </thead>
            <tbody>
              {activeKeys.map((key) => (
                <tr key={key.id}>
                  <td style={{ fontWeight: 600 }}>{key.label}</td>
                  <td style={{ whiteSpace: 'normal' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {Object.entries(key.permissions).map(([resource, actions]) =>
                        (actions as string[]).map((action) => (
                          <span key={`${resource}:${action}`} className="badge badge-gray">
                            {resource}:{action}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td style={{ color: 'var(--color-gray-400)' }}>{formatDate(key.last_used_at)}</td>
                  <td style={{ color: 'var(--color-gray-400)' }}>{formatDate(key.created_at)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => handleRevoke(key.id, key.label)}
                      disabled={revokingId === key.id}
                      className="btn btn-sm btn-danger"
                      style={{ opacity: revokingId === key.id ? 0.5 : 1 }}
                    >
                      {revokingId === key.id ? 'Revogando...' : 'Revogar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Revoked keys */}
      {revokedKeys.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '9px 14px', borderBottom: '1px solid var(--color-gray-100)', background: 'var(--color-gray-50)' }}>
            <p className="text-label">Chaves revogadas</p>
          </div>
          <table className="data-table">
            <tbody>
              {revokedKeys.map((key) => (
                <tr key={key.id} style={{ opacity: 0.5 }}>
                  <td style={{ fontWeight: 600, textDecoration: 'line-through', color: 'var(--color-gray-600)' }}>
                    {key.label}
                  </td>
                  <td style={{ color: 'var(--color-gray-400)', fontSize: 11 }}>
                    Revogada em {formatDate(key.revoked_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
