interface LeadScoreBadgeProps {
  score: number
}

export default function LeadScoreBadge({ score }: LeadScoreBadgeProps) {
  let badgeClass: string
  let label: string

  if (score <= 30) {
    badgeClass = 'badge badge-gray'
    label = 'Frio'
  } else if (score <= 60) {
    badgeClass = 'badge badge-amber'
    label = 'Morno'
  } else {
    badgeClass = 'badge badge-teal'
    label = 'Quente'
  }

  return (
    <span className={badgeClass} title={`Score: ${score}`}>
      {score} <span style={{ fontWeight: 400, opacity: 0.7 }}>{label}</span>
    </span>
  )
}
