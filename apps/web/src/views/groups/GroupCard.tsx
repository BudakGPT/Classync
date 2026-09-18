import { Plus, Sparkles } from 'lucide-react'
import { Avatar, AvatarStack, Badge, Card, ChannelChip, DiscordGlyph, IconTile, RoleChip, StatusBadge } from '@/components/ui'
import { navigate } from '@/lib/router'
import { shortName } from '@/lib/selectors'
import { relTime } from '@/lib/time'
import type { Group } from '@/lib/types'
import { cn, plural } from '@/lib/utils'
import { useStore } from '@/store/store'
import { ClassChips, ClassStripe, DurationInfo, GroupMenu, TypeBadge } from './GroupBits'
import { GROUP_TYPES, groupPath } from './meta'

export function GroupCard({ group: g, index, onEdit, onDelete }: { group: Group; index: number; onEdit: (id: string) => void; onDelete: (id: string) => void }) {
  const { person } = useStore()
  const meta = GROUP_TYPES[g.type]
  const archived = g.status === 'Archived'
  const names = g.memberIds.slice(0, 2).map((id) => shortName(person(id))).join(', ')
  const rest = g.memberIds.length - 2

  return (
    // Animations live on the wrapper so they don't override the card's hover lift / shadow.
    <div className={cn('flex rounded-2xl', g.isNew ? 'animate-highlight' : 'animate-rise-in')} style={{ animationDelay: g.isNew ? undefined : `${Math.min(index, 8) * 40}ms` }}>
      <Card
        interactive onClick={() => navigate(groupPath(g.id))} aria-label={`Open ${g.name}`}
        className={cn('flex w-full flex-col overflow-hidden', g.isNew && 'border-brand-300', archived && 'bg-surface/70')}
      >
        <ClassStripe classIds={g.classIds} muted={archived} />
        <div className="flex flex-1 flex-col p-4">
          <div className="flex items-start gap-3">
            <IconTile icon={meta.icon} tone={archived ? 'slate' : meta.tone} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className={cn('truncate text-[15px] font-bold tracking-tight', archived ? 'text-ink-2' : 'text-ink')}>{g.name}</h3>
                {g.isNew && <Badge tone="brand" icon={Sparkles} size="xs">New</Badge>}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1">
                <TypeBadge type={g.type} muted={archived} />
                <ClassChips group={g} />
              </div>
            </div>
            <GroupMenu group={g} onEdit={onEdit} onDelete={onDelete} withOpen />
          </div>

          {g.description && <p className="mt-3 line-clamp-2 text-[12.5px] leading-relaxed text-ink-3">{g.description}</p>}

          <div className={cn('mt-4 flex items-center justify-between gap-3', archived && 'opacity-70 grayscale-[40%]')}>
            <AvatarStack ids={g.memberIds} size="md" max={5} />
            <div className="min-w-0 text-right">
              <div className="text-[13px] font-bold text-ink tabular">{plural(g.memberIds.length, 'member')}</div>
              <div className="truncate text-[11.5px] text-ink-3">{names}{rest > 0 && ` +${rest}`}</div>
            </div>
          </div>

          <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
            <DiscordGlyph className={cn('mr-0.5 size-4', archived ? 'text-ink-3' : 'text-discord')} aria-hidden />
            <RoleChip name={g.role} tone={archived ? 'slate' : 'teal'} />
            {g.text.map((c) => <ChannelChip key={c} name={c} />)}
            {g.voice.map((c) => <ChannelChip key={c} name={c} voice />)}
          </div>

          <div className="mt-auto pt-4"><DurationInfo group={g} /></div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-line px-4 py-2.5">
          <div className="flex min-w-0 items-center gap-2 text-[11.5px] text-ink-3">
            <Avatar id={g.createdBy} size="xs" />
            <span className="truncate"><span className="font-semibold text-ink-2">{shortName(person(g.createdBy))}</span> created · {relTime(g.createdAt)}</span>
          </div>
          <StatusBadge status={g.status} size="xs" />
        </div>
      </Card>
    </div>
  )
}

/** Dashed "start a group" tile that closes the grid. */
export function NewGroupTile({ onCreate, index }: { onCreate: () => void; index: number }) {
  return (
    <button
      type="button" onClick={onCreate} style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
      className="group flex min-h-[280px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line-strong bg-surface/40 p-6 text-center transition duration-200 animate-rise-in hover:border-brand-300 hover:bg-brand-50/40 active:scale-[0.99]"
    >
      <span className="relative">
        <AvatarStack ids={['haekal', 'malik', 'helven', 'dylan']} size="lg" />
        <span className="absolute -bottom-1 -right-2 grid size-7 place-items-center rounded-full bg-brand-600 text-white ring-4 ring-canvas transition duration-200 group-hover:scale-110">
          <Plus className="size-4" strokeWidth={2.75} />
        </span>
      </span>
      <span className="mt-5 text-[14px] font-bold text-ink">Start a new group</span>
      <span className="mt-1 max-w-[250px] text-[12.5px] leading-relaxed text-ink-3">Pick students and Classync sets up the Discord role and channels for them.</span>
    </button>
  )
}
