import { useMemo } from 'react'
import { History } from 'lucide-react'
import { ActivityItem } from '@/components/domain/ActivityItem'
import { Card, EmptyState } from '@/components/ui'
import { useStore } from '@/store/store'
import { classActivities, type TabProps } from './lib'

export function ActivityTab({ cls, s }: TabProps) {
  const { data } = useStore()
  const activities = useMemo(() => classActivities(data, cls, s), [data, cls, s])

  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold text-ink">
        Class Activity History ({activities.length})
      </h3>

      {activities.length === 0 ? (
        <Card>
          <EmptyState
            icon={History}
            title="No activity yet"
            description="Recent announcements, task updates, and student actions for this class will appear here."
          />
        </Card>
      ) : (
        <Card className="divide-y divide-line p-2">
          {activities.map((a) => (
            <div key={a.id} className="p-3">
              <ActivityItem activity={a} />
            </div>
          ))}
        </Card>
      )}
    </div>
  )
}
