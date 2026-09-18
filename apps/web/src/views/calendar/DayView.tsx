import { CalendarPlus, Plus } from 'lucide-react'
import { AvatarStack, Button, EmptyState, PersonLine } from '@/components/ui'
import { fmtDate, fmtTime, sameDay, WEEKDAYS } from '@/lib/time'
import type { CalEvent } from '@/lib/types'
import { cn, plural } from '@/lib/utils'
import { useStore } from '@/store/store'
import { catTone, NewBadge } from './EventBits'
import { dayKey, isDeadline, timeRange, useCal, useNow } from './lib'
import { TimeGrid } from './TimeGrid'

export function DayView({ days, byDay }: { days: Date[]; byDay: Map<string, CalEvent[]> }) {
  const cal = useCal()
  const { person } = useStore()
  const nowD = useNow()
  const day = days[0]
  const key = dayKey(day)
  const list = [...(byDay.get(key) ?? [])].sort((a, b) => a.start.localeCompare(b.start))
  const people = [...new Set(list.flatMap((e) => cal.participants(e)))]
  const hosts = [...new Set(list.map((e) => e.hostId).filter(Boolean))] as string[]
  const minutes = list.reduce((n, e) => n + (e.end && !isDeadline(e) ? (new Date(e.end).getTime() - new Date(e.start).getTime()) / 60_000 : 0), 0)
  const deadlines = list.filter(isDeadline).length
  const today = sameDay(day, nowD)
  const stats: [string | number, string][] = [
    [list.length, plural(list.length, 'Event').replace(/^\d+ /, '')],
    [deadlines, deadlines === 1 ? 'Deadline' : 'Deadlines'],
    [`${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${Math.round(minutes % 60)}m` : ''}`, 'Scheduled'],
  ]

  return (
    <div className="flex flex-col lg:flex-row">
      <div className="min-w-0 flex-1"><TimeGrid days={days} byDay={byDay} hourPx={64} large /></div>
      <aside className="scrollbar-thin w-full shrink-0 overflow-y-auto border-t border-line lg:h-[calc(100dvh-300px)] lg:min-h-[520px] lg:w-[320px] lg:border-l lg:border-t-0">
        <div className="hero-gradient border-b border-line px-5 py-5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">{today ? 'Today' : 'Day overview'}</div>
          <div className="mt-1 text-[22px] font-extrabold leading-tight tracking-tight text-ink">{WEEKDAYS[day.getDay()]}</div>
          <div className="text-[13px] text-ink-3">{fmtDate(day.toISOString())}</div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {stats.map(([v, l]) => (
              <div key={l} className="rounded-xl bg-surface/85 px-2.5 py-2 ring-1 ring-line">
                <div className="text-[17px] font-extrabold leading-tight text-ink tabular">{v}</div>
                <div className="text-[11px] text-ink-3">{l}</div>
              </div>
            ))}
          </div>
        </div>

        <section className="px-5 py-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-ink">Agenda</h3>
            <Button size="xs" variant="ghost" icon={Plus} onClick={() => cal.create(key)}>Add</Button>
          </div>
          {list.length ? (
            <ul className="-mx-2 space-y-0.5">
              {list.map((e, i) => (
                <li key={e.id} className="animate-rise-in" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                  <button type="button" onClick={() => cal.open(e)}
                    className={cn('flex w-full items-start gap-2.5 rounded-xl p-2 text-left transition hover:bg-subtle', e.isNew && 'bg-brand-50/60 ring-1 ring-brand-200')}>
                    <span className="mt-px w-11 shrink-0 text-[12px] font-bold text-ink tabular">{isDeadline(e) ? 'Due' : fmtTime(e.start)}</span>
                    <span className="mt-0.5 h-8 w-[3px] shrink-0 rounded-full" style={{ background: catTone(e).hex }} />
                    <span className="min-w-0 flex-1">
                      <span className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate text-[13px] font-semibold text-ink">{e.title}</span>
                        {e.isNew && <NewBadge />}
                      </span>
                      <span className="mt-0.5 block truncate text-[11.5px] text-ink-3">{timeRange(e)}{e.location ? ` · ${e.location}` : ''}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState compact icon={CalendarPlus} characters={['helven', 'jessica', 'dylan']} title="Nothing scheduled"
              description="A free day — add a lecture, FGD or deadline." action={{ label: 'Add event', icon: Plus, onClick: () => cal.create(key) }} />
          )}
        </section>

        {people.length + hosts.length > 0 && (
          <section className="border-t border-line px-5 py-4">
            <h3 className="text-[15px] font-bold text-ink">Participants</h3>
            <p className="mt-0.5 text-[12px] text-ink-3">{plural(people.length, 'person', 'people')} across {plural(list.length, 'event')}</p>
            {people.length > 0 && <AvatarStack ids={people} max={8} size="md" className="mt-3" />}
            {hosts.length > 0 && (
              <>
                <div className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-ink-3">Hosts</div>
                <div className="mt-2 space-y-2.5">
                  {hosts.map((id) => (
                    <PersonLine key={id} id={id} size="sm" presence subtitle={`${person(id)?.role ?? ''} · ${plural(list.filter((e) => e.hostId === id).length, 'event')}`} />
                  ))}
                </div>
              </>
            )}
          </section>
        )}
      </aside>
    </div>
  )
}
