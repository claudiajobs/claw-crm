import { createAccount } from '@/lib/actions/accounts'

const ACCOUNT_TYPES = [
  { value: 'distribuidor', label: 'Distribuidor' },
  { value: 'empreiteiro', label: 'Empreiteiro' },
  { value: 'construtora', label: 'Construtora' },
  { value: 'pintor_autonomo', label: 'Pintor Autônomo' },
  { value: 'loja_materiais', label: 'Loja de Materiais' },
]

const PAYMENT_TERMS = [
  { value: 'avista', label: 'À Vista' },
  { value: '30d', label: '30 dias' },
  { value: '60d', label: '60 dias' },
  { value: '90d', label: '90 dias' },
]

const REGIONS = [
  { value: 'Norte', label: 'Norte' },
  { value: 'Nordeste', label: 'Nordeste' },
  { value: 'Centro-Oeste', label: 'Centro-Oeste' },
  { value: 'Sudeste', label: 'Sudeste' },
  { value: 'Sul', label: 'Sul' },
]

interface AccountFormProps {
  erro?: string
}

export default function AccountForm({ erro }: AccountFormProps) {
  return (
    <form action={createAccount} className="max-w-lg space-y-5">
      {erro && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-700">{erro}</p>
        </div>
      )}

      {/* Nome */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Nome da conta <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="Ex: Distribuidora São Paulo Ltda"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      {/* Tipo */}
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
          Tipo <span className="text-red-500">*</span>
        </label>
        <select
          id="type"
          name="type"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white
                     focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="">Selecione o tipo</option>
          {ACCOUNT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Telefone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Telefone
        </label>
        <input
          id="phone"
          name="phone"
          type="text"
          placeholder="(11) 9999-9999"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      {/* Endereço */}
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
          Endereço
        </label>
        <input
          id="address"
          name="address"
          type="text"
          placeholder="Rua, número, bairro"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                     focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      {/* Cidade / Estado */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
            Cidade
          </label>
          <input
            id="city"
            name="city"
            type="text"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
            Estado
          </label>
          <input
            id="state"
            name="state"
            type="text"
            maxLength={2}
            placeholder="SP"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Território / Região */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="territory" className="block text-sm font-medium text-gray-700 mb-1">
            Território
          </label>
          <input
            id="territory"
            name="territory"
            type="text"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
            Região
          </label>
          <select
            id="region"
            name="region"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="">Selecione</option>
            {REGIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Condição de pagamento */}
      <div>
        <label htmlFor="payment_terms" className="block text-sm font-medium text-gray-700 mb-1">
          Condição de pagamento
        </label>
        <select
          id="payment_terms"
          name="payment_terms"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white
                     focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="">Selecione</option>
          {PAYMENT_TERMS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Limite de crédito / Volume anual */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="credit_limit" className="block text-sm font-medium text-gray-700 mb-1">
            Limite de crédito (R$)
          </label>
          <input
            id="credit_limit"
            name="credit_limit"
            type="number"
            min="0"
            step="0.01"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
        <div>
          <label
            htmlFor="annual_volume_liters"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Volume anual (L)
          </label>
          <input
            id="annual_volume_liters"
            name="annual_volume_liters"
            type="number"
            min="0"
            step="0.001"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm
                     font-semibold text-white hover:bg-red-700 transition-colors"
        >
          Criar conta
        </button>
        <a
          href="/accounts"
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium
                     text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </a>
      </div>
    </form>
  )
}
