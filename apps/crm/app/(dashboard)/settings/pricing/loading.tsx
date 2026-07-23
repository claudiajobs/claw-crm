export default function PricingLoading() {
  return (
    <div>
      {/* Title + subtitle */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ height: 24, width: 180, background: 'var(--color-gray-200)', borderRadius: 'var(--radius-sm)', marginBottom: 8 }} />
        <div style={{ height: 14, width: 360, background: 'var(--color-gray-100)', borderRadius: 'var(--radius-xs)' }} />
      </div>

      {/* Pricing grid skeleton — header row + product rows across tier columns */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ background: 'var(--color-gray-50)', borderBottom: '1px solid var(--color-gray-100)', padding: '9px 14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr repeat(4, 1fr)', gap: 16 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ height: 16, background: 'var(--color-gray-200)', borderRadius: 'var(--radius-xs)' }} />
            ))}
          </div>
        </div>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ padding: '10px 14px', borderBottom: '0.5px solid var(--color-gray-100)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr repeat(4, 1fr)', gap: 16, alignItems: 'center' }}>
              <div style={{ height: 16, background: 'var(--color-gray-100)', borderRadius: 'var(--radius-xs)', width: `${55 + (i * 7) % 35}%` }} />
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} style={{ height: 28, background: 'var(--color-gray-100)', borderRadius: 'var(--radius-xs)' }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
