import { useState, type CSSProperties } from 'react'
import { ArrowUpRight, Check, CircleCheck, ClipboardCheck, Eye, EyeOff, Lock, LockOpen, Megaphone, MessageSquareQuote, Send, TrendingUp } from 'lucide-react'
import { AnonStack, AvatarStack, Badge, Button, Card, EmptyState, ProgressBar, Segmented, StatusBadge, Tooltip } from '@/components/ui'
import { href } from '@/lib/router'
import { relTime } from '@/lib/time'
import type { HelpCluster } from '@/lib/types'
import { cn, plural, wait } from '@/lib/utils'
import { useActions } from '@/store/actions'
import { useStore } from '@/store/store'
import { byReports, reportTrend } from './helpers'
import { ClassChip, EYEBROW, PrivacyExplainer, SectionTitle, Sparkline } from './parts'

type Filter = 'all' | 'visible' | 'locked'
interface Handlers { onRespond: (clusterId: string) => void; onViewAnswer: (answerId: string) => void }
interface CardProps extends Handlers { cluster: HelpCluster; fresh: boolean; style?: CSSProperties }

export function DifficultySection({ onRespond, onViewAnswer }: Handlers) {
  const { data } = useStore()
  const threshold = data.settings.privacyThreshold
  const [filter, setFilter] = useState<Filter>('all')
  const [unlocked, setUnlocked] = useState<string[]>([])
  const all = byReports(data.helpClusters)
  const locked = all.filter((h) => h.reports < threshold)
  const list = filter === 'all' ? all : filter === 'locked' ? locked : all.filter((h) => h.reports >= threshold)
  const count = (n: number) => <span className="tabular opacity-60">{n}</span>

  return (
    <section aria-labelledby="difficulties-title">
      <SectionTitle
        id="difficulties-title"
        title="Most reported difficulties"
        subtitle="Grouped automatically from anonymous reports in Discord — no student names attached."
        action={
          <Segmented size="sm" aria-label="Filter difficulties" value={filter} onChange={setFilter} options={[
            { value: 'all', label: <>All {count(all.length)}</> },
            { value: 'visible', label: <>Visible {count(all.length - locked.length)}</> },
            { value: 'locked', label: <>Below threshold {count(locked.length)}</>, icon: Lock },
          ]} />
        }
      />
      <PrivacyExplainer threshold={threshold} />
      {list.length === 0 ? (
        <Card className="mt-4">
          <EmptyState compact icon={LockOpen} tone="emerald" characters={['nadia', 'citra', 'erik']} title="Every difficulty is visible"
            description={`All reported concepts have reached ${threshold}+ anonymous reports.`} action={{ label: 'Show all difficulties', onClick: () => setFilter('all') }} />
        </Card>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {list.map((h, i) => {
            const style = { animationDelay: `${Math.min(i, 8) * 40}ms` }
            if (h.reports < threshold) {
              return <LockedCard key={h.id} cluster={h} threshold={threshold} style={style} onUnlock={() => setUnlocked((u) => [...u, h.id])} />
            }
            const props = { cluster: h, fresh: unlocked.includes(h.id), onRespond, onViewAnswer }
            return i === 0 ? <HeroCard key={h.id} {...props} /> : <DifficultyCard key={h.id} {...props} style={style} />
          })}
        </div>
      )}
    </section>
  )
}

const reportLabel = (h: HelpCluster, fresh: boolean) =>
  fresh ? `${h.reports} students are experiencing this difficulty.` : `${h.reports} students experiencing this issue`

function AssignmentLink({ id, className }: { id?: string; className?: string }) {
  const { data } = useStore()
  const a = data.assignments.find((x) => x.id === id)
  if (!a) return null
  return (
    <a href={href(`/assignments/${a.id}`)} className={cn('group/link inline-flex max-w-full items-center gap-1.5 rounded text-[12.5px] font-medium text-ink-3 transition-colors hover:text-brand-700', className)}>
      <ClipboardCheck className="size-3.5 shrink-0" />
      <span className="truncate">{a.title}</span>
      <ArrowUpRight className="size-3 shrink-0 opacity-0 transition-opacity group-hover/link:opacity-100" />
    </a>
  )
}

function HeroCard({ cluster: h, fresh, onRespond, onViewAnswer }: CardProps) {
  const answered = h.status === 'answered'
  const n = h.requesterIds.length
  return (
    <Card className={cn('hero-gradient relative flex flex-col overflow-hidden p-6 animate-rise-in lg:col-span-2 xl:row-span-2', fresh && 'ring-2 ring-brand-300')}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="brand" icon={TrendingUp}>Most reported</Badge>
            <ClassChip classId={h.classId} subject />
            <StatusBadge status={answered ? 'answered' : h.priority} />
          </div>
          <h3 className="mt-3 text-[26px] font-extrabold leading-tight tracking-tight text-ink">{h.concept}</h3>
          <AssignmentLink id={h.assignmentId} className="mt-1" />
        </div>
        <div className="rounded-xl bg-surface/85 px-4 py-3 shadow-card ring-1 ring-line">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[22px] font-extrabold leading-none text-ink tabular">{h.reports}</span>
            <span className="text-[11px] font-medium text-ink-3">reports · 7 days</span>
          </div>
          <Sparkline values={reportTrend(h)} width={140} height={38} tone={answered ? 'emerald' : 'brand'} className="mt-2" />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <AnonStack count={h.reports} max={6} size="md" />
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-ink">{reportLabel(h, fresh)}</div>
          <div className="text-xs text-ink-3">Reported anonymously · first report {relTime(h.firstReportAt)}</div>
        </div>
      </div>

      <figure className="mt-5 rounded-xl border border-line bg-surface/90 p-4 shadow-card">
        <figcaption className={cn(EYEBROW, 'flex items-center gap-1.5')}><MessageSquareQuote className="size-3.5" />Anonymised sample question</figcaption>
        <blockquote className="mt-2 text-[15px] font-medium leading-relaxed text-ink">“{h.sampleQuestion}”</blockquote>
        {h.reports > 1 && <p className="mt-2 text-xs text-ink-3">+{h.reports - 1} similar questions grouped by Classync</p>}
      </figure>

      <div className="min-h-5 flex-1" />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        {answered ? (
          <span className="inline-flex items-center gap-2 text-[13px] text-ink-2">
            <CircleCheck className="size-4 text-emerald-600" />Answered {relTime(h.answeredAt ?? h.firstReportAt)} · sent privately to {plural(n, 'student')}
          </span>
        ) : n > 0 ? (
          <div className="flex items-center gap-2.5">
            <AvatarStack ids={h.requesterIds} max={5} />
            <span className="text-[13px] text-ink-3"><b className="font-semibold text-ink">{n} asked for help</b> · identity shared by request</span>
          </div>
        ) : (
          <span className="inline-flex items-center gap-2 text-[13px] text-ink-3"><EyeOff className="size-4" />No direct requests yet — every report is anonymous</span>
        )}
        {answered
          ? h.answerId && <Button variant="secondary" icon={Eye} onClick={() => onViewAnswer(h.answerId!)}>View answer</Button>
          : n > 0 && <Button variant="primary" icon={Send} onClick={() => onRespond(h.id)}>Respond to {plural(n, 'student')}</Button>}
      </div>
    </Card>
  )
}

function DifficultyCard({ cluster: h, fresh, onRespond, onViewAnswer, style }: CardProps) {
  const answered = h.status === 'answered'
  const n = h.requesterIds.length
  const card = (
    <Card style={fresh ? undefined : style} className={cn('flex h-full flex-col p-5', fresh ? 'animate-scale-in border-brand-300' : 'animate-rise-in')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <ClassChip classId={h.classId} />
          <StatusBadge status={answered ? 'answered' : h.priority} size="xs" />
          {fresh && <Badge tone="emerald" icon={LockOpen} size="xs">Just unlocked</Badge>}
        </div>
        <Tooltip content={`${h.reports} reports in the last 7 days`}>
          <Sparkline values={reportTrend(h)} width={64} height={24} tone={answered ? 'emerald' : 'brand'} />
        </Tooltip>
      </div>
      <h3 className="mt-3 text-[15px] font-bold tracking-tight text-ink">{h.concept}</h3>
      <AssignmentLink id={h.assignmentId} className="mt-0.5" />
      <div className="mt-3 flex items-center gap-2.5">
        <AnonStack count={h.reports} max={4} />
        <span className={cn('text-[12.5px] font-medium', fresh ? 'text-emerald-700' : 'text-ink-2')}>{reportLabel(h, fresh)}</span>
      </div>
      <p className="mt-3 line-clamp-2 rounded-lg bg-subtle/70 px-3 py-2 text-[12.5px] leading-relaxed text-ink-2">“{h.sampleQuestion}”</p>
      <div className="min-h-3 flex-1" />
      <div className="flex min-h-9 items-center justify-between gap-2 border-t border-line pt-3">
        {answered ? (
          <>
            <span className="inline-flex items-center gap-1.5 text-xs text-ink-3"><CircleCheck className="size-3.5 text-emerald-600" />Answered {relTime(h.answeredAt ?? h.firstReportAt)}</span>
            {h.answerId && <Button variant="ghost" size="xs" icon={Eye} onClick={() => onViewAnswer(h.answerId!)}>View answer</Button>}
          </>
        ) : n > 0 ? (
          <>
            <span className="flex items-center gap-2 text-xs text-ink-3"><AvatarStack ids={h.requesterIds} max={3} size="xs" />{n} asked for help</span>
            <Button variant="secondary" size="xs" icon={Send} onClick={() => onRespond(h.id)} aria-label={`Respond to ${h.concept}`}>Respond</Button>
          </>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-3"><EyeOff className="size-3.5" />No direct requests yet · first report {relTime(h.firstReportAt)}</span>
        )}
      </div>
    </Card>
  )
  return fresh ? <div className="h-full rounded-2xl animate-highlight">{card}</div> : card
}

function LockedCard({ cluster: h, threshold, onUnlock, style }: { cluster: HelpCluster; threshold: number; onUnlock: () => void; style?: CSSProperties }) {
  const { toast } = useStore()
  const actions = useActions()
  const [busy, setBusy] = useState(false)
  const [unlocking, setUnlocking] = useState(false)
  const [bumps, setBumps] = useState(0)
  const needed = threshold - h.reports

  const report = async () => {
    setBusy(true)
    await wait(450)
    if (needed > 1) {
      actions.reportDifficulty(h.id)
      setBumps((b) => b + 1)
      setBusy(false)
      return
    }
    setUnlocking(true)
    await wait(950)
    actions.reportDifficulty(h.id)
    onUnlock()
    toast({ tone: 'info', title: `Unlocked: ${h.concept}`, description: `${threshold} students are experiencing this difficulty. Identities remain hidden.` })
  }

  return (
    <Card style={style} className={cn('relative flex h-full flex-col overflow-hidden p-5 transition-colors duration-300 animate-rise-in', unlocking ? 'border-emerald-300 bg-emerald-50/30' : 'border-dashed bg-surface/70')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className={cn('grid size-9 place-items-center rounded-xl transition-colors duration-300', unlocking ? 'bg-emerald-100 text-emerald-600' : 'bg-subtle text-ink-3')}>
            {unlocking ? <LockOpen className="size-[18px] animate-pop" /> : <Lock className="size-[18px]" />}
          </span>
          <div className="space-y-1">
            <div className={EYEBROW}>{unlocking ? 'Unlocking…' : 'Hidden difficulty'}</div>
            <ClassChip classId={h.classId} />
          </div>
        </div>
        <Badge tone={unlocking ? 'emerald' : 'slate'}>
          <span key={bumps + (unlocking ? 100 : 0)} className="inline-block animate-pop tabular">{h.reports + (unlocking ? 1 : 0)}</span> reports
        </Badge>
      </div>

      <span className="sr-only">Concept hidden until {threshold} students report it.</span>
      <div className="mt-4 h-[46px]" aria-hidden>
        {unlocking ? (
          <div className="animate-fade-in">
            <div className="text-[15px] font-bold text-ink">{h.concept}</div>
            <div className="mt-1 text-xs text-emerald-700">Threshold reached — revealing aggregated insight</div>
          </div>
        ) : (
          <div className="select-none space-y-2 blur-[2.5px]">
            <div className="h-4 w-3/5 rounded-md bg-ink/15" />
            <div className="h-3 w-4/5 rounded-md bg-ink/10" />
            <div className="h-3 w-2/5 rounded-md bg-ink/10" />
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="font-medium text-ink-2">Privacy threshold · {threshold}</span>
          <span className={cn('tabular', unlocking ? 'font-semibold text-emerald-700' : 'text-ink-3')}>{unlocking ? 'Reached' : `${plural(needed, 'more report')} needed`}</span>
        </div>
        <ProgressBar value={((unlocking ? threshold : h.reports) / threshold) * 100} tone={unlocking ? 'emerald' : 'slate'} size="sm" label="Reports toward privacy threshold" />
      </div>
      <p className="mt-3 text-[12.5px] leading-relaxed text-ink-3">More reports are required before this information can be displayed.</p>

      <div className="min-h-3 flex-1" />
      <div className="flex min-h-9 items-center justify-between gap-2 border-t border-dashed border-line pt-3">
        {bumps > 0
          ? <span key={bumps} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 animate-rise-in"><Check className="size-3.5" strokeWidth={3} />Anonymous report received</span>
          : <span className="text-xs text-ink-3">First report {relTime(h.firstReportAt)}</span>}
        <Button variant="secondary" size="xs" icon={Megaphone} loading={busy} onClick={report}>Simulate anonymous report</Button>
      </div>
    </Card>
  )
}
