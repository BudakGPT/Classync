import { Badge } from '@/components/ui'
import { taskCounts } from '@/lib/selectors'
import { tone } from '@/lib/tones'
import type { Assignment, ClassId } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'
import { categoryMeta, dueMeta, STATES } from './lib'

type Size = 'xs' | 'sm' | 'md'

export function ClassChip({ classId, size }: { classId: ClassId; size?: Size }) {
  const { data } = useStore()
  return <Badge tone={data.classes.find((c) => c.id === classId)?.tone ?? 'slate'} dot size={size}>Class {classId}</Badge>
}

export function TaskCategoryBadge({ category, size }: { category: Assignment['category']; size?: Size }) {
  const m = categoryMeta(category)
  return <Badge tone={m.tone} icon={m.icon} size={size}>{category}</Badge>
}

export function DueBadge({ iso, size }: { iso: string; size?: Size }) {
  const d = dueMeta(iso)
  return <Badge tone={d.tone} icon={d.icon} size={size}>{d.label}</Badge>
}

/** "● Completed 18 · ● In Progress 9 · ● Stuck 5" */
export function StateLegend({ a, withNotStarted, className }: { a: Assignment; withNotStarted?: boolean; className?: string }) {
  const c = taskCounts(a)
  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-3', className)}>
      {STATES.filter((s) => withNotStarted || s.value !== 'not_started').map((s) => (
        <span key={s.value} className="inline-flex items-center gap-1.5">
          <span className={cn('size-2 rounded-full', s.value === 'not_started' ? 'bg-subtle ring-1 ring-inset ring-line-strong' : tone(s.tone).dot)} />
          {s.value === 'in_progress' ? 'In Progress' : s.label}
          <span className="font-bold text-ink tabular">{c[s.value]}</span>
        </span>
      ))}
    </div>
  )
}
