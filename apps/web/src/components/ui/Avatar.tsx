import type { CSSProperties, ReactNode } from 'react'
import { avatarUri } from '@/lib/avatar'
import type { Presence } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'
import { ClassyncMark } from './Brand'
import { Tooltip } from './Overlay'

export const AVATAR_PX = { xs: 20, sm: 24, md: 32, lg: 40, xl: 56, '2xl': 80 } as const
export type AvatarSize = keyof typeof AVATAR_PX

const PRESENCE: Record<Presence, string> = { online: 'bg-emerald-500', idle: 'bg-amber-400', offline: 'bg-slate-300' }

/**
 * Illustrated avatar for a person id ('classync' renders the system bot).
 * presence: show status dot · pulse: animate the dot when online · tooltip: show name on hover.
 */
export function Avatar({ id, name, size = 'md', presence, pulse, tooltip, className }: {
  id: string; name?: string; size?: AvatarSize; presence?: boolean; pulse?: boolean; tooltip?: boolean; className?: string
}) {
  const { person } = useStore()
  const p = person(id)
  const px = AVATAR_PX[size]
  const dot = Math.max(8, Math.round(px * 0.28))
  const node = (
    <span className={cn('relative inline-flex shrink-0 rounded-full', className)} style={{ width: px, height: px }}>
      {id === 'classync'
        ? <ClassyncMark size={px} className="rounded-full" />
        : <img src={avatarUri(id, p?.name ?? name)} alt={p?.name ?? name ?? ''} width={px} height={px} draggable={false} className="block size-full rounded-full bg-subtle" />}
      {presence && p && (
        <span className="absolute -bottom-px -right-px" style={{ width: dot, height: dot }} aria-label={p.presence}>
          {pulse && p.presence === 'online' && <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping-soft" />}
          <span className={cn('absolute inset-0 rounded-full ring-2 ring-white', PRESENCE[p.presence])} />
        </span>
      )}
    </span>
  )
  return tooltip ? <Tooltip content={id === 'classync' ? 'Classync Bot' : p?.name ?? name}>{node}</Tooltip> : node
}

/** Overlapping avatars; spreads slightly on hover; each shows its name in a tooltip. */
export function AvatarStack({ ids, max = 4, size = 'sm', total, className, onClick, ringClass = 'ring-white' }: {
  ids: string[]; max?: number; size?: AvatarSize; total?: number; className?: string; onClick?: () => void; ringClass?: string
}) {
  const { person } = useStore()
  const shown = ids.slice(0, max)
  const count = total ?? ids.length
  const extra = Math.max(0, count - shown.length)
  const px = AVATAR_PX[size]
  const overlap = Math.round(px * 0.32)
  const restNames = ids.slice(max).map((id) => person(id)?.name).filter(Boolean) as string[]
  const restLabel = restNames.length
    ? `${restNames.slice(0, 5).join(', ')}${extra > 5 ? ` +${extra - 5} more` : ''}`
    : `${extra} more`

  return (
    <div className={cn('group/stack flex items-center', onClick && 'cursor-pointer', className)} onClick={onClick} aria-label={`${count} people`} role="group">
      {shown.map((id, i) => (
        <span
          key={id}
          className="relative transition-transform duration-200 ease-out group-hover/stack:translate-x-[var(--spread)] hover:z-10 hover:-translate-y-0.5"
          style={{ marginLeft: i ? -overlap : 0, '--spread': `${i * 3}px` } as CSSProperties}
        >
          <Tooltip content={person(id)?.name ?? 'Student'}>
            <span className={cn('block rounded-full ring-2', ringClass)}><Avatar id={id} size={size} /></span>
          </Tooltip>
        </span>
      ))}
      {extra > 0 && (
        <span className="relative transition-transform duration-200 ease-out group-hover/stack:translate-x-[var(--spread)]" style={{ marginLeft: -overlap, '--spread': `${shown.length * 3}px` } as CSSProperties}>
          <Tooltip content={restLabel}>
            <span className={cn('grid place-items-center rounded-full bg-subtle font-semibold text-ink-2 ring-2 tabular', ringClass)} style={{ width: px, height: px, fontSize: Math.max(9, Math.round(px * 0.36)) }}>
              +{extra}
            </span>
          </Tooltip>
        </span>
      )}
    </div>
  )
}

const ANON_BG = ['bg-brand-300', 'bg-sky-300', 'bg-teal-300', 'bg-violet-300', 'bg-amber-300', 'bg-pink-300']

/** Privacy-preserving stack: silhouettes instead of faces. */
export function AnonStack({ count, max = 5, size = 'sm', className }: { count: number; max?: number; size?: AvatarSize; className?: string }) {
  const px = AVATAR_PX[size]
  const overlap = Math.round(px * 0.32)
  return (
    <div className={cn('flex items-center', className)} role="img" aria-label={`${count} anonymous students`}>
      {Array.from({ length: Math.min(count, max) }, (_, i) => (
        <span key={i} className={cn('grid place-items-center overflow-hidden rounded-full ring-2 ring-white', ANON_BG[i % ANON_BG.length])} style={{ width: px, height: px, marginLeft: i ? -overlap : 0 }}>
          <svg viewBox="0 0 24 24" className="mt-[22%] size-[78%] text-white/95" fill="currentColor" aria-hidden>
            <circle cx="12" cy="8" r="4.2" /><path d="M3.5 22c0-4.8 3.8-8.2 8.5-8.2s8.5 3.4 8.5 8.2z" />
          </svg>
        </span>
      ))}
      {count > max && (
        <span className="grid place-items-center rounded-full bg-subtle font-semibold text-ink-2 ring-2 ring-white tabular" style={{ width: px, height: px, marginLeft: -overlap, fontSize: Math.max(9, Math.round(px * 0.36)) }}>+{count - max}</span>
      )}
    </div>
  )
}

/** Avatar + name + optional subtitle — the standard "person row". */
export function PersonLine({ id, subtitle, size = 'md', presence, trailing, className, onClick }: {
  id: string; subtitle?: ReactNode; size?: AvatarSize; presence?: boolean; trailing?: ReactNode; className?: string; onClick?: () => void
}) {
  const { person } = useStore()
  const p = person(id)
  return (
    <div className={cn('flex min-w-0 items-center gap-2.5', onClick && 'cursor-pointer', className)} onClick={onClick}>
      <Avatar id={id} size={size} presence={presence} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-semibold text-ink">{id === 'classync' ? 'Classync Bot' : p?.name ?? id}</div>
        {subtitle && <div className="truncate text-xs text-ink-3">{subtitle}</div>}
      </div>
      {trailing}
    </div>
  )
}
