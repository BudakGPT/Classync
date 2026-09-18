import { useMemo } from 'react'
import { CheckCheck, CircleCheck, FileSpreadsheet, FileText, History, Loader2, RefreshCw, Sheet, ShieldCheck, type LucideIcon } from 'lucide-react'
import { ActivityItem } from '@/components/domain/ActivityItem'
import { Avatar, Badge, Button, Card, CardHeader } from '@/components/ui'
import { href } from '@/lib/router'
import { shortName } from '@/lib/selectors'
import { tone as toneOf } from '@/lib/tones'
import { ago, now, relTime, startOfDay } from '@/lib/time'
import type { Activity, Tone } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'

export type SourceKind = 'xlsx' | 'csv' | 'sheets'
export interface Source {
  id: string
  name: string
  kind: SourceKind
  verb: string // 'Imported' · 'Synced' · 'Connected' · 'Re-synced'
  by: string // person id or 'classync'
  at: string // last sync ISO
  rows: number
  status: 'Imported' | 'Synced' | 'Connected'
  syncing?: boolean
}

export const SEED_SOURCES: Source[] = [
  { id: 'xlsx', name: 'Fasilkom_DataScience_Roster_2026.xlsx', kind: 'xlsx', verb: 'Imported', by: 'sarah', at: ago(60 * 20 + 21), rows: 28, status: 'Imported' },
  { id: 'siak', name: 'SIAK export (CSV)', kind: 'csv', verb: 'Synced', by: 'classync', at: ago(60 * 24 * 3 + 95), rows: 124, status: 'Synced' },
  { id: 'sheets', name: 'Google Sheets · Class C roster', kind: 'sheets', verb: 'Connected', by: 'farhan', at: ago(38), rows: 31, status: 'Connected' },
]

const KIND: Record<SourceKind, { icon: LucideIcon; tone: Tone; ext: string }> = {
  xlsx: { icon: FileSpreadsheet, tone: 'emerald', ext: 'XLSX' },
  csv: { icon: FileText, tone: 'sky', ext: 'CSV' },
  sheets: { icon: Sheet, tone: 'teal', ext: 'SHEETS' },
}

const STATUS: Record<Source['status'], { tone: Tone; icon?: LucideIcon; dot?: boolean }> = {
  Imported: { tone: 'emerald', icon: CircleCheck },
  Synced: { tone: 'sky', icon: CheckCheck },
  Connected: { tone: 'teal', dot: true },
}

/** File-type tile with an extension tag. */
export function FileIcon({ kind, size = 'md' }: { kind: SourceKind; size?: 'sm' | 'md' }) {
  const k = KIND[kind]
  const t = toneOf(k.tone)
  return (
    <span className="relative inline-grid shrink-0" aria-label={`${k.ext} file`}>
      <span className={cn('grid place-items-center ring-1 ring-inset', t.soft, t.text, t.ring, size === 'sm' ? 'size-8 rounded-lg' : 'size-10 rounded-xl')}>
        <k.icon className={size === 'sm' ? 'size-4' : 'size-5'} />
      </span>
      <span className={cn('absolute -bottom-1 left-1/2 -translate-x-1/2 rounded bg-surface px-1 font-extrabold leading-[1.35] tracking-wide ring-1 ring-line', t.text, size === 'sm' ? 'text-[7px]' : 'text-[8px]')}>{k.ext}</span>
    </span>
  )
}

/** 'just now' · '12 min ago' · '3 h ago' · 'yesterday' · '3 days ago' */
function agoLabel(iso: string) {
  const diff = now().getTime() - new Date(iso).getTime()
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`
  const days = Math.round((startOfDay(now()).getTime() - startOfDay(new Date(iso)).getTime()) / 86_400_000)
  if (days === 0) return `${Math.floor(diff / 3_600_000)} h ago`
  return days === 1 ? 'yesterday' : `${days} days ago`
}

export function DataSources({ sources, onResync, className }: { sources: Source[]; onResync: (s: Source) => void; className?: string }) {
  const { person } = useStore()
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader title="Data sources" subtitle="Where Classync reads your academic records" icon={FileSpreadsheet} tone="emerald"
        action={<Badge tone="emerald" dot size="sm">{sources.length} connected</Badge>} />
      <ul className="mt-3 flex-1 divide-y divide-line border-t border-line">
        {sources.map((s, i) => {
          const st = STATUS[s.status]
          const by = s.by === 'classync' ? 'Classync' : shortName(person(s.by))
          return (
            <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 transition-colors hover:bg-subtle/50 animate-rise-in" style={{ animationDelay: `${i * 40}ms` }}>
              <FileIcon kind={s.kind} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-semibold text-ink" title={s.name}>{s.name}</div>
                <div className="mt-1 flex min-w-0 items-center gap-1.5 text-xs text-ink-3">
                  <Avatar id={s.by} size="xs" />
                  <span className="truncate">{s.verb} {agoLabel(s.at)} by <span className="font-medium text-ink-2">{by}</span> · <span className="tabular">{s.rows}</span> rows</span>
                </div>
              </div>
              <div className="flex w-36 flex-col items-end gap-1 text-right">
                {s.syncing
                  ? <Badge tone="brand" icon={Loader2} size="xs" className="[&_svg]:animate-spin">Syncing</Badge>
                  : <Badge tone={st.tone} icon={st.icon} dot={st.dot} size="xs">{s.status}</Badge>}
                <div key={s.at} className="whitespace-nowrap text-[11.5px] text-ink-3 animate-fade-in">Last sync <span className="font-semibold text-ink-2 tabular">{relTime(s.at)}</span></div>
              </div>
              <Button size="xs" variant="secondary" icon={RefreshCw} loading={s.syncing} onClick={() => onResync(s)} aria-label={`Re-sync ${s.name}`}>
                {s.syncing ? 'Syncing' : 'Re-sync'}
              </Button>
            </li>
          )
        })}
      </ul>
      <div className="flex items-center gap-2 rounded-b-2xl border-t border-line bg-subtle/40 px-5 py-3 text-xs text-ink-3">
        <ShieldCheck className="size-3.5 shrink-0 text-emerald-600" />
        Records are matched by NPM — duplicates merge automatically and conflicts are flagged for review.
      </div>
    </Card>
  )
}

// Older roster events that predate the activity feed.
const HISTORY: Activity[] = [
  { id: 'imp-siak', actorId: 'classync', action: 'synced', target: 'SIAK export (CSV)', detail: '124 records checked · 2 updated', type: 'system', at: ago(60 * 24 * 3 + 95) },
  { id: 'imp-sheets', actorId: 'farhan', action: 'connected', target: 'Google Sheets · Class C roster', detail: '31 rows · auto-sync every hour', type: 'students', at: ago(60 * 24 * 6 + 240) },
  { id: 'imp-initial', actorId: 'maya', action: 'imported', target: 'Fasilkom_Roster_Initial.xlsx', detail: '96 rows · Classes A–C created', type: 'students', at: ago(60 * 24 * 12 + 60) },
]
const isRosterEvent = (a: Activity) => a.action === 'imported' || a.action === 're-synced' || a.action.startsWith('synced academic records')

export function ImportHistory({ className }: { className?: string }) {
  const { data } = useStore()
  const items = useMemo(
    () => [...data.activities.filter(isRosterEvent), ...HISTORY].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 5),
    [data.activities],
  )
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader title="Import history" subtitle="Every roster change is logged" icon={History} tone="violet"
        action={<a href={href('/activity')} className="rounded text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline">View all</a>} />
      <ol className="relative flex-1 px-5 pb-5 pt-4">
        <span className="absolute bottom-10 left-[39.5px] top-8 w-px bg-line" aria-hidden />
        {items.map((a, i) => (
          <li key={a.id} className="relative pb-3.5 last:pb-0 animate-rise-in" style={{ animationDelay: `${i * 40}ms` }}>
            <ActivityItem activity={a} />
          </li>
        ))}
      </ol>
    </Card>
  )
}
