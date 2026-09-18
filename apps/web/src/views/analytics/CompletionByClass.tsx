import { ArrowUpRight, ClipboardCheck } from 'lucide-react'
import { Avatar, Button, Card, CardHeader, Tooltip } from '@/components/ui'
import { navigate } from '@/lib/router'
import { shortName, studentsIn } from '@/lib/selectors'
import { tone } from '@/lib/tones'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'
import { Delta, Tween, useMounted } from './charts'
import { CLASS_IDS, COMPLETION, COMPLETION_TARGET, PERIOD, type Range } from './data'

const TICKS = [0, 25, 50, 75, 100]

export function CompletionByClass({ range }: { range: Range }) {
  const { data, person } = useStore()
  const ready = useMounted()
  const rows = CLASS_IDS.flatMap((id) => {
    const c = data.classes.find((x) => x.id === id)
    if (!c) return []
    const size = studentsIn(data.people, id).length
    const { pct, delta } = COMPLETION[range][id]
    return [{ c, pct, delta, size, done: Math.round((pct / 100) * size), lecturer: person(c.lecturerId) }]
  })
  const avg = Math.round(rows.reduce((s, r) => s + r.pct, 0) / (rows.length || 1))
  const above = rows.filter((r) => r.pct >= COMPLETION_TARGET).length
  const summary = `Task completion by class: ${rows.map((r) => `${r.c.name} ${r.pct}%`).join(', ')}. Target ${COMPLETION_TARGET}%.`

  return (
    <Card className="flex flex-col">
      <CardHeader
        icon={ClipboardCheck} tone="brand" title="Task completion by class" subtitle={`Share of assigned tasks marked done · ${PERIOD[range].span}`}
        action={<Button variant="ghost" size="xs" iconRight={ArrowUpRight} onClick={() => navigate('/assignments')}>Assignments</Button>}
      />
      <div className="flex flex-1 flex-col px-5 pb-5 pt-2" role="group" aria-label={summary}>
        {/* plot */}
        <div className="relative mt-6 h-48">
          {TICKS.map((t) => (
            <div key={t} className="absolute inset-x-0 flex items-center" style={{ bottom: `${t}%` }} aria-hidden>
              <span className="w-8 -translate-y-px pr-2 text-right text-[11px] text-ink-3 tabular">{t}</span>
              <span className={cn('h-px flex-1', t === 0 ? 'bg-line-strong' : 'bg-line')} />
            </div>
          ))}
          <div className="absolute inset-x-0 left-8 flex items-center" style={{ bottom: `${COMPLETION_TARGET}%` }} aria-hidden>
            <span className="h-0 flex-1 border-t border-dashed border-ink-3/50" />
          </div>
          <div className="absolute inset-y-0 left-8 right-0 flex">
            {rows.map((r, i) => (
              <Tooltip
                key={r.c.id} className="group relative flex h-full flex-1 justify-center"
                content={
                  <span className="block py-0.5">
                    <span className="block font-bold">{r.c.name} · {r.pct}% complete</span>
                    <span className="block text-white/70">{r.done} of {r.size} students · {r.delta > 0 ? '+' : ''}{r.delta}% {PERIOD[range].vs}</span>
                  </span>
                }
              >
                <button
                  type="button" onClick={() => navigate(`/classes/${r.c.id}`)}
                  aria-label={`${r.c.name}, ${r.c.subject}: ${r.pct}% complete, ${r.done} of ${r.size} students. Open class.`}
                  className="absolute inset-x-1.5 -top-6 bottom-0 rounded-xl transition-colors group-hover:bg-subtle/70"
                />
                <div
                  className={cn('pointer-events-none absolute bottom-0 w-9 rounded-t-md transition-[height,filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:brightness-110', tone(r.c.tone).solid)}
                  style={{ height: ready ? `${r.pct}%` : '0%', transitionDelay: `${i * 70}ms` }}
                >
                  <span className="absolute inset-x-0 -top-6 text-center text-[13px] font-bold text-ink tabular"><Tween value={r.pct} suffix="%" /></span>
                </div>
              </Tooltip>
            ))}
          </div>
        </div>
        {/* x axis */}
        <div className="ml-8 mt-3 flex">
          {rows.map((r) => (
            <div key={r.c.id} className="flex min-w-0 flex-1 flex-col items-center gap-1 px-1 text-center">
              <span className="flex items-center gap-1.5">
                <span className="text-[13px] font-semibold text-ink">{r.c.name}</span>
                <Delta value={r.delta} className="px-1 py-0 text-[10.5px]" />
              </span>
              <span className="flex min-w-0 items-center gap-1.5 text-[11.5px] text-ink-3">
                <Avatar id={r.c.lecturerId} size="xs" tooltip />
                <span className="truncate">{shortName(r.lecturer)}</span>
              </span>
            </div>
          ))}
        </div>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3 text-xs text-ink-3">
          <span>Average <span className="font-bold text-ink tabular">{avg}%</span> · {above} of {rows.length} classes at target</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-4 border-t border-dashed border-ink-3" aria-hidden />Target {COMPLETION_TARGET}%</span>
        </div>
      </div>
    </Card>
  )
}
