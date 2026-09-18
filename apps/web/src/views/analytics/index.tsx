import { useEffect, useState } from 'react'
import { ChevronDown, Download, FileSpreadsheet, FileText, MessageSquareShare } from 'lucide-react'
import { Button, Menu, PageHeader, Segmented } from '@/components/ui'
import { navigate, useRoute } from '@/lib/router'
import { nowIso, relTime, toDateInput } from '@/lib/time'
import { cn, wait } from '@/lib/utils'
import { useStore } from '@/store/store'
import { ClassEngagementCards } from './ClassEngagement'
import { CompletionByClass } from './CompletionByClass'
import { Difficulties } from './Difficulties'
import { EngagementHeatmap } from './EngagementHeatmap'
import { HelpTrends } from './HelpTrends'
import { InsightCallout } from './InsightCallout'
import { KpiRow } from './KpiRow'
import { RANGE_OPTIONS, isRange, type Range } from './data'
import './analytics.css'

type ExportKind = 'csv' | 'pdf' | 'discord'

export default function AnalyticsPage() {
  const { params } = useRoute()
  const raw = params.get('range')
  const range: Range = isRange(raw) ? raw : 'week'
  const { data, me, toast, log } = useStore()

  // The URL range flips the control instantly; the data swaps after a short dim so the change reads as a refresh.
  const [shown, setShown] = useState<Range>(range)
  const refreshing = shown !== range
  useEffect(() => {
    if (range === shown) return
    const t = setTimeout(() => setShown(range), 260)
    return () => clearTimeout(t)
  }, [range, shown])

  const [exporting, setExporting] = useState<ExportKind | null>(null)
  const label = RANGE_OPTIONS.find((o) => o.value === shown)!.label
  const runExport = async (kind: ExportKind) => {
    setExporting(kind)
    await wait(kind === 'discord' ? 1500 : 1200)
    setExporting(null)
    const file = `classync-analytics-${shown}-${toDateInput(nowIso())}`
    if (kind === 'csv') toast({ tone: 'success', title: 'CSV export ready', description: `${file}.csv · 6 datasets, 214 rows saved to Downloads` })
    if (kind === 'pdf') toast({ tone: 'success', title: 'PDF report generated', description: `${file}.pdf · 4 pages with charts and the current insight` })
    if (kind === 'discord') toast({ tone: 'discord', title: 'Summary posted to #staff-lounge', description: `${label} snapshot shared with lecturers and TAs in ${data.discord.server}` })
    log(kind === 'discord'
      ? { actorId: me.id, action: 'shared an analytics summary in', target: '#staff-lounge', detail: `${label} · completion, help requests, engagement`, type: 'discord' }
      : { actorId: me.id, action: 'exported analytics', target: `${label} report`, detail: kind.toUpperCase(), type: 'system' })
  }

  return (
    <>
      <PageHeader
        eyebrow={<span className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">Insights · {data.settings.term}</span>}
        title="Analytics"
        subtitle={`Completion, help requests and engagement across your classes. Discord data synced ${relTime(data.discord.lastSync).toLowerCase()}.`}
        actions={
          <>
            <Segmented aria-label="Date range" options={RANGE_OPTIONS} value={range} onChange={(r) => navigate(r === 'week' ? '/analytics' : `/analytics?range=${r}`)} />
            <Menu
              label={`Export · ${label}`} width={272}
              trigger={<Button icon={Download} iconRight={ChevronDown} loading={!!exporting}>{exporting ? 'Exporting…' : 'Export'}</Button>}
              items={[
                { label: 'Download CSV', description: 'Raw data behind every chart', icon: FileSpreadsheet, onSelect: () => runExport('csv') },
                { label: 'PDF report', description: 'Formatted summary for lecturers', icon: FileText, onSelect: () => runExport('pdf') },
                { label: 'Post summary to Discord', description: '#staff-lounge · lecturers & TAs', icon: MessageSquareShare, onSelect: () => runExport('discord'), divider: true },
              ]}
            />
          </>
        }
      />
      <div className={cn('space-y-5 transition-opacity duration-200', refreshing && 'opacity-50')} aria-busy={refreshing}>
        <KpiRow range={shown} />
        <InsightCallout range={shown} />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <CompletionByClass range={shown} />
          <HelpTrends range={shown} />
          <Difficulties range={shown} />
          <EngagementHeatmap range={shown} />
        </div>
        <ClassEngagementCards range={shown} />
      </div>
    </>
  )
}
