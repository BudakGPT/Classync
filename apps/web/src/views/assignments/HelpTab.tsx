import { ArrowUpRight, CircleCheck, CircleDot, Hand, LifeBuoy, MessageCircleQuestionMark, MessagesSquare, ShieldCheck, type LucideIcon } from 'lucide-react'
import { AnonStack, AvatarStack, Button, Card, EmptyState, IconTile, StatusBadge } from '@/components/ui'
import { navigate } from '@/lib/router'
import { idsWithState, shortName } from '@/lib/selectors'
import { relTime } from '@/lib/time'
import type { Assignment, HelpCluster, Tone } from '@/lib/types'
import { plural } from '@/lib/utils'
import { useStore } from '@/store/store'
import { linkedClusters } from './lib'

const PRIORITY_TONE: Record<HelpCluster['priority'], Tone> = { High: 'rose', Medium: 'amber', Low: 'slate' }

function Mini({ label, value, icon, tone }: { label: string; value: number; icon: LucideIcon; tone: Tone }) {
  return (
    <div className="flex items-center gap-3">
      <IconTile icon={icon} tone={tone} size="sm" />
      <div>
        <div key={value} className="text-[20px] font-extrabold leading-none text-ink tabular animate-pop">{value}</div>
        <div className="mt-0.5 text-[11.5px] text-ink-3">{label}</div>
      </div>
    </div>
  )
}

export function HelpTab({ a }: { a: Assignment }) {
  const { data } = useStore()
  const clusters = linkedClusters(a, data.helpClusters)

  if (!clusters.length) {
    return (
      <Card>
        <EmptyState
          icon={MessageCircleQuestionMark} tone="amber" title="No help requests yet"
          description={`When students in Class ${a.classId} report a difficulty with this task, Classync groups similar questions here — identities stay private unless they ask for help.`}
          action={{ label: 'Open Help Center', icon: LifeBuoy, onClick: () => navigate('/help') }}
        />
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center gap-x-8 gap-y-4 px-5 py-4">
        <Mini label="Open topics" value={clusters.filter((h) => h.status === 'open').length} icon={CircleDot} tone="amber" />
        <Mini label="Total reports" value={clusters.reduce((n, h) => n + h.reports, 0)} icon={MessagesSquare} tone="violet" />
        <Mini label="Asked by name" value={new Set(clusters.flatMap((h) => h.requesterIds)).size} icon={Hand} tone="sky" />
        <Mini label="Currently stuck" value={idsWithState(a, 'stuck').length} icon={LifeBuoy} tone="rose" />
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-3">
            <ShieldCheck className="size-4 text-emerald-600" />Anonymous reporters stay hidden · topics surface after {data.settings.privacyThreshold} reports
          </span>
          <Button variant="secondary" size="sm" iconRight={ArrowUpRight} onClick={() => navigate('/help')}>Open Help Center</Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {clusters.map((h, i) => <ClusterCard key={h.id} h={h} index={i} />)}
      </div>
    </div>
  )
}

function ClusterCard({ h, index }: { h: HelpCluster; index: number }) {
  const { data, person } = useStore()
  const anon = Math.max(0, h.reports - h.requesterIds.length)
  const answer = data.answers.find((x) => x.id === h.answerId)
  const threshold = data.settings.privacyThreshold
  const names = h.requesterIds.slice(0, 2).map((id) => shortName(person(id))).join(', ') + (h.requesterIds.length > 2 ? ` +${h.requesterIds.length - 2}` : '')

  return (
    <Card className="flex flex-col p-5 animate-rise-in" style={{ animationDelay: `${index * 50}ms` }}>
      <div className="flex items-start gap-3">
        <IconTile icon={MessageCircleQuestionMark} tone={PRIORITY_TONE[h.priority]} />
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold tracking-tight text-ink">{h.concept}</h3>
          <p className="text-xs text-ink-3">First reported {relTime(h.firstReportAt).toLowerCase()} · Class {h.classId}</p>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
          <StatusBadge status={h.priority} size="xs" />
          <StatusBadge status={h.status} size="xs" />
        </div>
      </div>

      <blockquote className="mt-4 rounded-xl border-l-4 border-brand-200 bg-canvas px-4 py-3">
        <p className="text-[13.5px] leading-relaxed text-ink-2">“{h.sampleQuestion}”</p>
        <p className="mt-1 text-[11px] text-ink-3">Representative question · anonymised</p>
      </blockquote>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-line p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">Asked for help</div>
          {h.requesterIds.length ? (
            <div className="mt-2 flex min-w-0 items-center gap-2">
              <AvatarStack ids={h.requesterIds} max={4} />
              <span className="truncate text-xs text-ink-2">{names}</span>
            </div>
          ) : <p className="mt-2 text-xs leading-6 text-ink-3">No named requests — reports only</p>}
        </div>
        <div className="rounded-xl border border-line p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">Anonymous</div>
          <div className="mt-2 flex items-center gap-2">
            {anon > 0 && <AnonStack count={anon} max={4} />}
            <span className="text-xs leading-6 text-ink-3">{anon ? `${plural(anon, 'student')} reported privately` : 'Everyone asked by name'}</span>
          </div>
        </div>
      </div>

      {h.reports < threshold && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">Below the privacy threshold ({h.reports}/{threshold} reports) — shown to staff only as an aggregate.</p>
      )}

      <div className="flex-1" />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3.5">
        {h.status === 'answered' ? (
          <span className="inline-flex min-w-0 items-center gap-1.5 text-xs font-medium text-emerald-700">
            <CircleCheck className="size-4 shrink-0" />
            <span className="truncate">Answered {h.answeredAt ? relTime(h.answeredAt).toLowerCase() : ''}{answer && <> · “{answer.title}”</>}</span>
          </span>
        ) : (
          <span className="text-xs text-ink-3">{plural(h.reports, 'report')} · waiting for an answer</span>
        )}
        <Button size="sm" variant={h.status === 'open' ? 'soft' : 'ghost'} iconRight={ArrowUpRight} onClick={() => navigate('/help')}>
          {h.status === 'open' ? 'Answer in Help Center' : 'View answer'}
        </Button>
      </div>
    </Card>
  )
}
