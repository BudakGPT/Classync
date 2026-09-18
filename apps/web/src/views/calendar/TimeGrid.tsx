import { useLayoutEffect, useMemo, useRef } from 'react'
import { MapPin, Plus, Repeat } from 'lucide-react'
import { Avatar, AvatarStack, CategoryBadge } from '@/components/ui'
import { fmtDay, fmtTime, fromInputs, sameDay, WEEKDAYS } from '@/lib/time'
import type { CalEvent } from '@/lib/types'
import { cn } from '@/lib/utils'
import { catTone, ClassTag, DeadlineChip, NewBadge } from './EventBits'
import { DAY_END, DAY_START, dayKey, durationLabel, isDeadline, layoutDay, timeRange, useCal, useNow, type Placed } from './lib'

const pad = (n: number) => String(n).padStart(2, '0')
const HOURS = Array.from({ length: DAY_END - DAY_START }, (_, i) => DAY_START + i)

/** Week / day time grid (07:00–24:00) with a sticky day header and "Deadlines" all-day row. */
export function TimeGrid({ days, byDay, hourPx = 56, large = false }: { days: Date[]; byDay: Map<string, CalEvent[]>; hourPx?: number; large?: boolean }) {
  const cal = useCal()
  const nowD = useNow()
  const scroller = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => { scroller.current?.scrollTo({ top: hourPx * (8 - DAY_START) }) }, [hourPx])

  const cols = useMemo(() => days.map((d) => {
    const key = dayKey(d)
    const list = byDay.get(key) ?? []
    return { d, key, deadlines: list.filter(isDeadline), placed: layoutDay(list.filter((e) => !isDeadline(e))) }
  }), [days, byDay])

  const nowMin = nowD.getHours() * 60 + nowD.getMinutes()
  const nowTop = ((nowMin - DAY_START * 60) / 60) * hourPx
  const showNow = nowMin >= DAY_START * 60 && days.some((d) => sameDay(d, nowD))
  const template = { gridTemplateColumns: `64px repeat(${days.length}, minmax(0, 1fr))` }

  return (
    <div ref={scroller} className="scrollbar-thin relative h-[calc(100dvh-300px)] min-h-[520px] overflow-y-auto overscroll-contain">
      <div className="sticky top-0 z-20 bg-surface shadow-[0_1px_0_var(--color-line)]">
        <div className="grid" style={template}>
          <div />
          {cols.map((c) => {
            const today = sameDay(c.d, nowD)
            const label = (
              <>
                <span className={cn('text-[11px] font-semibold uppercase tracking-wider', today ? 'text-brand-700' : 'text-ink-3')}>{WEEKDAYS[c.d.getDay()].slice(0, 3)}</span>
                <span className={cn('grid size-7 place-items-center rounded-full text-[14px] font-bold tabular transition', today ? 'bg-brand-600 text-white shadow-glow' : 'text-ink group-hover:bg-surface')}>{c.d.getDate()}</span>
                {large && today && <span className="text-[12px] font-semibold text-brand-700">Today</span>}
              </>
            )
            return large
              ? <div key={c.key} className="flex items-center gap-2 border-l border-line px-4 py-2.5">{label}</div>
              : (
                <button key={c.key} type="button" onClick={() => cal.goDay(c.d)} aria-label={`Open ${fmtDay(c.d.toISOString())} in day view`}
                  className={cn('group flex items-center justify-center gap-2 border-l border-line py-2.5 transition-colors hover:bg-subtle/70', today && 'bg-brand-50/40')}>
                  {label}
                </button>
              )
          })}
        </div>
        <div className="grid border-t border-line bg-canvas/70" style={template}>
          <div className="py-2 pr-2.5 text-right text-[10.5px] font-semibold text-ink-3">Deadlines</div>
          {cols.map((c) => (
            <div key={c.key} className={cn('min-h-9 min-w-0 space-y-1 border-l border-line p-1', large && 'flex flex-wrap gap-1.5 space-y-0 [&>*]:w-auto [&>*]:min-w-48')}>
              {c.deadlines.map((e) => <DeadlineChip key={e.id} event={e} large={large} />)}
            </div>
          ))}
        </div>
      </div>

      <div className="relative grid" style={template}>
        <div className="relative">
          {HOURS.map((h) => (
            <div key={h} className="relative" style={{ height: hourPx }}>
              <span className={cn('absolute right-2.5 text-[10.5px] font-medium text-ink-3 tabular', h === DAY_START ? 'top-1' : '-top-2')}>{pad(h)}:00</span>
            </div>
          ))}
          {showNow && (
            <span className="absolute right-1.5 z-10 -translate-y-1/2 rounded-md bg-brand-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow-glow tabular" style={{ top: nowTop }}>
              {fmtTime(nowD.toISOString())}
            </span>
          )}
        </div>
        {cols.map((c) => {
          const today = sameDay(c.d, nowD)
          return (
            <div key={c.key} className={cn('relative min-w-0 border-l border-line', today && 'bg-brand-50/25')}>
              {HOURS.map((h) => (
                <button
                  key={h} type="button"
                  onClick={() => cal.create(fromInputs(c.key, `${pad(h)}:00`))}
                  aria-label={`Add event on ${fmtDay(c.d.toISOString())} at ${pad(h)}:00`}
                  className="group/slot flex w-full items-start justify-end border-b border-line/60 p-1 outline-none transition-colors hover:bg-brand-50/60 focus-visible:bg-brand-50"
                  style={{ height: hourPx }}
                >
                  <span className="flex items-center gap-0.5 rounded-md bg-surface px-1 py-px text-[10.5px] font-semibold text-brand-700 opacity-0 shadow-card transition-opacity group-hover/slot:opacity-100 group-focus-visible/slot:opacity-100">
                    <Plus className="size-3" />{pad(h)}:00
                  </span>
                </button>
              ))}
              {c.placed.map((p) => <TimedCard key={p.event.id} p={p} hourPx={hourPx} large={large} past={new Date(p.event.end ?? p.event.start) < nowD} />)}
              {today && showNow && (
                <div className="pointer-events-none absolute inset-x-0 z-10 flex items-center" style={{ top: nowTop }} aria-hidden>
                  <span className="-ml-[5px] size-2.5 rounded-full bg-brand-600 ring-2 ring-white" />
                  <span className="h-0.5 flex-1 bg-brand-600" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TimedCard({ p, hourPx, large, past }: { p: Placed; hourPx: number; large: boolean; past: boolean }) {
  const cal = useCal()
  const e = p.event
  const t = catTone(e)
  const h = Math.max(((p.end - p.top) / 60) * hourPx - 3, 20)
  const ids = cal.participants(e)
  const tiny = h < 38
  const roomy = h >= 64
  const dur = durationLabel(e)

  return (
    <button
      type="button" onClick={() => cal.open(e)} title={`${timeRange(e)} · ${e.title}`}
      className={cn(
        'group/ev absolute z-[2] flex overflow-hidden rounded-lg border-l-[3px] text-left transition duration-150 hover:z-[6] hover:-translate-y-px hover:opacity-100 hover:shadow-lift',
        t.soft,
        tiny ? 'items-center px-1.5' : large ? 'flex-col px-3 py-2' : 'flex-col px-2 py-1.5',
        e.isNew ? 'z-[3] ring-2 ring-brand-500 animate-highlight' : 'shadow-[0_1px_2px_rgb(23_23_59/0.06)]',
        past && !e.isNew && 'opacity-70',
      )}
      style={{
        top: ((p.top - DAY_START * 60) / 60) * hourPx + 1, height: h, borderLeftColor: t.hex,
        left: `calc(${(p.col / p.cols) * 100}% + 3px)`, width: `calc(${100 / p.cols}% - 6px)`,
      }}
    >
      {tiny ? (
        <span className="flex min-w-0 items-center gap-1 text-[11px] leading-none">
          <span className={cn('shrink-0 font-semibold tabular', t.text)}>{fmtTime(e.start)}</span>
          <span className="truncate font-semibold text-ink">{e.title}</span>
          {e.isNew && <NewBadge />}
        </span>
      ) : large ? (
        <div className="flex min-h-0 w-full flex-1 gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1.5">
              <span className="truncate text-[14px] font-bold text-ink">{e.title}</span>
              {e.isNew && <NewBadge />}
              {e.source === 'recurring' && <Repeat className="size-3.5 shrink-0 text-ink-3" aria-label="Repeats weekly" />}
            </div>
            <div className={cn('mt-0.5 truncate text-[12px] font-semibold tabular', t.text)}>
              {timeRange(e)}{dur && <span className="font-medium text-ink-3"> · {dur}</span>}
            </div>
            {roomy && (
              <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-1.5">
                <CategoryBadge category={e.category} size="xs" />
                <ClassTag event={e} />
                {e.location && p.cols === 1 && <span className="inline-flex min-w-0 items-center gap-1 text-[11.5px] text-ink-3"><MapPin className="size-3 shrink-0" /><span className="truncate">{e.location}</span></span>}
              </div>
            )}
          </div>
          {roomy && p.cols === 1 && (
            <div className="flex shrink-0 flex-col items-end justify-between gap-1">
              {e.hostId && <Avatar id={e.hostId} size="sm" tooltip />}
              {ids.length > 0 && <AvatarStack ids={ids} max={5} size="xs" />}
            </div>
          )}
        </div>
      ) : (
        <>
          <span className="flex w-full min-w-0 items-start gap-1">
            <span className={cn('min-w-0 flex-1 text-[12px] font-semibold leading-snug text-ink', h < 56 ? 'truncate' : 'line-clamp-2')}>{e.title}</span>
            {e.isNew && <NewBadge className="mt-px" />}
          </span>
          <span className={cn('mt-0.5 truncate text-[11px] font-semibold tabular', t.text)}>{timeRange(e)}</span>
          {h >= 110 && e.location && p.cols === 1 && (
            <span className="mt-0.5 flex min-w-0 items-center gap-1 text-[11px] text-ink-3"><MapPin className="size-3 shrink-0" /><span className="truncate">{e.location}</span></span>
          )}
          {h >= 76 && ids.length > 0 && <AvatarStack ids={ids} max={p.cols > 1 ? 2 : 3} size="xs" className="mt-auto pt-1" />}
        </>
      )}
    </button>
  )
}
