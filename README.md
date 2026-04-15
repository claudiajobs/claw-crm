# CLAW — Monorepo

## Apps

| App | Descrição | Stack |
|---|---|---|
| `apps/crm` | CRM para fábrica de tintas | Next.js 16 + Supabase + Vercel |

## Security

> **Next.js 16+ é requerido.** Versões anteriores são afetadas pela [CVE-2025-66478](https://github.com/vercel/next.js/security). O projeto utiliza Next.js 16.2.3+.

## Setup

```bash
# Instalar dependências do app CRM
cd apps/crm && npm install

# Rodar em dev
npm run crm
```

## Estrutura

```
apps/
  crm/          ← CRM (Next.js)
  sdr-whatsapp/ ← SDR WhatsApp (futuro)
  sdr-instagram/← SDR Instagram (futuro)
```
