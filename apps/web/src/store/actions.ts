import { useMemo } from 'react'
import { audienceIds, audienceLabel, studentsIn } from '@/lib/selectors'
import { now, nowIso, WEEKDAYS } from '@/lib/time'
import type {
  Assignment, CalEvent, ClassId, ClassRoom, Group, NotificationItem, NotificationStatus, Person, TaskState, Weekday,
} from '@/lib/types'
import { uid, wait } from '@/lib/utils'
import { useStore } from './store'

// Cross-page domain actions. They update the store AND write the activity feed so every screen stays in sync.
// They never toast — the calling UI decides how to celebrate.

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
const plusMin = (iso: string, min: number) => new Date(new Date(iso).getTime() + min * 60_000).toISOString()

/** ISO of the `weeksAhead`-th upcoming occurrence of a weekday/time (0 = next one). */
function nextOccurrence(day: Weekday, time: string, weeksAhead = 0) {
  const n = now()
  const [h, m] = time.split(':').map(Number)
  const d = new Date(n.getFullYear(), n.getMonth(), n.getDate() + ((WEEKDAYS.indexOf(day) - n.getDay() + 7) % 7), h, m)
  if (d < n) d.setDate(d.getDate() + 7)
  d.setDate(d.getDate() + weeksAhead * 7)
  return d.toISOString()
}

export type NotificationDraft = Omit<NotificationItem, 'id' | 'createdAt' | 'createdBy' | 'status' | 'isNew' | 'stats'> & { status?: NotificationStatus }
export type GroupDraft = Omit<Group, 'id' | 'createdAt' | 'createdBy' | 'isNew' | 'status' | 'role'> & { role?: string }

export function useActions() {
  const { data, update, log, me } = useStore()

  return useMemo(() => {
    const uniqueId = (base: string, taken: string[]) => {
      let id = slugify(base) || uid('x')
      for (let i = 2; taken.includes(id); i++) id = `${slugify(base)}-${i}`
      return id
    }

    return {
      /** Student marks a task completed / stuck / in progress. Stuck students join the assignment's help queue. */
      setTaskState(assignmentId: string, studentId: string, state: TaskState) {
        const a = data.assignments.find((x) => x.id === assignmentId)
        if (!a || a.progress[studentId] === state) return
        update('assignments', (as) => as.map((x) => (x.id === assignmentId ? { ...x, progress: { ...x.progress, [studentId]: state } } : x)))
        if (state === 'completed') log({ actorId: studentId, action: 'completed', target: a.title, detail: 'Reminders disabled for this task', type: 'assignments' })
        if (state === 'in_progress') log({ actorId: studentId, action: 'started working on', target: a.title, type: 'assignments' })
        if (state === 'stuck') {
          log({ actorId: studentId, action: 'is stuck on', target: a.title, detail: 'Help request opened', type: 'help' })
          const clusterId = a.helpClusterIds.find((id) => data.helpClusters.find((h) => h.id === id)?.status === 'open') ?? a.helpClusterIds[0]
          if (clusterId) update('helpClusters', (hs) => hs.map((h) => (h.id === clusterId && !h.requesterIds.includes(studentId)
            ? { ...h, status: 'open', reports: h.reports + 1, requesterIds: [...h.requesterIds, studentId] } : h)))
        }
      },

      /** Create/schedule a notification; adds calendar events and links (or creates) the matching assignment. */
      scheduleNotification(draft: NotificationDraft) {
        const id = uid('n')
        const status: NotificationStatus = draft.status ?? (draft.mode === 'now' ? 'Sent' : draft.mode === 'recurring' ? 'Recurring' : 'Scheduled')
        const reach = audienceIds(draft.audience, data).length
        const notification: NotificationItem = {
          ...draft, id, status, createdBy: me.id, createdAt: nowIso(), isNew: true,
          sendAt: draft.mode === 'now' ? nowIso() : draft.sendAt,
          stats: status === 'Sent' ? { delivered: reach, read: 0 } : undefined,
        }
        const classId = draft.audience.classIds.length === 1 ? draft.audience.classIds[0] : undefined
        const groupId = draft.audience.type === 'group' ? draft.audience.groupIds[0] : undefined
        const base = {
          classId, groupId, hostId: data.classes.find((c) => c.id === classId)?.lecturerId ?? me.id,
          participantIds: draft.audience.type === 'students' || draft.audience.type === 'custom' ? audienceIds(draft.audience, data) : [],
          reminders: draft.reminders, delivery: draft.delivery, description: draft.description,
          source: 'notification' as const, notificationId: id, isNew: true,
        }
        const events: CalEvent[] = []
        if (status !== 'Draft') {
          if (draft.mode === 'recurring' && draft.repeat) {
            for (let w = 0; w < 6; w++) {
              const start = nextOccurrence(draft.repeat.day, draft.repeat.time, w)
              events.push({ ...base, id: uid('ev'), title: draft.title, category: draft.category, start, end: draft.category === 'Lecture' ? plusMin(start, 100) : undefined })
            }
          }
          for (const x of draft.extras) events.push({ ...base, id: uid('ev'), title: `Extra: ${draft.title}`, category: 'Extra Class', start: x, end: plusMin(x, 100) })
          if (draft.deadline) events.push({ ...base, id: uid('ev'), title: draft.category === 'Assignment' ? `${draft.title} deadline` : draft.title, category: draft.category === 'Assignment' ? 'Deadline' : draft.category, start: draft.deadline })
          else if (draft.mode === 'scheduled' && draft.sendAt) events.push({ ...base, id: uid('ev'), title: draft.title, category: draft.category, start: draft.sendAt })
        }

        let assignment: Assignment | undefined
        if ((draft.category === 'Assignment' || draft.category === 'Quiz' || draft.category === 'Presentation') && draft.deadline && classId && status !== 'Draft') {
          const existing = data.assignments.find((a) => a.title.trim().toLowerCase() === draft.title.trim().toLowerCase())
          if (existing) {
            update('assignments', (as) => as.map((a) => (a.id === existing.id ? { ...a, due: draft.deadline!, notificationIds: [...a.notificationIds, id] } : a)))
          } else {
            assignment = {
              id: uniqueId(draft.title, data.assignments.map((a) => a.id)), title: draft.title, classId, category: draft.category as Assignment['category'],
              due: draft.deadline, createdAt: nowIso(), createdBy: me.id, description: draft.description,
              progress: Object.fromEntries(studentsIn(data.people, classId).map((p) => [p.id, 'not_started' as TaskState])),
              helpClusterIds: [], notificationIds: [id], isNew: true,
            }
            const created = assignment
            update('assignments', (as) => [created, ...as])
          }
        }

        update('notifications', (ns) => [notification, ...ns])
        if (events.length) update('events', (es) => [...es, ...events])
        log({
          actorId: me.id,
          action: status === 'Sent' ? 'sent notification' : status === 'Draft' ? 'saved a draft notification' : 'scheduled notification',
          target: draft.title,
          detail: `${audienceLabel(draft.audience, data)} · ${draft.category}${events.length ? ` · ${events.length} calendar event${events.length > 1 ? 's' : ''} added` : ''}`,
          type: 'notifications',
        })
        return { notification, events, assignment, reach }
      },

      createGroup(draft: GroupDraft) {
        const group: Group = {
          ...draft, id: uniqueId(draft.name, data.groups.map((g) => g.id)), role: draft.role ?? `@${draft.name.trim().replace(/\s+/g, '-')}`,
          status: 'Active', createdBy: me.id, createdAt: nowIso(), isNew: true,
        }
        update('groups', (gs) => [group, ...gs])
        log({ actorId: me.id, action: 'created group', target: group.name, detail: `${group.memberIds.length} members · ${group.role} role and ${group.text.length + group.voice.length} channels created`, type: 'groups' })
        return group
      },
      updateGroup(id: string, patch: Partial<Group>) {
        update('groups', (gs) => gs.map((g) => (g.id === id ? { ...g, ...patch } : g)))
      },
      archiveGroup(id: string) {
        const g = data.groups.find((x) => x.id === id)
        update('groups', (gs) => gs.map((x) => (x.id === id ? { ...x, status: x.status === 'Archived' ? 'Active' : 'Archived' } : x)))
        if (g) log({ actorId: me.id, action: g.status === 'Archived' ? 'restored group' : 'archived group', target: g.name, detail: g.status === 'Archived' ? 'Discord channels re-opened' : 'Discord channels set to read-only', type: 'groups' })
      },
      deleteGroup(id: string) {
        const g = data.groups.find((x) => x.id === id)
        update('groups', (gs) => gs.filter((x) => x.id !== id))
        if (g) log({ actorId: me.id, action: 'deleted group', target: g.name, detail: `Removed ${g.role} role and ${g.text.length + g.voice.length} Discord channels`, type: 'groups' })
      },

      /** Discord onboarding: identity matched → Verified → class role assigned. */
      verifyStudent(id: string, classId?: ClassId) {
        const p = data.people.find((x) => x.id === id)
        if (!p) return
        const cls = classId ?? p.classId
        update('people', (ps) => ps.map((x) => (x.id === id ? {
          ...x, classId: cls, verification: 'Verified', presence: 'online',
          discord: x.discord ?? `${x.name.split(' ')[0].toLowerCase()}.${x.npm.slice(-3)}`,
        } : x)))
        log({ actorId: id, action: 'verified their academic identity', detail: `Matched NPM ${p.npm} in the academic database`, type: 'students' })
        log({ actorId: 'classync', action: `assigned the @Class-${cls} role to`, target: p.name, detail: '#announcement · #discussion · #material · #assignment · voice-class unlocked', type: 'discord' })
      },

      /** Spreadsheet import: existing NPMs are updated, new ones are added as Pending (not yet on Discord). */
      importStudents(rows: { name: string; npm: string; classId: ClassId }[], totalRows = rows.length) {
        const byNpm = new Map(data.people.map((p) => [p.npm, p]))
        const taken = data.people.map((p) => p.id)
        const added: Person[] = []
        for (const r of rows) {
          if (byNpm.has(r.npm)) continue
          const id = uniqueId(r.name, taken)
          taken.push(id)
          added.push({
            id, name: r.name, role: 'Student', isAdmin: false, classId: r.classId, npm: r.npm, email: `${slugify(r.name).replace(/-/g, '.')}@campus.ac.id`,
            verification: 'Pending', presence: 'offline', status: 'Active', joinedAt: nowIso(), isNew: true,
          })
        }
        const updated = totalRows - added.length
        update('people', (ps) => [...added, ...ps])
        log({ actorId: me.id, action: 'imported', target: `${totalRows} students`, detail: `${added.length} new · ${updated} updated · auto-categorized into classes`, type: 'students' })
        return { added, updated }
      },

      addStudent(input: { name: string; npm: string; email: string; classId: ClassId; discord?: string }) {
        const person: Person = {
          id: uniqueId(input.name, data.people.map((p) => p.id)), role: 'Student', isAdmin: false, status: 'Active', joinedAt: nowIso(), isNew: true,
          verification: input.discord ? 'Pending' : 'Not Connected', presence: 'offline', ...input, discord: input.discord || undefined,
        }
        update('people', (ps) => [person, ...ps])
        log({ actorId: me.id, action: 'added student', target: person.name, detail: `Class ${person.classId} · invite sent to ${person.email}`, type: 'students' })
        return person
      },

      /** Send one answer privately to every requester of a difficulty cluster. */
      answerCluster(clusterId: string, body: string, opts: { saveAsReusable?: boolean; title?: string; reuseAnswerId?: string } = {}) {
        const h = data.helpClusters.find((x) => x.id === clusterId)
        if (!h) return
        let answerId = opts.reuseAnswerId
        if (opts.reuseAnswerId) {
          update('answers', (as) => as.map((a) => (a.id === opts.reuseAnswerId ? { ...a, usedCount: a.usedCount + 1 } : a)))
        } else if (opts.saveAsReusable) {
          answerId = uid('ans')
          const newId = answerId
          update('answers', (as) => [{ id: newId, title: opts.title || `Understanding ${h.concept}`, concept: h.concept, body, usedCount: 1, helpfulPct: 100, authorId: me.id, updatedAt: nowIso(), isNew: true }, ...as])
          update('helpStats', (s) => ({ ...s, reusableAnswers: s.reusableAnswers + 1 }))
        }
        update('helpClusters', (hs) => hs.map((x) => (x.id === clusterId ? { ...x, status: 'answered', answeredAt: nowIso(), answerId } : x)))
        update('helpStats', (s) => ({ ...s, resolvedToday: s.resolvedToday + h.requesterIds.length }))
        log({ actorId: me.id, action: 'answered', target: h.concept, detail: `Sent privately to ${h.requesterIds.length} students${opts.saveAsReusable ? ' · saved as reusable answer' : opts.reuseAnswerId ? ' · reused answer' : ''}`, type: 'help' })
      },

      /** Anonymous difficulty report (drives the privacy-threshold demo). */
      reportDifficulty(clusterId: string) {
        const h = data.helpClusters.find((x) => x.id === clusterId)
        if (!h) return
        update('helpClusters', (hs) => hs.map((x) => (x.id === clusterId ? { ...x, reports: x.reports + 1, status: 'open' } : x)))
        if (h.reports + 1 === data.settings.privacyThreshold) {
          log({ actorId: 'classync', action: `now shows an aggregated difficulty:`, target: h.concept, detail: `${h.reports + 1} students reported it · identities protected`, type: 'help' })
        }
      },

      async syncDiscord() {
        await wait(1800)
        update('discord', (d) => ({ ...d, lastSync: nowIso(), connected: true, botOnline: true }))
        log({ actorId: 'classync', action: 'synchronized Discord roles for', target: data.discord.server, detail: `${data.discord.members} members · roles and channels up to date`, type: 'discord' })
      },

      connectClassDiscord(classId: ClassId) {
        const c = data.classes.find((x) => x.id === classId)
        update('classes', (cs) => cs.map((x) => (x.id === classId ? { ...x, discord: { ...x.discord, connected: true } } : x)))
        if (c) log({ actorId: me.id, action: 'connected Discord for', target: c.name, detail: `${c.discord.role} role · ${c.discord.text.length + c.discord.voice.length} channels created`, type: 'discord' })
      },

      addEvent(event: Omit<CalEvent, 'id' | 'isNew' | 'source'>) {
        const e: CalEvent = { ...event, id: uid('ev'), source: 'manual', isNew: true }
        update('events', (es) => [...es, e])
        log({ actorId: me.id, action: 'scheduled event', target: e.title, detail: `${e.category}${e.classId ? ` · Class ${e.classId}` : ''}`, type: 'notifications' })
        return e
      },

      createAssignment(input: Omit<Assignment, 'id' | 'createdAt' | 'createdBy' | 'progress' | 'helpClusterIds' | 'notificationIds' | 'isNew'>) {
        const a: Assignment = {
          ...input, id: uniqueId(input.title, data.assignments.map((x) => x.id)), createdAt: nowIso(), createdBy: me.id, isNew: true,
          progress: Object.fromEntries(studentsIn(data.people, input.classId).map((p) => [p.id, 'not_started' as TaskState])),
          helpClusterIds: [], notificationIds: [],
        }
        update('assignments', (as) => [a, ...as])
        log({ actorId: me.id, action: 'created assignment', target: a.title, detail: `Class ${a.classId} · due ${new Date(a.due).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`, type: 'assignments' })
        return a
      },

      createClass(input: Omit<ClassRoom, 'discord'> & { connectDiscord?: boolean }) {
        const { connectDiscord, ...rest } = input
        const c: ClassRoom = { ...rest, discord: { connected: !!connectDiscord, role: `@Class-${input.id}`, ...data.discord.templates[0] && { text: data.discord.templates[0].text, voice: data.discord.templates[0].voice } } }
        update('classes', (cs) => [...cs, c])
        log({ actorId: me.id, action: 'created class', target: `${c.name} · ${c.subject}`, detail: connectDiscord ? `${c.discord.role} role and channels created` : 'Discord not connected yet', type: 'classes' })
        return c
      },
    }
  }, [data, update, log, me])
}
