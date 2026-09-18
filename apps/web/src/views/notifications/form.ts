import { at, fmtTime, now, toDateInput } from '@/lib/time'
import type { Audience, Category, Delivery, NotificationItem, NotificationStatus, ScheduleMode, Weekday } from '@/lib/types'
import { uid } from '@/lib/utils'
import type { NotificationDraft } from '@/store/actions'
import { DEADLINE_CATEGORIES, DEFAULT_DESC, nextOccurrence } from './lib'

export interface FormState {
  title: string
  description: string
  category: Category
  audience: Audience
  mode: ScheduleMode
  sendDate: string
  sendTime: string
  repeatDay: Weekday
  repeatTime: string
  extras: { id: string; date: string; time: string }[]
  deadlineDate: string
  deadlineTime: string
  reminders: string[]
  delivery: Delivery
}

/** ISO from <input type=date/time> values, or undefined when incomplete. */
export function isoFrom(date: string, time: string) {
  if (!date || !time) return undefined
  const d = new Date(`${date}T${time}:00`)
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
}

export function initialForm(p: Partial<NotificationItem> = {}): FormState {
  const n = now()
  const nextHour = new Date(n.getFullYear(), n.getMonth(), n.getDate(), n.getHours() + 1, 0).toISOString()
  const category = p.category ?? 'Assignment'
  const sendAt = p.mode === 'scheduled' && p.sendAt && new Date(p.sendAt) > n ? p.sendAt : nextHour
  const deadline = p.deadline ?? at(1, '23:59')
  return {
    title: p.title ?? '',
    description: p.description ?? '',
    category,
    audience: p.audience ?? { type: 'class', classIds: ['B'], groupIds: [], studentIds: [] },
    mode: p.mode ?? (category === 'Lecture' ? 'recurring' : 'scheduled'),
    sendDate: toDateInput(sendAt),
    sendTime: fmtTime(sendAt),
    repeatDay: p.repeat?.day ?? 'Tuesday',
    repeatTime: p.repeat?.time ?? '10:00',
    extras: (p.extras ?? []).map((x) => ({ id: uid('x'), date: toDateInput(x), time: fmtTime(x) })),
    deadlineDate: toDateInput(deadline),
    deadlineTime: fmtTime(deadline),
    reminders: p.reminders ?? ['1 day before', '6 hours before', '1 hour before'],
    delivery: p.delivery ?? { announcement: true, dm: true, dashboard: true },
  }
}

export const needsDeadline = (c: Category) => DEADLINE_CATEGORIES.includes(c)

export function toDraft(f: FormState, status?: NotificationStatus): NotificationDraft {
  return {
    title: f.title.trim(),
    description: f.description.trim() || DEFAULT_DESC[f.category],
    category: f.category,
    audience: f.audience,
    mode: f.mode,
    sendAt: f.mode === 'scheduled' ? isoFrom(f.sendDate, f.sendTime) : undefined,
    repeat: f.mode === 'recurring' ? { day: f.repeatDay, time: f.repeatTime } : undefined,
    extras: f.category === 'Lecture' ? f.extras.map((x) => isoFrom(x.date, x.time)).filter((x): x is string => !!x) : [],
    deadline: needsDeadline(f.category) ? isoFrom(f.deadlineDate, f.deadlineTime) : undefined,
    reminders: f.reminders,
    delivery: f.delivery,
    status,
  }
}

/** Mirrors how actions.scheduleNotification creates calendar events. */
export function estimateEvents(d: NotificationDraft) {
  return (d.mode === 'recurring' && d.repeat ? 6 : 0) + d.extras.length + (d.deadline || (d.mode === 'scheduled' && d.sendAt) ? 1 : 0)
}

export type FormErrors = Partial<Record<'title' | 'audience' | 'sendAt' | 'repeat' | 'deadline' | 'delivery', string>>

export function validate(f: FormState, d: NotificationDraft, reach: number): FormErrors {
  const e: FormErrors = {}
  if (!d.title) e.title = 'Add a title so students know what this is about.'
  if (!reach) e.audience = 'Choose at least one recipient.'
  if (f.mode === 'scheduled' && (!d.sendAt || new Date(d.sendAt) <= now())) e.sendAt = 'Pick a send time in the future.'
  if (f.mode === 'recurring' && !nextOccurrence(f.repeatDay, f.repeatTime)) e.repeat = 'Pick a time for the weekly send.'
  if (needsDeadline(f.category) && !d.deadline) e.deadline = 'Set a deadline date and time.'
  if (!f.delivery.announcement && !f.delivery.dm && !f.delivery.dashboard) e.delivery = 'Turn on at least one delivery channel.'
  return e
}
