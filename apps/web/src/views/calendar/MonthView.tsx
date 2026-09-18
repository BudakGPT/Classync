import { Plus } from 'lucide-react'
import { Button, Popover } from '@/components/ui'
import { fmtDay, sameDay } from '@/lib/time'
import type { CalEvent } from '@/lib/types'
import { cn, plural } from '@/lib/utils'
import { EventPill } from './EventBits'
import { dayKey, useCal, useNow } from './lib'

const WEEK_HEAD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MAX = 3

export function MonthView({ anchor, days, byDay }: { anchor: Date; days: Date[]; byDay: Map<string, CalEvent[]> }) {
  const cal = useCal()
  const nowD = useNow()
  return (
    <div>
      <div className="grid grid-cols-7 border-b border-line bg-canvas/60">
        {WEEK_HEAD.map((d) => <div key={d} className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-3">{d}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d, i) => {
          const key = dayKey(d)
          const list = byDay.get(key) ?? []
          const inMonth = d.getMonth() === anchor.getMonth()
          const today = sameDay(d, nowD)
          const shown = list.length > MAX ? list.slice(0, MAX - 1) : list
          const extra = list.length - shown.length
          const label = fmtDay(d.toISOString())
          return (
            <div key={key} className={cn('group/cell relative min-h-[122px] border-line p-1.5', i % 7 !== 6 && 'border-r', i < 35 && 'border-b', !inMonth && 'bg-canvas/70')}>
              <button type="button" onClick={() => cal.create(key)} aria-label={`Add event on ${label}`}
                className="absolute inset-0 z-0 transition-colors hover:bg-brand-50/50 focus-visible:outline-offset-[-2px]" />
              <div className="pointer-events-none relative z-[1] mb-1 flex items-center justify-between pl-0.5 pr-1">
                <button type="button" onClick={() => cal.goDay(d)} aria-label={`Open ${label} in day view`}
                  className={cn('pointer-events-auto grid size-6 place-items-center rounded-full text-[12.5px] font-bold tabular transition',
                    today ? 'bg-brand-600 text-white shadow-glow' : inMonth ? 'text-ink hover:bg-subtle' : 'text-ink-3/70 hover:bg-subtle')}>
                  {d.getDate()}
                </button>
                <Plus className="size-3.5 text-brand-600 opacity-0 transition-opacity group-hover/cell:opacity-100" aria-hidden />
              </div>
              <div className={cn('pointer-events-none relative z-[1] space-y-1', !inMonth && 'opacity-60')}>
                {shown.map((e) => <div key={e.id} className="pointer-events-auto"><EventPill event={e} /></div>)}
                {extra > 0 && (
                  <div className="pointer-events-auto">
                    <Popover align="start" width={290} trigger={
                      <button type="button" className="rounded-md px-1.5 py-0.5 text-[11.5px] font-semibold text-ink-3 transition hover:bg-subtle hover:text-ink">+{extra} more</button>
                    }>
                      {(close) => (
                        <div className="p-1.5">
                          <div className="flex items-center justify-between gap-2 px-1 pb-2">
                            <div>
                              <div className="text-[13px] font-bold text-ink">{label}</div>
                              <div className="text-[11.5px] text-ink-3">{plural(list.length, 'event')}</div>
                            </div>
                            <Button size="xs" variant="soft" icon={Plus} onClick={() => { close(); cal.create(key) }}>Add</Button>
                          </div>
                          <div className="scrollbar-thin max-h-72 space-y-1 overflow-y-auto">
                            {list.map((e) => <EventPill key={e.id} event={e} onOpen={(ev) => { close(); cal.open(ev) }} />)}
                          </div>
                        </div>
                      )}
                    </Popover>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
