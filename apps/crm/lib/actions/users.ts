'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type UserRole = 'admin' | 'editor' | 'vendedor' | 'sdr'

export async function approveUser(userId: string, role: UserRole) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('users')
    .update({
      status: 'active',
      role,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/settings/users')
  return { success: true }
}

export async function suspendUser(userId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('users')
    .update({ status: 'suspended' })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/settings/users')
  return { success: true }
}

export async function reactivateUser(userId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase
    .from('users')
    .update({ status: 'active' })
    .eq('id', userId)

  if (error) return { error: error.message }

  revalidatePath('/settings/users')
  return { success: true }
}
