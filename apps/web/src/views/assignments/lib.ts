import {
  AlarmClock, CalendarCheck2, CalendarClock, CalendarDays, Circle, CircleCheck, FolderKanban, LifeBuoy, Loader, type LucideIcon,
} from 'lucide-react'
import { taskCounts } from '@/lib/selectors'
import { dueLabel, fmtDay, now, urgency } from '@/lib/time'
import { CATEGORY } from '@/lib/tones'
import type { Assignment, Category, HelpCluster, NotificationItem, TaskState, Tone } from '@/lib/types'

export type Lifecycle = 'upcoming' | 'in_progress' | 'completed'
export type ListTab = 'all' | Lifecycle | 'stuck'
export type DetailTab = 'overview' | 'students' | 'help' | 'announcements'
export const DETAIL_TABS: DetailTab[] = ['overview', 'students', 'help', 'announcements']

/** Completed: due passed or ≥90% done · Upcoming: due ahead with <20% started · In progress: the rest. */
export function lifecycle(a: Assignment): Lifecycle {
  const c = taskCounts(a)
  if (new Date(a.due).getTime() <= now().getTime() || c.pct >= 90) return 'completed'
  return c.total && (c.total - c.not_started) / c.total >= 0.2 ? 'in_progress' : 'upcoming'
}

// ponytail: "Stuck" is an attention filter that overlaps the lifecycle tabs — as an exclusive bucket it would swallow
// every seeded in-progress task (they all have someone stuck) and leave In Progress empty.
export const needsHelp = (a: Assignment) => lifecycle(a) !== 'completed' && taskCounts(a).stuck > 0
export const inTab = (a: Assignment, t: ListTab) => t === 'all' || (t === 'stuck' ? needsHelp(a) : lifecycle(a) === t)

export const STATES: { value: TaskState; label: string; tone: Tone; icon: LucideIcon }[] = [
  { value: 'completed', label: 'Completed', tone: 'emerald', icon: CircleCheck },
  { value: 'in_progress', label: 'In progress', tone: 'sky', icon: Loader },
  { value: 'stuck', label: 'Stuck', tone: 'rose', icon: LifeBuoy },
  { value: 'not_started', label: 'Not started', tone: 'slate', icon: Circle },
]
export const STATE = Object.fromEntries(STATES.map((s) => [s.value, s])) as Record<TaskState, (typeof STATES)[number]>

/** StackedProgress segments; "not started" is the empty track. */
export function stateSegments(a: Assignment) {
  const c = taskCounts(a)
  return STATES.slice(0, 3).map((s) => ({ value: c[s.value], tone: s.tone, label: s.label }))
}

/** CATEGORY has no 'Project' (it is not a notification category). */
export const categoryMeta = (cat: Assignment['category']): { icon: LucideIcon; tone: Tone } =>
  cat === 'Project' ? { icon: FolderKanban, tone: 'pink' } : CATEGORY[cat]
export const notificationCategory = (cat: Assignment['category']): Category => (cat === 'Project' ? 'Assignment' : cat)

/** 'Due tomorrow, 23:59' with urgency tone + icon; past deadlines read 'Closed Fri, 11 Sep'. */
export function dueMeta(iso: string): { label: string; tone: Tone; icon: LucideIcon } {
  const u = urgency(iso)
  if (u === 'overdue') return { label: `Closed ${fmtDay(iso)}`, tone: 'slate', icon: CalendarCheck2 }
  const label = `Due ${dueLabel(iso).replace(/^(Today|Tomorrow)/, (m) => m.toLowerCase())}`
  if (u === 'urgent') return { label, tone: 'rose', icon: AlarmClock }
  if (u === 'soon') return { label, tone: 'amber', icon: CalendarClock }
  return { label, tone: 'slate', icon: CalendarDays }
}

export const linkedClusters = (a: Assignment, all: HelpCluster[]) =>
  a.helpClusterIds.map((id) => all.find((h) => h.id === id)).filter((h): h is HelpCluster => !!h)

export const linkedNotifications = (a: Assignment, all: NotificationItem[]) =>
  all.filter((n) => a.notificationIds.includes(n.id) || n.title.trim().toLowerCase() === a.title.trim().toLowerCase())
