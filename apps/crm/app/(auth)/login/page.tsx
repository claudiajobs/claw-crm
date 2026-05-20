import Link from 'next/link'
import { login } from '@/lib/actions/auth'

interface LoginPageProps {
  searchParams: Promise<{ next?: string; erro?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { erro } = await searchParams

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

      {/* Login card */}
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
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-gray-800)', marginBottom: 4 }}>Bem-vindo de volta</h1>
            <p style={{ fontSize: 13, color: 'var(--color-gray-400)' }}>Entre na sua conta</p>
          </div>

          {/* Error */}
          {erro && (
            <div style={{ marginBottom: 24, padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--color-danger-light)', borderLeft: '3px solid var(--color-danger)' }}>
              <p style={{ fontSize: 12, color: '#C44040' }}>{erro}</p>
            </div>
          )}

          <form action={login} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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

            <div className="field">
              <label htmlFor="password" className="field-label">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="input"
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}>
              Entrar
            </button>
          </form>

          <p style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: 'var(--color-gray-400)' }}>
            Nao tem conta?{' '}
            <Link href="/signup" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}
