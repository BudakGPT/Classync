import type { ReactNode } from 'react'
import { GraduationCap, UsersRound } from 'lucide-react'
import { AvatarStack, Card, DiscordGlyph, IconTile } from '@/components/ui'
import { relTime, urgency } from '@/lib/time'
import { plural } from '@/lib/utils'
import { useStore } from '@/store/store'

function Stat({ icon, value, label, sub, trailing }: { icon: ReactNode; value: number; label: string; sub: ReactNode; trailing?: ReactNode }) {
  return (
    <div className="flex items-center gap-3.5 px-5 py-4">
      {icon}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-[24px] font-extrabold leading-none tracking-tight text-ink tabular">{value}</span>
          <span className="truncate text-[13px] font-semibold text-ink-2">{label}</span>
        </div>
        <div className="mt-1 truncate text-xs text-ink-3">{sub}</div>
      </div>
      {trailing}
    </div>
  )
}

export function GroupStats() {
  const { data } = useStore()
  const active = data.groups.filter((g) => g.status === 'Active')
  const memberIds = [...new Set(active.flatMap((g) => g.memberIds))]
  const channels = active.reduce((n, g) => n + g.text.length + g.voice.length, 0)
  const cross = active.filter((g) => g.scope === 'cross').length
  const ending = active.filter((g) => g.endDate && urgency(g.endDate) !== 'later' && urgency(g.endDate) !== 'overdue').length
  const classes = new Set(active.flatMap((g) => g.classIds)).size

  return (
    <Card className="hero-gradient grid grid-cols-1 divide-y divide-line overflow-hidden md:grid-cols-3 md:divide-x md:divide-y-0">
      <Stat
        icon={<IconTile icon={UsersRound} tone="teal" />}
        value={active.length} label="Active groups"
        sub={`${cross} cross-class · ${ending} ending this week`}
      />
      <Stat
        icon={<IconTile icon={GraduationCap} tone="brand" />}
        value={memberIds.length} label="Students in groups"
        sub={`Across ${plural(classes, 'class', 'classes')}`}
        trailing={<AvatarStack ids={memberIds} max={5} size="sm" />}
      />
      <Stat
        icon={<span className="grid size-9 shrink-0 place-items-center rounded-xl bg-discord/10 text-discord"><DiscordGlyph className="size-[18px]" aria-hidden /></span>}
        value={channels} label="Discord channels"
        sub={`${plural(active.length, 'group role')} · synced ${relTime(data.discord.lastSync)}`}
      />
    </Card>
  )
}
