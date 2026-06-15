'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { IconCircleCheck, IconLoader2 } from '@tabler/icons-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [validationError, setValidationError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    // Timeout fallback — if token doesn't trigger PASSWORD_RECOVERY in 5s, show error
    const timeout = setTimeout(() => {
      setErrorMsg('Link inválido ou expirado. Solicite um novo email de recuperação.')
      setStatus('error')
    }, 5000)

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        clearTimeout(timeout)
        setReady(true)
      }
    })

    return () => {
      clearTimeout(timeout)
      subscription.unsubscribe()
    }

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setValidationError('')
    setErrorMsg('')

    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password.length < 8) {
      setValidationError('A senha deve ter pelo menos 8 caracteres.')
      return
    }

    if (password !== confirmPassword) {
      setValidationError('As senhas não coincidem.')
      return
    }

    setStatus('loading')

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setErrorMsg(error.message)
      setStatus('error')
      return
    }

    setStatus('success')
    setTimeout(() => {
      router.push('/login?sucesso=' + encodeURIComponent('Senha atualizada com sucesso! Faça login.'))
    }, 2000)
  }

  return (
    <>
      {/* Video background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
        }}
      >
        <source src="/login-bg.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 10,
          background: 'linear-gradient(to bottom right, rgba(0,0,0,0.55), rgba(30,20,60,0.65))',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)',
        }}
      />

      {/* Card */}
      <div
        style={{
          position: 'relative',
          zIndex: 20,
          width: '100%',
          maxWidth: 400,
          padding: '0 20px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            padding: 40,
            borderRadius: 'var(--radius-xl)',
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.3)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          }}
        >
          {/* Logo */}
          <div style={{ marginBottom: 32, textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div className="sb-mark" style={{ width: 36, height: 36, fontSize: 16 }}>S</div>
              <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-gray-800)', letterSpacing: '-0.02em' }}>sevende</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-gray-800)', marginBottom: 4 }}>Nova senha</h1>
            <p style={{ fontSize: 13, color: 'var(--color-gray-400)' }}>Escolha uma senha segura para sua conta</p>
          </div>

          {!ready ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <IconLoader2 size={32} style={{ color: 'var(--color-primary)', animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: 13, color: 'var(--color-gray-400)', marginTop: 12 }}>Verificando link...</p>
              <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
            </div>
          ) : status === 'success' ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <IconCircleCheck size={48} style={{ color: 'var(--color-success)', marginBottom: 16 }} />
              <p style={{ fontSize: 14, color: 'var(--color-gray-800)', fontWeight: 600, marginBottom: 8 }}>
                Senha atualizada com sucesso!
              </p>
              <p style={{ fontSize: 13, color: 'var(--color-gray-500)' }}>
                Redirecionando para o login...
              </p>
            </div>
          ) : (
            <>
              {(errorMsg || validationError) && (
                <div style={{ marginBottom: 24, padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--color-danger-light)', borderLeft: '3px solid var(--color-danger)' }}>
                  <p style={{ fontSize: 12, color: '#C44040' }}>{validationError || errorMsg}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="field">
                  <label htmlFor="password" className="field-label">
                    Nova senha
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    placeholder="Mínimo 8 caracteres"
                    className="input"
                  />
                </div>

                <div className="field">
                  <label htmlFor="confirmPassword" className="field-label">
                    Confirmar nova senha
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    placeholder="Repita a senha"
                    className="input"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', justifyContent: 'center' }}
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? 'Salvando...' : 'Salvar nova senha'}
                </button>
              </form>

              <p style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: 'var(--color-gray-400)' }}>
                <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                  Voltar para o login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </>
  )
}
