import type { ReactNode } from 'react'
import { Clock3, Unplug } from 'lucide-react'
import { Badge, DiscordGlyph } from '@/components/ui'
import { tone } from '@/lib/tones'
import { timeLeft, urgency } from '@/lib/time'
import type { ClassRoom, Tone } from '@/lib/types'
import { cn } from '@/lib/utils'

const MARK = { sm: 'size-8 rounded-lg text-sm', md: 'size-12 rounded-2xl text-xl', lg: 'size-[72px] rounded-[22px] text-[34px]' }

/** Class letter tile in the class tone. */
export function ClassMark({ cls, size = 'md', className }: { cls: Pick<ClassRoom, 'id' | 'tone'>; size?: keyof typeof MARK; className?: string }) {
  const t = tone(cls.tone)
  return (
    <span
      aria-hidden
      className={cn('grid shrink-0 place-items-center font-extrabold leading-none text-white', t.solid, MARK[size], className)}
      style={{ boxShadow: `inset 0 1px 0 rgb(255 255 255 / 0.28), 0 10px 22px -10px ${t.hex}` }}
    >
      {cls.id}
    </span>
  )
}

export const Eyebrow = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn('text-[11px] font-semibold uppercase tracking-wider text-ink-3', className)}>{children}</div>
)

/** Pulsing "Lecture live" pill. */
export function LiveBadge({ label = 'Lecture live' }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11.5px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
      <span className="relative size-1.5">
        <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping-soft" />
        <span className="absolute inset-0 rounded-full bg-emerald-500" />
      </span>
      {label}
    </span>
  )
}

export function DiscordStatus({ connected, className }: { connected: boolean; className?: string }) {
  return connected ? (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full bg-discord/10 px-2 py-0.5 text-[11.5px] font-semibold text-discord ring-1 ring-inset ring-discord/20', className)}>
      <DiscordGlyph className="size-3.5" />Discord connected
    </span>
  ) : (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full bg-subtle px-2 py-0.5 text-[11.5px] font-semibold text-ink-3 ring-1 ring-inset ring-line-strong', className)}>
      <Unplug className="size-3.5" />Not connected
    </span>
  )
}

const URGENCY_TONE: Record<string, Tone> = { overdue: 'slate', urgent: 'rose', soon: 'amber', later: 'slate' }

/** '1 day left' in an urgency tone, 'Closed' once passed. */
export function DueBadge({ iso }: { iso: string }) {
  const u = urgency(iso)
  return <Badge tone={URGENCY_TONE[u]} icon={Clock3} size="xs">{u === 'overdue' ? 'Closed' : timeLeft(iso)}</Badge>
}

export const PresenceDot = ({ className }: { className?: string }) => (
  <span className={cn('relative inline-block size-2 shrink-0', className)} aria-hidden>
    <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping-soft" />
    <span className="absolute inset-0 rounded-full bg-emerald-500" />
  </span>
)
