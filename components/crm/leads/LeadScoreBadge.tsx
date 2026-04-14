interface LeadScoreBadgeProps {
  score: number
}

export default function LeadScoreBadge({ score }: LeadScoreBadgeProps) {
  let colorClass: string
  let label: string

  if (score <= 30) {
    colorClass = 'bg-gray-100 text-gray-600'
    label = 'Frio'
  } else if (score <= 60) {
    colorClass = 'bg-yellow-100 text-yellow-700'
    label = 'Morno'
  } else {
    colorClass = 'bg-green-100 text-green-700'
    label = 'Quente'
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${colorClass}`}
      title={`Score: ${score}`}
    >
      {score} <span className="font-normal opacity-70">{label}</span>
    </span>
  )
}
