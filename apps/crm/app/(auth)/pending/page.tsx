import { logout } from '@/lib/actions/auth'

export default function PendingPage() {
  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-lg px-8 py-10 text-center">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">CLAW CRM</h1>
        </div>

        <div className="mb-6">
          <div className="w-16 h-16 rounded-full bg-yellow-100 mx-auto flex items-center justify-center mb-4">
            <span className="text-2xl">&#9202;</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Aguardando aprovacao
          </h2>
          <p className="text-sm text-gray-500">
            Seu acesso esta sendo avaliado. Um administrador ira aprovar sua conta em breve.
          </p>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors
                       border border-gray-200 rounded-lg px-4 py-2 hover:border-gray-300"
          >
            Sair
          </button>
        </form>
      </div>
    </div>
  )
}
