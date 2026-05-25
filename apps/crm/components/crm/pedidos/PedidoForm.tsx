'use client'

import { useState, useTransition, useRef, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { IconX, IconPlus, IconSearch } from '@tabler/icons-react'
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

interface PrefetchedVariant {
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
}

interface SelectedContact {
  id: string
  name: string
  tier: string | null
}

interface CartItem {
  variantId: string
  variantName: string
  productName: string
  sku: string
  quantity: number
  unit: string
  unitPrice: number
  discountPct: number
}

const MAX_DROPDOWN_ITEMS = 50

// ─── Component ──────────────────────────────────────────────────────────────

export default function PedidoForm({
  userId,
  prefillContact,
  prefillLead,
  tiers,
  allContacts,
  allVariants,
  priceMap,
}: PedidoFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

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
  const [tier, setTier] = useState(tiers[0]?.slug ?? '')

  // Cart
  const [cart, setCart] = useState<CartItem[]>([])

  // Derived tier: from contact's membership or manually selected
  const effectiveTier = selectedContact?.tier || tier || 'standard'

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
    if (!selectedVariant || quantity < 1 || variantPrice === null) return

    setCart((prev) => [
      ...prev,
      {
        variantId: selectedVariant.id,
        variantName: selectedVariant.name,
        productName: selectedVariant.productName,
        sku: selectedVariant.sku,
        quantity,
        unit: selectedVariant.unit,
        unitPrice: variantPrice,
        discountPct: 0,
      },
    ])
    setSelectedVariant(null)
    setProductSearch('')
    setVariantPrice(null)
    setQuantity(1)
  }, [selectedVariant, quantity, variantPrice])

  function handleRemoveFromCart(index: number) {
    setCart((prev) => prev.filter((_, i) => i !== index))
  }

  function handleDiscountChange(index: number, value: number) {
    setCart((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, discountPct: Math.max(0, Math.min(100, value)) } : item
      )
    )
  }

  function getSubtotal(item: CartItem) {
    return item.quantity * item.unitPrice * (1 - item.discountPct / 100)
  }

  const runningTotal = cart.reduce((sum, item) => sum + getSubtotal(item), 0)

  function handleSubmit() {
    if (!selectedContact) {
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
          contactId: selectedContact.id,
          leadId: leadId || undefined,
          ownerId: userId,
          notes: notes || undefined,
        })

        for (const item of cart) {
          await addItem(pedido.id, {
            variantId: item.variantId,
            quantity: item.quantity,
            membershipTier: effectiveTier,
            discountPct: item.discountPct > 0 ? item.discountPct : undefined,
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div ref={contactRef} style={{ position: 'relative' }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-gray-600)' }}>Contato</label>
            {selectedContact ? (
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginTop: 4,
                  padding: '6px 10px', background: 'var(--color-gray-50)', borderRadius: 8,
                  border: '1px solid var(--color-gray-200)',
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-gray-800)', flex: 1 }}>
                  {selectedContact.name}
                </span>
                {selectedContact.tier && (
                  <span className="badge badge-sq badge-teal" style={{ fontSize: 10 }}>
                    {selectedContact.tier}
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
                    className="input"
                    placeholder="Buscar por nome ou e-mail..."
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

          {prefillLead && (
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-gray-600)' }}>Lead</label>
              <p style={{ fontSize: 14, color: 'var(--color-gray-800)', marginTop: 4 }}>{prefillLead.title}</p>
            </div>
          )}

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-gray-600)' }}>Faixa de preço</label>
            <select
              className="input"
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              style={{ marginTop: 4 }}
            >
              {tiers.map((t) => (
                <option key={t.slug} value={t.slug}>{t.name}</option>
              ))}
            </select>
            {selectedContact?.tier && (
              <p style={{ fontSize: 11, color: 'var(--color-gray-400)', marginTop: 4 }}>
                Tier do contato: {selectedContact.tier}
              </p>
            )}
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-gray-600)' }}>Observações</label>
            <input
              type="text"
              className="input"
              placeholder="Opcional"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ marginTop: 4 }}
            />
          </div>
        </div>
      </div>

      {/* ─── New Contact Quick Form ──────────────────────────────────────── */}
      {showNewContactForm && !selectedContact && (
        <NewContactInlineForm
          onCreated={(c) => {
            setSelectedContact(c)
            setShowNewContactForm(false)
            // Add to local list so the new contact is available if user clears and re-selects
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
            disabled={!selectedVariant || variantPrice === null}
          >
            Adicionar
          </button>
        </div>

        {/* ─── Cart Table ──────────────────────────────────────────────────── */}
        {cart.length > 0 && (
          <>
            <table className="data-table" style={{ marginTop: 16 }}>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th style={{ textAlign: 'right' }}>Qtd</th>
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
                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontSize: 13 }}>
                      R$ {item.unitPrice.toFixed(2)}
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

      {/* ─── Submit ────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button
          type="button"
          className="btn btn-primary"
          disabled={isPending}
          onClick={handleSubmit}
        >
          {isPending ? 'Criando...' : 'Criar e enviar pedido'}
        </button>
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-gray-500)' }}>Nome *</label>
          <input
            type="text"
            className="input"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            style={{ marginTop: 4 }}
            autoFocus
          />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-gray-500)' }}>Sobrenome</label>
          <input
            type="text"
            className="input"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            style={{ marginTop: 4 }}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-gray-500)' }}>WhatsApp</label>
          <input
            type="text"
            className="input"
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
