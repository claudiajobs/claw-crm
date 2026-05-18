export default function ContactDetailLoading() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ height: 16, width: 80, background: 'var(--color-gray-200)', borderRadius: 'var(--radius-xs)' }} />
        <div style={{ height: 16, width: 8, background: 'var(--color-gray-100)', borderRadius: 'var(--radius-xs)' }} />
        <div style={{ height: 28, width: 192, background: 'var(--color-gray-200)', borderRadius: 'var(--radius-xs)' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="card">
          <div style={{ height: 24, width: 160, background: 'var(--color-gray-200)', borderRadius: 'var(--radius-xs)', marginBottom: 20 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px 24px' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ height: 12, width: 64, background: 'var(--color-gray-100)', borderRadius: 'var(--radius-xs)' }} />
                <div style={{ height: 16, width: 112, background: 'var(--color-gray-200)', borderRadius: 'var(--radius-xs)' }} />
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div style={{ height: 16, width: 96, background: 'var(--color-gray-200)', borderRadius: 'var(--radius-xs)', marginBottom: 12 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[0, 1].map((i) => (
              <div key={i} style={{ height: 40, background: 'var(--color-gray-100)', borderRadius: 'var(--radius-xs)' }} />
            ))}
          </div>
        </div>

        <div className="card">
          <div style={{ height: 16, width: 96, background: 'var(--color-gray-200)', borderRadius: 'var(--radius-xs)', marginBottom: 16 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 6, borderRadius: 'var(--radius-full)', background: 'var(--color-gray-200)' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ height: 12, width: 160, background: 'var(--color-gray-100)', borderRadius: 'var(--radius-xs)' }} />
                  <div style={{ height: 16, width: 256, background: 'var(--color-gray-200)', borderRadius: 'var(--radius-xs)' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
