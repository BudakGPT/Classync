import { AlarmClock, ArrowRight, CalendarClock, Flame } from 'lucide-react'
import { AvatarStack, Badge, Button, Card, CardHeader, ProgressBar } from '@/components/ui'
import { navigate } from '@/lib/router'
import { idsWithState, taskCounts } from '@/lib/selectors'
import { tone as toneOf } from '@/lib/tones'
import { dueLabel, now, timeLeft, urgency } from '@/lib/time'
import type { Tone } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'

const URGENCY: Record<string, { tone: Tone; label: string; icon: typeof Flame }> = {
  urgent: { tone: 'rose', label: 'Urgent', icon: Flame },
  soon: { tone: 'amber', label: 'Soon', icon: AlarmClock },
  later: { tone: 'sky', label: 'Upcoming', icon: CalendarClock },
  overdue: { tone: 'rose', label: 'Overdue', icon: Flame },
}

export function Deadlines() {
  const { data } = useStore()
  const t = now()
  const list = data.assignments.filter((a) => new Date(a.due) > t).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 3)

  return (
    <Card className="animate-rise-in [animation-delay:220ms]">
      <CardHeader
        title="Upcoming Deadlines"
        subtitle="Color-coded by urgency"
        action={<Button variant="ghost" size="sm" iconRight={ArrowRight} onClick={() => navigate('/assignments')}>All</Button>}
      />
      <div className="space-y-2.5 p-5 pt-4">
        {list.map((a) => {
          const c = taskCounts(a)
          const u = URGENCY[urgency(a.due)]
          const stuck = idsWithState(a, 'stuck')
          const cls = data.classes.find((x) => x.id === a.classId)
          return (
            <button
              key={a.id} type="button" onClick={() => navigate(`/assignments/${a.id}`)}
              className={cn('group relative w-full overflow-hidden rounded-xl border border-line bg-surface py-3 pl-4 pr-3.5 text-left transition duration-200 hover:-translate-y-px hover:border-line-strong hover:shadow-card', a.isNew && 'animate-highlight')}
            >
              <span className={cn('absolute inset-y-0 left-0 w-1', toneOf(u.tone).solid)} aria-hidden />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-bold text-ink">{a.title}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-3">
                    {cls && <span className={cn('rounded-md px-1.5 py-px text-[11px] font-bold', toneOf(cls.tone).soft, toneOf(cls.tone).text)}>{cls.name}</span>}
                    <span className="truncate">{dueLabel(a.due)}</span>
                  </div>
                </div>
                <Badge tone={u.tone} icon={u.icon} size="xs">{urgency(a.due) === 'later' ? timeLeft(a.due) : `${u.label} · ${timeLeft(a.due)}`}</Badge>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <ProgressBar value={c.pct} tone={u.tone === 'rose' ? 'brand' : u.tone} size="sm" className="flex-1" label={`${a.title} completion`} />
                <span className="shrink-0 text-xs font-semibold text-ink-2 tabular">{c.completed}/{c.total} completed</span>
              </div>
              {stuck.length > 0 && (
                <div className="mt-2 flex items-center gap-2 text-xs text-ink-3">
                  <AvatarStack ids={stuck} max={3} size="xs" />
                  <span><b className="font-semibold text-rose-600">{stuck.length} stuck</b> · {c.in_progress} in progress</span>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </Card>
  )
}
