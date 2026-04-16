'use client'

import { useState } from 'react'
import { createContact } from '@/lib/actions/contacts'

interface ContactFormProps {
  erro?: string
}

const INDIVIDUAL_TYPES = [
  { value: 'pintor_autonomo', label: 'Pintor Autônomo' },
  { value: 'empreiteiro', label: 'Empreiteiro' },
  { value: 'engenheiro', label: 'Engenheiro' },
  { value: 'arquiteto', label: 'Arquiteto' },
]

const COMPANY_TYPES = [
  { value: 'distribuidor', label: 'Distribuidor' },
  { value: 'construtora', label: 'Construtora' },
  { value: 'loja_materiais', label: 'Loja de Materiais' },
]

const REGIONS = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul']
const PAYMENT_TERMS = [
  { value: 'avista', label: 'À vista' },
  { value: '30d', label: '30 dias' },
  { value: '60d', label: '60 dias' },
  { value: '90d', label: '90 dias' },
]

const inputClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent'
const selectClass =
  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent'

export default function ContactForm({ erro }: ContactFormProps) {
  const [entityType, setEntityType] = useState<'individual' | 'company'>('individual')

  const types = entityType === 'individual' ? INDIVIDUAL_TYPES : COMPANY_TYPES

  return (
    <form action={createContact} className="space-y-6 max-w-lg">
      {erro && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-700">{erro}</p>
        </div>
      )}

      {/* Tipo de entidade */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de registro</label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setEntityType('individual')}
            className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
              entityType === 'individual'
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Pessoa
          </button>
          <button
            type="button"
            onClick={() => setEntityType('company')}
            className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
              entityType === 'company'
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Empresa
          </button>
        </div>
        <input type="hidden" name="entity_type" value={entityType} />
      </div>

      {/* Nome */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
            {entityType === 'company' ? 'Nome da empresa' : 'Nome'} <span className="text-red-500">*</span>
          </label>
          <input
            id="first_name"
            name="first_name"
            type="text"
            required
            placeholder={entityType === 'company' ? 'Tintas ABC Ltda' : 'João'}
            className={inputClass}
          />
        </div>
        {entityType === 'individual' && (
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
              Sobrenome
            </label>
            <input
              id="last_name"
              name="last_name"
              type="text"
              placeholder="Silva"
              className={inputClass}
            />
          </div>
        )}
      </div>

      {/* Canal de contato */}
      <fieldset>
        <legend className="text-sm font-medium text-gray-700 mb-1">
          Canal de contato <span className="text-red-500">*</span>
          <span className="ml-1 text-xs text-gray-400 font-normal">(ao menos um)</span>
        </legend>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-lg">&#128172;</span>
            <input
              id="whatsapp_number"
              name="whatsapp_number"
              type="tel"
              placeholder="+55 11 99999-9999"
              className={'flex-1 ' + inputClass}
            />
            <label htmlFor="whatsapp_number" className="text-sm text-gray-600 w-24">
              WhatsApp
            </label>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg">&#128247;</span>
            <input
              id="instagram_handle"
              name="instagram_handle"
              type="text"
              placeholder="@perfil"
              className={'flex-1 ' + inputClass}
            />
            <label htmlFor="instagram_handle" className="text-sm text-gray-600 w-24">
              Instagram
            </label>
          </div>
        </div>
      </fieldset>

      {/* Canal preferencial */}
      <div>
        <label htmlFor="preferred_channel" className="block text-sm font-medium text-gray-700 mb-1">
          Canal preferencial
        </label>
        <select id="preferred_channel" name="preferred_channel" className={selectClass}>
          <option value="">Selecione...</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="instagram">Instagram</option>
          <option value="telefone">Telefone</option>
        </select>
      </div>

      {/* Tipo */}
      <div>
        <label htmlFor="classification" className="block text-sm font-medium text-gray-700 mb-1">
          Tipo
        </label>
        <select id="classification" name="classification" className={selectClass}>
          <option value="">Selecione...</option>
          {types.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Território */}
      <div>
        <label htmlFor="territory" className="block text-sm font-medium text-gray-700 mb-1">
          Território
        </label>
        <input
          id="territory"
          name="territory"
          type="text"
          placeholder="Ex: SP — Grande São Paulo"
          className={inputClass}
        />
      </div>

      {/* Company-specific fields */}
      {entityType === 'company' && (
        <div className="space-y-6 pt-2 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700">Dados da empresa</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="cnpj" className="block text-sm font-medium text-gray-700 mb-1">
                CNPJ
              </label>
              <input id="cnpj" name="cnpj" type="text" placeholder="00.000.000/0001-00" className={inputClass} />
            </div>
            <div>
              <label htmlFor="razao_social" className="block text-sm font-medium text-gray-700 mb-1">
                Razao social
              </label>
              <input id="razao_social" name="razao_social" type="text" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="responsible_name" className="block text-sm font-medium text-gray-700 mb-1">
                Responsavel
              </label>
              <input id="responsible_name" name="responsible_name" type="text" className={inputClass} />
            </div>
            <div>
              <label htmlFor="responsible_whatsapp" className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp responsavel
              </label>
              <input id="responsible_whatsapp" name="responsible_whatsapp" type="tel" className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">
                Regiao
              </label>
              <select id="region" name="region" className={selectClass}>
                <option value="">Selecione...</option>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="payment_terms" className="block text-sm font-medium text-gray-700 mb-1">
                Prazo de pagamento
              </label>
              <select id="payment_terms" name="payment_terms" className={selectClass}>
                <option value="">Selecione...</option>
                {PAYMENT_TERMS.map((pt) => (
                  <option key={pt.value} value={pt.value}>{pt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="credit_limit" className="block text-sm font-medium text-gray-700 mb-1">
                Limite de credito (R$)
              </label>
              <input id="credit_limit" name="credit_limit" type="number" min="0" step="0.01" className={inputClass} />
            </div>
            <div>
              <label htmlFor="annual_volume_liters" className="block text-sm font-medium text-gray-700 mb-1">
                Volume anual (litros)
              </label>
              <input id="annual_volume_liters" name="annual_volume_liters" type="number" min="0" className={inputClass} />
            </div>
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white
                     hover:bg-red-700 active:bg-red-800
                     focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                     transition-colors"
        >
          Salvar contato
        </button>
        <a
          href="/contacts"
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium
                     text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancelar
        </a>
      </div>
    </form>
  )
}
