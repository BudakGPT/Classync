import { createContext, useContext, useEffect, useState } from 'react'
import { addDays, fmtDate, fmtTime, now, sameDay, startOfDay, toDateInput, WEEKDAYS } from '@/lib/time'
import type { CalEvent, ClassId, ClassRoom, Group } from '@/lib/types'

export type View = 'month' | 'week' | 'day' | 'agenda'
export type ClassFilter = ClassId | 'all'

export const DAY_START = 7 // grid starts 07:00
export const DAY_END = 24
export const POINT_MIN = 45 // events without an end render as 45 min blocks

const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** 'YYYY-MM-DD' in local time. */
export const dayKey = (d: Date | string) => toDateInput(typeof d === 'string' ? d : d.toISOString())

export function parseDateParam(v: string | null): Date {
  const m = v?.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : startOfDay(now())
}

export const startOfWeek = (d: Date) => { const s = startOfDay(d); return addDays(s, -((s.getDay() + 6) % 7)) }

export function viewRange(view: View, anchor: Date): { start: Date; days: Date[] } {
  const start = view === 'month' ? startOfWeek(new Date(anchor.getFullYear(), anchor.getMonth(), 1)) : view === 'day' ? startOfDay(anchor) : startOfWeek(anchor)
  const n = view === 'month' ? 42 : view === 'week' ? 7 : view === 'day' ? 1 : 14
  return { start, days: Array.from({ length: n }, (_, i) => addDays(start, i)) }
}

export function shiftAnchor(view: View, anchor: Date, dir: 1 | -1): Date {
  if (view === 'month') return new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1)
  return addDays(anchor, dir * (view === 'week' ? 7 : view === 'day' ? 1 : 14))
}

const noYear = (d: Date) => fmtDate(d.toISOString()).replace(/ \d{4}$/, '')
export function rangeLabel(view: View, anchor: Date): string {
  if (view === 'month') return `${MONTHS_LONG[anchor.getMonth()]} ${anchor.getFullYear()}`
  if (view === 'day') return `${WEEKDAYS[anchor.getDay()]}, ${anchor.getDate()} ${MONTHS_LONG[anchor.getMonth()]} ${anchor.getFullYear()}`
  const { days } = viewRange(view, anchor)
  const a = days[0], b = days[days.length - 1]
  return `${a.getMonth() === b.getMonth() ? a.getDate() : noYear(a)} – ${fmtDate(b.toISOString())}`
}

export const minutesOf = (iso: string) => { const d = new Date(iso); return d.getHours() * 60 + d.getMinutes() }

/** Deadlines live in the all-day row: due at 23:59, or a point event too late to fit the grid. */
export const isDeadline = (e: CalEvent) => fmtTime(e.start) === '23:59' || (!e.end && minutesOf(e.start) >= 23 * 60)

export function endMinutes(e: CalEvent) {
  const s = minutesOf(e.start)
  if (!e.end) return s + POINT_MIN
  return sameDay(e.start, e.end) ? Math.max(minutesOf(e.end), s + 15) : DAY_END * 60
}

export function timeRange(e: CalEvent) {
  if (isDeadline(e)) return `Due ${fmtTime(e.start)}`
  return e.end ? `${fmtTime(e.start)} – ${fmtTime(e.end)}` : fmtTime(e.start)
}

export function durationLabel(e: CalEvent) {
  if (!e.end) return null
  const m = Math.round((new Date(e.end).getTime() - new Date(e.start).getTime()) / 60_000)
  const h = Math.floor(m / 60)
  return h ? `${h}h${m % 60 ? ` ${m % 60}m` : ''}` : `${m}m`
}

export function matchesClass(e: CalEvent, cls: ClassFilter, groups: Map<string, Group>) {
  if (cls === 'all') return true
  if (e.classId) return e.classId === cls
  const g = e.groupId ? groups.get(e.groupId) : undefined
  return g ? g.classIds.includes(cls) : true // faculty-wide events show under every class
}

/** New events first (so the demo's auto-added items are never hidden behind "+N more"), then chronological. */
export const byStart = (a: CalEvent, b: CalEvent) => Number(!!b.isNew) - Number(!!a.isNew) || a.start.localeCompare(b.start)

export interface Placed { event: CalEvent; top: number; end: number; col: number; cols: number }

/** Side-by-side layout for overlapping timed events of one day (minutes clamped to the grid). */
export function layoutDay(events: CalEvent[]): Placed[] {
  const items = events
    .map((event) => ({ event, top: Math.max(minutesOf(event.start), DAY_START * 60), end: Math.min(endMinutes(event), DAY_END * 60), col: 0, cols: 1 }))
    .sort((a, b) => a.top - b.top || b.end - a.end)
  const out: Placed[] = []
  let cluster: Placed[] = []
  let clusterEnd = -1
  const flush = () => {
    const colEnds: number[] = []
    for (const it of cluster) {
      let c = colEnds.findIndex((end) => end <= it.top)
      if (c < 0) { c = colEnds.length; colEnds.push(0) }
      colEnds[c] = it.end
      it.col = c
    }
    for (const it of cluster) out.push({ ...it, cols: colEnds.length })
    cluster = []
  }
  for (const it of items) {
    if (cluster.length && it.top >= clusterEnd) flush()
    cluster.push(it)
    clusterEnd = cluster.length === 1 ? it.end : Math.max(clusterEnd, it.end)
  }
  if (cluster.length) flush()
  return out
}

// ── page context (avoids threading the same callbacks through every view) ──
export interface CalApi {
  participants: (e: CalEvent) => string[]
  classOf: (id?: ClassId) => ClassRoom | undefined
  groupOf: (id?: string) => Group | undefined
  open: (e: CalEvent) => void
  /** date 'YYYY-MM-DD' or ISO datetime for a clicked slot */
  create: (date: string) => void
  goDay: (d: Date) => void
}
export const CalCtx = createContext<CalApi | null>(null)
export const useCal = () => useContext(CalCtx)!

/** Demo clock that re-renders every 30 s (current-time line, relative labels). */
export function useNow() {
  const [t, setT] = useState(now)
  useEffect(() => { const i = setInterval(() => setT(now()), 30_000); return () => clearInterval(i) }, [])
  return t
}
