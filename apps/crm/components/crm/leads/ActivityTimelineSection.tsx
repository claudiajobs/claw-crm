'use client'

import { useOptimistic } from 'react'
import ActivityTimeline from './ActivityTimeline'
import ActivityForm from '@/components/crm/ActivityForm'
import type { Activity } from './ActivityTimeline'

interface ActivityTimelineSectionProps {
  activities: Activity[]
  contactId: string
  leadId?: string | null
  currentUserId: string
  currentUserName: string
}

export default function ActivityTimelineSection({
  activities,
  contactId,
  leadId,
  currentUserId,
  currentUserName,
}: ActivityTimelineSectionProps) {
  const [optimisticActivities, addOptimistic] = useOptimistic(
    activities,
    (state: Activity[], newActivity: Activity) => [newActivity, ...state]
  )

  return (
    <>
      <div className="card">
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-gray-800)', marginBottom: 16 }}>Atividades</h3>
        <ActivityTimeline activities={optimisticActivities} currentUserId={currentUserId} />
      </div>

      <ActivityForm
        contactId={contactId}
        leadId={leadId}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
        onActivityCreated={(activity) => addOptimistic(activity)}
      />
    </>
  )
}
