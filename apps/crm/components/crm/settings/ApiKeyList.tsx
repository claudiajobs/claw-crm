'use client'

import { useState, useTransition } from 'react'
import { revokeApiKey } from '@/lib/actions/api-keys'
import CreateApiKeyModal from './CreateApiKeyModal'

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Chaves de API</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Chaves usadas por robot SDRs e integrações externas
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm
                     font-semibold text-white hover:bg-red-700 transition-colors"
        >
          + Nova chave
        </button>
      </div>

      {/* Active keys */}
      {activeKeys.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 px-6 py-16 text-center mb-6">
          <p className="text-gray-400 text-sm">Nenhuma chave de API ativa.</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 inline-block text-sm text-red-600 hover:underline"
          >
            Criar primeira chave
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Nome
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Permissões
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Último uso
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Criado em
                </th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activeKeys.map((key) => (
                <tr key={key.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{key.label}</td>
                  <td className="px-6 py-4 text-gray-500 max-w-xs">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(key.permissions).map(([resource, actions]) =>
                        (actions as string[]).map((action) => (
                          <span
                            key={`${resource}:${action}`}
                            className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                          >
                            {resource}:{action}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{formatDate(key.last_used_at)}</td>
                  <td className="px-6 py-4 text-gray-500">{formatDate(key.created_at)}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleRevoke(key.id, key.label)}
                      disabled={revokingId === key.id}
                      className="text-xs text-red-600 hover:text-red-700 font-medium transition-colors
                                 disabled:opacity-50"
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
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Chaves revogadas
            </p>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-50">
              {revokedKeys.map((key) => (
                <tr key={key.id} className="opacity-50">
                  <td className="px-6 py-3 font-medium text-gray-600 line-through">
                    {key.label}
                  </td>
                  <td className="px-6 py-3 text-gray-400 text-xs">
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
