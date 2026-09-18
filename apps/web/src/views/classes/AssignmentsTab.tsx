import { CalendarClock, ListChecks, Plus } from 'lucide-react'
import { Avatar, AvatarStack, Badge, Button, Card, CategoryBadge, EmptyState, IconTile, StackedProgress } from '@/components/ui'
import { navigate } from '@/lib/router'
import { idsWithState, shortName, taskCounts } from '@/lib/selectors'
import { CATEGORY } from '@/lib/tones'
import { fmtLong } from '@/lib/time'
import type { Assignment, TaskState } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'
import type { TabProps } from './lib'
import { DueBadge, Eyebrow } from './parts'

const LEGEND: [TaskState, string, string][] = [
  ['completed', 'done', 'bg-emerald-500'],
  ['in_progress', 'in progress', 'bg-sky-500'],
  ['stuck', 'stuck', 'bg-rose-500'],
  ['not_started', 'not started', 'bg-slate-300'],
]

function AssignmentRow({ a, i, closed }: { a: Assignment; i: number; closed?: boolean }) {
  const { person } = useStore()
  const c = taskCounts(a)
  const cat = CATEGORY[a.category]
  const stuck = idsWithState(a, 'stuck')
  return (
    <div className="animate-rise-in" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
      <Card
        interactive onClick={() => navigate(`/assignments/${a.id}`)} aria-label={`Open ${a.title}`}
        className={cn('p-5', closed && 'bg-canvas/40', a.isNew && 'ring-2 ring-brand-200')}
      >
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <IconTile icon={cat.icon} tone={closed ? 'slate' : cat.tone} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-[15px] font-bold tracking-tight text-ink">{a.title}</h3>
                <CategoryBadge category={a.category} size="xs" />
                {closed ? <Badge size="xs" tone="slate">Closed</Badge> : <DueBadge iso={a.due} />}
                {a.isNew && <Badge size="xs" tone="brand">New</Badge>}
              </div>
              <p className="mt-1 line-clamp-1 text-[13px] text-ink-3">{a.description}</p>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-3">
                <span className="inline-flex items-center gap-1.5"><CalendarClock className="size-3.5" />Due {fmtLong(a.due)}</span>
                <span className="inline-flex items-center gap-1.5"><Avatar id={a.createdBy} size="xs" />Created by {shortName(person(a.createdBy))}</span>
              </div>
            </div>
          </div>

          <div className="w-full shrink-0 md:w-80">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[22px] font-extrabold tracking-tight text-ink tabular">{c.pct}%</span>
              <span className="text-xs text-ink-3 tabular">{c.completed} of {c.total} completed</span>
            </div>
            <StackedProgress
              className="mt-2" total={c.total}
              segments={[{ value: c.completed, tone: 'emerald', label: 'Completed' }, { value: c.in_progress, tone: 'sky', label: 'In progress' }, { value: c.stuck, tone: 'rose', label: 'Stuck' }]}
            />
            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink-3 tabular">
              {LEGEND.map(([k, label, dot]) => (
                <span key={k} className="inline-flex items-center gap-1"><span className={cn('size-2 rounded-full', dot)} />{c[k]} {label}</span>
              ))}
              {stuck.length > 0 && <AvatarStack ids={stuck} max={3} size="xs" className="ml-auto" />}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export function AssignmentsTab({ cls, s }: TabProps) {
  const { openModal } = useStore()
  const past = s.assignments.filter((a) => !s.upcoming.includes(a)).reverse()
  const create = () => openModal({ type: 'createAssignment', classId: cls.id })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold tracking-tight text-ink">Assignments</h2>
          <p className="text-xs text-ink-3">{s.upcoming.length} open · {past.length} closed · progress updates when students check in from Discord</p>
        </div>
        <Button variant="secondary" icon={Plus} onClick={create}>New assignment</Button>
      </div>

      {s.assignments.length === 0 ? (
        <Card>
          <EmptyState
            icon={ListChecks} tone={cls.tone} title={`No assignments for ${cls.name} yet`}
            description="Create an assignment and Classync tracks who has finished, who is working on it and who is stuck."
            action={{ label: 'New assignment', icon: Plus, onClick: create }}
          />
        </Card>
      ) : (
        <>
          {s.upcoming.map((a, i) => <AssignmentRow key={a.id} a={a} i={i} />)}
          {past.length > 0 && <Eyebrow className="pt-2">Closed</Eyebrow>}
          {past.map((a, i) => <AssignmentRow key={a.id} a={a} i={i + s.upcoming.length} closed />)}
        </>
      )}
    </div>
  )
}
