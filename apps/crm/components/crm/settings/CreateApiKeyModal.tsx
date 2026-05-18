'use client'

import { useState, useTransition } from 'react'
import { generateApiKey, type GenerateApiKeyResult } from '@/lib/actions/api-keys'
import { IconX, IconCopy, IconCheck } from '@tabler/icons-react'

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
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
      <div className="card" style={{ width: '100%', maxWidth: 440, margin: 16, padding: 0, borderRadius: 'var(--radius-xl)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '0.5px solid var(--color-gray-100)' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-gray-800)' }}>
            {createdKey ? 'Chave criada' : 'Nova chave de API'}
          </h2>
          <button onClick={onClose} className="btn-icon" aria-label="Fechar">
            <IconX size={16} stroke={1.5} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          {!createdKey ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {error && (
                <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--color-danger-light)', borderLeft: '3px solid var(--color-danger)' }}>
                  <p style={{ fontSize: 12, color: '#C44040' }}>{error}</p>
                </div>
              )}

              <div className="field">
                <label htmlFor="key-label" className="field-label">
                  Nome da chave <span className="req">*</span>
                </label>
                <input
                  id="key-label"
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Ex: Robot SDR Alpha"
                  className="input"
                />
              </div>

              <div>
                <p className="field-label" style={{ marginBottom: 12 }}>
                  Permissões <span className="req">*</span>
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {RESOURCES.map((resource) => (
                    <div key={resource}>
                      <p className="text-label" style={{ marginBottom: 6 }}>{resource}</p>
                      <div style={{ display: 'flex', gap: 12 }}>
                        {ACTIONS.map((action) => {
                          const checked = permissions[resource]?.includes(action) ?? false
                          return (
                            <label
                              key={action}
                              style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => togglePermission(resource, action)}
                                style={{ accentColor: 'var(--color-primary)' }}
                              />
                              <span style={{ fontSize: 13, color: 'var(--color-gray-600)' }}>{action}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 8 }}>
                <button type="button" onClick={onClose} className="btn btn-ghost">
                  Cancelar
                </button>
                <button type="submit" disabled={isPending} className="btn btn-primary" style={{ opacity: isPending ? 0.6 : 1 }}>
                  {isPending ? 'Gerando...' : 'Gerar chave'}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Warning */}
              <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--color-warning-light)', borderLeft: '3px solid var(--color-warning)' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#9A6600', marginBottom: 2 }}>
                  Guarde esta chave agora
                </p>
                <p style={{ fontSize: 12, color: '#9A6600' }}>
                  Esta chave não será exibida novamente. Copie e armazene em local seguro.
                </p>
              </div>

              {/* Key display */}
              <div>
                <p className="text-label" style={{ marginBottom: 6 }}>Chave de API</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <code style={{ flex: 1, background: 'var(--color-gray-50)', border: '0.5px solid var(--color-gray-200)', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: 11, color: 'var(--color-gray-800)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
                    {createdKey.plainKey}
                  </code>
                  <button onClick={handleCopy} className="btn-icon" title="Copiar chave" aria-label="Copiar chave">
                    {copied ? <IconCheck size={16} stroke={1.5} /> : <IconCopy size={16} stroke={1.5} />}
                  </button>
                </div>
              </div>

              {/* Meta */}
              <div style={{ fontSize: 13, color: 'var(--color-gray-600)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <p><span style={{ fontWeight: 600 }}>Nome:</span> {createdKey.label}</p>
                <p>
                  <span style={{ fontWeight: 600 }}>Permissões:</span>{' '}
                  {Object.entries(createdKey.permissions)
                    .map(([r, actions]) => `${r}: ${actions.join(', ')}`)
                    .join(' | ')}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8 }}>
                <button onClick={onClose} className="btn btn-primary">
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
