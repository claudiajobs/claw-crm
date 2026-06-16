'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'

// ─── Share a pedido with one or more users ──────────────────────────────────

export async function sharePedido(pedidoId: string, userIds: string[]) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (userIds.length === 0) return

  const serviceClient = createServiceClient()

  // Verify caller has permission (owner, admin, or editor)
  const { data: profile } = await serviceClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const { data: pedido } = await serviceClient
    .from('pedidos')
    .select('owner_id')
    .eq('id', pedidoId)
    .single()

  if (!pedido) throw new Error('Pedido não encontrado')

  const isOwner = pedido.owner_id === user.id
  const isPrivileged = profile?.role === 'admin' || profile?.role === 'editor'
  if (!isOwner && !isPrivileged) {
    throw new Error('Sem permissão para compartilhar este pedido')
  }

  const rows = userIds.map((uid) => ({
    pedido_id: pedidoId,
    shared_with: uid,
    shared_by: user.id,
  }))

  const { error } = await serviceClient
    .from('pedido_shares')
    .upsert(rows, { onConflict: 'pedido_id,shared_with', ignoreDuplicates: true })

  if (error) throw new Error(`Erro ao compartilhar: ${error.message}`)

  revalidatePath(`/pedidos/${pedidoId}`)
  revalidatePath('/pedidos')
}

// ─── Remove a share ─────────────────────────────────────────────────────────

export async function unsharePedido(pedidoId: string, userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const serviceClient = createServiceClient()

  const { data: profile } = await serviceClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const { data: pedido } = await serviceClient
    .from('pedidos')
    .select('owner_id')
    .eq('id', pedidoId)
    .single()

  if (!pedido) throw new Error('Pedido não encontrado')

  const isOwner = pedido.owner_id === user.id
  const isPrivileged = profile?.role === 'admin' || profile?.role === 'editor'
  if (!isOwner && !isPrivileged) {
    throw new Error('Sem permissão para remover compartilhamento')
  }

  const { error } = await serviceClient
    .from('pedido_shares')
    .delete()
    .eq('pedido_id', pedidoId)
    .eq('shared_with', userId)

  if (error) throw new Error(`Erro ao remover compartilhamento: ${error.message}`)

  revalidatePath(`/pedidos/${pedidoId}`)
  revalidatePath('/pedidos')
}

// ─── List shares for a pedido ───────────────────────────────────────────────

export async function getPedidoShares(pedidoId: string) {
  const serviceClient = createServiceClient()

  const { data, error } = await serviceClient
    .from('pedido_shares')
    .select('id, shared_with, shared_by, created_at, user:users!pedido_shares_shared_with_fkey(id, name, email)')
    .eq('pedido_id', pedidoId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Erro ao buscar compartilhamentos: ${error.message}`)

  return (data ?? []).map((row) => {
    const u = Array.isArray(row.user) ? row.user[0] : row.user
    return {
      id: row.id,
      sharedWith: row.shared_with,
      sharedBy: row.shared_by,
      createdAt: row.created_at,
      userName: u?.name ?? u?.email ?? '—',
      userEmail: u?.email ?? '',
    }
  })
}

// ─── Get active users for the share picker ──────────────────────────────────

export async function getActiveUsers() {
  const serviceClient = createServiceClient()

  const { data } = await serviceClient
    .from('users')
    .select('id, name, email')
    .eq('status', 'active')
    .order('name', { ascending: true })

  return data ?? []
}
