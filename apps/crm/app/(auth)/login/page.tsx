import Link from 'next/link'
import { login } from '@/lib/actions/auth'

interface LoginPageProps {
  searchParams: Promise<{ next?: string; erro?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { erro } = await searchParams

  return (
    <div style={{ width: '100%', maxWidth: 420 }}>
      <div className="card" style={{ padding: '40px 32px', borderRadius: 'var(--radius-xl)' }}>
        {/* Logo */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div className="sb-mark" style={{ width: 36, height: 36, fontSize: 16 }}>S</div>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-gray-800)', letterSpacing: '-0.02em' }}>sevende</span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--color-gray-400)' }}>Acesse sua conta</p>
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
  )
}
