import { ArrowRight, CalendarClock, Hash, MessageCircle } from 'lucide-react'
import { AvatarStack, Button, Card } from '@/components/ui'
import { navigate } from '@/lib/router'
import { audienceIds, audienceLabel } from '@/lib/selectors'
import { fmtTime, now } from '@/lib/time'
import { CATEGORY, tone as toneOf } from '@/lib/tones'
import type { NotificationItem } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'
import { dayWord, nextSend, untilLabel } from './lib'

/** Mini timeline of the next automatic sends (scheduled + next recurring occurrence). */
export function UpNext({ onSelect, className }: { onSelect: (n: NotificationItem) => void; className?: string }) {
  const { data } = useStore()
  const items = data.notifications
    .map((n) => ({ n, at: nextSend(n) }))
    .filter((x): x is { n: NotificationItem; at: Date } => !!x.at)
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .slice(0, 4)

  return (
    <Card className={cn('flex flex-col p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-bold tracking-tight text-ink">Up next</h2>
          <p className="text-xs text-ink-3">Automatic sends queued by Classync</p>
        </div>
        <Button size="xs" variant="ghost" iconRight={ArrowRight} onClick={() => navigate('/calendar')}>Calendar</Button>
      </div>

      <ol className="relative mt-3 flex-1">
        <span className="absolute bottom-3 left-[67px] top-3 w-px bg-line" aria-hidden />
        <li className="grid grid-cols-[52px_14px_1fr] items-center gap-3 px-2 py-1">
          <span className="text-right text-[11.5px] font-semibold text-brand-700 tabular">{fmtTime(now().toISOString())}</span>
          <span className="relative mx-auto grid size-3.5 place-items-center">
            <span className="absolute inset-0 rounded-full bg-brand-400 animate-ping-soft" />
            <span className="relative size-2.5 rounded-full bg-brand-600 ring-2 ring-white" />
          </span>
          <span className="text-[11.5px] font-semibold uppercase tracking-wider text-brand-700">Now</span>
        </li>
        {items.map(({ n, at }, i) => {
          const c = CATEGORY[n.category]
          const Icon = c.icon
          return (
            <li key={n.id} className="animate-rise-in" style={{ animationDelay: `${i * 50}ms` }}>
              <button
                type="button" onClick={() => onSelect(n)}
                className="grid w-full grid-cols-[52px_14px_1fr_auto] items-center gap-3 rounded-xl px-2 py-2 text-left transition hover:bg-subtle focus-visible:bg-subtle"
              >
                <span className="text-right leading-tight">
                  <span className="block text-[13px] font-bold text-ink tabular">{fmtTime(at.toISOString())}</span>
                  <span className="block text-[11px] text-ink-3">{dayWord(at)}</span>
                </span>
                <span className={cn('mx-auto size-2.5 rounded-full ring-4 ring-white', toneOf(c.tone).dot)} />
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5">
                    <Icon className={cn('size-3.5 shrink-0', toneOf(c.tone).text)} />
                    <span className="truncate text-[13px] font-semibold text-ink">{n.title}</span>
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-ink-3">
                    <span className="truncate">{audienceLabel(n.audience, data)}</span>
                    {n.delivery.announcement && <Hash className="size-3 shrink-0" aria-label="announcement channel" />}
                    {n.delivery.dm && <MessageCircle className="size-3 shrink-0" aria-label="direct message" />}
                    <span className="shrink-0">· {n.status === 'Recurring' ? 'weekly' : untilLabel(at)}</span>
                  </span>
                </span>
                <AvatarStack ids={audienceIds(n.audience, data)} max={3} size="xs" />
              </button>
            </li>
          )
        })}
        {items.length === 0 && (
          <li className="flex items-center gap-2 px-2 py-6 text-[13px] text-ink-3"><CalendarClock className="size-4" />Nothing queued — schedule a notification to see it here.</li>
        )}
      </ol>
    </Card>
  )
}
