import { useState } from 'react'
import { audienceIds, audienceLabel } from '@/lib/selectors'
import { addDays, dueLabel, fmtDay, now, nowIso, relTime, sameDay, WEEKDAYS } from '@/lib/time'
import type { Category, Delivery, NotificationItem, NotificationStatus, Weekday } from '@/lib/types'
import { plural, uid, wait } from '@/lib/utils'
import { useStore } from '@/store/store'

export type Tab = 'all' | 'scheduled' | 'sent' | 'recurring' | 'draft'
export const TABS: Tab[] = ['all', 'scheduled', 'sent', 'recurring', 'draft']
export const TAB_STATUS: Record<Exclude<Tab, 'all'>, NotificationStatus> = { scheduled: 'Scheduled', sent: 'Sent', recurring: 'Recurring', draft: 'Draft' }

export const REMINDER_OPTIONS = ['1 day before', '6 hours before', '1 hour before', '24 hours before', '3 hours before']
export const DEADLINE_CATEGORIES: Category[] = ['Assignment', 'Quiz', 'Presentation', 'Deadline', 'FGD']
export const WEEK: Weekday[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export const DEFAULT_DESC: Record<Category, string> = {
  Assignment: 'A new assignment has been posted.',
  Quiz: 'A quiz has been scheduled for your class.',
  Lecture: 'Lecture reminder for your class.',
  FGD: 'Your focus group discussion is coming up.',
  Presentation: 'The presentation schedule has been published.',
  Deadline: 'A deadline is approaching.',
  Announcement: 'New announcement from your teaching team.',
  Material: 'New course material is available.',
  Project: 'A project milestone or deadline has been scheduled.',
  Reading: 'New required reading material has been assigned.',
}

/** '1 day before' → '1 day' */
export const shortReminder = (r: string) => r.replace(/ before$/, '')
export const reminderSummary = (rs: string[]) => (rs.length ? `${rs.map(shortReminder).join(' · ')} before` : 'None')

export const channelNames = (d: Delivery) => [d.announcement && '#announcement', d.dm && 'Direct Message', d.dashboard && 'Dashboard'].filter(Boolean) as string[]

/** Next weekly slot (mirrors the non-exported helper in store/actions). Invalid input → undefined. */
export function nextOccurrence(day: Weekday, time: string): Date | undefined {
  const n = now()
  const [h, m] = time.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return undefined
  const d = new Date(n.getFullYear(), n.getMonth(), n.getDate() + ((WEEKDAYS.indexOf(day) - n.getDay() + 7) % 7), h, m)
  if (d < n) d.setDate(d.getDate() + 7)
  return d
}

/** When a notification goes out next (scheduled or recurring only). */
export function nextSend(n: NotificationItem): Date | undefined {
  if (n.status === 'Scheduled' && n.sendAt && new Date(n.sendAt) > now()) return new Date(n.sendAt)
  if (n.status === 'Recurring' && n.repeat) return nextOccurrence(n.repeat.day, n.repeat.time)
}

type ScheduleSource = Pick<NotificationItem, 'mode' | 'sendAt' | 'repeat'> & { status?: NotificationStatus }

/** 'Sends Today, 12:00' · 'Every Tuesday · 10:00' · 'Sent 18 h ago' */
export function scheduleLabel(n: ScheduleSource): string {
  if (n.status === 'Sent') return n.sendAt ? `Sent ${relTime(n.sendAt)}` : 'Sent'
  if (n.mode === 'recurring' && n.repeat) return `Every ${n.repeat.day} · ${n.repeat.time}`
  if (n.mode === 'scheduled' && n.sendAt) return `${n.status === 'Draft' ? 'Planned for' : 'Sends'} ${dueLabel(n.sendAt)}`
  if (n.mode === 'now') return n.status === 'Draft' ? 'Sends when published' : 'Sends immediately'
  return 'Not scheduled yet'
}

/** 'Today' · 'Tomorrow' · 'Thu, 17 Sep' */
export function dayWord(d: Date) {
  if (sameDay(d, now())) return 'Today'
  if (sameDay(d, addDays(now(), 1))) return 'Tomorrow'
  return fmtDay(d.toISOString())
}

/** 'in 19 min' · 'in 1 h 19 min' · 'in 2 days' */
export function untilLabel(d: Date) {
  const min = Math.round((d.getTime() - now().getTime()) / 60_000)
  if (min <= 0) return 'now'
  if (min < 60) return `in ${min} min`
  if (min < 24 * 60) return `in ${Math.floor(min / 60)} h${min % 60 ? ` ${min % 60} min` : ''}`
  const days = Math.round(min / 1440)
  return `in ${days} day${days > 1 ? 's' : ''}`
}

/** Card/drawer operations that only concern this page (send now, duplicate, delete). */
export function useNotificationOps() {
  const { data, me, update, log, toast, openModal } = useStore()
  const [sendingId, setSendingId] = useState<string | null>(null)

  const edit = (n: NotificationItem) => openModal({ type: 'createNotification', prefill: n })

  async function sendNow(n: NotificationItem) {
    const reach = audienceIds(n.audience, data).length
    setSendingId(n.id)
    await wait(1000)
    // A recurring series keeps running — "send now" just delivers this week's instance early.
    update('notifications', (ns) => ns.map((x) => (x.id === n.id
      ? { ...x, ...(x.status === 'Recurring' ? {} : { status: 'Sent' as const, mode: 'now' as const, sendAt: nowIso() }), stats: { delivered: reach, read: 0 } }
      : x)))
    log({ actorId: me.id, action: 'sent notification', target: n.title, detail: `${audienceLabel(n.audience, data)} · delivered to ${plural(reach, 'student')}`, type: 'notifications' })
    setSendingId(null)
    toast({ title: 'Notification sent', description: `${n.title} reached ${plural(reach, 'student')} via ${channelNames(n.delivery).join(', ') || 'Dashboard'}.`, tone: 'success' })
  }

  function duplicate(n: NotificationItem) {
    const copy: NotificationItem = { ...n, id: uid('n'), title: `${n.title} (copy)`, status: 'Draft', stats: undefined, isNew: true, createdAt: nowIso(), createdBy: me.id }
    update('notifications', (ns) => [copy, ...ns])
    log({ actorId: me.id, action: 'duplicated notification', target: n.title, detail: 'Saved as draft', type: 'notifications' })
    toast({ title: 'Duplicated as draft', description: `“${copy.title}” is waiting in Drafts.`, tone: 'success', action: { label: 'Edit', onClick: () => edit(copy) } })
  }

  function remove(n: NotificationItem) {
    update('notifications', (ns) => ns.filter((x) => x.id !== n.id))
    // Drop calendar entries this notification generated (manual/recurring lecture series stay).
    update('events', (es) => es.filter((e) => !(e.notificationId === n.id && e.source === 'notification')))
    log({ actorId: me.id, action: 'deleted notification', target: n.title, detail: audienceLabel(n.audience, data), type: 'notifications' })
    toast({ title: 'Notification deleted', description: `“${n.title}” and its reminders were removed.`, tone: 'info' })
  }

  return { sendingId, sendNow, duplicate, remove, edit }
}
export type NotificationOps = ReturnType<typeof useNotificationOps>
