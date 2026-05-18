export default function TasksLoading() {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ height: 28, width: 128, background: 'var(--color-gray-200)', borderRadius: 'var(--radius-sm)' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {[0, 1, 2].map((group) => (
          <div key={group}>
            <div style={{ height: 20, width: 64, background: 'var(--color-gray-200)', borderRadius: 'var(--radius-full)', marginBottom: 12 }} />
            <div className="card" style={{ padding: 0 }}>
              {[0, 1].map((i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', gap: 16, borderBottom: i === 0 ? '0.5px solid var(--color-gray-100)' : 'none' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ height: 16, width: 192, background: 'var(--color-gray-200)', borderRadius: 'var(--radius-xs)' }} />
                    <div style={{ height: 12, width: 128, background: 'var(--color-gray-100)', borderRadius: 'var(--radius-xs)' }} />
                  </div>
                  <div style={{ height: 28, width: 80, background: 'var(--color-gray-100)', borderRadius: 'var(--radius-sm)' }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
