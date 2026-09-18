import { BellRing, CircleCheck, MessageCircle, MousePointerClick, ShieldCheck } from 'lucide-react'
import { ReminderDM } from '@/components/domain/ReminderDM'
import { AvatarStack, Badge, Card, PersonLine, StackedProgress } from '@/components/ui'
import { idsWithState, taskCounts } from '@/lib/selectors'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'
import { Eyebrow } from './parts'

const RULES = [
  { when: '1 day before', what: 'DM + dashboard to everyone who hasn’t finished', icon: BellRing, tone: 'bg-amber-500' },
  { when: '6 hours before', what: 'Personal DM to students still in progress or stuck', icon: MessageCircle, tone: 'bg-orange-500' },
  { when: '1 hour before', what: 'Final nudge with a direct “Mark as Done” button', icon: BellRing, tone: 'bg-rose-500' },
  { when: 'Marked as done', what: 'Reminders stop automatically for that student', icon: CircleCheck, tone: 'bg-emerald-500' },
]

export function ReminderSection() {
  const { data } = useStore()
  const a = data.assignments.find((x) => x.id === 'ml-assignment')
  if (!a) return null
  const c = taskCounts(a)
  const pending = [...idsWithState(a, 'stuck'), ...idsWithState(a, 'in_progress'), ...idsWithState(a, 'not_started')]

  return (
    <section className="mt-8 animate-rise-in" aria-labelledby="reminder-preview">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 id="reminder-preview" className="text-[15px] font-bold tracking-tight text-ink">Student reminder preview</h2>
          <p className="text-[13px] text-ink-3">Students receive personal reminders and can stop them after completing the task.</p>
        </div>
        <Badge tone="emerald" icon={ShieldCheck}>Only the student sees their own reminder</Badge>
      </div>
      <Card className="overflow-hidden">
        <div className="grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
          <div className="p-6">
            <Eyebrow>Reminder rules</Eyebrow>
            <ol className="relative mt-3 space-y-4">
              <span className="absolute bottom-2 left-[13px] top-2 w-px bg-line" aria-hidden />
              {RULES.map((r) => (
                <li key={r.when} className="relative flex gap-3">
                  <span className={cn('relative grid size-7 shrink-0 place-items-center rounded-full text-white ring-4 ring-white', r.tone)}><r.icon className="size-3.5" /></span>
                  <div className="pt-0.5">
                    <div className="text-[13.5px] font-semibold text-ink">{r.when}</div>
                    <div className="text-[12.5px] text-ink-3">{r.what}</div>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-6 rounded-2xl border border-line bg-canvas p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-semibold text-ink">{a.title} · Class {a.classId}</div>
                  <div className="text-[12px] text-ink-3"><b className="font-semibold text-emerald-700 tabular">{c.completed}</b> of {c.total} done · <b className="font-semibold text-ink-2 tabular">{c.total - c.completed}</b> still receive reminders</div>
                </div>
                <AvatarStack ids={pending} max={4} size="sm" />
              </div>
              <StackedProgress className="mt-3" total={c.total} segments={[
                { value: c.completed, tone: 'emerald', label: 'Completed' },
                { value: c.in_progress, tone: 'sky', label: 'In progress' },
                { value: c.stuck, tone: 'rose', label: 'Stuck' },
              ]} />
            </div>
          </div>

          <div className="bg-dots relative border-t border-line bg-canvas p-6 lg:border-l lg:border-t-0">
            <div className="mb-3 flex items-center justify-between gap-2">
              <PersonLine id="haekal" size="sm" presence subtitle="Class B · receives this in Discord" />
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-[11.5px] font-semibold text-brand-700 shadow-card ring-1 ring-line">
                <MousePointerClick className="size-3.5" />Try “Mark as Done”
              </span>
            </div>
            <ReminderDM studentId="haekal" assignmentId="ml-assignment" dueIn="6 hours" />
          </div>
        </div>
      </Card>
    </section>
  )
}
