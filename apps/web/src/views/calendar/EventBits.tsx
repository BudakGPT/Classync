import { Users } from 'lucide-react'
import { AvatarStack, Badge } from '@/components/ui'
import { fmtTime } from '@/lib/time'
import { CATEGORY, tone } from '@/lib/tones'
import type { CalEvent } from '@/lib/types'
import { cn } from '@/lib/utils'
import { timeRange, useCal } from './lib'

export const catTone = (e: CalEvent) => tone(CATEGORY[e.category].tone)

export function NewBadge({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex shrink-0 items-center rounded-full bg-brand-600 px-1.5 text-[9.5px] font-bold uppercase leading-4 tracking-wide text-white', className)}>
      New
    </span>
  )
}

/** Group chip for group events, class chip for class events, "All classes" otherwise. */
export function ClassTag({ event, size = 'xs' }: { event: CalEvent; size?: 'xs' | 'sm' }) {
  const { classOf, groupOf } = useCal()
  const g = groupOf(event.groupId)
  if (g) return <Badge tone="teal" icon={Users} size={size}>{g.name}</Badge>
  const c = classOf(event.classId)
  return c ? <Badge tone={c.tone} size={size} dot>{c.name}</Badge> : <Badge tone="slate" size={size}>All classes</Badge>
}

/** Compact month pill: soft category background, colored left border, time + title (+ member faces for groups). */
export function EventPill({ event: e, onOpen }: { event: CalEvent; onOpen?: (e: CalEvent) => void }) {
  const cal = useCal()
  const t = catTone(e)
  const ids = e.groupId ? cal.participants(e) : []
  return (
    <button
      type="button"
      onClick={(ev) => { ev.stopPropagation(); (onOpen ?? cal.open)(e) }}
      title={`${timeRange(e)} · ${e.title}`}
      className={cn(
        'flex h-[22px] w-full min-w-0 items-center gap-1.5 rounded-md border-l-[3px] pl-1.5 pr-1 text-left text-[11.5px] leading-none transition duration-150 hover:shadow-card hover:brightness-[0.97]',
        t.soft, e.isNew && 'ring-2 ring-brand-500 animate-highlight',
      )}
      style={{ borderLeftColor: t.hex }}
    >
      <span className={cn('shrink-0 font-semibold tabular', t.text)}>{fmtTime(e.start)}</span>
      <span className="min-w-0 flex-1 truncate font-semibold text-ink">{e.title}</span>
      {e.isNew
        ? <NewBadge />
        : ids.length > 0 && <AvatarStack ids={ids} max={2} total={Math.min(ids.length, 2)} size="xs" className="-my-1 shrink-0 scale-90" />}
    </button>
  )
}

/** Card in the week/day "Deadlines" all-day row. */
export function DeadlineChip({ event: e, large }: { event: CalEvent; large?: boolean }) {
  const cal = useCal()
  const c = CATEGORY[e.category]
  const t = tone(c.tone)
  return (
    <button
      type="button" onClick={() => cal.open(e)} title={e.title}
      className={cn(
        'flex w-full min-w-0 flex-col gap-0.5 rounded-md border-l-[3px] px-1.5 py-1 text-left transition duration-150 hover:shadow-card hover:brightness-[0.97]',
        t.soft, e.isNew && 'ring-2 ring-brand-500 animate-highlight',
      )}
      style={{ borderLeftColor: t.hex }}
    >
      <span className={cn('flex w-full items-center gap-1 text-[10.5px] font-semibold tabular', t.text)}>
        <c.icon className="size-3 shrink-0" />{fmtTime(e.start)}
        {e.isNew && <NewBadge className="ml-auto" />}
      </span>
      <span className={cn('line-clamp-2 font-semibold leading-snug text-ink', large ? 'text-[13px]' : 'text-[11.5px]')}>{e.title}</span>
    </button>
  )
}
