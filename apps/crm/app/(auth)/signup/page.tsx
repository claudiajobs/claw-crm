import Link from 'next/link'
import { signup } from '@/lib/actions/auth'

interface SignupPageProps {
  searchParams: Promise<{ erro?: string }>
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { erro } = await searchParams

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-lg px-8 py-10">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">CLAW CRM</h1>
          <p className="text-sm text-gray-500 mt-1">Crie sua conta</p>
        </div>

        {erro && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3">
            <p className="text-sm text-red-700">{erro}</p>
          </div>
        )}

        <form action={signup} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nome completo
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              required
              placeholder="Seu nome"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                         text-gray-900 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="voce@empresa.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                         text-gray-900 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              placeholder="Minimo 6 caracteres"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                         text-gray-900 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold
                       text-white hover:bg-red-700 active:bg-red-800
                       focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                       transition-colors"
          >
            Criar conta
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Ja tem conta?{' '}
          <Link href="/login" className="text-red-600 hover:underline font-medium">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
