'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { assignLead } from '@/lib/actions/leads'
import { IconChevronDown } from '@tabler/icons-react'

interface UserOption {
  id: string
  name: string
}

interface LeadOwnerSelectProps {
  leadId: string
  currentOwner: { id: string; name: string } | null
  users: UserOption[]
  canChange: boolean
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export default function LeadOwnerSelect({
  leadId,
  currentOwner,
  users,
  canChange,
}: LeadOwnerSelectProps) {
  const [open, setOpen] = useState(false)
  const [optimisticOwner, setOptimisticOwner] = useState(currentOwner)
  const [isPending, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)

  // Sync with server data
  useEffect(() => {
    setOptimisticOwner(currentOwner)
  }, [currentOwner])

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function handleSelect(user: UserOption) {
    setOpen(false)
    setOptimisticOwner(user)
    startTransition(async () => {
      await assignLead(leadId, user.id)
    })
  }

  const ownerName = optimisticOwner?.name ?? '—'
  const ownerInitials = optimisticOwner ? getInitials(optimisticOwner.name) : '?'

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          className="avatar avatar-sm avatar-purple"
          style={{ opacity: isPending ? 0.5 : 1 }}
        >
          {ownerInitials}
        </div>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-gray-800)' }}>
          {ownerName}
        </span>
        {canChange && (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            style={{
              marginLeft: 4,
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--color-primary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              padding: 0,
            }}
          >
            Alterar
            <IconChevronDown size={12} stroke={2} aria-hidden />
          </button>
        )}
      </div>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 4,
            background: 'var(--color-white)',
            border: '1px solid var(--color-gray-100)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-md)',
            zIndex: 50,
            minWidth: 200,
            maxHeight: 240,
            overflowY: 'auto',
          }}
        >
          {users.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => handleSelect(u)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                padding: '8px 12px',
                fontSize: 13,
                color: 'var(--color-gray-800)',
                background: u.id === optimisticOwner?.id ? 'var(--color-gray-50)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div className="avatar avatar-sm avatar-purple" style={{ width: 20, height: 20, fontSize: 8 }}>
                {getInitials(u.name)}
              </div>
              {u.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
