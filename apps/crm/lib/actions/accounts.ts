'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// ─── createAccount ─────────────────────────────────────────────────────────────
export async function createAccount(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = (formData.get('name') as string | null)?.trim() ?? ''
  const type = (formData.get('type') as string | null)?.trim() ?? ''
  const phone = (formData.get('phone') as string | null)?.trim() || null
  const address = (formData.get('address') as string | null)?.trim() || null
  const city = (formData.get('city') as string | null)?.trim() || null
  const state = (formData.get('state') as string | null)?.trim() || null
  const territory = (formData.get('territory') as string | null)?.trim() || null
  const region = (formData.get('region') as string | null)?.trim() || null
  const payment_terms = (formData.get('payment_terms') as string | null)?.trim() || null
  const rawCredit = formData.get('credit_limit') as string | null
  const credit_limit = rawCredit ? Number(rawCredit) : null
  const rawVolume = formData.get('annual_volume_liters') as string | null
  const annual_volume_liters = rawVolume ? Number(rawVolume) : null

  if (!name) redirect('/accounts/new?erro=Nome+é+obrigatório')
  if (!type) redirect('/accounts/new?erro=Tipo+é+obrigatório')

  const { data: account, error } = await supabase
    .from('accounts')
    .insert({
      name,
      type,
      phone,
      address,
      city,
      state,
      territory,
      region: region || null,
      payment_terms,
      credit_limit,
      annual_volume_liters,
      owner_id: user.id,
    })
    .select('id')
    .single()

  if (error || !account) {
    redirect(
      `/accounts/new?erro=${encodeURIComponent('Erro ao criar conta: ' + (error?.message ?? 'desconhecido'))}`
    )
  }

  revalidatePath('/accounts')
  redirect(`/accounts/${account.id}`)
}

// ─── updateAccount ─────────────────────────────────────────────────────────────
export async function updateAccount(
  accountId: string,
  fields: {
    name?: string
    type?: string
    phone?: string | null
    address?: string | null
    city?: string | null
    state?: string | null
    territory?: string | null
    region?: string | null
    payment_terms?: string | null
    credit_limit?: number | null
    annual_volume_liters?: number | null
  }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase.from('accounts').update(fields).eq('id', accountId)

  revalidatePath(`/accounts/${accountId}`)
  revalidatePath('/accounts')
}
