'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  IconTimeline,
  IconBriefcase,
  IconUsers,
  IconCheckbox,
  IconSettings,
} from '@tabler/icons-react'

const navItems = [
  { href: '/pipeline', label: 'Pipeline', icon: <IconTimeline size={18} stroke={1.5} aria-hidden /> },
  { href: '/leads', label: 'Leads', icon: <IconBriefcase size={18} stroke={1.5} aria-hidden /> },
  { href: '/contacts', label: 'Contatos', icon: <IconUsers size={18} stroke={1.5} aria-hidden /> },
  { href: '/tasks', label: 'Tarefas', icon: <IconCheckbox size={18} stroke={1.5} aria-hidden /> },
  { href: '/settings', label: 'Configurações', icon: <IconSettings size={18} stroke={1.5} aria-hidden /> },
]

export default function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Hamburger button — fixed in header area, mobile only */}
      <button
        type="button"
        aria-label="Abrir menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
        className="fixed top-0 left-0 z-50 md:hidden"
        style={{
          height: 56,
          width: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-gray-500)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
             strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <line x1="3" y1="6"  x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          aria-hidden
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0,0,0,0.5)' }}
        />
      )}

      {/* Slide-in panel */}
      <div
        className={`fixed top-0 left-0 bottom-0 z-50 md:hidden`}
        style={{
          width: 260,
          background: 'var(--color-gray-900, #111827)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 200ms ease-in-out',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        {/* Header row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          height: 56,
          borderBottom: '1px solid var(--color-gray-700, #374151)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="sb-mark">S</div>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em' }}>sevende</span>
          </div>
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setIsOpen(false)}
            style={{
              color: 'var(--color-gray-400, #9CA3AF)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="nav-item"
              style={{ minHeight: 44, display: 'flex', alignItems: 'center', gap: 12 }}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </>
  )
}
