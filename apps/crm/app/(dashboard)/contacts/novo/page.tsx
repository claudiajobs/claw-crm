import ContactForm from '@/components/crm/contacts/ContactForm'

interface NovoContatoPageProps {
  searchParams: Promise<{ erro?: string }>
}

export default async function NovoContatoPage({ searchParams }: NovoContatoPageProps) {
  const { erro } = await searchParams

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Novo Contato</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Preencha os dados do contato. Nome e ao menos um canal são obrigatórios.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <ContactForm erro={erro} />
      </div>
    </div>
  )
}
