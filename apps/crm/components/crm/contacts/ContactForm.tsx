'use client'

import { useState } from 'react'
import { createContact } from '@/lib/actions/contacts'
import { IconBrandWhatsapp, IconBrandInstagram } from '@tabler/icons-react'

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

export default function ContactForm({ erro }: ContactFormProps) {
  const [entityType, setEntityType] = useState<'individual' | 'company'>('individual')

  const types = entityType === 'individual' ? INDIVIDUAL_TYPES : COMPANY_TYPES

  return (
    <form action={createContact} style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 520 }}>
      {erro && (
        <div style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--color-danger-light)', borderLeft: '3px solid var(--color-danger)' }}>
          <p style={{ fontSize: 12, color: '#C44040' }}>{erro}</p>
        </div>
      )}

      {/* Entity type */}
      <div className="field">
        <label className="field-label">Tipo de registro</label>
        <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
          <button
            type="button"
            onClick={() => setEntityType('individual')}
            className={entityType === 'individual' ? 'btn btn-secondary' : 'btn btn-ghost'}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            Pessoa
          </button>
          <button
            type="button"
            onClick={() => setEntityType('company')}
            className={entityType === 'company' ? 'btn btn-secondary' : 'btn btn-ghost'}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            Empresa
          </button>
        </div>
        <input type="hidden" name="entity_type" value={entityType} />
      </div>

      {/* Name */}
      <div className="form-grid-2">
        <div className="field">
          <label htmlFor="first_name" className="field-label">
            {entityType === 'company' ? 'Nome da empresa' : 'Nome'} <span className="req">*</span>
          </label>
          <input id="first_name" name="first_name" type="text" required placeholder={entityType === 'company' ? 'Tintas ABC Ltda' : 'João'} className="input" />
        </div>
        {entityType === 'individual' && (
          <div className="field">
            <label htmlFor="last_name" className="field-label">Sobrenome</label>
            <input id="last_name" name="last_name" type="text" placeholder="Silva" className="input" />
          </div>
        )}
      </div>

      {/* Contact channels */}
      <fieldset style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <legend className="field-label" style={{ marginBottom: 4 }}>
          Canal de contato <span className="req">*</span>
          <span style={{ marginLeft: 4, fontSize: 10, color: 'var(--color-gray-400)', fontWeight: 400 }}>(ao menos um)</span>
        </legend>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <IconBrandWhatsapp size={16} stroke={1.5} aria-hidden style={{ color: 'var(--color-success)', flexShrink: 0 }} />
          <input id="whatsapp_number" name="whatsapp_number" type="tel" placeholder="+55 11 99999-9999" className="input" />
          <label htmlFor="whatsapp_number" style={{ fontSize: 12, color: 'var(--color-gray-600)', width: 80, flexShrink: 0 }}>WhatsApp</label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <IconBrandInstagram size={16} stroke={1.5} aria-hidden style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
          <input id="instagram_handle" name="instagram_handle" type="text" placeholder="@perfil" className="input" />
          <label htmlFor="instagram_handle" style={{ fontSize: 12, color: 'var(--color-gray-600)', width: 80, flexShrink: 0 }}>Instagram</label>
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor="preferred_channel" className="field-label">Canal preferencial</label>
        <select id="preferred_channel" name="preferred_channel" className="input">
          <option value="">Selecione...</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="instagram">Instagram</option>
          <option value="telefone">Telefone</option>
        </select>
      </div>

      <div className="field">
        <label htmlFor="classification" className="field-label">Tipo</label>
        <select id="classification" name="classification" className="input">
          <option value="">Selecione...</option>
          {types.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="territory" className="field-label">Território</label>
        <input id="territory" name="territory" type="text" placeholder="Ex: SP — Grande São Paulo" className="input" />
      </div>

      {/* Company-specific fields */}
      {entityType === 'company' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingTop: 8, borderTop: '0.5px solid var(--color-gray-200)' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-gray-800)' }}>Dados da empresa</h3>

          <div className="form-grid-2">
            <div className="field">
              <label htmlFor="cnpj" className="field-label">CNPJ</label>
              <input id="cnpj" name="cnpj" type="text" placeholder="00.000.000/0001-00" className="input" />
            </div>
            <div className="field">
              <label htmlFor="razao_social" className="field-label">Razao social</label>
              <input id="razao_social" name="razao_social" type="text" className="input" />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="field">
              <label htmlFor="responsible_name" className="field-label">Responsavel</label>
              <input id="responsible_name" name="responsible_name" type="text" className="input" />
            </div>
            <div className="field">
              <label htmlFor="responsible_whatsapp" className="field-label">WhatsApp responsavel</label>
              <input id="responsible_whatsapp" name="responsible_whatsapp" type="tel" className="input" />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="field">
              <label htmlFor="region" className="field-label">Regiao</label>
              <select id="region" name="region" className="input">
                <option value="">Selecione...</option>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="payment_terms" className="field-label">Prazo de pagamento</label>
              <select id="payment_terms" name="payment_terms" className="input">
                <option value="">Selecione...</option>
                {PAYMENT_TERMS.map((pt) => (
                  <option key={pt.value} value={pt.value}>{pt.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="field">
              <label htmlFor="credit_limit" className="field-label">Limite de credito (R$)</label>
              <input id="credit_limit" name="credit_limit" type="number" min="0" step="0.01" className="input" />
            </div>
            <div className="field">
              <label htmlFor="annual_volume_liters" className="field-label">Volume anual (litros)</label>
              <input id="annual_volume_liters" name="annual_volume_liters" type="number" min="0" className="input" />
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, paddingTop: 8 }}>
        <button type="submit" className="btn btn-primary py-3 md:py-2.5 min-h-[44px]">
          Salvar contato
        </button>
        <a href="/contacts" className="btn btn-ghost py-3 md:py-2.5 min-h-[44px] flex items-center">
          Cancelar
        </a>
      </div>
    </form>
  )
}
