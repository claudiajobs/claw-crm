'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  IconTimeline,
  IconBriefcase,
  IconUsers,
  IconCheckbox,
  IconSettings,
  IconKey,
} from '@tabler/icons-react'

const baseNavItems = [
  { href: '/pipeline', label: 'Pipeline', icon: <IconTimeline size={17} stroke={1.5} aria-hidden /> },
  { href: '/leads', label: 'Leads', icon: <IconBriefcase size={17} stroke={1.5} aria-hidden /> },
  { href: '/contacts', label: 'Contatos', icon: <IconUsers size={17} stroke={1.5} aria-hidden /> },
  { href: '/tasks', label: 'Tarefas', icon: <IconCheckbox size={17} stroke={1.5} aria-hidden /> },
  { href: '/settings', label: 'Configurações', icon: <IconSettings size={17} stroke={1.5} aria-hidden /> },
  { href: '/settings/users', label: 'Usuários', icon: <IconKey size={17} stroke={1.5} aria-hidden />, adminOnly: true },
]

export default function MobileSidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const navItems = baseNavItems.filter(item => !('adminOnly' in item) || !item.adminOnly || isAdmin)

  return (
    <>
      {/* Hamburger button — mobile only */}
      <button
        type="button"
        aria-label="Abrir menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
        className="btn-icon fixed top-3 left-3 z-50 md:hidden"
        style={{ width: 40, height: 40, border: 'none', background: 'var(--color-bg-card)' }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
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
          style={{ background: 'rgba(42, 42, 64, 0.4)' }}
        />
      )}

      {/* Slide-in panel */}
      <div
        className="fixed top-0 left-0 bottom-0 z-50 md:hidden"
        style={{
          width: 240,
          background: 'var(--color-bg-sidebar)',
          borderRight: 'var(--border-default)',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 200ms ease-in-out',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 14px 12px',
        }}>
          <div className="sb-logo" style={{ padding: 0 }}>
            <div className="sb-mark">S</div>
            <span className="sb-wordmark">sevende</span>
          </div>
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setIsOpen(false)}
            className="btn-icon"
            style={{ width: 32, height: 32 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Section label */}
        <div className="sb-section-label">Menu</div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '0 10px', overflowY: 'auto' }}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="nav-item"
              style={{ minHeight: 44 }}
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
