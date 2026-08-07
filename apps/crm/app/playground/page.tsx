import Clock from './Clock'

export const dynamic = 'force-dynamic'

// Sandbox route for the ticket-loop automation. Automated tickets labelled `toy`
// are restricted to this directory, so nothing they do can reach the product.
export default function PlaygroundPage() {
  const builtAt = new Date().toISOString()

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        fontFamily: 'system-ui, sans-serif',
        padding: '2rem',
      }}
    >
      <h1 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Playground</h1>
      <p style={{ color: '#666', fontSize: '0.875rem' }}>
        Sandbox route — automated toy tickets land here.
      </p>
      <Clock />
      <p style={{ color: '#999', fontSize: '0.75rem', fontFamily: 'monospace' }}>
        rendered at {builtAt}
      </p>
    </main>
  )
}
