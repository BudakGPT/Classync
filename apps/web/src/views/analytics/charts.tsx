// Small chart primitives shared by the analytics sections (pure SVG/CSS).
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Flips true a tick after mount so CSS transitions animate from 0. */
export function useMounted() {
  const [ready, setReady] = useState(false)
  useEffect(() => { const t = setTimeout(() => setReady(true), 40); return () => clearTimeout(t) }, [])
  return ready
}

/** Eases from the previous value to `value` (count-up on mount, tween on range change). */
export function useTween(value: number, ms = 700) {
  const [v, setV] = useState(0)
  const from = useRef(0)
  useEffect(() => {
    const start = performance.now()
    const a = from.current
    let raf = 0
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / ms)
      const cur = a + (value - a) * (1 - Math.pow(1 - k, 3))
      from.current = cur
      setV(cur)
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, ms])
  return v
}

export function Tween({ value, suffix = '' }: { value: number; suffix?: string }) {
  return <>{Math.round(useTween(value)).toLocaleString('en-US')}{suffix}</>
}

/** Container width via ResizeObserver, for SVG charts drawn in real pixels. */
export function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [w, setW] = useState(0)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    setW(el.getBoundingClientRect().width)
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w] as const
}

/** Signed change chip. Color = direction × whether up is good. */
export function Delta({ value, unit = '%', goodWhenUp = true, className }: { value: number; unit?: string; goodWhenUp?: boolean; className?: string }) {
  const flat = value === 0
  const up = value > 0
  const good = up === goodWhenUp
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold tabular',
        flat ? 'bg-subtle text-ink-3' : good ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700',
        className,
      )}
      aria-label={flat ? 'no change' : `${up ? 'up' : 'down'} ${Math.abs(value)}${unit}`}
    >
      <Icon className="size-3" strokeWidth={2.5} />{Math.abs(value)}{unit}
    </span>
  )
}

/** Stretchy sparkline: line + soft area wash + end dot. Re-key it to replay the reveal. */
export function Sparkline({ values, color, height = 40, className }: { values: number[]; color: string; height?: number; className?: string }) {
  const gid = `spark-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const lo = Math.min(...values), hi = Math.max(...values)
  const span = hi - lo || 1
  const pts = values.map((v, i) => [values.length === 1 ? 50 : (i / (values.length - 1)) * 100, 90 - ((v - lo) / span) * 76] as const)
  const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' ')
  const [ex, ey] = pts[pts.length - 1]
  return (
    <div className={cn('relative', className)} style={{ height }} aria-hidden>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="an-reveal absolute inset-0 size-full overflow-visible">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.2} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={`${line} L100,100 L0,100 Z`} fill={`url(#${gid})`} />
        <path d={line} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <span className="an-pop absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white" style={{ left: `${ex}%`, top: `${ey}%`, background: color, animationDelay: '700ms' }} />
    </div>
  )
}
