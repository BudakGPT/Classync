import { BellRing, Cog, GraduationCap, LifeBuoy, ListChecks, School, Users, type LucideIcon } from 'lucide-react'
import { Avatar, DiscordGlyph } from '@/components/ui'
import { shortName } from '@/lib/selectors'
import { tone as toneOf } from '@/lib/tones'
import { now, relTime } from '@/lib/time'
import type { Activity, ActivityType, Tone } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'

export const ACTIVITY_META: Record<ActivityType, { label: string; icon: LucideIcon | typeof DiscordGlyph; tone: Tone }> = {
  students: { label: 'Students', icon: GraduationCap, tone: 'sky' },
  classes: { label: 'Classes', icon: School, tone: 'brand' },
  groups: { label: 'Groups', icon: Users, tone: 'teal' },
  notifications: { label: 'Notifications', icon: BellRing, tone: 'amber' },
  discord: { label: 'Discord', icon: DiscordGlyph, tone: 'violet' },
  system: { label: 'System', icon: Cog, tone: 'slate' },
  assignments: { label: 'Assignments', icon: ListChecks, tone: 'emerald' },
  help: { label: 'Help', icon: LifeBuoy, tone: 'rose' },
}

/** One feed row: avatar with type badge · "Actor action target" · detail · relative time. Fresh items glow briefly. */
export function ActivityItem({ activity: a, compact, className }: { activity: Activity; compact?: boolean; className?: string }) {
  const { person } = useStore()
  const meta = ACTIVITY_META[a.type]
  const Icon = meta.icon
  const fresh = now().getTime() - new Date(a.at).getTime() < 90_000
  const actor = a.actorId === 'classync' ? 'Classync' : shortName(person(a.actorId))
  return (
    <div className={cn('flex items-start gap-3 rounded-xl', fresh && 'animate-highlight', className)}>
      <span className="relative shrink-0">
        <Avatar id={a.actorId} size={compact ? 'md' : 'lg'} tooltip />
        <span className={cn('absolute -bottom-1 -right-1 grid size-[18px] place-items-center rounded-full ring-2 ring-white', toneOf(meta.tone).soft, toneOf(meta.tone).text)}>
          <Icon className="size-2.5" />
        </span>
      </span>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className="text-[13px] leading-snug text-ink-2">
          <span className="font-semibold text-ink">{actor}</span> {a.action}{a.target && <> <span className="font-semibold text-ink">{a.target}</span></>}
        </p>
        {a.detail && !compact && <p className="mt-0.5 truncate text-xs text-ink-3">{a.detail}</p>}
        <p className={cn('mt-0.5 text-[11.5px]', fresh ? 'font-semibold text-brand-600' : 'text-ink-3')}>{relTime(a.at)}</p>
      </div>
    </div>
  )
}
