'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PricingTier {
  slug: string
  name: string
}

export interface PricingVariant {
  id: string
  name: string
  sku: string
  unit: string
  // Current active price per tier slug (null when no price is set yet)
  prices: Record<string, number | null>
}

export interface PricingProduct {
  id: string
  name: string
  active: boolean
  variants: PricingVariant[]
}

export interface PricingCategory {
  id: string
  name: string
  products: PricingProduct[]
}

export interface PricingGrid {
  tiers: PricingTier[]
  categories: PricingCategory[]
  // Every category (including empty ones) — feeds the category <select> in the
  // create-product modal
  allCategories: { id: string; name: string }[]
}

export interface PriceChange {
  variantId: string
  tierSlug: string
  price: number
}

export interface CreateProductVariantInput {
  sku: string
  name: string
  unit: string
}

export interface CreateProductPriceInput {
  // Index into CreateProductData.variants — variants have no id before insert
  variantIndex: number
  tierSlug: string
  price: number
}

export interface CreateProductData {
  name: string
  categoryId?: string
  newCategoryName?: string
  variants: CreateProductVariantInput[]
  prices: CreateProductPriceInput[]
}

// ─── Admin guard ─────────────────────────────────────────────────────────────

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceClient = createServiceClient()
  const { data: profile } = await serviceClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/pipeline')
  }
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export async function getPricingGrid(): Promise<PricingGrid> {
  await requireAdmin()

  const svc = createServiceClient()
  const now = new Date().toISOString()

  const [tiersRes, categoriesRes, productsRes, variantsRes, pricingRes] =
    await Promise.all([
      svc.from('membership_tiers').select('slug, name').order('sort_order'),
      svc.from('product_categories').select('id, name').order('sort_order'),
      // All products (active + inactive) so the toggle can reactivate them
      svc.from('products').select('id, name, active, category_id').order('name'),
      svc
        .from('product_variants')
        .select('id, name, sku, unit, product_id')
        .eq('active', true)
        .order('name'),
      svc
        .from('product_pricing')
        .select('variant_id, tier_slug, price, valid_from, valid_until')
        .lte('valid_from', now)
        .or(`valid_until.is.null,valid_until.gt.${now}`)
        .order('valid_from', { ascending: false }),
    ])

  const tiers: PricingTier[] = (tiersRes.data ?? []).map((t) => ({
    slug: t.slug as string,
    name: t.name as string,
  }))

  // Build price map: `${variant_id}:${tier_slug}` → latest active price
  const priceMap: Record<string, number> = {}
  for (const row of pricingRes.data ?? []) {
    const key = `${row.variant_id}:${row.tier_slug}`
    if (!(key in priceMap)) {
      priceMap[key] = Number(row.price)
    }
  }

  // Group variants by product
  const variantsByProduct = new Map<string, PricingVariant[]>()
  for (const v of variantsRes.data ?? []) {
    const prices: Record<string, number | null> = {}
    for (const tier of tiers) {
      const key = `${v.id}:${tier.slug}`
      prices[tier.slug] = key in priceMap ? priceMap[key] : null
    }
    const list = variantsByProduct.get(v.product_id as string) ?? []
    list.push({
      id: v.id as string,
      name: v.name as string,
      sku: v.sku as string,
      unit: v.unit as string,
      prices,
    })
    variantsByProduct.set(v.product_id as string, list)
  }

  // Group products by category
  const productsByCategory = new Map<string, PricingProduct[]>()
  for (const p of productsRes.data ?? []) {
    const variants = variantsByProduct.get(p.id as string) ?? []
    if (variants.length === 0) continue // no active variants → nothing to price
    const list = productsByCategory.get(p.category_id as string) ?? []
    list.push({
      id: p.id as string,
      name: p.name as string,
      active: Boolean(p.active),
      variants,
    })
    productsByCategory.set(p.category_id as string, list)
  }

  const categories: PricingCategory[] = (categoriesRes.data ?? [])
    .map((c) => ({
      id: c.id as string,
      name: c.name as string,
      products: productsByCategory.get(c.id as string) ?? [],
    }))
    .filter((c) => c.products.length > 0)

  const allCategories = (categoriesRes.data ?? []).map((c) => ({
    id: c.id as string,
    name: c.name as string,
  }))

  return { tiers, categories, allCategories }
}

export async function savePricingGrid(changes: PriceChange[]) {
  await requireAdmin()

  if (changes.length === 0) {
    return { success: true, inserted: 0 }
  }

  const svc = createServiceClient()
  const validFrom = new Date().toISOString()

  // Insert a NEW pricing row per changed cell — never update existing rows,
  // so full price history is preserved.
  const rows = changes.map((c) => ({
    variant_id: c.variantId,
    tier_slug: c.tierSlug,
    price: c.price,
    valid_from: validFrom,
  }))

  const { error } = await svc.from('product_pricing').insert(rows)

  if (error) {
    // Log raw detail server-side; surface a clean PT-BR message to the user.
    console.error('[savePricingGrid] insert failed:', error)
    throw new Error('Não foi possível salvar a tabela de preços. Tente novamente.')
  }

  revalidatePath('/settings/pricing')
  return { success: true, inserted: rows.length }
}

export async function updateProductName(productId: string, name: string): Promise<void> {
  await requireAdmin()

  const trimmed = name.trim()
  if (trimmed === '') {
    throw new Error('Nome do produto não pode ser vazio')
  }
  if (trimmed.length > 120) {
    throw new Error('Nome do produto não pode ter mais de 120 caracteres')
  }

  const svc = createServiceClient()
  const { error } = await svc
    .from('products')
    .update({ name: trimmed })
    .eq('id', productId)

  if (error) {
    // Log raw detail server-side; surface a clean PT-BR message to the user.
    console.error('[updateProductName] update failed:', error)
    throw new Error('Não foi possível atualizar o nome do produto. Tente novamente.')
  }

  revalidatePath('/settings/pricing')
}

// ─── Slug helpers ────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function uniqueSlug(
  svc: ReturnType<typeof createServiceClient>,
  table: 'products' | 'product_categories',
  name: string,
  fallback: string
): Promise<string> {
  const base = slugify(name) || fallback
  const { data } = await svc.from(table).select('slug').like('slug', `${base}%`)
  const existing = new Set((data ?? []).map((r) => r.slug as string))
  if (!existing.has(base)) return base
  let n = 2
  while (existing.has(`${base}-${n}`)) n++
  return `${base}-${n}`
}

// ─── Product management ──────────────────────────────────────────────────────

export async function createProduct(data: CreateProductData): Promise<{ id: string }> {
  await requireAdmin()

  const name = data.name?.trim() ?? ''
  if (name === '') throw new Error('Nome do produto é obrigatório')
  if (name.length > 120) {
    throw new Error('Nome do produto não pode ter mais de 120 caracteres')
  }

  const newCategoryName = data.newCategoryName?.trim() ?? ''
  if (!data.categoryId && newCategoryName === '') {
    throw new Error('Selecione uma categoria ou crie uma nova')
  }
  if (newCategoryName.length > 120) {
    throw new Error('Nome da categoria não pode ter mais de 120 caracteres')
  }

  const variants = (data.variants ?? []).map((v) => ({
    sku: v.sku?.trim() ?? '',
    name: v.name?.trim() ?? '',
    unit: v.unit?.trim() || 'un',
  }))
  if (variants.length === 0) throw new Error('Adicione ao menos uma variante')
  if (variants.some((v) => v.sku === '' || v.name === '')) {
    throw new Error('SKU e nome são obrigatórios em todas as variantes')
  }
  const skus = variants.map((v) => v.sku)
  if (new Set(skus).size !== skus.length) {
    throw new Error('SKUs duplicados no formulário — cada variante precisa de um SKU único')
  }

  const prices = (data.prices ?? []).filter(
    (p) =>
      Number.isInteger(p.variantIndex) &&
      p.variantIndex >= 0 &&
      p.variantIndex < variants.length &&
      typeof p.tierSlug === 'string' &&
      Number.isFinite(p.price) &&
      p.price >= 0
  )

  const svc = createServiceClient()

  // 1. Category — reuse selected or create a new one
  let categoryId = data.categoryId ?? ''
  let createdCategoryId: string | null = null
  if (!categoryId) {
    const slug = await uniqueSlug(svc, 'product_categories', newCategoryName, 'categoria')
    const { data: maxRow } = await svc
      .from('product_categories')
      .select('sort_order')
      .order('sort_order', { ascending: false })
      .limit(1)
      .maybeSingle()
    const { data: cat, error: catError } = await svc
      .from('product_categories')
      .insert({
        name: newCategoryName,
        slug,
        sort_order: ((maxRow?.sort_order as number) ?? 0) + 1,
      })
      .select('id')
      .single()
    if (catError || !cat) {
      console.error('[createProduct] category insert failed:', catError)
      throw new Error('Não foi possível criar a categoria. Tente novamente.')
    }
    categoryId = cat.id as string
    createdCategoryId = categoryId
  }

  // Best-effort rollback — supabase-js has no transactions, so on a later
  // failure we delete what was inserted (product delete cascades to variants
  // and pricing).
  async function rollback(productId: string | null) {
    if (productId) await svc.from('products').delete().eq('id', productId)
    if (createdCategoryId) {
      await svc.from('product_categories').delete().eq('id', createdCategoryId)
    }
  }

  // 2. Product
  const productSlug = await uniqueSlug(svc, 'products', name, 'produto')
  const { data: product, error: productError } = await svc
    .from('products')
    .insert({ name, slug: productSlug, category_id: categoryId })
    .select('id')
    .single()
  if (productError || !product) {
    console.error('[createProduct] product insert failed:', productError)
    await rollback(null)
    throw new Error('Não foi possível criar o produto. Tente novamente.')
  }
  const productId = product.id as string

  // 3. Variants
  const { data: insertedVariants, error: variantsError } = await svc
    .from('product_variants')
    .insert(variants.map((v) => ({ ...v, product_id: productId })))
    .select('id, sku')
  if (variantsError || !insertedVariants) {
    console.error('[createProduct] variants insert failed:', variantsError)
    await rollback(productId)
    if (variantsError?.code === '23505') {
      throw new Error('Já existe uma variante com um dos SKUs informados.')
    }
    throw new Error('Não foi possível criar as variantes. Tente novamente.')
  }

  // 4. Pricing — map submitted prices to the new variant ids via SKU
  if (prices.length > 0) {
    const idBySku = new Map(
      insertedVariants.map((v) => [v.sku as string, v.id as string])
    )
    const validFrom = new Date().toISOString()
    const rows = prices.map((p) => ({
      variant_id: idBySku.get(variants[p.variantIndex].sku),
      tier_slug: p.tierSlug,
      price: Math.round(p.price * 100) / 100,
      valid_from: validFrom,
    }))
    const { error: pricingError } = await svc.from('product_pricing').insert(rows)
    if (pricingError) {
      console.error('[createProduct] pricing insert failed:', pricingError)
      await rollback(productId)
      throw new Error('Não foi possível salvar os preços do produto. Tente novamente.')
    }
  }

  revalidatePath('/settings/pricing')
  return { id: productId }
}

export async function updateCategoryName(categoryId: string, name: string): Promise<void> {
  await requireAdmin()

  const trimmed = name.trim()
  if (trimmed === '') {
    throw new Error('Nome da categoria não pode ser vazio')
  }
  if (trimmed.length > 120) {
    throw new Error('Nome da categoria não pode ter mais de 120 caracteres')
  }

  const svc = createServiceClient()
  const { error } = await svc
    .from('product_categories')
    .update({ name: trimmed })
    .eq('id', categoryId)

  if (error) {
    // Log raw detail server-side; surface a clean PT-BR message to the user.
    console.error('[updateCategoryName] update failed:', error)
    throw new Error('Não foi possível atualizar o nome da categoria. Tente novamente.')
  }

  revalidatePath('/settings/pricing')
}

export async function toggleProductActive(productId: string, active: boolean) {
  await requireAdmin()

  const svc = createServiceClient()
  const { error } = await svc
    .from('products')
    .update({ active })
    .eq('id', productId)

  if (error) {
    // Log raw detail server-side; surface a clean PT-BR message to the user.
    console.error('[toggleProductActive] update failed:', error)
    throw new Error('Não foi possível atualizar o produto. Tente novamente.')
  }

  revalidatePath('/settings/pricing')
  return { success: true }
}
