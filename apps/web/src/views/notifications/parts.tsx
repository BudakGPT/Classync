import type { ReactNode } from 'react'
import {
  AlarmClock, AlarmClockOff, BellOff, BellRing, CalendarCheck, CalendarClock, CalendarPlus, CheckCheck, Copy, Ellipsis, Eye, Hourglass,
  LayoutDashboard, MessageCircle, PencilLine, Repeat, Send, Trash2, type LucideIcon,
} from 'lucide-react'
import { Badge, ChannelChip, IconButton, Menu, ProgressBar, type MenuItem } from '@/components/ui'
import { fmtDay, fmtLong, fmtTime, timeLeft, urgency, type Urgency } from '@/lib/time'
import { tone as toneOf } from '@/lib/tones'
import type { Delivery, NotificationItem, Tone } from '@/lib/types'
import { cn } from '@/lib/utils'
import { scheduleLabel, type NotificationOps } from './lib'

export interface CardHandlers { preview: (n: NotificationItem) => void; askDelete: (n: NotificationItem) => void; ops: NotificationOps }

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('text-[11px] font-semibold uppercase tracking-wider text-ink-3', className)}>{children}</div>
}

export function MetaCell({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('min-w-0', className)}>
      <Eyebrow className="mb-1">{label}</Eyebrow>
      {children}
    </div>
  )
}

const DELIVERY_CHIP = 'inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-subtle px-1.5 py-0.5 text-xs font-medium text-ink-2'

export function DeliveryChips({ delivery, className }: { delivery: Delivery; className?: string }) {
  const none = !delivery.announcement && !delivery.dm && !delivery.dashboard
  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {delivery.announcement && <ChannelChip name="announcement" />}
      {delivery.dm && <span className={DELIVERY_CHIP}><MessageCircle className="size-3 opacity-70" strokeWidth={2.5} />Direct Message</span>}
      {delivery.dashboard && <span className={DELIVERY_CHIP}><LayoutDashboard className="size-3 opacity-70" strokeWidth={2.5} />Dashboard</span>}
      {none && <span className="text-xs text-ink-3">No channels</span>}
    </div>
  )
}

export function ReminderChips({ reminders, className }: { reminders: string[]; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {reminders.length
        ? reminders.map((r) => <Badge key={r} tone="amber" icon={BellRing} size="xs">{r}</Badge>)
        : <Badge tone="slate" icon={BellOff} size="xs">No reminders</Badge>}
    </div>
  )
}

const URGENCY: Record<Urgency, { tone: Tone; icon: LucideIcon }> = {
  overdue: { tone: 'rose', icon: AlarmClockOff },
  urgent: { tone: 'rose', icon: AlarmClock },
  soon: { tone: 'amber', icon: Hourglass },
  later: { tone: 'emerald', icon: CalendarCheck },
}

export function DeadlineInfo({ iso }: { iso?: string }) {
  if (!iso) return <div className="text-[12.5px] font-medium text-ink-3">No deadline</div>
  const u = urgency(iso)
  const { tone, icon: Icon } = URGENCY[u]
  return (
    <div>
      <div className={cn('flex items-center gap-1.5 text-[12.5px] font-semibold', toneOf(tone).text)}>
        <Icon className="size-3.5 shrink-0" /><span className="truncate">{fmtLong(iso)}</span>
      </div>
      <div className={cn('mt-0.5 text-[11.5px]', u === 'urgent' || u === 'overdue' ? 'font-semibold text-rose-600' : 'text-ink-3')}>{u === 'overdue' ? 'Overdue' : timeLeft(iso)}</div>
    </div>
  )
}

export function ScheduleInfo({ n }: { n: NotificationItem }) {
  const Icon = n.status === 'Sent' ? CheckCheck : n.mode === 'recurring' ? Repeat : n.status === 'Draft' ? PencilLine : CalendarClock
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink">
        <Icon className="size-3.5 shrink-0 text-ink-3" /><span className="truncate">{scheduleLabel(n)}</span>
      </div>
      {n.extras.length > 0 && n.status !== 'Sent' && (
        <div className="mt-0.5 flex items-center gap-1 text-[11.5px] font-medium text-pink-700">
          <CalendarPlus className="size-3 shrink-0" />
          <span className="truncate">Extra · {fmtDay(n.extras[0])} {fmtTime(n.extras[0])}{n.extras.length > 1 ? ` +${n.extras.length - 1}` : ''}</span>
        </div>
      )}
    </div>
  )
}

export function SentStats({ stats, className }: { stats: { delivered: number; read: number }; className?: string }) {
  const pct = stats.delivered ? Math.round((stats.read / stats.delivered) * 100) : 0
  return (
    <div className={cn('w-40', className)}>
      <div className="flex items-baseline justify-between text-[11.5px]">
        <span className="text-ink-3">Read <b className="font-semibold text-ink-2 tabular">{stats.read}</b>/<span className="tabular">{stats.delivered}</span></span>
        <span className="font-bold text-emerald-700 tabular">{pct}%</span>
      </div>
      <ProgressBar value={pct} tone="emerald" size="sm" className="mt-1" label={`${pct}% read`} />
    </div>
  )
}

export function CardMenu({ n, h }: { n: NotificationItem; h: CardHandlers }) {
  const items: MenuItem[] = [
    { label: 'Preview', icon: Eye, onSelect: () => h.preview(n), description: 'Discord, DM & dashboard' },
    { label: 'Duplicate', icon: Copy, onSelect: () => h.ops.duplicate(n) },
    { label: n.status === 'Recurring' ? 'Send this week now' : 'Send now', icon: Send, onSelect: () => h.ops.sendNow(n), disabled: n.status === 'Sent' },
    { label: 'Edit', icon: PencilLine, onSelect: () => h.ops.edit(n) },
    { label: 'Delete', icon: Trash2, onSelect: () => h.askDelete(n), danger: true, divider: true },
  ]
  return <Menu label="Notification" width={230} items={items} trigger={<IconButton icon={Ellipsis} label={`Actions for ${n.title}`} size="sm" />} />
}
