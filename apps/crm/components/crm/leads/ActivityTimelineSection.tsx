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
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Atividades</h3>
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
