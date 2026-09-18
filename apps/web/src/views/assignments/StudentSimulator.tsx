import { useState } from 'react'
import { BellOff, BellRing, Check, CircleCheck, Eye, LifeBuoy, Loader } from 'lucide-react'
import { ReminderDM } from '@/components/domain/ReminderDM'
import { Avatar, Button, Card, IconTile, ProgressBar, Select, StatusBadge, SuccessBurst } from '@/components/ui'
import { studentsIn } from '@/lib/selectors'
import { dueLabel, timeLeft } from '@/lib/time'
import type { Assignment, TaskState } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useActions } from '@/store/actions'
import { useStore } from '@/store/store'
import { linkedClusters, STATE } from './lib'

const STEPS = ['Read the brief and dataset', 'Work through the tasks', 'Submit in #assignment']
const STEPS_DONE: Record<TaskState, number> = { not_started: 0, in_progress: 1, stuck: 1, completed: 3 }
const Eyebrow = ({ children }: { children: string }) => <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">{children}</div>

/** Act as a student: checklist buttons + the Discord reminder DM both write to the shared store. */
export function StudentSimulator({ a, className }: { a: Assignment; className?: string }) {
  const { data, person, toast } = useStore()
  const actions = useActions()
  const roster = studentsIn(data.people, a.classId).sort((x, y) => Number(!!y.featured) - Number(!!x.featured) || x.name.localeCompare(y.name))
  const [sid, setSid] = useState(() => (roster.some((p) => p.id === 'haekal') ? 'haekal' : roster[0]?.id ?? ''))
  const p = person(sid)
  if (!p) return null

  const first = p.name.split(' ')[0]
  const state = a.progress[sid] ?? 'not_started'
  const clusters = linkedClusters(a, data.helpClusters)
  const cluster = clusters.find((h) => h.status === 'open') ?? clusters[0]

  const set = (s: TaskState) => {
    if (s === state) return
    actions.setTaskState(a.id, sid, s)
    if (s === 'completed') toast({ title: `${first} completed the task`, description: `${a.title} checked off · reminders disabled.`, tone: 'success' })
    if (s === 'stuck') toast({ title: `${first} is stuck`, description: cluster ? `Help request opened in “${cluster.concept}”.` : 'Help request sent to the teaching team.', tone: 'warning' })
    if (s === 'in_progress') toast({ title: `${first} is working on it`, description: `${a.title} marked as in progress.`, tone: 'info' })
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-canvas/60 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <IconTile icon={Eye} tone="violet" size="sm" />
          <div className="min-w-0">
            <h3 className="text-[15px] font-bold tracking-tight text-ink">Student view simulation</h3>
            <p className="text-xs text-ink-3">Act as a student — checklist taps and Discord buttons update this dashboard live.</p>
          </div>
        </div>
        <label className="flex items-center gap-2.5 text-[13px] font-semibold text-ink-2">
          Viewing as
          <Select value={sid} onChange={(e) => setSid(e.target.value)} className="h-9 w-64">
            {roster.map((s) => <option key={s.id} value={s.id}>{s.name} · {STATE[a.progress[s.id] ?? 'not_started'].label}</option>)}
          </Select>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-2">
        <div>
          <Eyebrow>{`${first}'s checklist · Classync`}</Eyebrow>
          <div className="mt-2 rounded-2xl border border-line bg-surface p-5 shadow-card">
            <div className="flex items-center gap-3">
              <Avatar id={sid} size="lg" presence />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-bold text-ink">{p.name}</div>
                <div className="text-xs text-ink-3 tabular">NPM {p.npm} · Class {a.classId}</div>
              </div>
              <span key={state} className="animate-scale-in"><StatusBadge status={state} size="md" /></span>
            </div>

            <div className="mt-4 rounded-xl bg-canvas p-4">
              <div className="flex items-start gap-3">
                <StateCheck state={state} />
                <div className="min-w-0 flex-1">
                  <div className={cn('text-[14px] font-semibold transition-colors', state === 'completed' ? 'text-ink-3 line-through decoration-2' : 'text-ink')}>{a.title}</div>
                  <div className="mt-0.5 text-xs text-ink-3">{dueLabel(a.due)} · {timeLeft(a.due)}</div>
                </div>
              </div>
              <ul className="mt-3 space-y-1.5 pl-9">
                {STEPS.map((step, i) => {
                  const done = i < STEPS_DONE[state]
                  return (
                    <li key={step} className="flex items-center gap-2 text-[13px]">
                      <span className={cn('grid size-4 shrink-0 place-items-center rounded-full border transition-colors', done ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-line-strong bg-surface')}>
                        {done && <Check className="size-2.5 animate-check-in" strokeWidth={3.5} />}
                      </span>
                      <span className={done ? 'text-ink-3 line-through' : 'text-ink-2'}>{step}</span>
                    </li>
                  )
                })}
              </ul>
              <ProgressBar className="mt-3" size="sm" value={(STEPS_DONE[state] / 3) * 100} tone={state === 'stuck' ? 'rose' : 'emerald'} label="Checklist progress" />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Button variant={state === 'completed' ? 'success' : 'secondary'} icon={CircleCheck} aria-pressed={state === 'completed'} onClick={() => set('completed')}>Mark as Done</Button>
              <Button variant={state === 'stuck' ? 'danger-soft' : 'secondary'} icon={LifeBuoy} aria-pressed={state === 'stuck'} onClick={() => set('stuck')}
                className={cn(state === 'stuck' && 'ring-1 ring-inset ring-rose-200')}>I'm stuck</Button>
              <Button variant={state === 'in_progress' ? 'soft' : 'secondary'} icon={Loader} aria-pressed={state === 'in_progress'} onClick={() => set('in_progress')}
                className={cn(state === 'in_progress' && 'ring-1 ring-inset ring-brand-200')}>In progress</Button>
            </div>

            <StateHint key={`${sid}-${state}`} state={state} first={first} concept={cluster?.concept} />
          </div>
        </div>

        <div>
          <Eyebrow>{`What ${first} gets on Discord`}</Eyebrow>
          <ReminderDM key={sid} className="mt-2" studentId={sid} assignmentId={a.id} dueIn={timeLeft(a.due).replace(/ left$/, '')} />
        </div>
      </div>
    </Card>
  )
}

function StateCheck({ state }: { state: TaskState }) {
  const Icon = state === 'completed' ? Check : state === 'stuck' ? LifeBuoy : state === 'in_progress' ? Loader : null
  return (
    <span key={state} className={cn('mt-0.5 grid size-6 shrink-0 place-items-center rounded-full border-2 animate-pop', {
      completed: 'border-emerald-500 bg-emerald-500 text-white',
      stuck: 'border-rose-300 bg-rose-50 text-rose-600',
      in_progress: 'border-sky-300 bg-sky-50 text-sky-600',
      not_started: 'border-line-strong bg-surface',
    }[state])}>
      {Icon && <Icon className="size-3.5" strokeWidth={3} />}
    </span>
  )
}

function StateHint({ state, first, concept }: { state: TaskState; first: string; concept?: string }) {
  const base = 'mt-4 flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[12.5px] leading-snug animate-rise-in'
  if (state === 'completed') {
    return (
      <div className={cn(base, 'bg-emerald-50 text-emerald-800')}>
        <SuccessBurst size={22} className="-my-2 -ml-2 shrink-0" />
        <span><span className="font-semibold">Nice work!</span> Reminders are off — Classync won't ping {first} about this task again.</span>
      </div>
    )
  }
  if (state === 'stuck') {
    return (
      <div className={cn(base, 'bg-rose-50 text-rose-800')}>
        <LifeBuoy className="size-4 shrink-0" />
        <span>{first} joined {concept ? <>the <span className="font-semibold">{concept}</span> help queue</> : 'the help queue'} — the teaching team sees it under Help Requests.</span>
      </div>
    )
  }
  return (
    <div className={cn(base, 'bg-brand-50 text-brand-800')}>
      {state === 'in_progress' ? <BellRing className="size-4 shrink-0" /> : <BellOff className="size-4 shrink-0 opacity-0" aria-hidden />}
      <span>{state === 'in_progress' ? `Classync will DM ${first} 1 day and 1 hour before the deadline.` : `${first} hasn't started yet — reminder DMs continue until the task is marked done.`}</span>
    </div>
  )
}
