'use client'

import { useEffect, useState } from 'react'

const formatter = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'full',
  timeStyle: 'medium',
})

export default function Clock() {
  // Computed on mount, never during render: formatting `new Date()` on the
  // server yields different text than the client's first render, which React
  // reports as a hydration mismatch.
  const [now, setNow] = useState<string | null>(null)

  useEffect(() => {
    setNow(formatter.format(new Date()))
  }, [])

  return (
    <p style={{ color: '#333', fontSize: '1rem' }}>{now ?? '—'}</p>
  )
}
