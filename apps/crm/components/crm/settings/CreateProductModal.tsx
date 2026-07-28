'use client'

import { useState, useTransition } from 'react'
import { IconX, IconPlus, IconTrash } from '@tabler/icons-react'
import {
  createProduct,
  type CreateProductData,
  type PricingTier,
} from '@/lib/actions/pricing'

const NEW_CATEGORY = '__new__'

interface VariantRow {
  sku: string
  name: string
  unit: string
}

interface CreateProductModalProps {
  tiers: PricingTier[]
  categories: { id: string; name: string }[]
  onClose: () => void
  onCreated: () => void
}

export default function CreateProductModal({
  tiers,
  categories,
  onClose,
  onCreated,
}: CreateProductModalProps) {
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [variants, setVariants] = useState<VariantRow[]>([
    { sku: '', name: '', unit: 'un' },
  ])
  // Optional tier prices keyed by `${variantIndex}:${tierSlug}`
  const [prices, setPrices] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function updateVariant(index: number, patch: Partial<VariantRow>) {
    setVariants((prev) => prev.map((v, i) => (i === index ? { ...v, ...patch } : v)))
  }

  function addVariant() {
    setVariants((prev) => [...prev, { sku: '', name: '', unit: 'un' }])
  }

  function removeVariant(index: number) {
    setVariants((prev) => prev.filter((_, i) => i !== index))
    // Reindex price keys so they keep pointing at the same variant rows
    setPrices((prev) => {
      const next: Record<string, string> = {}
      for (const [key, value] of Object.entries(prev)) {
        const [idxStr, tierSlug] = key.split(':')
        const idx = Number(idxStr)
        if (idx === index) continue
        next[`${idx > index ? idx - 1 : idx}:${tierSlug}`] = value
      }
      return next
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) {
      setError('Nome do produto é obrigatório')
      return
    }
    if (!categoryId || (categoryId === NEW_CATEGORY && !newCategoryName.trim())) {
      setError('Selecione uma categoria ou informe o nome da nova categoria')
      return
    }
    if (variants.some((v) => !v.sku.trim() || !v.name.trim())) {
      setError('SKU e nome são obrigatórios em todas as variantes')
      return
    }
    const skus = variants.map((v) => v.sku.trim())
    if (new Set(skus).size !== skus.length) {
      setError('SKUs duplicados — cada variante precisa de um SKU único')
      return
    }

    const priceInputs: CreateProductData['prices'] = []
    for (const [key, raw] of Object.entries(prices)) {
      const trimmed = raw.trim()
      if (trimmed === '') continue
      const parsed = Number(trimmed.replace(',', '.'))
      if (!Number.isFinite(parsed) || parsed < 0) {
        setError('Preço inválido — use apenas números maiores ou iguais a zero')
        return
      }
      const [idxStr, tierSlug] = key.split(':')
      priceInputs.push({ variantIndex: Number(idxStr), tierSlug, price: parsed })
    }

    const data: CreateProductData = {
      name: name.trim(),
      categoryId: categoryId === NEW_CATEGORY ? undefined : categoryId,
      newCategoryName:
        categoryId === NEW_CATEGORY ? newCategoryName.trim() : undefined,
      variants: variants.map((v) => ({
        sku: v.sku.trim(),
        name: v.name.trim(),
        unit: v.unit.trim() || 'un',
      })),
      prices: priceInputs,
    }

    startTransition(async () => {
      try {
        await createProduct(data)
        onCreated()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao criar produto')
      }
    })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}>
      <div
        className="card"
        style={{ width: '100%', maxWidth: 640, margin: 16, padding: 0, borderRadius: 'var(--radius-xl)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '0.5px solid var(--color-gray-100)' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-gray-800)' }}>
            Novo produto
          </h2>
          <button onClick={onClose} className="btn-icon" aria-label="Fechar">
            <IconX size={16} stroke={1.5} />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}
        >
          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--color-danger-light)', borderLeft: '3px solid var(--color-danger)' }}>
              <p style={{ fontSize: 12, color: '#C44040' }}>{error}</p>
            </div>
          )}

          <div className="field">
            <label htmlFor="product-name" className="field-label">
              Nome do produto <span className="req">*</span>
            </label>
            <input
              id="product-name"
              type="text"
              className="input"
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Tinta Acrílica Premium"
            />
          </div>

          <div className="field">
            <label htmlFor="product-category" className="field-label">
              Categoria <span className="req">*</span>
            </label>
            <select
              id="product-category"
              className="input"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Selecione...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value={NEW_CATEGORY}>+ Nova categoria</option>
            </select>
            {categoryId === NEW_CATEGORY && (
              <input
                type="text"
                className="input"
                maxLength={120}
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Nome da nova categoria"
                style={{ marginTop: 8 }}
                autoFocus
              />
            )}
          </div>

          <div>
            <p className="field-label" style={{ marginBottom: 8 }}>
              Variantes <span className="req">*</span>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {variants.map((v, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    className="input"
                    value={v.sku}
                    onChange={(e) => updateVariant(i, { sku: e.target.value })}
                    placeholder="SKU"
                    aria-label={`SKU da variante ${i + 1}`}
                    style={{ width: 140 }}
                  />
                  <input
                    type="text"
                    className="input"
                    value={v.name}
                    onChange={(e) => updateVariant(i, { name: e.target.value })}
                    placeholder="Nome da variante"
                    aria-label={`Nome da variante ${i + 1}`}
                    style={{ flex: 1 }}
                  />
                  <input
                    type="text"
                    className="input"
                    value={v.unit}
                    onChange={(e) => updateVariant(i, { unit: e.target.value })}
                    placeholder="un"
                    aria-label={`Unidade da variante ${i + 1}`}
                    style={{ width: 64 }}
                  />
                  <button
                    type="button"
                    className="btn-icon"
                    onClick={() => removeVariant(i)}
                    disabled={variants.length === 1}
                    aria-label={`Remover variante ${i + 1}`}
                    style={{ opacity: variants.length === 1 ? 0.3 : 1 }}
                  >
                    <IconTrash size={16} stroke={1.5} />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={addVariant}
              style={{ marginTop: 8, fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}
            >
              <IconPlus size={14} stroke={1.5} /> Variante
            </button>
          </div>

          {tiers.length > 0 && (
            <div>
              <p className="field-label" style={{ marginBottom: 4 }}>Preços por faixa</p>
              <p style={{ fontSize: 11, color: 'var(--color-gray-400)', marginBottom: 8 }}>
                Opcional — você pode preencher depois na tabela de preços.
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table" style={{ minWidth: 360 }}>
                  <thead>
                    <tr>
                      <th style={{ minWidth: 140 }}>Variante</th>
                      {tiers.map((t) => (
                        <th key={t.slug} style={{ textAlign: 'right', minWidth: 100 }}>
                          {t.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v, i) => (
                      <tr key={i}>
                        <td style={{ fontSize: 12, color: 'var(--color-gray-600)' }}>
                          {v.name.trim() || v.sku.trim() || `Variante ${i + 1}`}
                        </td>
                        {tiers.map((t) => (
                          <td key={t.slug} style={{ textAlign: 'right' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
                              <span style={{ fontSize: 11, color: 'var(--color-gray-400)' }}>R$</span>
                              <input
                                type="number"
                                className="input"
                                min={0}
                                step="0.01"
                                placeholder="—"
                                value={prices[`${i}:${t.slug}`] ?? ''}
                                onChange={(e) =>
                                  setPrices((prev) => ({
                                    ...prev,
                                    [`${i}:${t.slug}`]: e.target.value,
                                  }))
                                }
                                aria-label={`Preço ${t.name} da variante ${i + 1}`}
                                style={{ width: 84, textAlign: 'right', fontSize: 13, fontFamily: 'monospace', padding: '2px 6px', height: 30 }}
                              />
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 8 }}>
            <button type="button" onClick={onClose} className="btn btn-ghost">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="btn btn-primary"
              style={{ opacity: isPending ? 0.6 : 1 }}
            >
              {isPending ? 'Criando...' : 'Criar produto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
