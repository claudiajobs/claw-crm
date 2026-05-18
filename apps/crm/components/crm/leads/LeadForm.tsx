'use client'

import { useState } from 'react'
import { createLead } from '@/lib/actions/leads'

interface LeadFormProps {
  erro?: string
  contacts: Array<{ id: string; first_name: string; last_name: string | null }>
}

export default function LeadForm({ erro, contacts }: LeadFormProps) {
  const [useQuickContact, setUseQuickContact] = useState(false)

  return (
    <form action={createLead} style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 520 }}>
      {erro && (
        <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--color-danger-light)', borderLeft: '3px solid var(--color-danger)' }}>
          <p style={{ fontSize: 12, color: '#C44040' }}>{erro}</p>
        </div>
      )}

      <div className="field">
        <label htmlFor="title" className="field-label">
          Titulo <span className="req">*</span>
        </label>
        <input id="title" name="title" type="text" required placeholder="Ex: Venda de tinta para obra residencial" className="input" />
      </div>

      <div className="field">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
          <label className="field-label">Contato <span className="req">*</span></label>
          <button
            type="button"
            onClick={() => setUseQuickContact(!useQuickContact)}
            style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {useQuickContact ? 'Selecionar existente' : 'Criar contato rapido'}
          </button>
        </div>

        {!useQuickContact ? (
          <select id="contact_id" name="contact_id" className="input">
            <option value="">Selecione um contato...</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {[c.first_name, c.last_name].filter(Boolean).join(' ')}
              </option>
            ))}
          </select>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderRadius: 'var(--radius-sm)', border: '0.5px solid var(--color-gray-200)', background: 'var(--color-gray-50)', padding: 16 }}>
            <p style={{ fontSize: 11, color: 'var(--color-gray-400)' }}>
              Crie um contato rapidamente — apenas nome e canal.
            </p>
            <div className="field">
              <label htmlFor="quick_contact_name" className="field-label">Nome do contato</label>
              <input id="quick_contact_name" name="quick_contact_name" type="text" placeholder="Ex: Joao Silva" className="input" />
            </div>
            <div className="field">
              <label htmlFor="quick_contact_channel" className="field-label">WhatsApp ou Instagram</label>
              <input id="quick_contact_channel" name="quick_contact_channel" type="text" placeholder="+55 11 99999-9999 ou @perfil" className="input" />
            </div>
          </div>
        )}
      </div>

      <div className="field">
        <label htmlFor="status" className="field-label">Status</label>
        <select id="status" name="status" className="input">
          <option value="novo">Novo</option>
          <option value="contatado">Contatado</option>
          <option value="qualificado">Qualificado</option>
          <option value="proposta">Proposta</option>
          <option value="negociacao">Negociacao</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="value" className="field-label">Valor estimado (R$)</label>
        <input id="value" name="value" type="number" min="0" step="0.01" placeholder="0,00" className="input" />
      </div>

      <div className="field">
        <label htmlFor="product_interest" className="field-label">Interesse em produto</label>
        <input id="product_interest" name="product_interest" type="text" placeholder="Ex: Tinta acrilica premium" className="input" />
      </div>

      <div className="field">
        <label htmlFor="decision_timeline" className="field-label">Prazo de decisao</label>
        <select id="decision_timeline" name="decision_timeline" className="input">
          <option value="">Selecione...</option>
          <option value="imediato">Imediato</option>
          <option value="1-3m">1 a 3 meses</option>
          <option value="3-6m">3 a 6 meses</option>
          <option value="6m+">Mais de 6 meses</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="estimated_volume_liters" className="field-label">Volume estimado (litros)</label>
        <input id="estimated_volume_liters" name="estimated_volume_liters" type="number" min="0" step="0.001" placeholder="0" className="input" />
      </div>

      <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
        <button type="submit" className="btn btn-primary">
          Salvar lead
        </button>
        <a href="/leads" className="btn btn-ghost">
          Cancelar
        </a>
      </div>
    </form>
  )
}
