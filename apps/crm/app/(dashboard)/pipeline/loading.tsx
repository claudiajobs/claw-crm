export default function PipelineLoading() {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ height: 28, width: 80, background: 'var(--color-gray-200)', borderRadius: 'var(--radius-sm)' }} />
        <div style={{ height: 16, width: 288, background: 'var(--color-gray-100)', borderRadius: 'var(--radius-sm)', marginTop: 6 }} />
      </div>

      <div className="kanban-board">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="kanban-col">
            <div style={{ padding: '0 4px 4px' }}>
              <div style={{ height: 12, width: 80, background: 'var(--color-gray-200)', borderRadius: 'var(--radius-xs)' }} />
            </div>
            <div className="kanban-drop-zone">
              {Array.from({ length: Math.max(1, 3 - i) }).map((_, j) => (
                <div key={j} className="deal-card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ height: 16, width: '100%', background: 'var(--color-gray-200)', borderRadius: 'var(--radius-xs)' }} />
                  <div style={{ height: 12, width: 96, background: 'var(--color-gray-100)', borderRadius: 'var(--radius-xs)' }} />
                  <div style={{ height: 12, width: 64, background: 'var(--color-gray-100)', borderRadius: 'var(--radius-xs)' }} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
