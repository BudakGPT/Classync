import type { KeyboardEvent } from 'react'
import { MapPin, Repeat } from 'lucide-react'
import { AvatarStack, Badge, CategoryBadge, IconTile, PersonLine } from '@/components/ui'
import { fmtMonth, fmtTime, sameDay, WEEKDAYS } from '@/lib/time'
import { CATEGORY } from '@/lib/tones'
import type { CalEvent } from '@/lib/types'
import { cn, plural } from '@/lib/utils'
import { useStore } from '@/store/store'
import { ClassTag, NewBadge } from './EventBits'
import { dayKey, durationLabel, isDeadline, useCal, useNow } from './lib'

export function AgendaView({ days, byDay }: { days: Date[]; byDay: Map<string, CalEvent[]> }) {
  const nowD = useNow()
  const sections = days
    .map((d) => ({ d, key: dayKey(d), list: [...(byDay.get(dayKey(d)) ?? [])].sort((a, b) => a.start.localeCompare(b.start)) }))
    .filter((s) => s.list.length)

  return (
    <div className="divide-y divide-line">
      {sections.map((s, i) => {
        const today = sameDay(s.d, nowD)
        return (
          <section key={s.key} aria-label={`${WEEKDAYS[s.d.getDay()]} ${s.d.getDate()}`}
            className={cn('grid gap-3 px-4 py-4 sm:px-5 md:grid-cols-[112px_minmax(0,1fr)] md:gap-5', today && 'bg-brand-50/30')}>
            <div className="flex items-baseline gap-2 md:sticky md:top-20 md:block md:self-start">
              <div className={cn('text-[28px] font-extrabold leading-none tracking-tight tabular', today ? 'text-brand-600' : 'text-ink')}>{s.d.getDate()}</div>
              <div className="text-[13px] font-semibold text-ink md:mt-1.5">{WEEKDAYS[s.d.getDay()]}</div>
              <div className="text-[11.5px] text-ink-3">{fmtMonth(s.d)} · {plural(s.list.length, 'event')}</div>
              {today && <Badge tone="brand" size="xs" dot className="md:mt-2">Today</Badge>}
            </div>
            <div className="space-y-2">
              {s.list.map((e, j) => <AgendaRow key={e.id} event={e} past={new Date(e.end ?? e.start) < nowD} delay={Math.min(i + j, 8) * 35} />)}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function AgendaRow({ event: e, past, delay }: { event: CalEvent; past: boolean; delay: number }) {
  const cal = useCal()
  const { person } = useStore()
  const c = CATEGORY[e.category]
  const ids = cal.participants(e)
  const host = person(e.hostId)
  const dl = isDeadline(e)
  const onKey = (ev: KeyboardEvent) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); cal.open(e) } }

  return (
    <div
      role="button" tabIndex={0} onClick={() => cal.open(e)} onKeyDown={onKey} style={{ animationDelay: `${delay}ms` }}
      aria-label={`${e.title}, ${dl ? `due ${fmtTime(e.start)}` : fmtTime(e.start)}`}
      className={cn(
        'group grid cursor-pointer grid-cols-[92px_auto_minmax(0,1fr)] items-center gap-3.5 rounded-xl border border-line bg-surface px-4 py-3 shadow-card transition duration-150 hover:-translate-y-px hover:border-line-strong hover:opacity-100 hover:shadow-lift lg:grid-cols-[104px_auto_minmax(0,1fr)_190px_132px]',
        e.isNew ? 'ring-2 ring-brand-400 animate-highlight' : 'animate-rise-in',
        past && !e.isNew && 'opacity-60',
      )}
    >
      <div className="tabular">
        <div className="text-[13px] font-bold text-ink">{dl ? fmtTime(e.start) : e.end ? `${fmtTime(e.start)} – ${fmtTime(e.end)}` : fmtTime(e.start)}</div>
        <div className="text-[11.5px] text-ink-3">{dl ? 'Due' : e.end ? durationLabel(e) : 'Reminder'}</div>
      </div>
      <IconTile icon={c.icon} tone={c.tone} />
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-[14px] font-semibold text-ink transition-colors group-hover:text-brand-700">{e.title}</span>
          {e.isNew && <NewBadge />}
          {e.source === 'recurring' && <Repeat className="size-3.5 shrink-0 text-ink-3" aria-label="Repeats weekly" />}
        </div>
        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-1.5 text-[12px] text-ink-3">
          <CategoryBadge category={e.category} size="xs" />
          <ClassTag event={e} />
          {e.location && <span className="ml-1 inline-flex min-w-0 items-center gap-1"><MapPin className="size-3.5 shrink-0" /><span className="truncate">{e.location}</span></span>}
        </div>
      </div>
      <div className="hidden min-w-0 lg:block">
        {host ? <PersonLine id={host.id} size="sm" subtitle={host.role} /> : <span className="text-[12px] text-ink-3">—</span>}
      </div>
      <div className="hidden justify-end lg:flex">
        {ids.length ? <AvatarStack ids={ids} max={4} size="sm" /> : <span className="text-[12px] text-ink-3">All classes</span>}
      </div>
    </div>
  )
}
