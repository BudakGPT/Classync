import { FlaskConical, FolderKanban, Hourglass, MessagesSquare, Presentation, Shapes, type LucideIcon } from 'lucide-react'
import { fmtDate, now } from '@/lib/time'
import type { ClassId, Group, GroupType, Tone } from '@/lib/types'

/** Group type → icon, tone, name prefix and the Discord channel template Classync provisions. */
export const GROUP_TYPES: Record<GroupType, { icon: LucideIcon; tone: Tone; prefix: string; description: string; text: string[]; voice: string[] }> = {
  FGD: { icon: MessagesSquare, tone: 'teal', prefix: 'FGD', description: 'Focus group discussion', text: ['discussion', 'submission'], voice: ['voice-fgd'] },
  Project: { icon: FolderKanban, tone: 'sky', prefix: 'Project', description: 'Long-running team', text: ['general', 'project-board'], voice: ['voice-team'] },
  Presentation: { icon: Presentation, tone: 'violet', prefix: 'Presentation', description: 'Slides & rehearsals', text: ['discussion', 'slides'], voice: ['voice-presentation'] },
  Research: { icon: FlaskConical, tone: 'amber', prefix: 'Research', description: 'Papers & experiments', text: ['research', 'papers'], voice: ['voice-research'] },
  Temporary: { icon: Hourglass, tone: 'orange', prefix: 'Temp', description: 'Short-lived space', text: ['discussion'], voice: ['voice-group'] },
  Custom: { icon: Shapes, tone: 'pink', prefix: 'Group', description: 'Build your own setup', text: ['discussion'], voice: ['voice-group'] },
}
export const TYPE_LIST = Object.keys(GROUP_TYPES) as GroupType[]

export const roleFor = (name: string) => `@${name.trim().replace(/\s+/g, '-')}`

/** First free name: 'FGD-B1', 'Project-C2', 'FGD-Cross-1'. */
export function suggestName(type: GroupType, scope: Group['scope'], classId: ClassId, taken: string[]) {
  const base = `${GROUP_TYPES[type].prefix}-${scope === 'cross' ? 'Cross-' : classId}`
  const used = new Set(taken.map((t) => t.toLowerCase()))
  let n = 1
  while (used.has(`${base}${n}`.toLowerCase())) n++
  return `${base}${n}`
}

/** '7 Sep' */
export const shortDate = (iso: string) => fmtDate(iso).replace(/ \d{4}$/, '')

/** Elapsed share of a temporary group's lifetime. */
export function timeline(g: Pick<Group, 'startDate' | 'endDate'>) {
  if (!g.startDate || !g.endDate) return null
  const s = new Date(g.startDate).getTime(), e = new Date(g.endDate).getTime(), n = now().getTime()
  return {
    pct: Math.round(Math.min(1, Math.max(0, (n - s) / Math.max(1, e - s))) * 100),
    ended: n >= e,
    daysLeft: Math.ceil((e - n) / 86_400_000),
    range: `${shortDate(g.startDate)} – ${shortDate(g.endDate)}`,
  }
}

/** '/groups/fgd-b2?tab=active' — keeps the current list filters in the URL when opening/closing the detail. */
export const groupPath = (id?: string) => {
  const q = window.location.hash.split('?')[1]
  return `/groups${id ? `/${id}` : ''}${q ? `?${q}` : ''}`
}
