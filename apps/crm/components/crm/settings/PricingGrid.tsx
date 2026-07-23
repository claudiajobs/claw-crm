'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  savePricingGrid,
  toggleProductActive,
  updateProductName,
  type PricingGrid as PricingGridData,
  type PriceChange,
} from '@/lib/actions/pricing'

interface PricingGridProps {
  grid: PricingGridData
}

// Draft cell values keyed by `${variantId}:${tierSlug}` — only holds edited cells
type Draft = Record<string, string>

function cellKey(variantId: string, tierSlug: string) {
  return `${variantId}:${tierSlug}`
}

export default function PricingGrid({ grid }: PricingGridProps) {
  const router = useRouter()
  const [draft, setDraft] = useState<Draft>({})
  const [savingPrices, startSaveTransition] = useTransition()
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  // Draft product names keyed by productId — only holds the one being edited
  const [nameDraft, setNameDraft] = useState<Record<string, string>>({})
  const [savingNameId, setSavingNameId] = useState<string | null>(null)

  const { tiers, categories } = grid

  // Build the list of changed cells (draft value differs from the current price)
  const changes: PriceChange[] = useMemo(() => {
    const priceByKey = new Map<string, number | null>()
    for (const cat of categories) {
      for (const prod of cat.products) {
        for (const v of prod.variants) {
          for (const tier of tiers) {
            priceByKey.set(cellKey(v.id, tier.slug), v.prices[tier.slug])
          }
        }
      }
    }

    const result: PriceChange[] = []
    for (const [key, raw] of Object.entries(draft)) {
      const trimmed = raw.trim()
      if (trimmed === '') continue
      const parsed = Number(trimmed.replace(',', '.'))
      if (!Number.isFinite(parsed) || parsed < 0) continue
      const current = priceByKey.get(key)
      // Round both sides to 2 decimals before comparing
      const rounded = Math.round(parsed * 100) / 100
      if (current !== null && current !== undefined && Math.round(current * 100) / 100 === rounded) {
        continue
      }
      const [variantId, tierSlug] = key.split(':')
      result.push({ variantId, tierSlug, price: rounded })
    }
    return result
  }, [draft, categories, tiers])

  function handleCellChange(variantId: string, tierSlug: string, value: string) {
    setDraft((prev) => ({ ...prev, [cellKey(variantId, tierSlug)]: value }))
  }

  function displayValue(variantId: string, tierSlug: string, current: number | null): string {
    const key = cellKey(variantId, tierSlug)
    if (key in draft) return draft[key]
    return current === null ? '' : String(current)
  }

  function isDirty(variantId: string, tierSlug: string, current: number | null): boolean {
    const key = cellKey(variantId, tierSlug)
    if (!(key in draft)) return false
    return changes.some((c) => c.variantId === variantId && c.tierSlug === tierSlug)
  }

  function handleSave() {
    if (changes.length === 0) {
      setMessage({ type: 'err', text: 'Nenhuma alteração para salvar.' })
      return
    }
    setMessage(null)
    startSaveTransition(async () => {
      try {
        const res = await savePricingGrid(changes)
        setDraft({})
        setMessage({
          type: 'ok',
          text: `${res.inserted} preço(s) atualizado(s) com sucesso.`,
        })
        router.refresh()
      } catch (err) {
        setMessage({
          type: 'err',
          text: err instanceof Error ? err.message : 'Erro ao salvar preços.',
        })
      }
    })
  }

  function handleNameBlur(productId: string, currentName: string) {
    const draft = nameDraft[productId]
    // Nothing typed / never edited this cell
    if (draft === undefined) return

    const trimmed = draft.trim()

    // Empty is invalid — warn and revert to the stored name
    if (trimmed === '') {
      setMessage({ type: 'err', text: 'Nome do produto não pode ser vazio' })
      setNameDraft((prev) => {
        const next = { ...prev }
        delete next[productId]
        return next
      })
      return
    }

    // Unchanged — just drop the draft, no write
    if (trimmed === currentName) {
      setNameDraft((prev) => {
        const next = { ...prev }
        delete next[productId]
        return next
      })
      return
    }

    setMessage(null)
    setSavingNameId(productId)
    startSaveTransition(async () => {
      try {
        await updateProductName(productId, trimmed)
        setNameDraft((prev) => {
          const next = { ...prev }
          delete next[productId]
          return next
        })
        setMessage({ type: 'ok', text: 'Nome do produto atualizado.' })
        router.refresh()
      } catch (err) {
        setMessage({
          type: 'err',
          text: err instanceof Error ? err.message : 'Erro ao atualizar produto.',
        })
      } finally {
        setSavingNameId(null)
      }
    })
  }

  function handleToggle(productId: string, nextActive: boolean) {
    setTogglingId(productId)
    setMessage(null)
    startSaveTransition(async () => {
      try {
        await toggleProductActive(productId, nextActive)
        router.refresh()
      } catch (err) {
        setMessage({
          type: 'err',
          text: err instanceof Error ? err.message : 'Erro ao atualizar produto.',
        })
      } finally {
        setTogglingId(null)
      }
    })
  }

  if (categories.length === 0) {
    return (
      <div className="card">
        <p style={{ fontSize: 13, color: 'var(--color-gray-500)' }}>
          Nenhum produto com variantes ativas encontrado.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 80 }}>
      {message && (
        <div
          className="card"
          style={{
            borderLeft: `3px solid ${message.type === 'ok' ? 'var(--color-primary)' : 'var(--color-danger)'}`,
          }}
        >
          <p style={{ fontSize: 13, color: message.type === 'ok' ? 'var(--color-gray-800)' : '#C44040', margin: 0 }}>
            {message.text}
          </p>
        </div>
      )}

      {categories.map((cat) => (
        <div key={cat.id} className="card">
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-gray-800)', marginBottom: 16 }}>
            {cat.name}
          </h3>

          {cat.products.map((prod) => (
            <div key={prod.id} style={{ marginBottom: 20 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="text"
                    className="input"
                    aria-label="Nome do produto"
                    value={nameDraft[prod.id] ?? prod.name}
                    disabled={savingNameId === prod.id}
                    onChange={(e) =>
                      setNameDraft((prev) => ({ ...prev, [prod.id]: e.target.value }))
                    }
                    onBlur={() => handleNameBlur(prod.id, prod.name)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') e.currentTarget.blur()
                      if (e.key === 'Escape') {
                        setNameDraft((prev) => {
                          const next = { ...prev }
                          delete next[prod.id]
                          return next
                        })
                        e.currentTarget.blur()
                      }
                    }}
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--color-gray-800)',
                      padding: '2px 6px',
                      height: 28,
                      minWidth: 180,
                      borderColor:
                        nameDraft[prod.id] !== undefined &&
                        nameDraft[prod.id] !== prod.name
                          ? 'var(--color-primary)'
                          : 'transparent',
                      background:
                        nameDraft[prod.id] !== undefined &&
                        nameDraft[prod.id] !== prod.name
                          ? 'rgba(91,71,224,0.06)'
                          : 'transparent',
                    }}
                  />
                  {savingNameId === prod.id && (
                    <span style={{ fontSize: 11, color: 'var(--color-gray-400)' }}>
                      salvando...
                    </span>
                  )}
                  <span className={prod.active ? 'badge badge-sq badge-teal' : 'badge badge-sq badge-gray'}>
                    {prod.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <button
                  type="button"
                  className={prod.active ? 'btn btn-ghost' : 'btn btn-primary'}
                  onClick={() => handleToggle(prod.id, !prod.active)}
                  disabled={savingPrices && togglingId === prod.id}
                  style={{ fontSize: 12, padding: '4px 12px', height: 28 }}
                >
                  {togglingId === prod.id
                    ? '...'
                    : prod.active
                      ? 'Desativar'
                      : 'Ativar'}
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ minWidth: 480 }}>
                  <thead>
                    <tr>
                      <th style={{ minWidth: 180 }}>Variante</th>
                      {tiers.map((t) => (
                        <th key={t.slug} style={{ textAlign: 'right', minWidth: 110 }}>
                          {t.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {prod.variants.map((v) => (
                      <tr key={v.id}>
                        <td>
                          <span style={{ fontWeight: 500 }}>{v.name}</span>
                          <br />
                          <span style={{ fontSize: 11, color: 'var(--color-gray-400)' }}>
                            {v.sku} · {v.unit}
                          </span>
                        </td>
                        {tiers.map((t) => {
                          const dirty = isDirty(v.id, t.slug, v.prices[t.slug])
                          return (
                            <td key={t.slug} style={{ textAlign: 'right' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                                <span style={{ fontSize: 11, color: 'var(--color-gray-400)' }}>R$</span>
                                <input
                                  type="number"
                                  className="input"
                                  min={0}
                                  step="0.01"
                                  placeholder="—"
                                  value={displayValue(v.id, t.slug, v.prices[t.slug])}
                                  onChange={(e) => handleCellChange(v.id, t.slug, e.target.value)}
                                  style={{
                                    width: 90,
                                    textAlign: 'right',
                                    fontSize: 13,
                                    fontFamily: 'monospace',
                                    padding: '2px 6px',
                                    height: 30,
                                    borderColor: dirty ? 'var(--color-primary)' : undefined,
                                    background: dirty ? 'rgba(91,71,224,0.06)' : undefined,
                                  }}
                                />
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Sticky save bar */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#fff',
          borderTop: '1px solid var(--color-gray-200)',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 12,
          zIndex: 40,
        }}
      >
        <span style={{ fontSize: 12, color: 'var(--color-gray-500)' }}>
          {changes.length > 0
            ? `${changes.length} alteração(ões) pendente(s)`
            : 'Sem alterações pendentes'}
        </span>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSave}
          disabled={savingPrices || changes.length === 0}
        >
          {savingPrices ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
    </div>
  )
}
