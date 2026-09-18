// Demo clock: the app pretends "now" is Tue 15 Sep 2026, 10:41 and ticks forward in real time from load.
const DEMO_START = new Date(2026, 8, 15, 10, 41).getTime()
const LOADED_AT = Date.now()

export const now = () => new Date(DEMO_START + (Date.now() - LOADED_AT))
export const nowIso = () => now().toISOString()

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

/** ISO for a local datetime relative to the demo day. at(1, '23:59') → tomorrow 23:59. */
export function at(dayOffset: number, hhmm = '09:00'): string {
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date(DEMO_START)
  d.setDate(d.getDate() + dayOffset)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

/** ISO for minutes before the demo start (for seeded activity). */
export const ago = (minutes: number) => new Date(DEMO_START - minutes * MIN).toISOString()

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, d.getHours(), d.getMinutes())
export const sameDay = (a: Date | string, b: Date | string) => startOfDay(new Date(a)).getTime() === startOfDay(new Date(b)).getTime()
const dayDiff = (iso: string) => Math.round((startOfDay(new Date(iso)).getTime() - startOfDay(now()).getTime()) / DAY)

const pad = (n: number) => String(n).padStart(2, '0')
export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/** '10:00' */
export const fmtTime = (iso: string) => { const d = new Date(iso); return `${pad(d.getHours())}:${pad(d.getMinutes())}` }
/** '16 Sep 2026' */
export const fmtDate = (iso: string) => { const d = new Date(iso); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` }
/** '16 September 2026, 23:59' */
export const fmtLong = (iso: string) => { const d = new Date(iso); return `${d.getDate()} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}, ${fmtTime(iso)}` }
/** 'Wed, 16 Sep' */
export const fmtDay = (iso: string) => { const d = new Date(iso); return `${WEEKDAYS[d.getDay()].slice(0, 3)}, ${d.getDate()} ${MONTHS[d.getMonth()]}` }
/** 'September 2026' */
export const fmtMonth = (d: Date) => `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`
export const weekday = (iso: string) => WEEKDAYS[new Date(iso).getDay()]
/** value for <input type="date"> / <input type="time"> */
export const toDateInput = (iso: string) => { const d = new Date(iso); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }
export const fromInputs = (date: string, time = '09:00') => new Date(`${date}T${time}:00`).toISOString()

/** '12 min ago', '3 h ago', 'Yesterday, 14:10', '12 Sep' */
export function relTime(iso: string): string {
  const diff = now().getTime() - new Date(iso).getTime()
  if (diff < 0) return dueLabel(iso)
  if (diff < MIN) return 'Just now'
  if (diff < HOUR) return `${Math.floor(diff / MIN)} min ago`
  const dd = dayDiff(iso)
  if (dd === 0) return `${Math.floor(diff / HOUR)} h ago`
  if (dd === -1) return `Yesterday, ${fmtTime(iso)}`
  if (dd > -7) return `${WEEKDAYS[new Date(iso).getDay()]}, ${fmtTime(iso)}`
  return fmtDate(iso)
}

/** Future-facing label: 'Today, 15:30', 'Tomorrow, 23:59', 'Friday, 13:00', '2 Oct, 10:00', 'Overdue' */
export function dueLabel(iso: string): string {
  const dd = dayDiff(iso)
  const t = fmtTime(iso)
  if (new Date(iso).getTime() < now().getTime()) return dd === 0 ? `Today, ${t} (passed)` : 'Overdue'
  if (dd === 0) return `Today, ${t}`
  if (dd === 1) return `Tomorrow, ${t}`
  if (dd < 7) return `${WEEKDAYS[new Date(iso).getDay()]}, ${t}`
  return `${fmtDay(iso)}, ${t}`
}

/** '2 days left', '14 h left', '35 min left' */
export function timeLeft(iso: string): string {
  const diff = new Date(iso).getTime() - now().getTime()
  if (diff <= 0) return 'Due'
  if (diff < HOUR) return `${Math.ceil(diff / MIN)} min left`
  if (diff < DAY) return `${Math.floor(diff / HOUR)} h left`
  const d = Math.floor(diff / DAY)
  return `${d} day${d > 1 ? 's' : ''} left`
}

export type Urgency = 'overdue' | 'urgent' | 'soon' | 'later'
/** overdue: past · urgent: < 48h · soon: < 4 days · later */
export function urgency(iso: string): Urgency {
  const diff = new Date(iso).getTime() - now().getTime()
  if (diff < 0) return 'overdue'
  if (diff < 48 * HOUR) return 'urgent'
  if (diff < 4 * DAY) return 'soon'
  return 'later'
}

export function greeting(): string {
  const h = now().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}
