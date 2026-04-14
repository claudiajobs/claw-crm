import LeadCard, { type LeadCardData } from './LeadCard'

interface PipelineColumnProps {
  status: string
  label: string
  leads: LeadCardData[]
  onDrop: (leadId: string, targetStatus: string) => void
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void
}

export default function PipelineColumn({
  status,
  label,
  leads,
  onDrop,
  onDragOver,
}: PipelineColumnProps) {
  return (
    <div
      className="flex flex-col min-w-[220px] max-w-[220px] bg-gray-50 rounded-xl border border-gray-200"
      onDragOver={onDragOver}
      onDrop={(e) => {
        e.preventDefault()
        const leadId = e.dataTransfer.getData('leadId')
        if (leadId) onDrop(leadId, status)
      }}
    >
      {/* Cabeçalho da coluna */}
      <div className="px-3 py-2.5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
            {label}
          </span>
          <span className="text-xs font-medium text-gray-400 bg-white rounded-full px-1.5 py-0.5 border border-gray-200">
            {leads.length}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 p-2 space-y-2 min-h-[80px]">
        {leads.map((lead) => (
          <div
            key={lead.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('leadId', lead.id)
              e.dataTransfer.effectAllowed = 'move'
            }}
          >
            <LeadCard lead={lead} />
          </div>
        ))}
        {leads.length === 0 && (
          <div className="flex items-center justify-center h-12 text-xs text-gray-400">
            Solte aqui
          </div>
        )}
      </div>
    </div>
  )
}
