import { Archive, ArchiveRestore, CalendarRange, Download, Ellipsis, Infinity as InfinityIcon, PanelRightOpen, PencilLine, Trash2 } from 'lucide-react'
import { Badge, IconButton, Menu, ProgressBar } from '@/components/ui'
import { navigate } from '@/lib/router'
import { timeLeft } from '@/lib/time'
import { tone } from '@/lib/tones'
import type { ClassId, Group, GroupType, Tone } from '@/lib/types'
import { cn, plural } from '@/lib/utils'
import { useActions } from '@/store/actions'
import { useStore } from '@/store/store'
import { GROUP_TYPES, groupPath, shortDate, timeline } from './meta'

export function useClassTone() {
  const { data } = useStore()
  return (id?: ClassId): Tone => data.classes.find((c) => c.id === id)?.tone ?? 'slate'
}

export function TypeBadge({ type, size = 'xs', muted }: { type: GroupType; size?: 'xs' | 'sm'; muted?: boolean }) {
  const m = GROUP_TYPES[type]
  return <Badge tone={muted ? 'slate' : m.tone} icon={m.icon} size={size}>{type}</Badge>
}

/** 'Class B' or 'Cross-class (A)(B)(C)(D)' with each class in its own color. */
export function ClassChips({ group }: { group: Pick<Group, 'scope' | 'classIds'> }) {
  const classTone = useClassTone()
  if (group.scope === 'single' || group.classIds.length < 2) {
    return <Badge tone={classTone(group.classIds[0])} dot size="xs">Class {group.classIds[0]}</Badge>
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-subtle py-px pl-2 pr-0.5 text-[10.5px] font-semibold text-ink-2 ring-1 ring-inset ring-line" aria-label={`Cross-class: Classes ${group.classIds.join(', ')}`}>
      Cross-class
      <span className="flex gap-0.5" aria-hidden>
        {group.classIds.map((c) => (
          <span key={c} className={cn('grid size-[15px] place-items-center rounded-full text-[9px] font-bold text-white', tone(classTone(c)).solid)}>{c}</span>
        ))}
      </span>
    </span>
  )
}

/** Thin top stripe: one color per class the group spans. */
export function ClassStripe({ classIds, muted, className }: { classIds: ClassId[]; muted?: boolean; className?: string }) {
  const classTone = useClassTone()
  return (
    <div className={cn('flex h-1', className)} aria-hidden>
      {classIds.map((c) => <span key={c} className={cn('flex-1', muted ? 'bg-line-strong' : tone(classTone(c)).solid)} />)}
    </div>
  )
}

export function DurationInfo({ group }: { group: Group }) {
  const t = timeline(group)
  if (group.duration === 'Permanent' || !t) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-ink-3">
        <InfinityIcon className="size-3.5" /><span className="font-semibold text-ink-2">Permanent</span> · no end date
      </div>
    )
  }
  const soon = !t.ended && t.daysLeft <= 3
  const muted = t.ended || group.status === 'Archived'
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="flex items-center gap-1.5 text-ink-3"><CalendarRange className="size-3.5" />{t.range}</span>
        <span className={cn('font-semibold tabular', soon ? 'text-amber-700' : 'text-ink-2')}>{t.ended ? `Ended ${shortDate(group.endDate!)}` : timeLeft(group.endDate!)}</span>
      </div>
      <ProgressBar value={t.pct} tone={muted ? 'slate' : soon ? 'amber' : 'teal'} size="sm" className="mt-1.5" label={`${t.pct}% of the group duration elapsed`} />
    </div>
  )
}

/** Archive/restore + export with feedback. */
export function useGroupOps() {
  const { toast } = useStore()
  const actions = useActions()
  return {
    archive(g: Group) {
      actions.archiveGroup(g.id)
      toast(g.status === 'Archived'
        ? { title: `${g.name} restored`, description: `${g.role} and its channels are open again`, tone: 'success' }
        : { title: `${g.name} archived`, description: 'Discord channels are now read-only for members', tone: 'info' })
    },
    exportGroup(g: Group) {
      toast({ title: `${g.name} exported`, description: `${plural(g.memberIds.length, 'member')} with NPM & Discord handles · ${g.id}.csv`, tone: 'success' })
    },
  }
}

export function GroupMenu({ group: g, onEdit, onDelete, withOpen }: { group: Group; onEdit: (id: string) => void; onDelete: (id: string) => void; withOpen?: boolean }) {
  const ops = useGroupOps()
  const archived = g.status === 'Archived'
  return (
    <Menu
      label="Group actions" width={210}
      trigger={<IconButton icon={Ellipsis} label={`Actions for ${g.name}`} size="sm" tooltip={false} />}
      items={[
        ...(withOpen ? [{ label: 'Open', icon: PanelRightOpen, onSelect: () => navigate(groupPath(g.id)) }] : []),
        { label: 'Edit', icon: PencilLine, description: 'Rename or change members', onSelect: () => onEdit(g.id) },
        { label: 'Export', icon: Download, onSelect: () => ops.exportGroup(g) },
        { label: archived ? 'Restore' : 'Archive', icon: archived ? ArchiveRestore : Archive, onSelect: () => ops.archive(g) },
        { label: 'Delete', icon: Trash2, danger: true, divider: true, onSelect: () => onDelete(g.id) },
      ]}
    />
  )
}
