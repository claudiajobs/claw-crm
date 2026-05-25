'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createPedido, addItem, submitPedido } from '@/lib/actions/pedidos'

interface Variant {
  id: string
  sku: string
  name: string
  unit: string
  active: boolean
}

interface Product {
  id: string
  name: string
  slug: string
  variants: Variant[]
}

interface PedidoFormProps {
  userId: string
  prefillContact: { id: string; name: string } | null
  prefillLead: { id: string; title: string; contactId: string; contactName: string } | null
  tiers: Array<{ slug: string; name: string }>
  products: Product[]
}

interface CartItem {
  variantId: string
  variantName: string
  productName: string
  quantity: number
  unit: string
}

export default function PedidoForm({
  userId,
  prefillContact,
  prefillLead,
  tiers,
  products,
}: PedidoFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [contactId, setContactId] = useState(prefillLead?.contactId ?? prefillContact?.id ?? '')
  const [contactName] = useState(prefillLead?.contactName ?? prefillContact?.name ?? '')
  const [leadId] = useState(prefillLead?.id ?? '')
  const [tier, setTier] = useState(tiers[0]?.slug ?? '')
  const [notes, setNotes] = useState('')

  // Cart
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState('')
  const [selectedVariant, setSelectedVariant] = useState('')
  const [quantity, setQuantity] = useState(1)

  const currentProduct = products.find((p) => p.id === selectedProduct)

  function handleAddToCart() {
    if (!selectedVariant || quantity < 1) return
    const product = products.find((p) => p.variants.some((v) => v.id === selectedVariant))
    const variant = product?.variants.find((v) => v.id === selectedVariant)
    if (!product || !variant) return

    setCart((prev) => [
      ...prev,
      {
        variantId: variant.id,
        variantName: variant.name,
        productName: product.name,
        quantity,
        unit: variant.unit,
      },
    ])
    setSelectedVariant('')
    setQuantity(1)
  }

  function handleRemoveFromCart(index: number) {
    setCart((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit() {
    if (!contactId) {
      setError('Selecione um contato')
      return
    }
    if (cart.length === 0) {
      setError('Adicione pelo menos um item')
      return
    }
    if (!tier) {
      setError('Selecione uma faixa de preço')
      return
    }

    setError(null)
    startTransition(async () => {
      try {
        const pedido = await createPedido({
          contactId,
          leadId: leadId || undefined,
          ownerId: userId,
          notes: notes || undefined,
        })

        // Add all items
        for (const item of cart) {
          await addItem(pedido.id, {
            variantId: item.variantId,
            quantity: item.quantity,
            membershipTier: tier,
          })
        }

        // Submit
        await submitPedido(pedido.id)

        router.push(`/pedidos/${pedido.id}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao criar pedido')
      }
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {error && (
        <div className="card" style={{ borderLeft: '3px solid var(--color-danger)' }}>
          <p style={{ fontSize: 13, color: '#C44040' }}>{error}</p>
        </div>
      )}

      {/* Contact & Lead info */}
      <div className="card">
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-gray-800)', marginBottom: 12 }}>
          Dados do pedido
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-gray-600)' }}>Contato</label>
            {contactName ? (
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-gray-800)', marginTop: 4 }}>{contactName}</p>
            ) : (
              <input
                type="text"
                className="input"
                placeholder="ID do contato"
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                style={{ marginTop: 4 }}
              />
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

      {/* Add items */}
      <div className="card">
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-gray-800)', marginBottom: 12 }}>
          Itens
        </h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-gray-500)' }}>Produto</label>
            <select
              className="input"
              value={selectedProduct}
              onChange={(e) => { setSelectedProduct(e.target.value); setSelectedVariant('') }}
              style={{ marginTop: 4 }}
            >
              <option value="">Selecione...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          {currentProduct && currentProduct.variants.length > 0 && (
            <div style={{ flex: '1 1 200px' }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-gray-500)' }}>Variante</label>
              <select
                className="input"
                value={selectedVariant}
                onChange={(e) => setSelectedVariant(e.target.value)}
                style={{ marginTop: 4 }}
              >
                <option value="">Selecione...</option>
                {currentProduct.variants.map((v) => (
                  <option key={v.id} value={v.id}>{v.name} ({v.sku})</option>
                ))}
              </select>
            </div>
          )}
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
            disabled={!selectedVariant}
          >
            Adicionar
          </button>
        </div>

        {cart.length > 0 && (
          <table className="data-table" style={{ marginTop: 16 }}>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Variante</th>
                <th>Qtd</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.productName}</td>
                  <td>{item.variantName}</td>
                  <td>{item.quantity} {item.unit}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleRemoveFromCart(idx)}
                      style={{ fontSize: 12, color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Submit */}
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
