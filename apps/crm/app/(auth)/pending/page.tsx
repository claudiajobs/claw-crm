import { logout } from '@/lib/actions/auth'
import { IconClock } from '@tabler/icons-react'

export default function PendingPage() {
  return (
    <div style={{ width: '100%', maxWidth: 420 }}>
      <div className="card" style={{ padding: '40px 32px', borderRadius: 'var(--radius-xl)', textAlign: 'center' }}>
        {/* Logo */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div className="sb-mark" style={{ width: 36, height: 36, fontSize: 16 }}>S</div>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-gray-800)', letterSpacing: '-0.02em' }}>sevende</span>
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ width: 56, height: 56, borderRadius: 'var(--radius-full)', background: 'var(--color-warning-light)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconClock size={24} stroke={1.5} style={{ color: 'var(--color-warning)' }} aria-hidden />
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-gray-800)', marginBottom: 8 }}>
            Aguardando aprovacao
          </h2>
          <p style={{ fontSize: 13, color: 'var(--color-gray-400)' }}>
            Seu acesso esta sendo avaliado. Um administrador ira aprovar sua conta em breve.
          </p>
        </div>

        <form action={logout}>
          <button type="submit" className="btn btn-ghost">
            Sair
          </button>
        </form>
      </div>
    </div>
  )
}
