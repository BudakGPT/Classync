import type { AppData, Assignment, Audience, CalEvent, ClassId, HelpCluster, Person, TaskState, Tone } from './types'

export const students = (people: Person[]) => people.filter((p) => p.role === 'Student')
export const staff = (people: Person[]) => people.filter((p) => p.role !== 'Student')
export const studentsIn = (people: Person[], classId: ClassId) => people.filter((p) => p.role === 'Student' && p.classId === classId)

/** 'Dr. Maya' / 'Haekal' */
export const shortName = (p?: Person) => (!p ? 'Someone' : p.name.startsWith('Dr. ') ? `Dr. ${p.name.split(' ')[1]}` : p.name.split(' ')[0])

export function taskCounts(a: Assignment) {
  const c: Record<TaskState, number> = { completed: 0, in_progress: 0, stuck: 0, not_started: 0 }
  for (const s of Object.values(a.progress)) c[s]++
  const total = Object.keys(a.progress).length
  return { ...c, total, pct: total ? Math.round((c.completed / total) * 100) : 0 }
}
export const idsWithState = (a: Assignment, s: TaskState) => Object.keys(a.progress).filter((id) => a.progress[id] === s)

/** Who an event is for: explicit ids → group members → class roster. */
export function eventParticipantIds(e: CalEvent, d: AppData): string[] {
  if (e.participantIds.length) return e.participantIds
  if (e.groupId) return d.groups.find((g) => g.id === e.groupId)?.memberIds ?? []
  if (e.classId) return studentsIn(d.people, e.classId).map((p) => p.id)
  return []
}

/** Student ids reached by an audience selection. */
export function audienceIds(a: Audience, d: AppData): string[] {
  const set = new Set<string>()
  const addClass = (c: ClassId) => studentsIn(d.people, c).forEach((p) => set.add(p.id))
  const addGroup = (g: string) => d.groups.find((x) => x.id === g)?.memberIds.forEach((id) => set.add(id))
  if (a.type === 'class' || a.type === 'classes' || a.type === 'custom') a.classIds.forEach(addClass)
  if (a.type === 'group' || a.type === 'custom') a.groupIds.forEach(addGroup)
  if (a.type === 'students' || a.type === 'custom') a.studentIds.forEach((id) => set.add(id))
  return [...set]
}

/** 'Class B' · 'Classes A, B' · 'All classes' · 'FGD-B2' · '3 students' */
export function audienceLabel(a: Audience, d: AppData): string {
  if (a.type === 'group') return a.groupIds.map((g) => d.groups.find((x) => x.id === g)?.name ?? g).join(', ') || 'Group'
  if (a.type === 'students') return `${a.studentIds.length} student${a.studentIds.length === 1 ? '' : 's'}`
  if (a.type === 'custom') return `Custom · ${audienceIds(a, d).length} students`
  if (a.classIds.length === 4) return 'All classes'
  if (a.classIds.length === 1) return `Class ${a.classIds[0]}`
  return `Classes ${a.classIds.join(', ')}`
}

export interface RoleInfo { name: string; count: number; tone: Tone; kind: 'system' | 'class' | 'group' }
/** Discord roles Classync manages, with member counts. */
export function discordRoles(d: AppData): RoleInfo[] {
  const s = staff(d.people)
  return [
    { name: '@Admin', count: d.people.filter((p) => p.isAdmin).length, tone: 'rose', kind: 'system' },
    { name: '@Lecturer', count: s.filter((p) => p.role === 'Lecturer').length, tone: 'violet', kind: 'system' },
    { name: '@Teaching-Assistant', count: s.filter((p) => p.role === 'Teaching Assistant').length, tone: 'sky', kind: 'system' },
    ...d.classes.filter((c) => c.discord.connected).map((c) => ({ name: c.discord.role, count: studentsIn(d.people, c.id).filter((p) => p.verification === 'Verified').length, tone: c.tone, kind: 'class' as const })),
    ...d.groups.filter((g) => g.status === 'Active').map((g) => ({ name: g.role, count: g.memberIds.length, tone: 'teal' as Tone, kind: 'group' as const })),
  ]
}

export const isVisibleCluster = (h: HelpCluster, threshold: number) => h.reports >= threshold
export const openRequestCount = (d: AppData) => d.helpClusters.filter((h) => h.status === 'open').reduce((n, h) => n + h.requesterIds.length, 0)
