export default function EditPedidoLoading() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ height: 16, width: 48, background: 'var(--color-gray-200)', borderRadius: 'var(--radius-xs)' }} />
        <div style={{ height: 16, width: 16, background: 'var(--color-gray-100)', borderRadius: 'var(--radius-xs)' }} />
        <div style={{ height: 24, width: 256, background: 'var(--color-gray-200)', borderRadius: 'var(--radius-xs)' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="card">
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 200 }}>
                <div style={{ height: 12, width: 80, background: 'var(--color-gray-100)', borderRadius: 'var(--radius-xs)' }} />
                <div style={{ height: 34, width: 200, background: 'var(--color-gray-100)', borderRadius: 'var(--radius-sm)' }} />
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div style={{ height: 20, width: 160, background: 'var(--color-gray-200)', borderRadius: 'var(--radius-xs)', marginBottom: 16 }} />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '10px 0', borderBottom: '0.5px solid var(--color-gray-100)' }}>
              <div style={{ height: 16, width: 192, background: 'var(--color-gray-100)', borderRadius: 'var(--radius-xs)' }} />
              <div style={{ height: 16, width: 64, background: 'var(--color-gray-100)', borderRadius: 'var(--radius-xs)' }} />
              <div style={{ height: 16, width: 96, background: 'var(--color-gray-100)', borderRadius: 'var(--radius-xs)' }} />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ height: 34, width: 144, background: 'var(--color-gray-200)', borderRadius: 'var(--radius-sm)' }} />
          <div style={{ height: 34, width: 96, background: 'var(--color-gray-100)', borderRadius: 'var(--radius-sm)' }} />
        </div>
      </div>
    </div>
  )
}
