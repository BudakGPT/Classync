import { studentsIn, taskCounts } from '@/lib/selectors'
import { now } from '@/lib/time'
import type { Assignment, AppData, Audience, CalEvent, ClassId, ClassRoom, Person } from '@/lib/types'

export const TABS = ['overview', 'members', 'assignments', 'groups', 'discord', 'activity'] as const
export type ClassTab = (typeof TABS)[number]

export const classPath = (id: string, tab?: ClassTab) => `/classes/${id}${tab && tab !== 'overview' ? `?tab=${tab}` : ''}`
export const classAudience = (id: ClassId): Audience => ({ type: 'class', classIds: [id], groupIds: [], studentIds: [] })

// ponytail: ClassRoom has no isNew flag; the seed ships A–D, so anything else was created this session.
export const isNewClass = (c: ClassRoom) => !['A', 'B', 'C', 'D'].includes(c.id)

const ms = (iso: string) => new Date(iso).getTime()

/** '10:00' → '11:40' (lectures run 100 minutes). */
export function endTime(hhmm: string, min = 100) {
  const [h, m] = hhmm.split(':').map(Number)
  const t = h * 60 + m + min
  return `${String(Math.floor(t / 60) % 24).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`
}

const RANK = { online: 0, idle: 1, offline: 2 }
/** Online first, then the recurring characters — so avatar stacks show familiar faces. */
export const byPresence = (a: Person, b: Person) => RANK[a.presence] - RANK[b.presence] || Number(!!b.featured) - Number(!!a.featured)

/** Next (or currently running) lecture / extra class for a class. */
export function nextMeeting(data: AppData, classId: ClassId) {
  const t = now().getTime()
  const event = data.events
    .filter((e) => e.classId === classId && (e.category === 'Lecture' || e.category === 'Extra Class') && ms(e.end ?? e.start) > t)
    .sort((a, b) => a.start.localeCompare(b.start))[0]
  return event ? { event, live: ms(event.start) <= t } : undefined
}

export function classStats(data: AppData, c: ClassRoom) {
  const t = now().getTime()
  const roster = studentsIn(data.people, c.id).sort(byPresence)
  const assignments = data.assignments.filter((a) => a.classId === c.id).sort((a, b) => a.due.localeCompare(b.due))
  const openHelp = data.helpClusters.filter((h) => h.classId === c.id && h.status === 'open')
  return {
    roster,
    online: roster.filter((p) => p.presence === 'online'),
    verified: roster.filter((p) => p.verification === 'Verified').length,
    assignments,
    upcoming: assignments.filter((a) => ms(a.due) > t),
    completion: assignments.length ? Math.round(assignments.reduce((n, a) => n + taskCounts(a).pct, 0) / assignments.length) : 0,
    openHelp,
    helpRequests: openHelp.reduce((n, h) => n + h.requesterIds.length, 0),
    groups: data.groups.filter((g) => g.classIds.includes(c.id)),
    meeting: nextMeeting(data, c.id),
  }
}
export type ClassStats = ReturnType<typeof classStats>
export interface TabProps { cls: ClassRoom; s: ClassStats }

export type UpcomingItem = { kind: 'assignment'; at: string; a: Assignment } | { kind: 'event'; at: string; e: CalEvent }

/** Deadlines and non-lecture sessions coming up for a class, soonest first. */
export function upcomingItems(data: AppData, c: ClassRoom, s: ClassStats, limit = 5): UpcomingItem[] {
  const t = now().getTime()
  const events = data.events.filter((e) => e.classId === c.id && e.category !== 'Lecture' && ms(e.start) > t)
  return [
    ...s.upcoming.map((a) => ({ kind: 'assignment' as const, at: a.due, a })),
    ...events.map((e) => ({ kind: 'event' as const, at: e.start, e })),
  ].sort((x, y) => x.at.localeCompare(y.at)).slice(0, limit)
}

/** Feed items about a class: mentions of 'Class B' / '@Class-B', its subject, assignments, groups or help topics, or a student of the class acting. */
export function classActivities(data: AppData, c: ClassRoom, s: ClassStats) {
  const re = new RegExp(`\\bClass[- ]${c.id}\\b`) // word boundary so 'Cross-Class AI Team' doesn't count as Class A
  const needles = [
    c.subject,
    ...s.assignments.map((a) => a.title),
    ...s.groups.map((g) => g.name),
    ...data.helpClusters.filter((h) => h.classId === c.id).map((h) => h.concept),
  ]
  const ids = new Set(s.roster.map((p) => p.id))
  return data.activities.filter((a) => {
    const text = `${a.action} ${a.target ?? ''} ${a.detail ?? ''}`
    return ids.has(a.actorId) || re.test(text) || needles.some((n) => text.includes(n))
  })
}

/** Who sits in the class voice channel (simulated from presence; busier while a lecture is live). */
export function inVoice(c: ClassRoom, s: ClassStats) {
  if (!c.discord.connected) return []
  const students = s.online.slice(0, s.meeting?.live ? 9 : 3).map((p) => p.id)
  return s.meeting?.live ? [c.lecturerId, ...students] : students
}

export const CHANNEL_INFO: Record<string, { desc: string; perm: string }> = {
  announcement: { desc: 'Official updates, schedule changes and Classync reminders', perm: 'Staff post · students read' },
  discussion: { desc: 'Open questions and peer discussion', perm: 'Everyone can post' },
  material: { desc: 'Slides, notebooks and weekly readings', perm: 'Staff post · students read' },
  assignment: { desc: 'Briefs, submissions and deadline reminders', perm: 'Students submit' },
}
