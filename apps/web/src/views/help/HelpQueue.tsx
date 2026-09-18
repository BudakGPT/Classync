import { CircleCheck, Clock3, Eye, HeartHandshake, LifeBuoy, Lightbulb, Send, Timer } from 'lucide-react'
import { AvatarStack, Badge, Button, Card, CardHeader, EmptyState, IconButton, IconTile, StatusBadge } from '@/components/ui'
import { openRequestCount } from '@/lib/selectors'
import { now, relTime } from '@/lib/time'
import { cn, plural } from '@/lib/utils'
import { useStore } from '@/store/store'
import { queueClusters, resolvedClusters } from './helpers'
import { ClassChip } from './parts'

export function HelpQueue({ onRespond, className }: { onRespond: (clusterId: string) => void; className?: string }) {
  const { data } = useStore()
  const queue = queueClusters(data)
  return (
    <Card id="help-queue" className={cn('flex scroll-mt-24 flex-col', className)}>
      <CardHeader
        icon={LifeBuoy} tone="amber" title="Teacher help queue"
        subtitle="Students who explicitly asked for help · most urgent first"
        action={<Badge tone={queue.length ? 'amber' : 'emerald'} dot>{queue.length ? plural(openRequestCount(data), 'active request') : 'All caught up'}</Badge>}
      />
      {queue.length === 0 ? (
        <EmptyState compact className="flex-1" icon={CircleCheck} tone="emerald" characters={['helven', 'jessica', 'kevin']}
          title="No active help requests" description="Every student who asked for help has received a private answer. New requests from Discord will appear here." />
      ) : (
        <ul className="mt-4 divide-y divide-line border-t border-line">
          {queue.map((h, i) => {
            const n = h.requesterIds.length
            const tone = data.classes.find((c) => c.id === h.classId)?.tone ?? 'brand'
            return (
              <li key={h.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 transition-colors animate-rise-in hover:bg-subtle/50" style={{ animationDelay: `${i * 40}ms` }}>
                <IconTile icon={Lightbulb} tone={tone} />
                <div className="min-w-0 flex-1 basis-52">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[14px] font-semibold text-ink">{h.concept}</span>
                    <ClassChip classId={h.classId} />
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-medium text-slate-600 border border-slate-200/80">
                      No Room Yet
                    </span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-ink-3">
                    <span className="font-semibold text-ink-2 tabular">{plural(n, 'active request')}</span>
                    <span aria-hidden>·</span>
                    <span className="inline-flex items-center gap-1"><Clock3 className="size-3" />First request {relTime(h.firstReportAt)}</span>
                  </div>
                </div>
                <div className="w-[76px]"><StatusBadge status={h.priority} /></div>
                <div className="w-[108px]"><AvatarStack ids={h.requesterIds} max={4} /></div>
                <Button variant="secondary" size="sm" icon={Send} onClick={() => onRespond(h.id)} aria-label={`Respond to ${h.concept}`}>Respond</Button>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

export function ResolvedList({ onViewAnswer, className }: { onViewAnswer: (answerId: string) => void; className?: string }) {
  const { data } = useStore()
  const list = resolvedClusters(data)
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader icon={CircleCheck} tone="emerald" title="Resolved" subtitle="Answered privately via Discord DM" />
      <div className="mx-5 mt-4 grid grid-cols-2 gap-2">
        <MiniStat icon={HeartHandshake} value={data.helpStats.resolvedToday} label="students helped today" />
        <MiniStat icon={Timer} value={`${data.helpStats.avgResponseMin} min`} label="avg. first response" />
      </div>
      {list.length === 0 ? (
        <p className="px-5 py-8 text-center text-[13px] text-ink-3">Nothing resolved yet today.</p>
      ) : (
        <ul className="space-y-0.5 px-3 pb-3 pt-3">
          {list.map((h) => {
            const recent = now().getTime() - new Date(h.answeredAt ?? 0).getTime() < 5 * 60_000
            return (
              <li key={h.id} className={cn('flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-subtle/50', recent && 'bg-emerald-50/60 animate-highlight')}>
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <CircleCheck className={cn('size-4', recent && 'animate-check-in')} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-semibold text-ink">{h.concept}</div>
                  <div className="truncate text-xs text-ink-3">Answered {h.answeredAt ? relTime(h.answeredAt).toLowerCase() : ''} · {plural(h.requesterIds.length, 'student')}</div>
                </div>
                <AvatarStack ids={h.requesterIds} max={3} size="xs" />
                {h.answerId
                  ? <IconButton icon={Eye} label={`View answer for ${h.concept}`} size="xs" onClick={() => onViewAnswer(h.answerId!)} />
                  : <span className="size-7" aria-hidden />}
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}

function MiniStat({ icon: Icon, value, label }: { icon: typeof Timer; value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-xl bg-subtle/70 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[17px] font-extrabold leading-none text-ink tabular"><Icon className="size-4 text-emerald-600" />{value}</div>
      <div className="mt-1 text-[11.5px] text-ink-3">{label}</div>
    </div>
  )
}
