'use client'

import { createContact } from '@/lib/actions/contacts'

interface ContactFormProps {
  erro?: string
}

export default function ContactForm({ erro }: ContactFormProps) {
  return (
    <form action={createContact} className="space-y-6 max-w-lg">
      {/* Erro global */}
      {erro && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-700">{erro}</p>
        </div>
      )}

      {/* Nome */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
            Nome <span className="text-red-500">*</span>
          </label>
          <input
            id="first_name"
            name="first_name"
            type="text"
            required
            placeholder="João"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                       text-gray-900 placeholder-gray-400
                       focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
            Sobrenome
          </label>
          <input
            id="last_name"
            name="last_name"
            type="text"
            placeholder="Silva"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                       text-gray-900 placeholder-gray-400
                       focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Canal de contato — ao menos um obrigatório */}
      <fieldset>
        <legend className="text-sm font-medium text-gray-700 mb-1">
          Canal de contato <span className="text-red-500">*</span>
          <span className="ml-1 text-xs text-gray-400 font-normal">(ao menos um)</span>
        </legend>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-lg">💬</span>
            <input
              id="whatsapp_number"
              name="whatsapp_number"
              type="tel"
              placeholder="+55 11 99999-9999"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm
                         text-gray-900 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <label htmlFor="whatsapp_number" className="text-sm text-gray-600 w-24">
              WhatsApp
            </label>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg">📸</span>
            <input
              id="instagram_handle"
              name="instagram_handle"
              type="text"
              placeholder="@perfil"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm
                         text-gray-900 placeholder-gray-400
                         focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
        <select
          id="preferred_channel"
          name="preferred_channel"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                     text-gray-900 bg-white
                     focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="">Selecione...</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="instagram">Instagram</option>
          <option value="telefone">Telefone</option>
        </select>
      </div>

      {/* Tipo */}
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
          Tipo
        </label>
        <select
          id="type"
          name="type"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                     text-gray-900 bg-white
                     focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="">Selecione...</option>
          <option value="pintor_autonomo">Pintor Autônomo</option>
          <option value="empreiteiro">Empreiteiro</option>
          <option value="engenheiro">Engenheiro</option>
          <option value="arquiteto">Arquiteto</option>
          <option value="distribuidor">Distribuidor</option>
          <option value="construtora">Construtora</option>
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
