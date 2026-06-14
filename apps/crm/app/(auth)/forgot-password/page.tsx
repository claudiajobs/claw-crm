'use client'

import Link from 'next/link'
import { useState } from 'react'
import { sendPasswordReset } from '@/lib/actions/auth'
import { IconCircleCheck } from '@tabler/icons-react'

export default function ForgotPasswordPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [sentEmail, setSentEmail] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setErrorMsg('')

    const formData = new FormData(e.currentTarget)
    const result = await sendPasswordReset(formData)

    if (result.success) {
      setSentEmail(formData.get('email') as string)
      setStatus('success')
    } else {
      setErrorMsg(result.error ?? 'Erro ao enviar email.')
      setStatus('error')
    }
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
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-gray-800)', marginBottom: 4 }}>Recuperar senha</h1>
            <p style={{ fontSize: 13, color: 'var(--color-gray-400)' }}>Digite seu email para receber o link de recuperação</p>
          </div>

          {status === 'success' ? (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <IconCircleCheck size={48} style={{ color: 'var(--color-success)', marginBottom: 16 }} />
              <p style={{ fontSize: 14, color: 'var(--color-gray-800)', fontWeight: 600, marginBottom: 8 }}>
                Verifique seu email
              </p>
              <p style={{ fontSize: 13, color: 'var(--color-gray-500)' }}>
                Enviamos um link para <strong>{sentEmail}</strong>.
              </p>
              <Link
                href="/login"
                style={{
                  display: 'inline-block',
                  marginTop: 24,
                  fontSize: 13,
                  color: 'var(--color-primary)',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Voltar para o login
              </Link>
            </div>
          ) : (
            <>
              {status === 'error' && (
                <div style={{ marginBottom: 24, padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--color-danger-light)', borderLeft: '3px solid var(--color-danger)' }}>
                  <p style={{ fontSize: 12, color: '#C44040' }}>{errorMsg}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div className="field">
                  <label htmlFor="email" className="field-label">
                    E-mail
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="voce@empresa.com"
                    className="input"
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', justifyContent: 'center' }}
                  disabled={status === 'loading'}
                >
                  {status === 'loading' ? 'Enviando...' : 'Enviar link de recuperação'}
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
