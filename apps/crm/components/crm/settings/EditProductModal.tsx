'use client'

import { useEffect, useState, useTransition } from 'react'
import { IconX } from '@tabler/icons-react'
import { updateProduct } from '@/lib/actions/pricing'

const NEW_CATEGORY = '__new__'

interface EditProductModalProps {
  product: { id: string; name: string; categoryId: string }
  categories: { id: string; name: string }[]
  onClose: () => void
  onSaved: () => void
}

export default function EditProductModal({
  product,
  categories,
  onClose,
  onSaved,
}: EditProductModalProps) {
  const [name, setName] = useState(product.name)
  const [categoryId, setCategoryId] = useState(product.categoryId)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && !isPending) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, isPending])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Nome do produto é obrigatório')
      return
    }
    if (!categoryId || (categoryId === NEW_CATEGORY && !newCategoryName.trim())) {
      setError('Selecione uma categoria ou informe o nome da nova categoria')
      return
    }

    startTransition(async () => {
      try {
        const isNewCategory = categoryId === NEW_CATEGORY
        await updateProduct(product.id, {
          name: trimmedName,
          categoryId: isNewCategory ? '' : categoryId,
          newCategoryName: isNewCategory ? newCategoryName.trim() : undefined,
        })
        onSaved()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar produto')
      }
    })
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose()
      }}
    >
      <div
        className="card"
        style={{ width: '100%', maxWidth: 440, margin: 16, padding: 0, borderRadius: 'var(--radius-xl)' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '0.5px solid var(--color-gray-100)' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-gray-800)' }}>
            Editar produto
          </h2>
          <button onClick={onClose} disabled={isPending} className="btn-icon" aria-label="Fechar">
            <IconX size={16} stroke={1.5} />
          </button>
        </div>

        {/* Body */}
        <form
          onSubmit={handleSubmit}
          style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}
        >
          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--color-danger-light)', borderLeft: '3px solid var(--color-danger)' }}>
              <p style={{ fontSize: 12, color: '#C44040' }}>{error}</p>
            </div>
          )}

          <div className="field">
            <label htmlFor="edit-product-name" className="field-label">
              Nome do produto <span className="req">*</span>
            </label>
            <input
              id="edit-product-name"
              type="text"
              className="input"
              maxLength={120}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="field">
            <label htmlFor="edit-product-category" className="field-label">
              Categoria <span className="req">*</span>
            </label>
            <select
              id="edit-product-category"
              className="input"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 8 }}>
            <button type="button" onClick={onClose} disabled={isPending} className="btn btn-ghost">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="btn btn-primary"
              style={{ opacity: isPending ? 0.6 : 1 }}
            >
              {isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
