import { useMemo, useState } from 'react'
import { MessagesSquare, Unplug } from 'lucide-react'
import { Card, CardHeader, EmptyState, Segmented, Tooltip } from '@/components/ui'
import { navigate } from '@/lib/router'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'
import { Tween } from './charts'
import { CLASS_IDS, CLASS_SHARE, HEAT_DAYS, HEAT_SLOTS, PERIOD, heatmap, type AnalyticsClassId, type Range } from './data'

type Filter = 'all' | AnalyticsClassId
const LEVELS = ['bg-brand-50', 'bg-brand-100', 'bg-brand-200', 'bg-brand-400', 'bg-brand-600']
const DAY_LONG = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday' }
const slotEnd = (s: string) => String(Number(s) + 2).padStart(2, '0')

export function EngagementHeatmap({ range }: { range: Range }) {
  const { data } = useStore()
  const [filter, setFilter] = useState<Filter>('all')
  const connected = (id: AnalyticsClassId) => !!data.classes.find((c) => c.id === id)?.discord.connected
  const connectedIds = CLASS_IDS.filter(connected)
  const share = filter === 'all' ? connectedIds.reduce((s, id) => s + CLASS_SHARE[id], 0) : connected(filter) ? CLASS_SHARE[filter] : 0
  const grid = useMemo(() => heatmap(range, share), [range, share])
  const flat = grid.flat()
  const max = Math.max(1, ...flat)
  const total = flat.reduce((s, v) => s + v, 0)
  const peakAt = flat.indexOf(max)
  const peak = { day: HEAT_DAYS[Math.floor(peakAt / HEAT_SLOTS.length)], slot: HEAT_SLOTS[peakAt % HEAT_SLOTS.length] }
  const empty = filter !== 'all' && !connected(filter)
  const scope = filter === 'all' ? `${connectedIds.length} connected classes` : `Class ${filter}`

  return (
    <Card className="flex flex-col">
      <CardHeader
        icon={MessagesSquare} tone="violet" title="Discord engagement" subtitle={`Messages by weekday and time · ${range === 'week' ? PERIOD.week.span : 'average week'}`}
        action={
          <Segmented<Filter>
            size="sm" aria-label="Filter heatmap by class" value={filter} onChange={setFilter}
            options={[{ value: 'all', label: 'All' }, ...CLASS_IDS.map((id) => ({ value: id, label: id }))]}
          />
        }
      />
      {empty ? (
        <EmptyState
          compact className="flex-1 justify-center" icon={Unplug} tone="orange" characters={['citra', 'yusuf', 'bagus']}
          title={`Class ${filter} isn't on Discord yet`}
          description="Connect the class to the Fasilkom Academic Hub to measure chat engagement. Attendance is still tracked below."
          action={{ label: `Connect Class ${filter}`, onClick: () => navigate(`/classes/${filter}`) }}
        />
      ) : (
        <>
          <div className="flex-1 px-5 pb-4 pt-4" role="group" aria-label={`Discord messages heatmap for ${scope}. Busiest slot ${DAY_LONG[peak.day]} ${peak.slot}:00 to ${slotEnd(peak.slot)}:00 with ${max} messages; ${total} messages in total.`}>
            <div className="grid grid-cols-[34px_repeat(7,minmax(0,1fr))] gap-1.5" aria-hidden>
              <span />
              {HEAT_SLOTS.map((s) => <span key={s} className="pb-0.5 text-center text-[11px] font-medium text-ink-3 tabular">{s}:00</span>)}
              {HEAT_DAYS.map((d, r) => (
                <div key={d} className="contents">
                  <span className="self-center text-[11.5px] font-semibold text-ink-2">{d}</span>
                  {grid[r].map((v, c) => {
                    const level = Math.min(LEVELS.length - 1, Math.floor((v / max) * LEVELS.length))
                    const isPeak = r * HEAT_SLOTS.length + c === peakAt
                    return (
                      <Tooltip key={c} className="block" content={<span><span className="font-bold tabular">{v} messages</span><span className="text-white/70"> · {DAY_LONG[d]} {HEAT_SLOTS[c]}:00–{slotEnd(HEAT_SLOTS[c])}:00</span></span>}>
                        <span
                          className={cn(
                            'grid h-9 place-items-center rounded-md text-[11px] font-bold text-white tabular transition-[background-color,box-shadow,transform] duration-500 hover:z-10 hover:scale-105 hover:shadow-[0_0_0_2px_#fff,0_0_0_4px_var(--color-brand-300)]',
                            LEVELS[level],
                          )}
                        >
                          {isPeak ? v : null}
                        </span>
                      </Tooltip>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3 text-xs text-ink-3">
            <span>Busiest <span className="font-semibold text-ink-2">{DAY_LONG[peak.day]} {peak.slot}:00–{slotEnd(peak.slot)}:00</span> · <span className="font-semibold text-ink-2 tabular"><Tween value={total} /></span> messages</span>
            <span className="inline-flex items-center gap-1.5" aria-hidden>
              Less
              {LEVELS.map((l) => <span key={l} className={cn('size-3 rounded-[4px]', l)} />)}
              More
            </span>
          </div>
        </>
      )}
    </Card>
  )
}
