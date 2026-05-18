export default function ContactsLoading() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ height: 28, width: 128, background: 'var(--color-gray-200)', borderRadius: 'var(--radius-sm)' }} />
        <div style={{ height: 34, width: 144, background: 'var(--color-gray-200)', borderRadius: 'var(--radius-sm)' }} />
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, padding: '9px 14px', borderBottom: '1px solid var(--color-gray-100)', background: 'var(--color-gray-50)' }}>
          {['Nome', 'Canal', 'Tipo', 'Status', 'Território'].map((col) => (
            <div key={col} style={{ height: 16, width: 80, background: 'var(--color-gray-200)', borderRadius: 'var(--radius-xs)' }} />
          ))}
        </div>

        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, padding: '10px 14px', borderBottom: '0.5px solid var(--color-gray-100)' }}>
            <div style={{ height: 16, background: 'var(--color-gray-100)', borderRadius: 'var(--radius-xs)', width: 160 }} />
            <div style={{ height: 16, background: 'var(--color-gray-100)', borderRadius: 'var(--radius-xs)', width: 112 }} />
            <div style={{ height: 16, background: 'var(--color-gray-100)', borderRadius: 'var(--radius-xs)', width: 96 }} />
            <div style={{ height: 20, background: 'var(--color-gray-100)', borderRadius: 'var(--radius-full)', width: 80 }} />
            <div style={{ height: 16, background: 'var(--color-gray-100)', borderRadius: 'var(--radius-xs)', width: 64 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
