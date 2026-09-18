// Mock analytics datasets per date range. Values are hand-tuned so the story is
// consistent across the page (e.g. this week's daily help requests sum to the
// latest weekly point of "This month").
import { hash, rng } from '@/lib/utils'

export type Range = 'week' | 'month' | 'semester'
export type AnalyticsClassId = 'A' | 'B' | 'C' | 'D'
export const CLASS_IDS: AnalyticsClassId[] = ['A', 'B', 'C', 'D']

export const RANGE_OPTIONS: { value: Range; label: string }[] = [
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'semester', label: 'Semester' },
]
export const isRange = (v: string | null): v is Range => v === 'week' || v === 'month' || v === 'semester'

export const PERIOD: Record<Range, { vs: string; span: string; points: string[]; granularity: string }> = {
  week: { vs: 'vs last week', span: 'Mon 14 – Fri 18 Sep', points: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], granularity: 'Daily' },
  month: { vs: 'vs last month', span: 'Last 4 weeks', points: ['24 Aug', '31 Aug', '7 Sep', '14 Sep'], granularity: 'Weekly' },
  semester: { vs: 'vs last semester', span: 'Odd Semester · Weeks 1–6', points: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4', 'Wk 5', 'Wk 6'], granularity: 'Weekly' },
}

// ── KPIs ──────────────────────────────────────────────────────────────────
export interface Kpis {
  completion: number; completionDelta: number; tasksDone: number; tasksTotal: number
  response: number; responseDelta: number; responseTrend: number[]; within1h: number
  active: number; activeDelta: number
  delivered: number; deliveredDelta: number; deliveries: number; deliveriesTotal: number
}
export const KPIS: Record<Range, Kpis> = {
  week: { completion: 78, completionDelta: 4, tasksDone: 412, tasksTotal: 528, response: 18, responseDelta: -3, responseTrend: [24, 21, 19, 16, 18], within1h: 94, active: 112, activeDelta: 6, delivered: 94, deliveredDelta: 2, deliveries: 1642, deliveriesTotal: 1748 },
  month: { completion: 74, completionDelta: -2, tasksDone: 1486, tasksTotal: 2008, response: 21, responseDelta: -5, responseTrend: [29, 25, 22, 18], within1h: 90, active: 118, activeDelta: 9, delivered: 93, deliveredDelta: 1, deliveries: 6204, deliveriesTotal: 6671 },
  semester: { completion: 81, completionDelta: 7, tasksDone: 2310, tasksTotal: 2852, response: 24, responseDelta: -9, responseTrend: [41, 33, 29, 25, 22, 18], within1h: 86, active: 121, activeDelta: 14, delivered: 91, deliveredDelta: 3, deliveries: 9120, deliveriesTotal: 10022 },
}

// ── Task completion by class ──────────────────────────────────────────────
export const COMPLETION: Record<Range, Record<AnalyticsClassId, { pct: number; delta: number }>> = {
  week: { A: { pct: 85, delta: 3 }, B: { pct: 76, delta: 2 }, C: { pct: 81, delta: 5 }, D: { pct: 71, delta: -6 } },
  month: { A: { pct: 82, delta: 1 }, B: { pct: 73, delta: -2 }, C: { pct: 78, delta: 4 }, D: { pct: 74, delta: -3 } },
  semester: { A: { pct: 88, delta: 6 }, B: { pct: 80, delta: 4 }, C: { pct: 79, delta: 2 }, D: { pct: 77, delta: 1 } },
}
export const COMPLETION_TARGET = 80

// ── Help request trends ───────────────────────────────────────────────────
export const HELP_TRENDS: Record<Range, { created: number[]; resolved: number[] }> = {
  week: { created: [9, 14, 11, 17, 8], resolved: [7, 12, 10, 13, 9] },
  month: { created: [38, 46, 52, 59], resolved: [35, 41, 47, 51] },
  semester: { created: [12, 24, 38, 46, 52, 59], resolved: [10, 20, 35, 41, 47, 51] },
}

// ── Most common difficulties (cluster ids from the Help Center seed) ──────
export interface Difficulty { clusterId: string; label: string; classId: AnalyticsClassId; context: string; counts: Record<Range, number>; rising?: Range[] }
export const DIFFICULTIES: Difficulty[] = [
  { clusterId: 'pca', label: 'PCA', classId: 'B', context: 'Eigenvectors · ML Assignment', counts: { week: 8, month: 23, semester: 34 }, rising: ['week'] },
  { clusterId: 'aws', label: 'AWS', classId: 'C', context: 'Deployment errors · Cloud Lab', counts: { week: 6, month: 19, semester: 26 } },
  { clusterId: 'sql-join', label: 'SQL', classId: 'A', context: 'JOIN types · Database Quiz 2', counts: { week: 5, month: 17, semester: 41 } },
  { clusterId: 'normalization', label: 'Normalization', classId: 'A', context: '3NF · SQL Worksheet', counts: { week: 4, month: 12, semester: 29 } },
  { clusterId: 'regression', label: 'Regression', classId: 'D', context: 'Assumptions · Regression Report', counts: { week: 3, month: 11, semester: 18 }, rising: ['week', 'month'] },
]

// ── Discord engagement heatmap (messages per weekday × 2-hour slot) ───────
export const HEAT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const
export const HEAT_SLOTS = ['08', '10', '12', '14', '16', '18', '20'] as const
const HEAT_BASE = [
  [22, 58, 41, 36, 64, 52, 38],
  [48, 96, 62, 55, 88, 70, 51],
  [30, 84, 57, 73, 142, 94, 66],
  [44, 72, 49, 60, 101, 83, 58],
  [26, 40, 35, 31, 47, 28, 19],
]
/** Share of server messages each class produces. */
export const CLASS_SHARE: Record<AnalyticsClassId, number> = { A: 0.24, B: 0.34, C: 0.26, D: 0.16 }

export function heatmap(range: Range, share: number): number[][] {
  const r = rng(hash(`heat-${range}`))
  const scale = range === 'week' ? 1 : range === 'month' ? 0.92 : 0.85
  return HEAT_BASE.map((row) => row.map((v) => Math.round(v * scale * share * (0.9 + r() * 0.2))))
}

// ── Class engagement cards ────────────────────────────────────────────────
export interface ClassEngagement {
  score: number; scoreDelta: number; messages: number; messagesDelta: number; attendance: number; active: number
  trend: number[]; topId: string; topDetail: string
}
export const ENGAGEMENT: Record<Range, Record<AnalyticsClassId, ClassEngagement>> = {
  week: {
    A: { score: 82, scoreDelta: 3, messages: 214, messagesDelta: 8, attendance: 92, active: 28, trend: [70, 78, 74, 81, 82], topId: 'nadia', topDetail: '41 messages · 5 answers upvoted' },
    B: { score: 88, scoreDelta: 5, messages: 386, messagesDelta: 12, attendance: 95, active: 31, trend: [76, 84, 86, 83, 88], topId: 'helven', topDetail: '63 messages · helped 4 classmates' },
    C: { score: 79, scoreDelta: 2, messages: 241, messagesDelta: 5, attendance: 89, active: 27, trend: [72, 70, 81, 76, 79], topId: 'kevin', topDetail: '38 messages · shared a deploy fix' },
    D: { score: 64, scoreDelta: -6, messages: 0, messagesDelta: 0, attendance: 84, active: 26, trend: [71, 69, 66, 62, 64], topId: 'citra', topDetail: 'Attended every session · 2 FGDs led' },
  },
  month: {
    A: { score: 80, scoreDelta: 1, messages: 198, messagesDelta: 4, attendance: 91, active: 29, trend: [74, 77, 79, 80], topId: 'nadia', topDetail: '152 messages · 17 answers upvoted' },
    B: { score: 85, scoreDelta: 3, messages: 352, messagesDelta: 9, attendance: 94, active: 31, trend: [79, 81, 84, 85], topId: 'helven', topDetail: '231 messages · helped 11 classmates' },
    C: { score: 77, scoreDelta: 4, messages: 226, messagesDelta: 11, attendance: 88, active: 29, trend: [69, 72, 75, 77], topId: 'kevin', topDetail: '146 messages · 3 guides pinned' },
    D: { score: 67, scoreDelta: -3, messages: 0, messagesDelta: 0, attendance: 85, active: 27, trend: [72, 70, 68, 67], topId: 'citra', topDetail: 'Attended 12 of 12 sessions' },
  },
  semester: {
    A: { score: 84, scoreDelta: 6, messages: 187, messagesDelta: 15, attendance: 93, active: 30, trend: [66, 72, 76, 79, 82, 84], topId: 'nadia', topDetail: '248 messages · 26 answers upvoted' },
    B: { score: 86, scoreDelta: 8, messages: 331, messagesDelta: 21, attendance: 94, active: 32, trend: [64, 71, 77, 81, 84, 86], topId: 'helven', topDetail: '372 messages · helped 19 classmates' },
    C: { score: 78, scoreDelta: 3, messages: 219, messagesDelta: 7, attendance: 90, active: 30, trend: [70, 73, 72, 76, 77, 78], topId: 'kevin', topDetail: '231 messages · 5 guides pinned' },
    D: { score: 70, scoreDelta: 1, messages: 0, messagesDelta: 0, attendance: 86, active: 28, trend: [66, 68, 71, 72, 69, 70], topId: 'citra', topDetail: 'Attended 17 of 18 sessions' },
  },
}
/** Messages/week once a class connects Discord mid-demo (Class D starts disconnected). */
export const CONNECTED_FALLBACK_MESSAGES = 96
