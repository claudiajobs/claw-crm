'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect(`/login?erro=${encodeURIComponent('Email ou senha inválidos.')}`)
  }

  // Check user status — redirect pending/suspended to /pending
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (user) {
    const serviceClient = createServiceClient()
    const { data: profile } = await serviceClient
      .from('users')
      .select('status')
      .eq('id', user.id)
      .single()

    if (profile && profile.status !== 'active') {
      redirect('/pending')
    }
  }

  revalidatePath('/', 'layout')
  redirect('/contacts')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const name = (formData.get('name') as string)?.trim() ?? ''
  const email = (formData.get('email') as string)?.trim() ?? ''
  const password = (formData.get('password') as string) ?? ''

  if (!name) redirect('/signup?erro=Nome+é+obrigatório')
  if (!email) redirect('/signup?erro=Email+é+obrigatório')
  if (!password || password.length < 6) {
    redirect('/signup?erro=Senha+deve+ter+pelo+menos+6+caracteres')
  }

  // Check for existing user with same email
  const serviceClient = createServiceClient()
  const { data: existingUser } = await serviceClient
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (existingUser) {
    redirect('/signup?erro=Este+email+já+está+registrado')
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) {
    redirect(`/signup?erro=${encodeURIComponent('Erro ao criar conta: ' + authError.message)}`)
  }

  if (authData.user) {
    // Upsert user profile with status=pending (use service client to bypass RLS).
    // Idempotent (conflict on id) so it plays nicely with the auth.users trigger,
    // which also creates a pending profile as a safety net.
    const { error: profileError } = await serviceClient.from('users').upsert(
      {
        id: authData.user.id,
        email,
        name,
        role: 'vendedor',
        status: 'pending',
      },
      { onConflict: 'id' }
    )

    // Do NOT redirect on failure — the DB trigger guarantees the profile exists,
    // so we log and continue to /pending rather than blocking the user.
    if (profileError) {
      console.error('signup: failed to upsert user profile', profileError)
    }
  }

  redirect('/pending')
}

export async function sendPasswordReset(formData: FormData) {
  const supabase = await createClient()
  const email = (formData.get('email') as string)?.trim() ?? ''

  if (!email) {
    return { error: 'E-mail é obrigatório.' }
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: process.env.NEXT_PUBLIC_APP_URL + '/reset-password',
  })

  if (error) {
    return { error: 'Não encontramos uma conta com este email.' }
  }

  return { success: true }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
