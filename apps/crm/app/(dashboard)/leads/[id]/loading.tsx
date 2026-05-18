export default function LeadDetailLoading() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ height: 16, width: 48, background: 'var(--color-gray-200)', borderRadius: 'var(--radius-xs)' }} />
        <div style={{ height: 16, width: 16, background: 'var(--color-gray-100)', borderRadius: 'var(--radius-xs)' }} />
        <div style={{ height: 24, width: 256, background: 'var(--color-gray-200)', borderRadius: 'var(--radius-xs)' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ height: 24, width: 256, background: 'var(--color-gray-200)', borderRadius: 'var(--radius-xs)' }} />
              <div style={{ height: 16, width: 160, background: 'var(--color-gray-100)', borderRadius: 'var(--radius-xs)' }} />
            </div>
            <div style={{ height: 24, width: 80, background: 'var(--color-gray-200)', borderRadius: 'var(--radius-full)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ height: 12, width: 80, background: 'var(--color-gray-100)', borderRadius: 'var(--radius-xs)' }} />
                <div style={{ height: 16, width: 112, background: 'var(--color-gray-200)', borderRadius: 'var(--radius-xs)' }} />
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div style={{ height: 20, width: 160, background: 'var(--color-gray-200)', borderRadius: 'var(--radius-xs)', marginBottom: 16 }} />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
              <div style={{ height: 16, width: 192, background: 'var(--color-gray-100)', borderRadius: 'var(--radius-xs)' }} />
              <div style={{ height: 16, width: 40, background: 'var(--color-gray-100)', borderRadius: 'var(--radius-full)' }} />
            </div>
          ))}
        </div>

        <div className="card">
          <div style={{ height: 20, width: 96, background: 'var(--color-gray-200)', borderRadius: 'var(--radius-xs)', marginBottom: 16 }} />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 0' }}>
              <div style={{ height: 20, width: 20, background: 'var(--color-gray-200)', borderRadius: 'var(--radius-xs)' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ height: 12, width: 128, background: 'var(--color-gray-200)', borderRadius: 'var(--radius-xs)' }} />
                <div style={{ height: 16, width: '100%', background: 'var(--color-gray-100)', borderRadius: 'var(--radius-xs)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
