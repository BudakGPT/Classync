import { ArrowRight } from 'lucide-react'
import { ActivityItem } from '@/components/domain/ActivityItem'
import { Button, Card, CardHeader } from '@/components/ui'
import { navigate } from '@/lib/router'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'
import { useTick } from './hooks'

export function RecentActivity({ className }: { className?: string }) {
  useTick(20_000)
  const { data } = useStore()
  const items = data.activities.slice(0, 6)

  return (
    <Card className={cn('flex flex-col animate-rise-in [animation-delay:400ms]', className)}>
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            Recent Activity
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-px text-[10.5px] font-bold uppercase tracking-wide text-emerald-700">
              <span className="relative size-1.5"><span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping-soft" /><span className="absolute inset-0 rounded-full bg-emerald-500" /></span>
              Live
            </span>
          </span>
        }
        subtitle="Across classes, groups and Discord"
        action={<Button variant="ghost" size="sm" iconRight={ArrowRight} onClick={() => navigate('/activity')}>View all</Button>}
      />
      <ul className="flex-1 space-y-1 p-3 pt-3">
        {items.map((a, i) => (
          <li key={a.id} className="animate-rise-in" style={{ animationDelay: `${440 + i * 40}ms` }}>
            <ActivityItem activity={a} className="p-2 transition-colors hover:bg-subtle/70" />
          </li>
        ))}
      </ul>
    </Card>
  )
}
