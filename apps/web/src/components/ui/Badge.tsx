import type { ReactNode } from 'react'
import {
  Archive, BadgeCheck, CalendarClock, CheckCheck, Circle, CircleCheck, CircleDot, CircleMinus, Clock3, Flame, Hash, LifeBuoy,
  Loader, PencilLine, Plane, Repeat, SignalHigh, SignalLow, Unplug, Volume2, type LucideIcon,
} from 'lucide-react'
import { CATEGORY, tone as toneOf } from '@/lib/tones'
import type { EventCategory, Tone } from '@/lib/types'
import { cn } from '@/lib/utils'

export function Badge({ tone = 'slate', icon: Icon, children, className, size = 'sm', dot }: {
  tone?: Tone; icon?: LucideIcon; children: ReactNode; className?: string; size?: 'xs' | 'sm' | 'md'; dot?: boolean
}) {
  const t = toneOf(tone)
  return (
    <span className={cn(
      'inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full font-semibold ring-1 ring-inset',
      size === 'xs' ? 'px-1.5 py-px text-[10.5px]' : size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11.5px]',
      t.soft, t.text, t.ring, className,
    )}>
      {dot && <span className={cn('size-1.5 rounded-full', t.dot)} />}
      {Icon && <Icon className={size === 'xs' ? 'size-3' : 'size-3.5'} strokeWidth={2.25} />}
      {children}
    </span>
  )
}

const STATUS: Record<string, { tone: Tone; icon: LucideIcon; label?: string }> = {
  Verified: { tone: 'emerald', icon: BadgeCheck },
  Pending: { tone: 'amber', icon: Clock3 },
  'Not Connected': { tone: 'slate', icon: Unplug },
  Scheduled: { tone: 'sky', icon: CalendarClock },
  Sent: { tone: 'emerald', icon: CheckCheck },
  Recurring: { tone: 'violet', icon: Repeat },
  Draft: { tone: 'slate', icon: PencilLine },
  Active: { tone: 'emerald', icon: CircleDot },
  Archived: { tone: 'slate', icon: Archive },
  Inactive: { tone: 'slate', icon: CircleMinus },
  'On Leave': { tone: 'amber', icon: Plane },
  open: { tone: 'amber', icon: CircleDot, label: 'Open' },
  answered: { tone: 'emerald', icon: CircleCheck, label: 'Answered' },
  High: { tone: 'rose', icon: Flame },
  Medium: { tone: 'amber', icon: SignalHigh },
  Low: { tone: 'slate', icon: SignalLow },
  completed: { tone: 'emerald', icon: CircleCheck, label: 'Completed' },
  in_progress: { tone: 'sky', icon: Loader, label: 'In progress' },
  stuck: { tone: 'rose', icon: LifeBuoy, label: 'Stuck' },
  not_started: { tone: 'slate', icon: Circle, label: 'Not started' },
}

/** Icon + label badge for any known status string (verification, notification, group, priority, task state...). */
export function StatusBadge({ status, size, className }: { status: string; size?: 'xs' | 'sm' | 'md'; className?: string }) {
  const s = STATUS[status] ?? { tone: 'slate' as Tone, icon: Circle }
  return <Badge tone={s.tone} icon={s.icon} size={size} className={className}>{s.label ?? status}</Badge>
}

export function CategoryBadge({ category, size, className }: { category: EventCategory; size?: 'xs' | 'sm' | 'md'; className?: string }) {
  const c = CATEGORY[category]
  return <Badge tone={c.tone} icon={c.icon} size={size} className={className}>{category}</Badge>
}

/** Rounded square icon tile in a category/tone color. */
export function IconTile({ icon: Icon, tone = 'brand', size = 'md', className }: { icon: LucideIcon; tone?: Tone; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const t = toneOf(tone)
  return (
    <span className={cn('grid shrink-0 place-items-center', t.soft, t.text, size === 'sm' ? 'size-7 rounded-lg' : size === 'lg' ? 'size-11 rounded-2xl' : 'size-9 rounded-xl', className)}>
      <Icon className={size === 'sm' ? 'size-3.5' : size === 'lg' ? 'size-5' : 'size-[18px]'} />
    </span>
  )
}

/** Discord channel chip: '# announcement' or '🔊 voice-class'. */
export function ChannelChip({ name, voice, className, tone }: { name: string; voice?: boolean; className?: string; tone?: 'default' | 'new' }) {
  const Icon = voice ? Volume2 : Hash
  return (
    <span className={cn(
      'inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-xs font-medium',
      tone === 'new' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200' : 'bg-subtle text-ink-2',
      className,
    )}>
      <Icon className="size-3 opacity-70" strokeWidth={2.5} />{name}
    </span>
  )
}

/** Discord role pill: '@Class-B'. */
export function RoleChip({ name, tone = 'brand', count, className }: { name: string; tone?: Tone; count?: number; className?: string }) {
  const t = toneOf(tone)
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold', t.soft, t.text, className)}>
      <span className={cn('size-2 rounded-full', t.dot)} />
      {name}
      {count != null && <span className="font-medium opacity-70 tabular">{count}</span>}
    </span>
  )
}
