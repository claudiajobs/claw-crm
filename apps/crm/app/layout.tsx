import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'sevende CRM',
  description: 'CRM para gestão de leads e clientes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
