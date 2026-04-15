'use client'

import { useState, useTransition } from 'react'
import { generateApiKey, type GenerateApiKeyResult } from '@/lib/actions/api-keys'

const RESOURCES = ['leads', 'contacts', 'activities', 'tasks'] as const
const ACTIONS = ['read', 'write'] as const

type Resource = (typeof RESOURCES)[number]
type Action = (typeof ACTIONS)[number]

interface CreateApiKeyModalProps {
  onClose: () => void
  onCreated: () => void
}

export default function CreateApiKeyModal({ onClose, onCreated }: CreateApiKeyModalProps) {
  const [label, setLabel] = useState('')
  const [permissions, setPermissions] = useState<Record<Resource, Action[]>>(
    {} as Record<Resource, Action[]>
  )
  const [createdKey, setCreatedKey] = useState<GenerateApiKeyResult | null>(null)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

  function togglePermission(resource: Resource, action: Action) {
    setPermissions((prev) => {
      const current = prev[resource] ?? []
      const has = current.includes(action)
      return {
        ...prev,
        [resource]: has ? current.filter((a) => a !== action) : [...current, action],
      }
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!label.trim()) {
      setError('Nome da chave é obrigatório')
      return
    }

    const hasAnyPermission = RESOURCES.some((r) => (permissions[r]?.length ?? 0) > 0)
    if (!hasAnyPermission) {
      setError('Selecione ao menos uma permissão')
      return
    }

    // Build permissions object excluding empty resources
    const cleanPerms: Record<string, string[]> = {}
    for (const resource of RESOURCES) {
      if (permissions[resource]?.length) {
        cleanPerms[resource] = permissions[resource]
      }
    }

    startTransition(async () => {
      try {
        const result = await generateApiKey(label.trim(), cleanPerms)
        setCreatedKey(result)
        onCreated()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao gerar chave')
      }
    })
  }

  async function handleCopy() {
    if (!createdKey) return
    await navigator.clipboard.writeText(createdKey.plainKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            {createdKey ? 'Chave criada' : 'Nova chave de API'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {!createdKey ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Label */}
              <div>
                <label
                  htmlFor="key-label"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Nome da chave <span className="text-red-500">*</span>
                </label>
                <input
                  id="key-label"
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Ex: Robot SDR Alpha"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                             focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              {/* Permissions */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">
                  Permissões <span className="text-red-500">*</span>
                </p>
                <div className="space-y-3">
                  {RESOURCES.map((resource) => (
                    <div key={resource}>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        {resource}
                      </p>
                      <div className="flex gap-3">
                        {ACTIONS.map((action) => {
                          const checked = permissions[resource]?.includes(action) ?? false
                          return (
                            <label
                              key={action}
                              className="flex items-center gap-2 cursor-pointer select-none"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => togglePermission(resource, action)}
                                className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                              />
                              <span className="text-sm text-gray-700">{action}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-60"
                >
                  {isPending ? 'Gerando...' : 'Gerar chave'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Warning */}
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
                <p className="text-sm font-semibold text-amber-800 mb-0.5">
                  Guarde esta chave agora
                </p>
                <p className="text-sm text-amber-700">
                  Esta chave não será exibida novamente. Copie e armazene em local seguro.
                </p>
              </div>

              {/* Key display */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Chave de API
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 font-mono break-all">
                    {createdKey.plainKey}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm
                               hover:bg-gray-50 transition-colors"
                    title="Copiar chave"
                  >
                    {copied ? '✓' : '⎘'}
                  </button>
                </div>
              </div>

              {/* Meta */}
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">Nome:</span> {createdKey.label}
                </p>
                <p>
                  <span className="font-medium">Permissões:</span>{' '}
                  {Object.entries(createdKey.permissions)
                    .map(([r, actions]) => `${r}: ${actions.join(', ')}`)
                    .join(' | ')}
                </p>
              </div>

              {/* Close */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={onClose}
                  className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
                >
                  Entendido — fechar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
