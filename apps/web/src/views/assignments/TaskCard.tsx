import { ArrowRight, CircleCheck } from 'lucide-react'
import { Avatar, AvatarStack, Badge, Card, IconTile, StackedProgress, Tooltip } from '@/components/ui'
import { navigate } from '@/lib/router'
import { idsWithState, shortName, taskCounts } from '@/lib/selectors'
import type { Assignment } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'
import { categoryMeta, lifecycle, stateSegments } from './lib'
import { ClassChip, DueBadge, StateLegend, TaskCategoryBadge } from './parts'

export function TaskCard({ a, index = 0 }: { a: Assignment; index?: number }) {
  const { person } = useStore()
  const c = taskCounts(a)
  const stuck = idsWithState(a, 'stuck')
  const cat = categoryMeta(a.category)
  const closed = lifecycle(a) === 'completed'

  return (
    <Card
      interactive onClick={() => navigate(`/assignments/${a.id}`)}
      className={cn('group flex flex-col p-5', a.isNew ? 'animate-highlight' : 'animate-rise-in')}
      style={{ animationDelay: a.isNew ? undefined : `${Math.min(index, 8) * 40}ms` }}
    >
      <div className="flex items-start gap-3">
        <IconTile icon={cat.icon} tone={cat.tone} />
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 text-[15px] font-bold leading-snug tracking-tight text-ink transition-colors group-hover:text-brand-700">{a.title}</h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <ClassChip classId={a.classId} size="xs" />
            <TaskCategoryBadge category={a.category} size="xs" />
            {a.isNew && <Badge tone="brand" size="xs">New</Badge>}
          </div>
        </div>
        <Tooltip content={`Created by ${shortName(person(a.createdBy))}`}>
          <Avatar id={a.createdBy} size="md" />
        </Tooltip>
      </div>

      <div className="mt-5 flex items-end justify-between gap-3">
        <div>
          <div className={cn('text-[30px] font-extrabold leading-none tracking-tight tabular', closed ? 'text-ink-2' : 'text-ink')}>
            {c.pct}<span className="ml-0.5 text-lg font-bold text-ink-3">%</span>
          </div>
          <div className="mt-1 text-xs text-ink-3"><span className="font-semibold text-ink-2 tabular">{c.completed}</span> of {c.total} completed</div>
        </div>
        <DueBadge iso={a.due} />
      </div>
      <StackedProgress className="mt-3" segments={stateSegments(a)} total={c.total} />
      <StateLegend a={a} className="mt-2.5" />

      <div className="flex-1" />
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3.5">
        {stuck.length ? (
          <div className="flex items-center gap-2 rounded-full bg-rose-50 py-0.5 pl-0.5 pr-2.5 ring-1 ring-inset ring-rose-100">
            <AvatarStack ids={stuck} max={4} size="sm" ringClass="ring-rose-50" />
            <span className="text-xs font-semibold text-rose-700">Stuck</span>
          </div>
        ) : (
          <span className="inline-flex h-7 items-center gap-1.5 text-xs font-semibold text-emerald-700"><CircleCheck className="size-4" />No one stuck</span>
        )}
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-3 transition-colors group-hover:text-brand-600">
          Checklist<ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Card>
  )
}
