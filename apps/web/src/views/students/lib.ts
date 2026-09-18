import type { AppData, Assignment, ClassId, MemberStatus, Person, Role, TaskState, Tone, Verification } from '@/lib/types'

export type RoleKey = Role | 'Admin'
export type FacetKey = 'classes' | 'roles' | 'verification' | 'status'

export interface Filters {
  classes: ClassId[]
  roles: RoleKey[]
  verification: Verification[]
  status: MemberStatus[]
  onlyNew: boolean
}

export const EMPTY_FILTERS: Filters = { classes: [], roles: [], verification: [], status: [], onlyNew: false }
export const ROLE_KEYS: RoleKey[] = ['Student', 'Teaching Assistant', 'Lecturer', 'Admin']
export const VERIFICATIONS: Verification[] = ['Verified', 'Pending', 'Not Connected']
export const STATUSES: MemberStatus[] = ['Active', 'Inactive', 'On Leave']
export const PAGE_SIZE = 15

export type SortKey = 'name' | 'npm' | 'class'
export interface Sort { key: SortKey; dir: 'asc' | 'desc' }

export const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
export const emailFor = (name: string) => `${name.trim().toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '')}@campus.ac.id`

/** Search + facet filter. `skip` ignores one facet so its menu can show counts for every option. */
export function matches(p: Person, f: Filters, q: string, skip?: FacetKey) {
  const term = q.trim().toLowerCase()
  if (term && ![p.name, p.npm, p.email, p.discord ?? ''].some((s) => s.toLowerCase().includes(term))) return false
  if (skip !== 'classes' && f.classes.length && !(p.classId && f.classes.includes(p.classId))) return false
  if (skip !== 'roles' && f.roles.length && !f.roles.some((r) => (r === 'Admin' ? p.isAdmin : p.role === r))) return false
  if (skip !== 'verification' && f.verification.length && !f.verification.includes(p.verification)) return false
  if (skip !== 'status' && f.status.length && !f.status.includes(p.status)) return false
  return !f.onlyNew || !!p.isNew
}

export const matchesFacet = (p: Person, key: FacetKey, value: string) =>
  key === 'classes' ? p.classId === value
    : key === 'roles' ? (value === 'Admin' ? p.isAdmin : p.role === value)
      : key === 'verification' ? p.verification === value
        : p.status === value

/** New records first, then the chosen column (roster order when unsorted). */
export function sortPeople(list: Person[], sort: Sort | null) {
  const val = (p: Person) => (sort?.key === 'npm' ? p.npm : sort?.key === 'class' ? p.classId ?? '~' : p.name)
  return [...list].sort((a, b) => {
    const n = Number(!!b.isNew) - Number(!!a.isNew)
    if (n || !sort) return n
    return val(a).localeCompare(val(b)) * (sort.dir === 'asc' ? 1 : -1)
  })
}

export const taughtClasses = (data: AppData, id: string) => data.classes.filter((c) => c.lecturerId === id || c.taIds.includes(id))
export const classTone = (data: AppData, id?: ClassId): Tone => data.classes.find((c) => c.id === id)?.tone ?? 'slate'

/** Class assignments this student is actively working on (in progress / stuck). */
export function currentTasks(data: AppData, p: Person): { assignment: Assignment; state: TaskState }[] {
  if (!p.classId) return []
  return data.assignments
    .filter((a) => a.classId === p.classId && (a.progress[p.id] === 'in_progress' || a.progress[p.id] === 'stuck'))
    .map((a) => ({ assignment: a, state: a.progress[p.id] }))
}
