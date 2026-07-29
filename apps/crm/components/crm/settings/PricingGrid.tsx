'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { IconPencil, IconPlus } from '@tabler/icons-react'
import {
  savePricingGrid,
  toggleProductActive,
  type PricingGrid as PricingGridData,
  type PriceChange,
} from '@/lib/actions/pricing'
import CreateProductModal from './CreateProductModal'
import EditProductModal from './EditProductModal'

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
  const [, startDeactivateTransition] = useTransition()
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  // Product being edited in the "Editar produto" modal
  const [editProduct, setEditProduct] = useState<{
    id: string
    name: string
    categoryId: string
  } | null>(null)
  // Product awaiting the "Desativar produto?" confirmation
  const [confirmProduct, setConfirmProduct] = useState<{ id: string; name: string } | null>(null)
  const [deactivating, setDeactivating] = useState(false)

  const { tiers, categories, allCategories } = grid

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

  function handleDeactivate() {
    if (!confirmProduct) return
    setDeactivating(true)
    setMessage(null)
    startDeactivateTransition(async () => {
      try {
        await toggleProductActive(confirmProduct.id, false)
        setConfirmProduct(null)
        setMessage({ type: 'ok', text: 'Produto desativado.' })
        router.refresh()
      } catch (err) {
        setMessage({
          type: 'err',
          text: err instanceof Error ? err.message : 'Erro ao desativar produto.',
        })
      } finally {
        setDeactivating(false)
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <IconPlus size={16} stroke={1.5} /> Novo produto
        </button>
      </div>

      {categories.length === 0 && (
        <div className="card">
          <p style={{ fontSize: 13, color: 'var(--color-gray-500)' }}>
            Nenhum produto com variantes ativas encontrado.
          </p>
        </div>
      )}

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
          <h3
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--color-gray-500)',
              marginBottom: 16,
            }}
          >
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
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--color-gray-800)',
                    }}
                  >
                    {prod.name}
                  </span>
                  <button
                    type="button"
                    className="btn-icon"
                    aria-label={`Editar produto ${prod.name}`}
                    onClick={() =>
                      setEditProduct({ id: prod.id, name: prod.name, categoryId: cat.id })
                    }
                  >
                    <IconPencil size={14} stroke={1.5} />
                  </button>
                  <span className={prod.active ? 'badge badge-sq badge-teal' : 'badge badge-sq badge-gray'}>
                    {prod.active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    className={prod.active ? 'btn btn-ghost' : 'btn btn-primary'}
                    onClick={() =>
                      prod.active
                        ? setConfirmProduct({ id: prod.id, name: prod.name })
                        : handleToggle(prod.id, true)
                    }
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

      {showCreateModal && (
        <CreateProductModal
          tiers={tiers}
          categories={allCategories}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false)
            setMessage({ type: 'ok', text: 'Produto criado com sucesso.' })
            router.refresh()
          }}
        />
      )}

      {editProduct && (
        <EditProductModal
          product={editProduct}
          categories={allCategories}
          onClose={() => setEditProduct(null)}
          onSaved={() => {
            setEditProduct(null)
            setMessage({ type: 'ok', text: 'Produto atualizado.' })
            router.refresh()
          }}
        />
      )}

      {confirmProduct && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
          <div className="card" style={{ width: '100%', maxWidth: 400, margin: 16, borderRadius: 'var(--radius-xl)' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-gray-800)', marginBottom: 8 }}>
              Desativar produto?
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-gray-600)', marginBottom: 20 }}>
              Este produto não aparecerá mais em novos pedidos. Pedidos
              existentes não são afetados.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setConfirmProduct(null)}
                disabled={deactivating}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleDeactivate}
                disabled={deactivating}
                style={{ background: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
              >
                {deactivating ? 'Desativando...' : 'Desativar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
