'use client'

import { useRouter } from 'next/navigation'
import { useRef } from 'react'

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
    <form ref={formRef} onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        type="text"
        name="q"
        defaultValue={defaultValue}
        placeholder="Buscar por nome..."
        className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm
                   placeholder:text-gray-400 focus:border-red-500 focus:ring-1
                   focus:ring-red-500 outline-none transition-colors"
      />
      <button
        type="submit"
        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white
                   hover:bg-gray-800 transition-colors"
      >
        Buscar
      </button>
      {defaultValue && (
        <button
          type="button"
          onClick={handleClear}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium
                     text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Limpar
        </button>
      )}
    </form>
  )
}
