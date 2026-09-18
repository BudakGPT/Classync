import { useState } from 'react'
import { ArrowRight, BarChart3, Check, LifeBuoy, MessagesSquare, PartyPopper, Send, TrendingUp } from 'lucide-react'
import {
  AnonStack, AvatarStack, Badge, Button, Card, CardHeader, Donut, EmptyState, IconTile, PersonLine, StackedProgress, StatusBadge,
} from '@/components/ui'
import { idsWithState, shortName, taskCounts } from '@/lib/selectors'
import { addDays, now, WEEKDAYS } from '@/lib/time'
import type { Assignment, TaskState } from '@/lib/types'
import { cn, hash, plural, rng } from '@/lib/utils'
import { useStore } from '@/store/store'
import { linkedClusters, STATES, stateSegments, type DetailTab } from './lib'
import { StudentSimulator } from './StudentSimulator'

type Go = (tab: DetailTab, state?: TaskState) => void

export function OverviewTab({ a, go }: { a: Assignment; go: Go }) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <CompletionCard a={a} go={go} className="xl:col-span-2" />
      <NeedsAttention a={a} go={go} />
      <CompletionTrend a={a} className="xl:col-span-2" />
      <HelpSummary a={a} go={go} />
      <StudentSimulator a={a} className="xl:col-span-3" />
    </div>
  )
}

function CompletionCard({ a, go, className }: { a: Assignment; go: Go; className?: string }) {
  const c = taskCounts(a)
  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-bold tracking-tight text-ink">Completion</h3>
          <p className="text-xs text-ink-3">{c.total} students in Class {a.classId} · updates live as students check in</p>
        </div>
        <Badge tone="emerald" icon={Check}>{c.completed} done</Badge>
      </div>

      <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row">
        <Donut value={c.pct} size={164} stroke={16} tone="emerald" label={`${c.pct}% completed`}>
          <div className="text-center">
            <div key={c.pct} className="text-[36px] font-extrabold leading-none tracking-tight text-ink tabular animate-pop">{c.pct}%</div>
            <div className="mt-1 text-xs font-medium text-ink-3">completed</div>
          </div>
        </Donut>

        <div className="w-full min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3 text-xs text-ink-3">
            <span><span className="font-bold text-ink tabular">{c.total - c.not_started}</span> of {c.total} started</span>
            <span className="tabular">{c.not_started} not started</span>
          </div>
          <StackedProgress size="lg" className="mt-2" segments={stateSegments(a)} total={c.total} />
          <div className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-4">
            {STATES.map((s) => (
              <button
                key={s.value} type="button" onClick={() => go('students', s.value)} aria-label={`${s.label}: ${c[s.value]} students — view list`}
                className="rounded-xl border border-line bg-surface p-3 text-left transition duration-150 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card active:translate-y-0"
              >
                <div className="flex items-center gap-2">
                  <IconTile icon={s.icon} tone={s.tone} size="sm" />
                  <span className="truncate text-[12px] font-semibold text-ink-2">{s.label}</span>
                </div>
                <div className="mt-2.5 flex items-end justify-between gap-2">
                  <span key={c[s.value]} className="text-[24px] font-extrabold leading-none tracking-tight text-ink tabular animate-pop">{c[s.value]}</span>
                  <AvatarStack ids={idsWithState(a, s.value)} max={3} size="xs" />
                </div>
                <div className="mt-1.5 text-[11px] text-ink-3 tabular">{c.total ? Math.round((c[s.value] / c.total) * 100) : 0}% of class</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

function NeedsAttention({ a, go }: { a: Assignment; go: Go }) {
  const { person, toast, log, me } = useStore()
  const [sent, setSent] = useState<string[]>([])
  const stuck = idsWithState(a, 'stuck')

  const offerHelp = (id: string) => {
    const name = shortName(person(id))
    setSent((s) => [...s, id])
    log({ actorId: me.id, action: 'offered help to', target: person(id)?.name ?? name, detail: a.title, type: 'help' })
    toast({ title: `Help DM sent to ${name}`, description: 'Classync shared the reusable answer and office-hour slots on Discord.', tone: 'discord' })
  }

  return (
    <Card className="flex flex-col">
      <CardHeader icon={LifeBuoy} tone="rose" title="Needs attention"
        subtitle={stuck.length ? `${plural(stuck.length, 'student')} marked themselves stuck` : 'Nobody is stuck right now'} />
      {stuck.length ? (
        <>
          <ul className="mt-3 flex-1 space-y-0.5 px-3">
            {stuck.slice(0, 5).map((id, i) => (
              <li key={id} className="rounded-xl px-2 py-2 transition-colors hover:bg-subtle/70 animate-rise-in" style={{ animationDelay: `${i * 40}ms` }}>
                <PersonLine
                  id={id} presence subtitle={`NPM ${person(id)?.npm ?? '—'}`}
                  trailing={sent.includes(id)
                    ? <Badge tone="emerald" icon={Check} size="xs">DM sent</Badge>
                    : <Button size="xs" variant="soft" icon={Send} onClick={() => offerHelp(id)}>Offer help</Button>}
                />
              </li>
            ))}
          </ul>
          <div className="mt-2 border-t border-line px-3 py-2.5">
            <Button variant="ghost" size="sm" iconRight={ArrowRight} onClick={() => go('students', 'stuck')}>
              {stuck.length > 5 ? `View all ${stuck.length} stuck students` : 'View in student list'}
            </Button>
          </div>
        </>
      ) : (
        <EmptyState compact icon={PartyPopper} tone="emerald" characters={['jessica', 'helven', 'malik']} className="flex-1 justify-center"
          title="All clear" description="No one has tapped “I'm stuck” on this task." />
      )}
    </Card>
  )
}

/** Mock daily completions: deterministic spread of the seeded count; today's bar absorbs live changes. */
function spread(seed: string, total: number) {
  const r = rng(hash(seed))
  const w = Array.from({ length: 7 }, (_, i) => (0.35 + r()) * (1 + i * 0.3))
  const sum = w.reduce((s, x) => s + x, 0)
  let acc = 0, prev = 0
  return w.map((x) => { acc += (total * x) / sum; const v = Math.round(acc) - prev; prev += v; return v })
}

function CompletionTrend({ a, className }: { a: Assignment; className?: string }) {
  const c = taskCounts(a)
  const [base] = useState(() => ({ completed: c.completed, days: spread(a.id, c.completed) }))
  const delta = c.completed - base.completed
  const days = base.days.map((v, i) => (i === 6 ? Math.max(0, v + delta) : v))
  const max = Math.max(...days, 1)
  const week = days.reduce((s, v) => s + v, 0)

  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-bold tracking-tight text-ink">Completions over the last 7 days</h3>
          <p className="text-xs text-ink-3">{plural(week, 'student')} finished this week · <span className="font-semibold text-ink-2 tabular">{days[6]}</span> today</p>
        </div>
        {delta > 0
          ? <Badge key={delta} tone="emerald" icon={TrendingUp} className="animate-pop">+{delta} this session</Badge>
          : <Badge tone="slate" icon={BarChart3}>Daily</Badge>}
      </div>

      <div className="mt-9 flex h-40 items-end gap-3 border-b border-line sm:gap-5" role="img" aria-label={`Daily completions: ${days.join(', ')}`}>
        {days.map((v, i) => (
          <div key={i} className="group flex h-full flex-1 items-end justify-center">
            <div
              className={cn('relative w-full max-w-14 rounded-t-lg transition-[height,background-color] duration-700 ease-[var(--ease-out)]', i === 6 ? 'bg-brand-600' : 'bg-brand-200 group-hover:bg-brand-300')}
              style={{ height: `${Math.max(3, (v / max) * 100)}%` }}
            >
              <span className={cn('absolute inset-x-0 -top-5 text-center text-xs font-bold tabular', i === 6 ? 'text-brand-700' : 'text-ink-3')}>{v}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-3 sm:gap-5">
        {days.map((_, i) => (
          <div key={i} className={cn('flex-1 text-center text-[11.5px]', i === 6 ? 'font-bold text-brand-700' : 'font-medium text-ink-3')}>
            {i === 6 ? 'Today' : WEEKDAYS[addDays(now(), i - 6).getDay()].slice(0, 3)}
          </div>
        ))}
      </div>
    </Card>
  )
}

function HelpSummary({ a, go }: { a: Assignment; go: Go }) {
  const { data } = useStore()
  const clusters = linkedClusters(a, data.helpClusters)
  const open = clusters.filter((h) => h.status === 'open').length

  return (
    <Card className="flex flex-col">
      <CardHeader icon={MessagesSquare} tone="amber" title="Related help topics"
        subtitle={clusters.length ? `${open} open · ${plural(clusters.reduce((n, h) => n + h.reports, 0), 'report')}` : 'No difficulties reported'} />
      {clusters.length ? (
        <ul className="mt-3 flex-1 space-y-2 px-5">
          {clusters.map((h) => {
            const anon = Math.max(0, h.reports - h.requesterIds.length)
            return (
              <li key={h.id} className="rounded-xl border border-line p-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[13.5px] font-semibold text-ink">{h.concept}</span>
                  <StatusBadge status={h.status} size="xs" />
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {h.requesterIds.length > 0 && <AvatarStack ids={h.requesterIds} max={3} size="xs" />}
                    {anon > 0 && <AnonStack count={anon} max={3} size="xs" />}
                  </div>
                  <span className="text-[11.5px] text-ink-3 tabular">{plural(h.reports, 'report')}</span>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <EmptyState compact icon={MessagesSquare} tone="amber" className="flex-1" title="No help topics yet" description="Similar questions from students get grouped here." />
      )}
      <div className="mt-3 border-t border-line px-3 py-2.5">
        <Button variant="ghost" size="sm" iconRight={ArrowRight} onClick={() => go('help')}>View help requests</Button>
      </div>
    </Card>
  )
}
