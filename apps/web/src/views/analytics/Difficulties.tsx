import type { CSSProperties } from 'react'
import { ArrowUpRight, Brain, TrendingUp } from 'lucide-react'
import { AnonStack, Badge, Button, Card, CardHeader, StatusBadge } from '@/components/ui'
import { navigate } from '@/lib/router'
import { tone } from '@/lib/tones'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'
import { Tween, useMounted } from './charts'
import { DIFFICULTIES, PERIOD, type Range } from './data'

export function Difficulties({ range }: { range: Range }) {
  const { data } = useStore()
  const ready = useMounted()
  const rows = DIFFICULTIES.map((d) => {
    const cluster = data.helpClusters.find((h) => h.id === d.clusterId)
    const cls = data.classes.find((c) => c.id === d.classId)
    // This week's counts are live from the Help Center, so reports filed there show up here.
    const count = range === 'week' ? cluster?.reports ?? d.counts.week : d.counts[range]
    return { ...d, cluster, classTone: cls?.tone ?? 'slate', count }
  }).sort((a, b) => b.count - a.count)
  const max = Math.max(1, ...rows.map((r) => r.count))
  const total = rows.reduce((s, r) => s + r.count, 0)

  return (
    <Card className="flex flex-col">
      <CardHeader
        icon={Brain} tone="orange" title="Most common difficulties" subtitle={`Grouped by concept from anonymous reports · ${PERIOD[range].span}`}
        action={<Button variant="ghost" size="xs" iconRight={ArrowUpRight} onClick={() => navigate('/help')}>Help Center</Button>}
      />
      <ol className="flex-1 space-y-0.5 px-3 pb-3 pt-3" aria-label={`Most common difficulties: ${rows.map((r) => `${r.label} ${r.count} reports`).join(', ')}`}>
        {rows.map((r, i) => (
          <li key={r.clusterId} className="animate-rise-in" style={{ animationDelay: `${i * 45}ms` } as CSSProperties}>
            <button
              type="button" onClick={() => navigate('/help')}
              aria-label={`Rank ${i + 1}: ${r.label}, ${r.context}, Class ${r.classId}, ${r.count} reports. Open Help Center.`}
              className="group flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-subtle/70"
            >
              <span className={cn('grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold tabular', i === 0 ? 'bg-ink text-white' : 'bg-subtle text-ink-2')}>{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0 text-[13.5px] font-semibold text-ink">{r.label}</span>
                  <span className="flex min-w-0 items-center gap-1 truncate text-xs text-ink-3">
                    <span className={cn('size-1.5 shrink-0 rounded-full', tone(r.classTone).dot)} aria-hidden />
                    <span className="truncate">Class {r.classId} · {r.context}</span>
                  </span>
                  {r.rising?.includes(range) && <Badge tone="amber" size="xs" icon={TrendingUp} className="ml-auto">Rising</Badge>}
                  {r.cluster?.status === 'answered' && <StatusBadge status="answered" size="xs" className={cn(!r.rising?.includes(range) && 'ml-auto')} />}
                </span>
                <span className="mt-2 block h-2 overflow-hidden rounded-full bg-subtle">
                  <span
                    className={cn('block h-full rounded-full transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:brightness-110', tone(r.classTone).solid)}
                    style={{ width: ready ? `${(r.count / max) * 100}%` : '0%', transitionDelay: `${i * 60}ms` }}
                  />
                </span>
              </span>
              <span className="w-14 shrink-0 text-right leading-tight">
                <span className="block text-[15px] font-bold text-ink tabular"><Tween value={r.count} /></span>
                <span className="block text-[11px] text-ink-3">reports</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3 text-xs text-ink-3">
        <span className="inline-flex items-center gap-2"><AnonStack count={total} max={4} size="xs" /><span><span className="font-semibold text-ink-2 tabular">{total}</span> reports · identities stay private</span></span>
        <span>Bar color = class</span>
      </div>
    </Card>
  )
}
