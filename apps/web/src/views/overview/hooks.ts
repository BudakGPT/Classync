import { useEffect, useRef, useState } from 'react'

/** Re-render every `ms` so relative times / "live now" states stay fresh. */
export function useTick(ms = 30_000) {
  const [, setN] = useState(0)
  useEffect(() => {
    const i = setInterval(() => setN((n) => n + 1), ms)
    return () => clearInterval(i)
  }, [ms])
}

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Eased count-up from the previous value to `value`. */
export function useCountUp(value: number, ms = 800) {
  const [v, setV] = useState(() => (reduced() ? value : 0))
  const from = useRef(reduced() ? value : 0)
  useEffect(() => {
    if (reduced()) { setV(value); from.current = value; return }
    const start = performance.now()
    const a = from.current
    let raf = 0
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / ms)
      setV(Math.round(a + (value - a) * (1 - Math.pow(1 - p, 3))))
      if (p < 1) raf = requestAnimationFrame(step)
      else from.current = value
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value, ms])
  return v
}
