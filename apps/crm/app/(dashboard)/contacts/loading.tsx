export default function ContactsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Cabeçalho skeleton */}
      <div className="flex items-center justify-between mb-6">
        <div className="h-7 w-32 bg-gray-200 rounded" />
        <div className="h-9 w-36 bg-gray-200 rounded-lg" />
      </div>

      {/* Tabela skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-4 gap-4 px-6 py-3 border-b border-gray-100 bg-gray-50">
          {['Nome', 'Canal', 'Tipo', 'Status'].map((col) => (
            <div key={col} className="h-4 bg-gray-200 rounded w-20" />
          ))}
        </div>

        {/* Linhas */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-gray-50 last:border-0"
          >
            <div className="h-4 bg-gray-100 rounded w-40" />
            <div className="h-4 bg-gray-100 rounded w-28" />
            <div className="h-4 bg-gray-100 rounded w-24" />
            <div className="h-5 bg-gray-100 rounded-full w-20" />
          </div>
        ))}
      </div>
    </div>
  )
}
