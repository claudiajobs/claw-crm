'use client'

import { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
      }}
    >
      <p style={{ fontSize: '1.125rem', fontWeight: 600 }}>count: {count}</p>
      <button
        type="button"
        onClick={() => setCount((current) => current + 1)}
        style={{
          fontFamily: 'inherit',
          fontSize: '0.875rem',
          padding: '0.5rem 1rem',
          border: '1px solid #ccc',
          borderRadius: '0.375rem',
          background: '#fff',
          cursor: 'pointer',
        }}
      >
        Increment
      </button>
    </div>
  )
}
