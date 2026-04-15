import Link from 'next/link'
import AccountForm from '@/components/crm/accounts/AccountForm'

interface NewAccountPageProps {
  searchParams: Promise<{ erro?: string }>
}

export default async function NewAccountPage({ searchParams }: NewAccountPageProps) {
  const { erro } = await searchParams

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/accounts" className="text-sm text-gray-500 hover:text-gray-700">
          ← Contas
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-semibold text-gray-900">Nova conta</h1>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <AccountForm erro={erro} />
      </div>
    </div>
  )
}
