import type { ReactNode } from 'react'
import { BadgeCheck, LifeBuoy, ListChecks, Lock, Unplug, type LucideIcon } from 'lucide-react'
import { AnonStack, AvatarStack, Button, Card, CardHeader, EmptyState, IconTile } from '@/components/ui'
import { navigate } from '@/lib/router'
import { idsWithState, isVisibleCluster, students } from '@/lib/selectors'
import type { Tone } from '@/lib/types'
import { useStore } from '@/store/store'

interface Item { key: string; icon: LucideIcon; tone: Tone; title: ReactNode; subtitle: ReactNode; visual: ReactNode; cta: string; to: string }

export function Attention() {
  const { data } = useStore()
  const items: Item[] = []

  const cluster = data.helpClusters.filter((h) => h.status === 'open' && isVisibleCluster(h, data.settings.privacyThreshold)).sort((a, b) => b.reports - a.reports)[0]
  if (cluster) items.push({
    key: 'help', icon: LifeBuoy, tone: 'rose', cta: 'Respond', to: '/help',
    title: cluster.concept,
    subtitle: <span className="inline-flex items-center gap-1"><Lock className="size-3" />{cluster.reports} students experiencing this issue</span>,
    visual: <AnonStack count={cluster.reports} max={3} size="xs" />,
  })

  const pending = students(data.people).filter((p) => p.verification === 'Pending').sort((a, b) => Number(!!b.featured) - Number(!!a.featured))
  if (pending.length) items.push({
    key: 'verify', icon: BadgeCheck, tone: 'amber', cta: 'Review', to: '/database',
    title: `${pending.length} awaiting verification`,
    subtitle: `${pending[0].name.split(' ')[0]} and others joined Discord`,
    visual: <AvatarStack ids={pending.map((p) => p.id)} max={3} size="xs" />,
  })

  const ml = data.assignments.find((a) => a.id === 'ml-assignment')
  const stuck = ml ? idsWithState(ml, 'stuck') : []
  if (ml && stuck.length) items.push({
    key: 'stuck', icon: ListChecks, tone: 'brand', cta: 'Open', to: `/assignments/${ml.id}?tab=students`,
    title: `${stuck.length} stuck on ML Assignment`,
    subtitle: 'Due tomorrow · Class B',
    visual: <AvatarStack ids={stuck} max={3} size="xs" />,
  })

  const offline = data.classes.find((c) => !c.discord.connected)
  if (offline) items.push({
    key: 'discord', icon: Unplug, tone: 'slate', cta: 'Connect', to: `/classes/${offline.id}?tab=discord`,
    title: `${offline.name} isn't on Discord`,
    subtitle: `${offline.subject} · roles & channels not created`,
    visual: null,
  })

  return (
    <Card className="animate-rise-in [animation-delay:280ms]">
      <CardHeader title="Needs your attention" subtitle={items.length ? `${items.length} items to follow up` : 'All clear'} />
      {items.length === 0 ? (
        <EmptyState compact icon={BadgeCheck} tone="emerald" title="You're all caught up" description="No pending verifications, help requests or setup tasks." />
      ) : (
        <ul className="divide-y divide-line px-5 pb-2 pt-2">
          {items.slice(0, 4).map((it) => (
            <li key={it.key} className="flex items-center gap-3 py-2.5">
              <IconTile icon={it.icon} tone={it.tone} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-ink">{it.title}</div>
                <div className="truncate text-[11.5px] text-ink-3">{it.subtitle}</div>
              </div>
              {it.visual && <span className="hidden sm:block">{it.visual}</span>}
              <Button size="xs" variant="soft" onClick={() => navigate(it.to)}>{it.cta}</Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
