import { ShieldCheck, Sparkles } from 'lucide-react'
import { Badge, DiscordGlyph, Tooltip } from '@/components/ui'
import type { ClassId, MemberStatus, Person } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'
import { classTone, currentTasks, taughtClasses } from './lib'

export function ClassChip({ classId, size = 'sm' }: { classId?: ClassId; size?: 'xs' | 'sm' }) {
  const { data } = useStore()
  if (!classId) return <span className="text-[12.5px] text-ink-3">—</span>
  return <Badge tone={classTone(data, classId)} dot size={size}>Class {classId}</Badge>
}

/** Students: their class. Staff: the classes they teach (or a dash). */
export function ClassCell({ p }: { p: Person }) {
  const { data } = useStore()
  if (p.role === 'Student') return <ClassChip classId={p.classId} />
  const taught = taughtClasses(data, p.id)
  if (!taught.length) return <span className="text-[12.5px] text-ink-3">—</span>
  return (
    <Tooltip content={`Teaches ${taught.map((c) => c.name).join(', ')}`}>
      <span className="flex gap-1">
        {taught.map((c) => <Badge key={c.id} tone={c.tone} size="xs">{c.id}</Badge>)}
      </span>
    </Tooltip>
  )
}

export const NewBadge = () => <Badge tone="brand" size="xs" icon={Sparkles}>New</Badge>
export const AdminBadge = () => <Badge tone="violet" size="xs" icon={ShieldCheck}>Admin</Badge>

export function RoleCell({ p }: { p: Person }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn('whitespace-nowrap text-[12.5px] font-medium', p.role === 'Student' ? 'text-ink-2' : 'text-ink')}>{p.role}</span>
      {p.isAdmin && <AdminBadge />}
    </span>
  )
}

const DOT: Record<MemberStatus, string> = { Active: 'bg-emerald-500', Inactive: 'bg-slate-400', 'On Leave': 'bg-amber-500' }
export function StatusDot({ status }: { status: MemberStatus }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[12.5px] font-medium text-ink-2">
      <span className={cn('size-1.5 rounded-full', DOT[status])} />{status}
    </span>
  )
}

export function DiscordHandle({ p, className }: { p: Person; className?: string }) {
  if (!p.discord) return <span className={cn('text-[12.5px] text-ink-3', className)}>—</span>
  return (
    <span className={cn('inline-flex min-w-0 items-center gap-1.5 text-[12.5px] font-medium text-ink-2', className)}>
      <DiscordGlyph className="size-3.5 shrink-0 text-discord" />
      <span className="truncate">{p.discord}</span>
    </span>
  )
}

export function TaskIndicator({ p }: { p: Person }) {
  const { data } = useStore()
  if (p.role !== 'Student') return <span className="text-[12.5px] text-ink-3">—</span>
  const tasks = currentTasks(data, p)
  if (!tasks.length) return <span className="text-[12.5px] text-ink-3">None</span>
  const stuck = tasks.filter((t) => t.state === 'stuck').length
  const busy = tasks.length - stuck
  return (
    <Tooltip content={tasks.map((t) => `${t.assignment.title} · ${t.state === 'stuck' ? 'stuck' : 'in progress'}`).join('\n')}>
      <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-ink tabular" aria-label={`${busy} in progress, ${stuck} stuck`}>
        <span className="flex items-end gap-[3px]" aria-hidden>
          {tasks.map((t, i) => <span key={i} className={cn('h-3.5 w-1 rounded-full', t.state === 'stuck' ? 'bg-rose-500' : 'bg-sky-500')} />)}
        </span>
        {tasks.length}
        {stuck > 0 && <span className="text-[11px] font-semibold text-rose-600">{stuck} stuck</span>}
      </span>
    </Tooltip>
  )
}
