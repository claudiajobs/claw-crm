'use client'

import { useState, useTransition, useRef, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { IconX, IconSearch, IconChevronDown } from '@tabler/icons-react'
import { updatePedido } from '@/lib/actions/pedidos'
import {
  MobileItemDrawer,
  tierBadgeClass,
  type CartItem,
  type PriceMode,
  type PrefetchedVariant,
} from '@/components/crm/pedidos/PedidoForm'

// ─── Types ──────────────────────────────────────────────────────────────────

interface PedidoEditFormProps {
  pedidoId: string
  contact: { name: string; tier: string | null } | null
  initialNotes: string
  initialItems: CartItem[]
  initialTier: string
  tiers: Array<{ slug: string; name: string }>
  allVariants: PrefetchedVariant[]
  priceMap: Record<string, number>
  isAdmin: boolean
}

const MAX_DROPDOWN_ITEMS = 50

// ─── Component ──────────────────────────────────────────────────────────────

export default function PedidoEditForm({
  pedidoId,
  contact,
  initialNotes,
  initialItems,
  initialTier,
  tiers,
  allVariants,
  priceMap,
  isAdmin,
}: PedidoEditFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [notes, setNotes] = useState(initialNotes)
  const [tier, setTier] = useState(initialTier)
  const [cart, setCart] = useState<CartItem[]>(initialItems)

  // Product state
  const [productSearch, setProductSearch] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<PrefetchedVariant | null>(null)
  const [variantPrice, setVariantPrice] = useState<number | null>(null)
  const [quantity, setQuantity] = useState(1)
  const productRef = useRef<HTMLDivElement>(null)

  // Mobile drawer state
  const [drawerItemIndex, setDrawerItemIndex] = useState<number | null>(null)

  // Tier for NEW items: contact's membership (when present) or manual selection
  const effectiveTier = contact?.tier || tier || 'standard'

  // ─── Client-side product filtering ──────────────────────────────────────────

  const filteredVariants = useMemo(() => {
    const q = productSearch.toLowerCase().trim()
    const list = q
      ? allVariants.filter((v) =>
          v.productName.toLowerCase().includes(q) ||
          v.name.toLowerCase().includes(q) ||
          v.sku.toLowerCase().includes(q)
        )
      : allVariants
    return list.slice(0, MAX_DROPDOWN_ITEMS)
  }, [productSearch, allVariants])

  const variantsTruncated = useMemo(() => {
    if (!productSearch.trim()) return allVariants.length > MAX_DROPDOWN_ITEMS
    const q = productSearch.toLowerCase().trim()
    let count = 0
    for (const v of allVariants) {
      if (v.productName.toLowerCase().includes(q) || v.name.toLowerCase().includes(q) || v.sku.toLowerCase().includes(q)) {
        count++
        if (count > MAX_DROPDOWN_ITEMS) return true
      }
    }
    return false
  }, [productSearch, allVariants])

  // ─── Price lookup from prefetched map ───────────────────────────────────────

  const lookupPrice = useCallback(
    (variantId: string, tierSlug: string): number | null => {
      return priceMap[`${variantId}:${tierSlug}`] ?? null
    },
    [priceMap]
  )

  useEffect(() => {
    if (!selectedVariant) {
      setVariantPrice(null)
      return
    }
    setVariantPrice(lookupPrice(selectedVariant.id, effectiveTier))
  }, [selectedVariant, effectiveTier, lookupPrice])

  // ─── Click outside handler ──────────────────────────────────────────────────

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (productRef.current && !productRef.current.contains(e.target as Node)) {
        setShowProductDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // ─── Handlers ─────────────────────────────────────────────────────────────────

  function handleSelectVariant(v: PrefetchedVariant) {
    setSelectedVariant(v)
    setProductSearch('')
    setShowProductDropdown(false)
  }

  const handleAddToCart = useCallback(() => {
    if (!selectedVariant || quantity < 1) return
    // Non-admins can only add items that have a tier price configured.
    if (variantPrice === null && !isAdmin) return

    setCart((prev) => [
      ...prev,
      {
        variantId: selectedVariant.id,
        variantName: selectedVariant.name,
        productName: selectedVariant.productName,
        sku: selectedVariant.sku,
        quantity,
        unit: selectedVariant.unit,
        unitPrice: variantPrice ?? 0,
        discountPct: 0,
        // Fall back to manual override when no tier price exists (admin only)
        priceMode: variantPrice === null ? 'override' : 'tier',
        tierSlug: effectiveTier,
      },
    ])
    setSelectedVariant(null)
    setProductSearch('')
    setVariantPrice(null)
    setQuantity(1)
  }, [selectedVariant, quantity, variantPrice, isAdmin, effectiveTier])

  function handleRemoveFromCart(index: number) {
    setCart((prev) => prev.filter((_, i) => i !== index))
    if (drawerItemIndex === index) setDrawerItemIndex(null)
  }

  function handleDiscountChange(index: number, value: number) {
    setCart((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, discountPct: Math.max(0, Math.min(100, value)) } : item
      )
    )
  }

  function handleQuantityChange(index: number, value: number) {
    setCart((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: Math.max(1, value) } : item
      )
    )
  }

  function tierName(slug: string): string {
    return tiers.find((t) => t.slug === slug)?.name ?? slug
  }

  function handlePriceModeChange(index: number, mode: PriceMode) {
    setCart((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item
        if (mode === 'tier') {
          // Restore the tier price for this item's tier. If no tier price
          // exists, stay in override mode — switching to tier here would make
          // the server-side getPrice() throw and fail the whole pedido.
          const tierPrice = lookupPrice(item.variantId, item.tierSlug)
          if (tierPrice === null) return item
          return {
            ...item,
            priceMode: 'tier',
            unitPrice: tierPrice,
          }
        }
        // Switching to manual keeps the current value as the starting point
        return { ...item, priceMode: 'override' }
      })
    )
  }

  function handleOverridePriceChange(index: number, value: number) {
    setCart((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, unitPrice: Math.max(0, value) } : item
      )
    )
  }

  function getSubtotal(item: CartItem) {
    return item.quantity * item.unitPrice * (1 - item.discountPct / 100)
  }

  const runningTotal = cart.reduce((sum, item) => sum + getSubtotal(item), 0)

  function handleSave() {
    if (cart.length === 0) {
      setError('Adicione pelo menos um item')
      return
    }

    setError(null)
    startTransition(async () => {
      try {
        await updatePedido(pedidoId, {
          notes,
          items: cart.map((item) => ({
            variantId: item.variantId,
            quantity: item.quantity,
            membershipTier: item.tierSlug,
            discountPct: item.discountPct > 0 ? item.discountPct : undefined,
            priceMode: item.priceMode,
            overridePrice: item.priceMode === 'override' ? item.unitPrice : undefined,
          })),
        })
        router.push(`/pedidos/${pedidoId}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar pedido')
      }
    })
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {error && (
        <div className="card" style={{ borderLeft: '3px solid var(--color-danger)' }}>
          <p style={{ fontSize: 13, color: '#C44040' }}>{error}</p>
        </div>
      )}

      <div style={{ padding: '14px 18px', borderRadius: 'var(--radius-lg)', background: '#FFF8E1', border: '1px solid #FFD54F', fontSize: 13, color: '#8D6E00' }}>
        Ao salvar, o pedido passa novamente pela regra de aprovação — descontos
        ou preço manual exigem nova aprovação de um administrador.
      </div>

      {/* ─── Dados do pedido ─────────────────────────────────────────────── */}
      <div className="card">
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-gray-800)', marginBottom: 12 }}>
          Dados do pedido
        </h3>

        <div className="flex flex-col md:flex-row md:flex-wrap" style={{ gap: 16 }}>
          <div className="w-full md:flex-1 md:min-w-[280px]">
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-gray-600)' }}>Contato</label>
            {contact ? (
              <div className="w-full" style={{
                display: 'flex', alignItems: 'center', gap: 8, marginTop: 4,
                padding: '6px 10px', background: 'var(--color-gray-50)', borderRadius: 8,
                border: '1px solid var(--color-gray-200)',
              }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-gray-800)', flex: 1 }}>
                  {contact.name}
                </span>
                {contact.tier && (
                  <span className={tierBadgeClass(contact.tier)} style={{ fontSize: 10 }}>
                    Plano: {tiers.find((t) => t.slug === contact.tier)?.name ?? contact.tier}
                  </span>
                )}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--color-gray-400)', marginTop: 8 }}>
                Pedido sem cliente
              </p>
            )}
            <p style={{ fontSize: 11, color: 'var(--color-gray-400)', marginTop: 6 }}>
              O contato não pode ser alterado em um pedido existente.
            </p>
          </div>

          {/* Tier selector — only for pedidos sem cliente (manual selection) */}
          {!contact && (
            <div className="w-full md:w-auto md:min-w-[200px]">
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-gray-600)' }}>Faixa de preço</label>
              <select
                className="input w-full"
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                style={{ marginTop: 4 }}
              >
                {tiers.map((t) => (
                  <option key={t.slug} value={t.slug}>{t.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="w-full md:flex-1 md:min-w-[200px]">
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-gray-600)' }}>Observações</label>
            <input
              type="text"
              className="input w-full"
              placeholder="Opcional"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ marginTop: 4 }}
            />
          </div>
        </div>
      </div>

      {/* ─── Itens ────────────────────────────────────────────────────────── */}
      <div className="card">
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-gray-800)', marginBottom: 12 }}>
          Itens
        </h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div ref={productRef} style={{ flex: '1 1 280px', position: 'relative' }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-gray-500)' }}>Produto / Variante</label>
            {selectedVariant ? (
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginTop: 4,
                  padding: '6px 10px', background: 'var(--color-gray-50)', borderRadius: 8,
                  border: '1px solid var(--color-gray-200)',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-gray-800)', flex: 1 }}>
                  {selectedVariant.productName} — {selectedVariant.name}
                </span>
                {variantPrice !== null && (
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)' }}>
                    R$ {variantPrice.toFixed(2)}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => { setSelectedVariant(null); setVariantPrice(null) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}
                >
                  <IconX size={14} stroke={2} color="var(--color-gray-400)" />
                </button>
              </div>
            ) : (
              <>
                <div style={{ position: 'relative', marginTop: 4 }}>
                  <IconSearch
                    size={14} stroke={1.5}
                    style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gray-400)' }}
                  />
                  <input
                    type="text"
                    className="input"
                    placeholder="Buscar por nome, SKU..."
                    value={productSearch}
                    onChange={(e) => {
                      setProductSearch(e.target.value)
                      setShowProductDropdown(true)
                    }}
                    onFocus={() => setShowProductDropdown(true)}
                    style={{ paddingLeft: 30 }}
                  />
                </div>
                {showProductDropdown && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                    background: '#fff', border: '1px solid var(--color-gray-200)',
                    borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    maxHeight: 240, overflowY: 'auto', marginTop: 4,
                  }}>
                    {filteredVariants.length > 0 ? (
                      <>
                        {filteredVariants.map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() => handleSelectVariant(v)}
                            style={{
                              display: 'flex', flexDirection: 'column', gap: 2, width: '100%',
                              padding: '8px 12px', border: 'none', background: 'none',
                              cursor: 'pointer', textAlign: 'left',
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.background = 'var(--color-gray-50)')}
                            onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
                          >
                            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-gray-800)' }}>
                              {v.productName} — {v.name}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--color-gray-400)' }}>
                              SKU: {v.sku}
                            </span>
                          </button>
                        ))}
                        {variantsTruncated && (
                          <p style={{ fontSize: 11, color: 'var(--color-gray-400)', padding: '6px 12px', margin: 0, borderTop: '1px solid var(--color-gray-100)' }}>
                            Digite para refinar a busca...
                          </p>
                        )}
                      </>
                    ) : (
                      <p style={{ fontSize: 12, color: 'var(--color-gray-400)', padding: '8px 12px', margin: 0 }}>
                        Nenhum resultado
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div style={{ flex: '0 0 80px' }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-gray-500)' }}>Qtd</label>
            <input
              type="number"
              className="input"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              style={{ marginTop: 4 }}
            />
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAddToCart}
            disabled={!selectedVariant || (variantPrice === null && !isAdmin)}
          >
            Adicionar
          </button>
        </div>

        {/* ─── Cart: Desktop Table (hidden on mobile) ─────────────────────── */}
        {cart.length > 0 && (
          <>
            <table className="data-table hidden md:table" style={{ marginTop: 16 }}>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th style={{ textAlign: 'right' }}>Qtd</th>
                  <th style={{ textAlign: 'left', minWidth: 140 }}>Modo de preço</th>
                  <th style={{ textAlign: 'right' }}>Preço unit.</th>
                  <th style={{ textAlign: 'center', width: 80 }}>Desc %</th>
                  <th style={{ textAlign: 'right' }}>Subtotal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <span style={{ fontWeight: 500 }}>{item.productName}</span>
                      <br />
                      <span style={{ fontSize: 11, color: 'var(--color-gray-400)' }}>
                        {item.variantName} · {item.sku}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {item.quantity} {item.unit}
                    </td>
                    <td>
                      {isAdmin ? (
                        <select
                          className="input"
                          value={item.priceMode}
                          onChange={(e) => handlePriceModeChange(idx, e.target.value as PriceMode)}
                          style={{ fontSize: 12, padding: '2px 6px', height: 28, width: '100%', minWidth: 130 }}
                        >
                          {/* Tier disabled when no configured price — prevents a
                              save that would throw server-side in getPrice() */}
                          <option value="tier" disabled={lookupPrice(item.variantId, item.tierSlug) === null}>
                            {tierName(item.tierSlug)}
                          </option>
                          <option value="override">Preço manual</option>
                        </select>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--color-gray-500)' }}>
                          {tierName(item.tierSlug)}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 13 }}>
                      {item.priceMode === 'override' ? (
                        <input
                          type="number"
                          className="input"
                          min={0}
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleOverridePriceChange(idx, Number(e.target.value))}
                          aria-label="Preço manual (R$)"
                          style={{ width: 90, textAlign: 'right', fontSize: 12, padding: '2px 6px', height: 28, fontFamily: 'monospace' }}
                        />
                      ) : (
                        <>R$ {item.unitPrice.toFixed(2)}</>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="number"
                        className="input"
                        min={0}
                        max={100}
                        value={item.discountPct}
                        onChange={(e) => handleDiscountChange(idx, Number(e.target.value))}
                        style={{ width: 60, textAlign: 'center', fontSize: 12, padding: '2px 4px', height: 28 }}
                      />
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 13, fontWeight: 600 }}>
                      R$ {getSubtotal(item).toFixed(2)}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(idx)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
                      >
                        <IconX size={14} stroke={2} color="var(--color-danger)" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ─── Cart: Mobile Card List (visible only on mobile) ──────────── */}
            <div className="md:hidden" style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cart.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setDrawerItemIndex(idx)}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '12px 14px', background: 'var(--color-gray-50)', borderRadius: 8,
                    border: '1px solid var(--color-gray-200)', cursor: 'pointer', textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-gray-800)' }}>
                      {item.productName} × {item.quantity}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'monospace', color: 'var(--color-gray-800)' }}>
                      R$ {getSubtotal(item).toFixed(2)}
                    </span>
                    <IconChevronDown size={14} stroke={2} color="var(--color-gray-400)" />
                  </div>
                </button>
              ))}
            </div>

            <div style={{
              display: 'flex', justifyContent: 'flex-end', marginTop: 12,
              padding: '8px 12px', background: 'var(--color-gray-50)', borderRadius: 8,
            }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-gray-800)' }}>
                Total: R$ {runningTotal.toFixed(2)}
              </span>
            </div>
          </>
        )}
      </div>

      {/* ─── Mobile Item Drawer (bottom sheet) ─────────────────────────────── */}
      {drawerItemIndex !== null && cart[drawerItemIndex] && (
        <MobileItemDrawer
          item={cart[drawerItemIndex]}
          index={drawerItemIndex}
          isAdmin={isAdmin}
          tierLabel={tierName(cart[drawerItemIndex].tierSlug)}
          hasTierPrice={lookupPrice(cart[drawerItemIndex].variantId, cart[drawerItemIndex].tierSlug) !== null}
          onClose={() => setDrawerItemIndex(null)}
          onQuantityChange={handleQuantityChange}
          onDiscountChange={handleDiscountChange}
          onPriceModeChange={handlePriceModeChange}
          onOverridePriceChange={handleOverridePriceChange}
          onRemove={handleRemoveFromCart}
          getSubtotal={getSubtotal}
        />
      )}

      {/* ─── Save ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={isPending}
          onClick={() => router.push(`/pedidos/${pedidoId}`)}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="btn btn-primary"
          disabled={isPending}
          onClick={handleSave}
        >
          {isPending ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
    </div>
  )
}
