import ContactForm from '@/components/crm/contacts/ContactForm'

interface NovoContatoPageProps {
  searchParams: Promise<{ erro?: string }>
}

export default async function NovoContatoPage({ searchParams }: NovoContatoPageProps) {
  const { erro } = await searchParams

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 className="topbar-title">Novo Contato</h1>
        <p className="topbar-sub">
          Preencha os dados do contato. Nome e ao menos um canal são obrigatórios.
        </p>
      </div>

      <div className="card">
        <ContactForm erro={erro} />
      </div>
    </div>
  )
}
