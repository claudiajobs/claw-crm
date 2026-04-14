'use client'

import { createLead } from '@/lib/actions/leads'

interface LeadFormProps {
  erro?: string
  contacts: Array<{ id: string; first_name: string; last_name: string | null }>
}

export default function LeadForm({ erro, contacts }: LeadFormProps) {
  return (
    <form action={createLead} className="space-y-6 max-w-lg">
      {erro && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-700">{erro}</p>
        </div>
      )}

      {/* Título */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Título <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          placeholder="Ex: Venda de tinta para obra residencial"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                     text-gray-900 placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      {/* Contato */}
      <div>
        <label htmlFor="contact_id" className="block text-sm font-medium text-gray-700 mb-1">
          Contato <span className="text-red-500">*</span>
        </label>
        <select
          id="contact_id"
          name="contact_id"
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                     text-gray-900 bg-white
                     focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="">Selecione um contato...</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {[c.first_name, c.last_name].filter(Boolean).join(' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Status */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          id="status"
          name="status"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                     text-gray-900 bg-white
                     focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="novo">Novo</option>
          <option value="contatado">Contatado</option>
          <option value="qualificado">Qualificado</option>
          <option value="proposta">Proposta</option>
          <option value="negociacao">Negociação</option>
        </select>
      </div>

      {/* Valor */}
      <div>
        <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">
          Valor estimado (R$)
        </label>
        <input
          id="value"
          name="value"
          type="number"
          min="0"
          step="0.01"
          placeholder="0,00"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                     text-gray-900 placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      {/* Interesse em produto */}
      <div>
        <label htmlFor="product_interest" className="block text-sm font-medium text-gray-700 mb-1">
          Interesse em produto
        </label>
        <input
          id="product_interest"
          name="product_interest"
          type="text"
          placeholder="Ex: Tinta acrílica premium"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                     text-gray-900 placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      {/* Prazo de decisão */}
      <div>
        <label htmlFor="decision_timeline" className="block text-sm font-medium text-gray-700 mb-1">
          Prazo de decisão
        </label>
        <select
          id="decision_timeline"
          name="decision_timeline"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                     text-gray-900 bg-white
                     focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="">Selecione...</option>
          <option value="imediato">Imediato</option>
          <option value="1-3m">1 a 3 meses</option>
          <option value="3-6m">3 a 6 meses</option>
          <option value="6m+">Mais de 6 meses</option>
        </select>
      </div>

      {/* Volume estimado (litros) */}
      <div>
        <label htmlFor="estimated_volume_liters" className="block text-sm font-medium text-gray-700 mb-1">
          Volume estimado (litros)
        </label>
        <input
          id="estimated_volume_liters"
          name="estimated_volume_liters"
          type="number"
          min="0"
          step="0.001"
          placeholder="0"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                     text-gray-900 placeholder-gray-400
                     focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      {/* Ações */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white
                     hover:bg-red-700 active:bg-red-800
                     focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                     transition-colors"
        >
          Salvar lead
        </button>
        <a
          href="/leads"
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium
                     text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </a>
      </div>
    </form>
  )
}
