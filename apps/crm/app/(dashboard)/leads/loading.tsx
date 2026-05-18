export default function LeadsLoading() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ height: 28, width: 64, background: 'var(--color-gray-200)', borderRadius: 'var(--radius-sm)' }} />
        <div style={{ height: 34, width: 112, background: 'var(--color-gray-200)', borderRadius: 'var(--radius-sm)' }} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} style={{ height: 24, width: 80, background: 'var(--color-gray-200)', borderRadius: 'var(--radius-full)' }} />
        ))}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ background: 'var(--color-gray-50)', borderBottom: '1px solid var(--color-gray-100)', padding: '9px 14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ height: 16, background: 'var(--color-gray-200)', borderRadius: 'var(--radius-xs)' }} />
            ))}
          </div>
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ padding: '10px 14px', borderBottom: '0.5px solid var(--color-gray-100)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
              {Array.from({ length: 5 }).map((_, j) => (
                <div key={j} style={{ height: 16, background: 'var(--color-gray-100)', borderRadius: 'var(--radius-xs)', width: `${60 + (j * 10) % 40}%` }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
