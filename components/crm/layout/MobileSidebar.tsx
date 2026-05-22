'use client'

import { useState } from 'react'
import Link from 'next/link'

const navItems = [
  { href: '/pipeline', label: 'Pipeline', icon: '📊' },
  { href: '/leads', label: 'Leads', icon: '🎯' },
  { href: '/contacts', label: 'Contatos', icon: '👥' },
  { href: '/accounts', label: 'Contas', icon: '🏢' },
  { href: '/tasks', label: 'Tarefas', icon: '✅' },
  { href: '/settings', label: 'Configurações', icon: '⚙️' },
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
        className="fixed top-0 left-0 z-50 h-14 w-14 flex items-center justify-center md:hidden
                   text-gray-700 hover:text-gray-900 focus:outline-none focus-visible:ring-2
                   focus-visible:ring-red-500"
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
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      {/* Slide-in panel */}
      <div
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-gray-900 flex flex-col
                    transition-transform duration-200 ease-in-out md:hidden
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Header row */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-gray-700">
          <span className="text-white font-bold text-lg tracking-tight">CLAW CRM</span>
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white p-1 rounded focus:outline-none
                       focus-visible:ring-2 focus-visible:ring-red-500"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium
                         text-gray-300 hover:bg-gray-800 hover:text-white transition-colors
                         min-h-[44px]"
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-700">
          <p className="text-xs text-gray-500">v0.1.0 — Sprint 1</p>
        </div>
      </div>
    </>
  )
}
