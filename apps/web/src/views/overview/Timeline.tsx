import { ArrowRight, Check } from 'lucide-react'
import { AvatarStack, Badge, Button, Card, CardHeader, IconTile } from '@/components/ui'
import { navigate } from '@/lib/router'
import { eventParticipantIds, shortName } from '@/lib/selectors'
import { CATEGORY, tone as toneOf } from '@/lib/tones'
import { addDays, fmtDay, fmtTime, now, nowIso, sameDay, startOfDay, toDateInput } from '@/lib/time'
import type { CalEvent } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'
import { useTick } from './hooks'

type Status = 'done' | 'live' | 'upcoming'

function statusOf(e: CalEvent, t: Date): Status {
  const start = new Date(e.start)
  const end = e.end ? new Date(e.end) : new Date(start.getTime() + 30 * 60_000)
  return t > end ? 'done' : t >= start ? 'live' : 'upcoming'
}

function inLabel(iso: string, t: Date) {
  const min = Math.max(1, Math.round((new Date(iso).getTime() - t.getTime()) / 60_000))
  return min < 60 ? `in ${min} min` : `in ${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m`
}

export function Timeline({ className }: { className?: string }) {
  useTick(30_000)
  const { data, person } = useStore()
  const t = now()
  const items = data.events.filter((e) => sameDay(e.start, t)).sort((a, b) => a.start.localeCompare(b.start))
  const firstUpcoming = items.findIndex((e) => statusOf(e, t) === 'upcoming')
  const tomorrow = startOfDay(addDays(t, 1)).getTime()
  const comingUp = data.events
    .filter((e) => { const s = new Date(e.start).getTime(); return s >= tomorrow && s < tomorrow + 4 * 86_400_000 })
    .sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew) || a.start.localeCompare(b.start))
    .slice(0, 8)
    .sort((a, b) => a.start.localeCompare(b.start))

  const titleOf = (e: CalEvent) => {
    const c = data.classes.find((x) => x.id === e.classId)
    return e.category === 'Lecture' && c ? `${c.subject} — ${c.name}` : e.title
  }

  return (
    <Card className={cn('flex flex-col animate-rise-in [animation-delay:160ms]', className)}>
      <CardHeader
        title="Today's Academic Timeline"
        subtitle={`${fmtDay(nowIso())} · ${items.length} events across your classes`}
        action={<Button variant="ghost" size="sm" iconRight={ArrowRight} onClick={() => navigate(`/calendar?view=day&date=${toDateInput(nowIso())}`)}>Calendar</Button>}
      />
      <ol className="relative flex-1 px-5 pb-5 pt-4">
        {items.map((e, i) => {
          const status = statusOf(e, t)
          const cat = CATEGORY[e.category]
          const ids = eventParticipantIds(e, data)
          const host = person(e.hostId)
          const last = i === items.length - 1
          return (
            <li key={e.id}>
              {i === firstUpcoming && <NowMarker time={fmtTime(nowIso())} />}
              <div className="grid grid-cols-[48px_minmax(0,1fr)] gap-3">
                <div className={cn('pt-3.5 text-right tabular', status === 'done' ? 'text-ink-3' : 'text-ink')}>
                  <div className="text-[13px] font-bold leading-none">{fmtTime(e.start)}</div>
                  {e.end && <div className="mt-1 text-[11px] font-medium text-ink-3">{fmtTime(e.end)}</div>}
                </div>
                <div className="relative pb-2.5 pl-6">
                  {!last && <span className="absolute bottom-0 left-[6px] top-6 w-px bg-line" aria-hidden />}
                  <span className={cn('absolute left-0 top-[18px] grid size-[13px] place-items-center rounded-full ring-4 ring-white', status === 'done' ? 'bg-line-strong' : status === 'live' ? 'bg-emerald-500' : 'bg-brand-500')} aria-hidden>
                    {status === 'live' && <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping-soft" />}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate(`/calendar?view=day&date=${toDateInput(e.start)}`)}
                    className={cn(
                      'group flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition duration-200 hover:-translate-y-px hover:shadow-card',
                      status === 'live' ? 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-300' : 'border-line bg-surface hover:border-line-strong',
                      status === 'done' && 'opacity-75 hover:opacity-100',
                      e.isNew && 'animate-highlight',
                    )}
                  >
                    <IconTile icon={cat.icon} tone={cat.tone} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className={cn('truncate text-[14px] font-bold', status === 'done' ? 'text-ink-2' : 'text-ink')}>{titleOf(e)}</span>
                        {status === 'live' && <Badge tone="emerald" size="xs" dot>Live now</Badge>}
                        {status === 'done' && <Badge tone="slate" size="xs" icon={Check}>Done</Badge>}
                        {e.isNew && <Badge tone="brand" size="xs">New</Badge>}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-ink-3">
                        {e.location}{host && <> · {shortName(host)}</>}
                        {status === 'upcoming' && <span className="font-semibold text-brand-600"> · {inLabel(e.start, t)}</span>}
                      </span>
                    </span>
                    {ids.length > 0 && <AvatarStack ids={ids} max={4} size="sm" className="hidden shrink-0 sm:flex" />}
                  </button>
                </div>
              </div>
            </li>
          )
        })}
        {firstUpcoming === -1 && items.length > 0 && <NowMarker time={fmtTime(nowIso())} />}
      </ol>

      {comingUp.length > 0 && (
        <div className="border-t border-line px-5 pb-4 pt-3.5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">Coming up this week</span>
            <span className="text-[11px] text-ink-3">{comingUp.length} events</span>
          </div>
          <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {comingUp.map((e) => {
              const cat = CATEGORY[e.category]
              return (
                <li key={e.id}>
                  <button type="button" onClick={() => navigate(`/calendar?view=day&date=${toDateInput(e.start)}`)}
                    className={cn('flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition hover:bg-subtle', e.isNew && 'animate-highlight')}>
                    <span className={cn('h-8 w-1 shrink-0 rounded-full', toneOf(cat.tone).solid)} aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-ink">{titleOf(e)}</span>
                      <span className="block text-[11.5px] text-ink-3 tabular">{fmtDay(e.start).split(',')[0]} · {fmtTime(e.start)} · {e.category}</span>
                    </span>
                    {e.isNew && <Badge tone="brand" size="xs">New</Badge>}
                    <AvatarStack ids={eventParticipantIds(e, data)} max={2} size="xs" className="shrink-0" />
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </Card>
  )
}

function NowMarker({ time }: { time: string }) {
  return (
    <div className="grid grid-cols-[48px_minmax(0,1fr)] items-center gap-3 pb-2.5" aria-label={`Current time ${time}`}>
      <span className="text-right text-[11px] font-bold text-brand-600 tabular">{time}</span>
      <span className="relative flex items-center">
        <span className="absolute -left-px size-[9px] rounded-full bg-brand-600 ring-4 ring-brand-100" />
        <span className="ml-3 h-px flex-1 bg-gradient-to-r from-brand-400 to-transparent" />
        <span className="ml-2 text-[11px] font-bold uppercase tracking-wider text-brand-600">Now</span>
      </span>
    </div>
  )
}
