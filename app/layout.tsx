import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CLAW CRM',
  description: 'CRM para gestão de leads e clientes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <head>
        <meta name="theme-color" content="#dc2626" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  )
}
