import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, CalendarClock, GraduationCap, LifeBuoy, School, type LucideIcon } from 'lucide-react'
import { AnonStack, AvatarStack, Card, IconTile, Tooltip } from '@/components/ui'
import { navigate } from '@/lib/router'
import { isVisibleCluster, openRequestCount, students } from '@/lib/selectors'
import { tone as toneOf } from '@/lib/tones'
import { addDays, now, sameDay, startOfDay, WEEKDAYS } from '@/lib/time'
import type { Tone } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'
import { useCountUp } from './hooks'

const DEADLINE_LIKE = new Set(['Deadline', 'Quiz', 'Presentation', 'Assignment'])

export function StatCards() {
  const { data } = useStore()
  const t = now()
  const roster = students(data.people)
  const online = roster.filter((p) => p.presence === 'online').length
  const faces = ['haekal', 'nadia', 'kevin', 'helven', 'malik', 'rania', 'dylan']
  const connected = data.classes.filter((c) => c.discord.connected).length

  // Deadlines over the next 7 days (assignments + deadline-like events). Baseline 8 represents the full dataset;
  // anything scheduled during this session is added on top.
  const week = Array.from({ length: 7 }, (_, i) => startOfDay(addDays(t, i)))
  const perDay = week.map((d) =>
    data.assignments.filter((a) => sameDay(a.due, d)).length + data.events.filter((e) => DEADLINE_LIKE.has(e.category) && e.source !== 'recurring' && sameDay(e.start, d)).length,
  )
  const fresh = data.events.filter((e) => e.isNew && DEADLINE_LIKE.has(e.category) && new Date(e.start) >= t && new Date(e.start) < addDays(t, 7)).length
    + data.assignments.filter((a) => a.isNew && new Date(a.due) >= t && new Date(a.due) < addDays(t, 7)).length
  const within48 = data.assignments.filter((a) => { const d = new Date(a.due).getTime() - t.getTime(); return d > 0 && d < 48 * 3600_000 }).length
  const maxDay = Math.max(1, ...perDay)

  const help = openRequestCount(data)
  const top = [...data.helpClusters].filter((h) => h.status === 'open' && isVisibleCluster(h, data.settings.privacyThreshold)).sort((a, b) => b.reports - a.reports)[0]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Stat i={0} label="Active Students" value={roster.length} suffix="students" icon={GraduationCap} tone="brand" trend={{ text: '+6', up: true, good: true }} onClick={() => navigate('/students')}>
        <div className="flex items-center justify-between gap-2">
          <AvatarStack ids={faces} max={5} total={roster.length} size="sm" />
          <span className="flex items-center gap-1.5 text-xs font-medium text-ink-3">
            <span className="relative size-2"><span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping-soft" /><span className="absolute inset-0 rounded-full bg-emerald-500" /></span>
            <b className="text-ink tabular">{online}</b> online
          </span>
        </div>
      </Stat>

      <Stat i={1} label="Active Classes" value={data.classes.length} suffix="classes" icon={School} tone="sky" trend={{ text: `${connected}/${data.classes.length} on Discord`, up: true, good: true, flat: true }} onClick={() => navigate('/classes')}>
        <div className="flex items-center gap-1.5">
          {data.classes.map((c) => (
            <Tooltip key={c.id} content={`${c.name} · ${c.subject}`}>
              <span className={cn('relative grid size-8 place-items-center rounded-xl text-[13px] font-extrabold ring-1 ring-inset', toneOf(c.tone).soft, toneOf(c.tone).text, toneOf(c.tone).ring)}>
                {c.id}
                {c.discord.connected && <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-discord ring-2 ring-white" />}
              </span>
            </Tooltip>
          ))}
        </div>
      </Stat>

      <Stat i={2} label="Upcoming Deadlines" value={8 + fresh} suffix="this week" icon={CalendarClock} tone="orange" trend={{ text: `${within48} in 48h`, up: true, good: false, flat: true }} onClick={() => navigate('/assignments')}>
        <div className="flex h-9 items-end gap-1.5" role="img" aria-label={`Deadlines per day: ${perDay.join(', ')}`}>
          {week.map((d, i) => (
            <Tooltip key={i} content={`${WEEKDAYS[d.getDay()]} · ${perDay[i]} due`} className="flex flex-1 flex-col items-center gap-1">
              <span
                className={cn('w-full origin-bottom rounded-md transition-transform duration-700', i === 0 ? 'bg-orange-500' : perDay[i] ? 'bg-orange-200' : 'bg-subtle')}
                style={{ height: 6 + (perDay[i] / maxDay) * 20, transitionDelay: `${i * 40}ms` }}
              />
              <span className={cn('text-[10px] font-semibold leading-none', i === 0 ? 'text-orange-600' : 'text-ink-3')}>{WEEKDAYS[d.getDay()][0]}</span>
            </Tooltip>
          ))}
        </div>
      </Stat>

      <Stat i={3} label="Open Help Requests" value={help} suffix="requests" icon={LifeBuoy} tone="rose" trend={{ text: '+5 today', up: true, good: false }} onClick={() => navigate('/help')}>
        <div className="flex items-center gap-2">
          <AnonStack count={help} max={3} size="xs" />
          <span className="min-w-0 truncate text-xs text-ink-3">Top · <b className="font-semibold text-ink">{top?.concept ?? '—'}</b></span>
        </div>
      </Stat>
    </div>
  )
}

function Stat({ i, label, value, suffix, icon, tone, trend, onClick, children }: {
  i: number; label: string; value: number; suffix: string; icon: LucideIcon; tone: Tone
  trend: { text: string; up: boolean; good: boolean; flat?: boolean }; onClick: () => void; children: ReactNode
}) {
  const shown = useCountUp(value)
  const TrendIcon = trend.up ? ArrowUpRight : ArrowDownRight
  return (
    <Card interactive onClick={onClick} className="group relative overflow-hidden p-5 animate-rise-in" style={{ animationDelay: `${80 + i * 50}ms` }}>
      <div className={cn('pointer-events-none absolute -right-8 -top-8 size-28 rounded-full opacity-60 blur-2xl transition-opacity group-hover:opacity-100', toneOf(tone).soft)} />
      <div className="relative flex items-center justify-between gap-2">
        <span className="flex items-center gap-2.5">
          <IconTile icon={icon} tone={tone} size="sm" />
          <span className="text-[13px] font-semibold text-ink-2">{label}</span>
        </span>
        <ArrowUpRight className="size-4 -translate-x-1 text-ink-3 opacity-0 transition duration-200 group-hover:translate-x-0 group-hover:opacity-100" />
      </div>
      <div className="relative mt-3 flex items-baseline gap-1.5">
        <span className="text-[34px] font-extrabold leading-none tracking-tight text-ink tabular">{shown}</span>
        <span className="text-[13px] font-medium text-ink-3">{suffix}</span>
        <span className={cn('ml-auto inline-flex shrink-0 items-center gap-0.5 self-center rounded-full px-1.5 py-0.5 text-[11px] font-bold', trend.good ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}>
          {!trend.flat && <TrendIcon className="size-3" />}{trend.text}
        </span>
      </div>
      <div className="relative mt-4">{children}</div>
    </Card>
  )
}
