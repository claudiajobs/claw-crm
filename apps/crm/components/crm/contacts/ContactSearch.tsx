'use client'

import { useRouter } from 'next/navigation'
import { useRef } from 'react'
import { IconSearch } from '@tabler/icons-react'

interface ContactSearchProps {
  defaultValue: string
}

export default function ContactSearch({ defaultValue }: ContactSearchProps) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const q = (fd.get('q') as string)?.trim()
    if (q) {
      router.push(`/contacts?q=${encodeURIComponent(q)}`)
    } else {
      router.push('/contacts')
    }
  }

  function handleClear() {
    router.push('/contacts')
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div className="input-icon-wrap" style={{ flex: 1 }}>
        <span className="input-icon">
          <IconSearch size={16} stroke={1.5} aria-hidden />
        </span>
        <input
          type="text"
          name="q"
          defaultValue={defaultValue}
          placeholder="Buscar por nome..."
          className="input"
        />
      </div>
      <button type="submit" className="btn btn-primary">
        Buscar
      </button>
      {defaultValue && (
        <button type="button" onClick={handleClear} className="btn btn-ghost">
          Limpar
        </button>
      )}
    </form>
  )
}
