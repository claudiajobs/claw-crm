'use client'

import { useState, useTransition, useRef, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { IconX, IconPlus, IconSearch, IconChevronDown } from '@tabler/icons-react'
import { createPedido, addItem, submitPedido } from '@/lib/actions/pedidos'
import { quickCreateContact } from '@/lib/actions/pedido-form'

// ─── Types ──────────────────────────────────────────────────────────────────

interface PrefetchedContact {
  id: string
  first_name: string
  last_name: string
  phone: string
  membership_tier: string | null
}

export interface PrefetchedVariant {
  id: string
  sku: string
  name: string
  unit: string
  productName: string
}

interface PedidoFormProps {
  userId: string
  prefillContact: { id: string; name: string } | null
  prefillLead: { id: string; title: string; contactId: string; contactName: string } | null
  tiers: Array<{ slug: string; name: string }>
  allContacts: PrefetchedContact[]
  allVariants: PrefetchedVariant[]
  priceMap: Record<string, number>
  isAdmin: boolean
}

interface SelectedContact {
  id: string
  name: string
  tier: string | null
}

export type PriceMode = 'tier' | 'override'

export interface CartItem {
  variantId: string
  variantName: string
  productName: string
  sku: string
  quantity: number
  unit: string
  unitPrice: number
  discountPct: number
  priceMode: PriceMode
  tierSlug: string
}

const MAX_DROPDOWN_ITEMS = 50

// ─── Tier badge color helper ────────────────────────────────────────────────

export function tierBadgeClass(tier: string): string {
  switch (tier) {
    case 'golden': return 'badge badge-sq badge-amber'
    case 'platinum': return 'badge badge-sq badge-purple'
    case 'premium': return 'badge badge-sq badge-teal'
    default: return 'badge badge-sq badge-gray'
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function PedidoForm({
  userId,
  prefillContact,
  prefillLead,
  tiers,
  allContacts,
  allVariants,
  priceMap,
  isAdmin,
}: PedidoFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // ─── Mode toggle: with or without client ──────────────────────────────────
  const [withClient, setWithClient] = useState(true)

  // Contact state
  const [localContacts, setLocalContacts] = useState<PrefetchedContact[]>(allContacts)
  const [selectedContact, setSelectedContact] = useState<SelectedContact | null>(
    prefillLead
      ? { id: prefillLead.contactId, name: prefillLead.contactName, tier: null }
      : prefillContact
        ? { id: prefillContact.id, name: prefillContact.name, tier: null }
        : null
  )
  const [contactSearch, setContactSearch] = useState('')
  const [showContactDropdown, setShowContactDropdown] = useState(false)
  const [showNewContactForm, setShowNewContactForm] = useState(false)
  const contactRef = useRef<HTMLDivElement>(null)

  // Product state
  const [productSearch, setProductSearch] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<PrefetchedVariant | null>(null)
  const [variantPrice, setVariantPrice] = useState<number | null>(null)
  const [quantity, setQuantity] = useState(1)
  const productRef = useRef<HTMLDivElement>(null)

  // Lead & form state
  const [leadId] = useState(prefillLead?.id ?? '')
  const [notes, setNotes] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [tier, setTier] = useState(tiers[0]?.slug ?? '')

  // Cart
  const [cart, setCart] = useState<CartItem[]>([])

  // Mobile drawer state
  const [drawerItemIndex, setDrawerItemIndex] = useState<number | null>(null)

  // Derived tier: from contact's membership (when with client) or manually selected
  const effectiveTier = withClient ? (selectedContact?.tier || tier || 'standard') : (tier || 'standard')

  // Clear contact when switching to "sem cliente"
  useEffect(() => {
    if (!withClient) {
      setSelectedContact(null)
      setContactSearch('')
      setShowContactDropdown(false)
      setShowNewContactForm(false)
    }
  }, [withClient])

  // ─── Client-side contact filtering ──────────────────────────────────────────

  const filteredContacts = useMemo(() => {
    const q = contactSearch.toLowerCase().trim()
    const list = q
      ? localContacts.filter((c) => {
          const full = `${c.first_name} ${c.last_name}`.toLowerCase()
          return (
            full.includes(q) ||
            c.first_name.toLowerCase().includes(q) ||
            c.last_name.toLowerCase().includes(q) ||
            c.phone.toLowerCase().includes(q)
          )
        })
      : localContacts
    return list.slice(0, MAX_DROPDOWN_ITEMS)
  }, [contactSearch, localContacts])

  const contactsTruncated = useMemo(() => {
    if (!contactSearch.trim()) return localContacts.length > MAX_DROPDOWN_ITEMS
    const q = contactSearch.toLowerCase().trim()
    let count = 0
    for (const c of localContacts) {
      const full = `${c.first_name} ${c.last_name}`.toLowerCase()
      if (full.includes(q) || c.first_name.toLowerCase().includes(q) || c.last_name.toLowerCase().includes(q) || c.phone.toLowerCase().includes(q)) {
        count++
        if (count > MAX_DROPDOWN_ITEMS) return true
      }
    }
    return false
  }, [contactSearch, localContacts])

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

  // Update price when variant or tier changes
  useEffect(() => {
    if (!selectedVariant) {
      setVariantPrice(null)
      return
    }
    setVariantPrice(lookupPrice(selectedVariant.id, effectiveTier))
  }, [selectedVariant, effectiveTier, lookupPrice])

  // ─── Click outside handlers ─────────────────────────────────────────────────

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (contactRef.current && !contactRef.current.contains(e.target as Node)) {
        setShowContactDropdown(false)
      }
      if (productRef.current && !productRef.current.contains(e.target as Node)) {
        setShowProductDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // ─── Handlers ─────────────────────────────────────────────────────────────────

  function handleSelectContact(c: PrefetchedContact) {
    const selected: SelectedContact = {
      id: c.id,
      name: [c.first_name, c.last_name].filter(Boolean).join(' '),
      tier: c.membership_tier,
    }
    setSelectedContact(selected)
    setContactSearch('')
    setShowContactDropdown(false)
    if (c.membership_tier) setTier(c.membership_tier)
  }

  function handleClearContact() {
    setSelectedContact(null)
    setContactSearch('')
  }

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

  function handleSubmit() {
    if (withClient && !selectedContact) {
      setError('Selecione um contato')
      return
    }
    if (cart.length === 0) {
      setError('Adicione pelo menos um item')
      return
    }

    setError(null)
    startTransition(async () => {
      try {
        const pedido = await createPedido({
          contactId: withClient ? selectedContact!.id : null,
          leadId: leadId || undefined,
          ownerId: userId,
          notes: notes || undefined,
          deliveryAddress: deliveryAddress.trim() || undefined,
        })

        for (const item of cart) {
          await addItem(pedido.id, {
            variantId: item.variantId,
            quantity: item.quantity,
            membershipTier: item.tierSlug,
            discountPct: item.discountPct > 0 ? item.discountPct : undefined,
            priceMode: item.priceMode,
            overridePrice: item.priceMode === 'override' ? item.unitPrice : undefined,
          })
        }

        await submitPedido(pedido.id)
        router.push(`/pedidos/${pedido.id}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao criar pedido')
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

      {/* ─── Contact Section ─────────────────────────────────────────────── */}
      <div className="card">
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-gray-800)', marginBottom: 12 }}>
          Dados do pedido
        </h3>

        {/* ─── Toggle: com / sem cliente ─────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--color-gray-200)', width: 'fit-content' }}>
          <button
            type="button"
            onClick={() => setWithClient(true)}
            style={{
              padding: '6px 16px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: withClient ? 'var(--color-primary)' : 'var(--color-gray-50)',
              color: withClient ? '#fff' : 'var(--color-gray-600)',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            Pedido com cliente
          </button>
          <button
            type="button"
            onClick={() => setWithClient(false)}
            style={{
              padding: '6px 16px', fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
              borderLeft: '1px solid var(--color-gray-200)',
              background: !withClient ? 'var(--color-primary)' : 'var(--color-gray-50)',
              color: !withClient ? '#fff' : 'var(--color-gray-600)',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            Pedido sem cliente
          </button>
        </div>

        {/* Change 2: flex-col on mobile, flex-row on md+ */}
        <div className="flex flex-col md:flex-row md:flex-wrap" style={{ gap: 16 }}>

          {/* Contact field — only when withClient */}
          {withClient && (
            <div ref={contactRef} className="w-full md:flex-1 md:min-w-[280px]" style={{ position: 'relative' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-gray-600)' }}>Contato</label>
              {selectedContact ? (
                <div className="w-full" style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginTop: 4,
                  padding: '6px 10px', background: 'var(--color-gray-50)', borderRadius: 8,
                  border: '1px solid var(--color-gray-200)',
                }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-gray-800)', flex: 1 }}>
                    {selectedContact.name}
                  </span>
                  {selectedContact.tier && (
                    <span className={tierBadgeClass(selectedContact.tier)} style={{ fontSize: 10 }}>
                      Plano: {tiers.find(t => t.slug === selectedContact.tier)?.name ?? selectedContact.tier}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleClearContact}
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
                      className="input w-full"
                      placeholder="Buscar por nome ou telefone..."
                      value={contactSearch}
                      onChange={(e) => {
                        setContactSearch(e.target.value)
                        setShowContactDropdown(true)
                      }}
                      onFocus={() => setShowContactDropdown(true)}
                      style={{ paddingLeft: 30 }}
                    />
                  </div>
                  {showContactDropdown && (
                    <div style={{
                      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                      background: '#fff', border: '1px solid var(--color-gray-200)',
                      borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      maxHeight: 240, overflowY: 'auto', marginTop: 4,
                    }}>
                      {filteredContacts.length > 0 ? (
                        <>
                          {filteredContacts.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleSelectContact(c)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                                padding: '8px 12px', border: 'none', background: 'none',
                                cursor: 'pointer', textAlign: 'left', fontSize: 13,
                              }}
                              onMouseOver={(e) => (e.currentTarget.style.background = 'var(--color-gray-50)')}
                              onMouseOut={(e) => (e.currentTarget.style.background = 'none')}
                            >
                              <span style={{ fontWeight: 500, color: 'var(--color-gray-800)', flex: 1 }}>
                                {[c.first_name, c.last_name].filter(Boolean).join(' ')}
                              </span>
                              {c.phone && (
                                <span style={{ fontSize: 11, color: 'var(--color-gray-400)' }}>{c.phone}</span>
                              )}
                              {c.membership_tier && (
                                <span style={{ fontSize: 11, color: 'var(--color-gray-400)' }}>({c.membership_tier})</span>
                              )}
                            </button>
                          ))}
                          {contactsTruncated && (
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
                  <button
                    type="button"
                    onClick={() => setShowNewContactForm(true)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      marginTop: 8, fontSize: 12, fontWeight: 500,
                      color: 'var(--color-primary)', background: 'none',
                      border: 'none', cursor: 'pointer', padding: 0,
                    }}
                  >
                    <IconPlus size={12} stroke={2} /> Criar contato
                  </button>
                </>
              )}
            </div>
          )}

          {prefillLead && (
            <div className="w-full md:w-auto">
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-gray-600)' }}>Lead</label>
              <p style={{ fontSize: 14, color: 'var(--color-gray-800)', marginTop: 4 }}>{prefillLead.title}</p>
            </div>
          )}

          {/* Tier selector — only when NOT withClient (manual selection) */}
          {!withClient && (
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

          <div className="w-full md:flex-1 md:min-w-[200px]">
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-gray-600)' }}>Endereço de entrega</label>
            <textarea
              className="input w-full"
              placeholder="Opcional"
              rows={2}
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              style={{ marginTop: 4, resize: 'vertical' }}
            />
          </div>
        </div>
      </div>

      {/* ─── New Contact Quick Form ──────────────────────────────────────── */}
      {showNewContactForm && !selectedContact && withClient && (
        <NewContactInlineForm
          onCreated={(c) => {
            setSelectedContact(c)
            setShowNewContactForm(false)
            setLocalContacts((prev) => [
              ...prev,
              {
                id: c.id,
                first_name: c.name.split(' ')[0] ?? '',
                last_name: c.name.split(' ').slice(1).join(' '),
                phone: '',
                membership_tier: c.tier,
              },
            ])
          }}
          onCancel={() => setShowNewContactForm(false)}
        />
      )}

      {/* ─── Product / Items Section ─────────────────────────────────────── */}
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
                              submit that would throw server-side in getPrice() */}
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

      {/* ─── Mobile Item Drawer (centred modal) ────────────────────────────── */}
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

      {/* ─── Submit ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button
          type="button"
          className="btn btn-primary"
          disabled={isPending}
          onClick={handleSubmit}
        >
          {isPending ? 'Criando pedido...' : 'Criar pedido'}
        </button>
      </div>
    </div>
  )
}

// ─── Mobile Item Drawer (Centred Modal) ─────────────────────────────────────

export function MobileItemDrawer({
  item,
  index,
  isAdmin,
  tierLabel,
  hasTierPrice,
  onClose,
  onQuantityChange,
  onDiscountChange,
  onPriceModeChange,
  onOverridePriceChange,
  onRemove,
  getSubtotal,
}: {
  item: CartItem
  index: number
  isAdmin: boolean
  tierLabel: string
  hasTierPrice: boolean
  onClose: () => void
  onQuantityChange: (index: number, value: number) => void
  onDiscountChange: (index: number, value: number) => void
  onPriceModeChange: (index: number, mode: PriceMode) => void
  onOverridePriceChange: (index: number, value: number) => void
  onRemove: (index: number) => void
  getSubtotal: (item: CartItem) => number
}) {
  // Close on backdrop click
  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.4)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div style={{
        background: '#fff', borderRadius: 16, width: '100%',
        maxWidth: 480, padding: 20,
        maxHeight: 'calc(100vh - 32px)', overflowY: 'auto',
        animation: 'modalIn 0.2s ease-out',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-gray-800)', margin: 0 }}>
            {item.productName}
          </h4>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}
          >
            <IconX size={18} stroke={2} color="var(--color-gray-400)" />
          </button>
        </div>

        {/* Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-gray-500)' }}>Variante</label>
            <p style={{ fontSize: 13, color: 'var(--color-gray-800)', margin: '2px 0 0' }}>{item.variantName}</p>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-gray-500)' }}>SKU</label>
            <p style={{ fontSize: 13, color: 'var(--color-gray-800)', margin: '2px 0 0', fontFamily: 'monospace' }}>{item.sku}</p>
          </div>

          {isAdmin && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-gray-500)' }}>Modo de preço</label>
              <select
                className="input"
                value={item.priceMode}
                onChange={(e) => onPriceModeChange(index, e.target.value as PriceMode)}
                style={{ marginTop: 4, width: '100%' }}
              >
                {/* Tier disabled when no configured price — prevents a submit
                    that would throw server-side in getPrice() */}
                <option value="tier" disabled={!hasTierPrice}>{tierLabel}</option>
                <option value="override">Preço manual</option>
              </select>
            </div>
          )}

          {item.priceMode === 'override' && (
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-gray-500)' }}>Preço manual (R$)</label>
              <input
                type="number"
                className="input"
                min={0}
                step="0.01"
                value={item.unitPrice}
                onChange={(e) => onOverridePriceChange(index, Number(e.target.value))}
                style={{ marginTop: 4, width: '100%' }}
              />
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-gray-500)' }}>Quantidade</label>
              <input
                type="number"
                className="input"
                min={1}
                value={item.quantity}
                onChange={(e) => onQuantityChange(index, Number(e.target.value))}
                style={{ marginTop: 4, width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-gray-500)' }}>Desconto %</label>
              <input
                type="number"
                className="input"
                min={0}
                max={100}
                value={item.discountPct}
                onChange={(e) => onDiscountChange(index, Number(e.target.value))}
                style={{ marginTop: 4, width: '100%' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-gray-500)' }}>Preço unitário</label>
              <p style={{ fontSize: 14, color: 'var(--color-gray-800)', margin: '2px 0 0', fontFamily: 'monospace' }}>
                R$ {item.unitPrice.toFixed(2)}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-gray-500)' }}>Subtotal</label>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-gray-800)', margin: '2px 0 0', fontFamily: 'monospace' }}>
                R$ {getSubtotal(item).toFixed(2)}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-danger"
            onClick={() => { onRemove(index); onClose() }}
            style={{ width: '100%', marginTop: 4 }}
          >
            Remover item
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Inline New Contact Form ────────────────────────────────────────────────

function NewContactInlineForm({
  onCreated,
  onCancel,
}: {
  onCreated: (c: SelectedContact) => void
  onCancel: () => void
}) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!firstName.trim()) {
      setError('Nome é obrigatório')
      return
    }
    setSaving(true)
    setError('')
    try {
      const contact = await quickCreateContact({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
      })
      onCreated(contact)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro')
      setSaving(false)
    }
  }

  return (
    <div className="card" style={{ borderLeft: '3px solid var(--color-primary)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-gray-800)', margin: 0 }}>
          Novo contato
        </h4>
        <button
          type="button"
          onClick={onCancel}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex' }}
        >
          <IconX size={14} stroke={2} color="var(--color-gray-400)" />
        </button>
      </div>
      {error && <p style={{ fontSize: 12, color: '#C44040', marginBottom: 8 }}>{error}</p>}
      <div className="flex flex-col md:flex-row" style={{ gap: 12 }}>
        <div className="w-full md:flex-1">
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-gray-500)' }}>Nome *</label>
          <input
            type="text"
            className="input w-full"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            style={{ marginTop: 4 }}
            autoFocus
          />
        </div>
        <div className="w-full md:flex-1">
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-gray-500)' }}>Sobrenome</label>
          <input
            type="text"
            className="input w-full"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            style={{ marginTop: 4 }}
          />
        </div>
        <div className="w-full md:flex-1">
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-gray-500)' }}>WhatsApp</label>
          <input
            type="text"
            className="input w-full"
            placeholder="(11) 99999-9999"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ marginTop: 4 }}
          />
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, gap: 8 }}>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancelar</button>
        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}
