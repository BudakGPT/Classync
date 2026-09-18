import type { AppData, HelpCluster } from '@/lib/types'
import { hash, rng } from '@/lib/utils'

const RANK = { High: 0, Medium: 1, Low: 2 } as const

/** Most reported first (stable for ties). */
export const byReports = (hs: HelpCluster[]) => [...hs].sort((a, b) => b.reports - a.reports)

/** Open clusters where students explicitly asked for help, most urgent first. */
export const queueClusters = (d: AppData) =>
  d.helpClusters
    .filter((h) => h.status === 'open' && h.requesterIds.length > 0)
    .sort((a, b) => RANK[a.priority] - RANK[b.priority] || b.requesterIds.length - a.requesterIds.length)

export const resolvedClusters = (d: AppData) =>
  d.helpClusters.filter((h) => h.status === 'answered').sort((a, b) => (b.answeredAt ?? '').localeCompare(a.answeredAt ?? ''))

/** Unique students waiting in open High-priority clusters. */
export const studentsWaiting = (d: AppData) =>
  new Set(d.helpClusters.filter((h) => h.status === 'open' && h.priority === 'High').flatMap((h) => h.requesterIds)).size

/** Cumulative reports over the last week — deterministic per cluster, always ends at the current count. */
export function reportTrend(h: HelpCluster, points = 8) {
  const r = rng(hash(h.id))
  const steps = Array.from({ length: points - 1 }, () => 0.15 + r())
  const total = steps.reduce((a, b) => a + b, 0)
  let acc = 0
  return [0, ...steps.map((s) => ((acc += s) / total) * h.reports)]
}

export const firstName = (name?: string) => name?.replace(/^Dr\. /, '').split(' ')[0] ?? 'there'

export const scrollToSection = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
