import { useState } from 'react'
import { LifeBuoy } from 'lucide-react'
import { Card, CardHeader } from '@/components/ui'
import { tone } from '@/lib/tones'
import { cn } from '@/lib/utils'
import { Tween, useWidth } from './charts'
import { HELP_TRENDS, PERIOD, type Range } from './data'

const H = 236
const PAD = { l: 34, r: 8, t: 22, b: 30 }
const SERIES = [
  { key: 'created', label: 'New requests', color: tone('brand').hex, dashed: false },
  { key: 'resolved', label: 'Resolved', color: tone('teal').hex, dashed: true },
] as const
type SeriesKey = (typeof SERIES)[number]['key']

const sum = (a: number[]) => a.reduce((s, v) => s + v, 0)
const LineKey = ({ color, dashed }: { color: string; dashed: boolean }) => (
  <svg width="16" height="4" aria-hidden><line x1="1" x2="15" y1="2" y2="2" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeDasharray={dashed ? '3 3' : undefined} /></svg>
)

function pointTitle(range: Range, label: string, i: number) {
  if (range === 'week') return `${label}, ${14 + i} Sep`
  if (range === 'month') return `Week of ${label}`
  return label.replace('Wk', 'Week')
}

export function HelpTrends({ range }: { range: Range }) {
  const [ref, w] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const [off, setOff] = useState<SeriesKey | null>(null)
  const data = HELP_TRENDS[range]
  const labels = PERIOD[range].points
  const n = labels.length

  const peak = Math.max(...data.created, ...data.resolved)
  const step = peak > 40 ? 20 : 5
  const top = Math.ceil((peak * 1.1) / step) * step
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step)
  const plotW = Math.max(0, w - PAD.l - PAD.r)
  const plotH = H - PAD.t - PAD.b
  const x = (i: number) => PAD.l + (plotW * (i + 0.5)) / n
  const y = (v: number) => PAD.t + plotH * (1 - v / top)
  const path = (vals: number[]) => vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')

  const totals = { created: sum(data.created), resolved: sum(data.resolved) }
  const rate = Math.round((totals.resolved / totals.created) * 100)
  const peakIdx = data.created.indexOf(Math.max(...data.created))
  const shown = SERIES.filter((s) => s.key !== off)
  const summary = `Help request trends, ${PERIOD[range].granularity.toLowerCase()}: ${labels.map((l, i) => `${l} ${data.created[i]} new and ${data.resolved[i]} resolved`).join('; ')}.`

  return (
    <Card className="flex flex-col">
      <CardHeader icon={LifeBuoy} tone="teal" title="Help request trends" subtitle={`${PERIOD[range].granularity} new vs resolved · ${PERIOD[range].span}`} />
      <div className="flex flex-wrap items-center gap-2 px-5 pt-4">
        {SERIES.map((s) => {
          const on = off !== s.key
          return (
            <button
              key={s.key} type="button" aria-pressed={on} onClick={() => setOff(on ? s.key : null)}
              title={on ? `Hide ${s.label.toLowerCase()}` : `Show ${s.label.toLowerCase()}`}
              className={cn(
                'inline-flex h-8 items-center gap-2 rounded-lg border px-2.5 transition duration-150 active:scale-[0.97]',
                on ? 'border-line bg-surface hover:border-line-strong hover:bg-subtle/60' : 'border-dashed border-line-strong bg-subtle/60 opacity-55 hover:opacity-90',
              )}
            >
              <LineKey color={s.color} dashed={s.dashed} />
              <span className="text-xs font-medium text-ink-2">{s.label}</span>
              <span className="text-[13px] font-bold text-ink tabular"><Tween value={totals[s.key]} /></span>
            </button>
          )
        })}
        <span className="ml-auto text-xs text-ink-3"><span className="font-bold text-ink tabular">{rate}%</span> resolution rate</span>
      </div>

      <div className="flex-1 px-5 pb-4 pt-2">
        <div ref={ref} className="relative" style={{ height: H }} role="group" aria-label={summary}>
          {w > 0 && (
            <>
              <svg width={w} height={H} className="absolute inset-0 overflow-visible" aria-hidden>
                <defs>
                  <linearGradient id="an-help-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={SERIES[0].color} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={SERIES[0].color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                {ticks.map((t) => (
                  <g key={t}>
                    <line x1={PAD.l} x2={w - PAD.r} y1={y(t)} y2={y(t)} strokeWidth={1} className={t === 0 ? 'stroke-line-strong' : 'stroke-line'} />
                    <text x={PAD.l - 10} y={y(t)} dy="0.35em" textAnchor="end" className="fill-ink-3 text-[11px] tabular">{t}</text>
                  </g>
                ))}
                {hover != null && <line x1={x(hover)} x2={x(hover)} y1={PAD.t - 6} y2={PAD.t + plotH} strokeWidth={1} className="stroke-line-strong" />}
                <g key={`${range}-${off}`} className="an-reveal">
                  {off !== 'created' && <path d={`${path(data.created)} L${x(n - 1)},${y(0)} L${x(0)},${y(0)} Z`} fill="url(#an-help-area)" />}
                  {shown.map((s) => (
                    <path key={s.key} d={path(data[s.key])} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={s.dashed ? '6 5' : undefined} />
                  ))}
                  {shown.map((s) => data[s.key].map((v, i) => (
                    <circle key={s.key + i} cx={x(i)} cy={y(v)} r={hover === i ? 6 : 4.5} fill={s.color} stroke="#fff" strokeWidth={2} className="transition-[r] duration-150" />
                  )))}
                </g>
                {off !== 'created' && hover == null && (
                  <text x={x(peakIdx)} y={y(data.created[peakIdx]) - 13} textAnchor="middle" className="text-[11.5px]">
                    <tspan className="fill-ink font-bold tabular">{data.created[peakIdx]}</tspan>
                    <tspan dx="4" className="fill-ink-3">peak</tspan>
                  </text>
                )}
              </svg>

              {labels.map((l, i) => (
                <span key={l} className={cn('absolute -translate-x-1/2 whitespace-nowrap text-[11.5px] tabular transition-colors', hover === i ? 'font-semibold text-ink' : 'font-medium text-ink-3')} style={{ left: x(i), top: H - PAD.b + 10 }}>{l}</span>
              ))}

              {labels.map((l, i) => (
                <button
                  key={l} type="button" aria-label={`${pointTitle(range, l, i)}: ${data.created[i]} new, ${data.resolved[i]} resolved`}
                  className="absolute rounded-lg"
                  style={{ left: x(i) - plotW / n / 2, width: plotW / n, top: PAD.t - 8, height: plotH + 8 }}
                  onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)}
                />
              ))}

              {hover != null && (
                <div
                  role="status"
                  className="pointer-events-none absolute z-10 w-44 rounded-xl border border-line bg-surface px-3 py-2.5 shadow-pop animate-fade-in"
                  style={{ top: PAD.t, left: x(hover), transform: x(hover) > w * 0.6 ? 'translateX(calc(-100% - 14px))' : 'translateX(14px)' }}
                >
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">{pointTitle(range, labels[hover], hover)}</div>
                  {SERIES.map((s) => (
                    <div key={s.key} className={cn('mt-1.5 flex items-center gap-2', s.key === off && 'opacity-40')}>
                      <LineKey color={s.color} dashed={s.dashed} />
                      <span className="w-6 text-[15px] font-bold text-ink tabular">{data[s.key][hover]}</span>
                      <span className="text-xs text-ink-3">{s.label}</span>
                    </div>
                  ))}
                  <div className="mt-2 border-t border-line pt-1.5 text-[11.5px] text-ink-3">
                    {(() => {
                      const net = data.created[hover] - data.resolved[hover]
                      return net > 0 ? `+${net} added to the queue` : net < 0 ? `${-net} cleared from the queue` : 'Queue unchanged'
                    })()}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  )
}
