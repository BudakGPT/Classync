import { useState } from 'react'
import { AtSign, Copy, MoreHorizontal, ShieldCheck, Users } from 'lucide-react'
import { AvatarStack, Badge, Card, CardHeader, ClassyncMark, EmptyState, IconButton, Menu, SearchInput, Segmented } from '@/components/ui'
import { navigate } from '@/lib/router'
import { discordRoles, type RoleInfo, studentsIn } from '@/lib/selectors'
import { tone } from '@/lib/tones'
import type { AppData } from '@/lib/types'
import { cn, plural } from '@/lib/utils'
import { useStore } from '@/store/store'

type Kind = 'all' | RoleInfo['kind']
const KIND_LABEL = { system: 'Staff role', class: 'Class role', group: 'Group role' }

function roleSource(r: RoleInfo, d: AppData) {
  if (r.name === '@Admin') return { ids: d.people.filter((p) => p.isAdmin).map((p) => p.id), to: '/students' }
  if (r.name === '@Lecturer') return { ids: d.people.filter((p) => p.role === 'Lecturer').map((p) => p.id), to: '/students' }
  if (r.name === '@Teaching-Assistant') return { ids: d.people.filter((p) => p.role === 'Teaching Assistant').map((p) => p.id), to: '/students' }
  const c = d.classes.find((x) => x.discord.role === r.name)
  if (c) return { ids: studentsIn(d.people, c.id).filter((p) => p.verification === 'Verified').sort((a, b) => Number(!!b.featured) - Number(!!a.featured)).map((p) => p.id), to: `/classes/${c.id}?tab=members` }
  const g = d.groups.find((x) => x.role === r.name)
  return { ids: g?.memberIds ?? [], to: g ? `/groups/${g.id}` : '/groups', isNew: g?.isNew }
}

export function RolesCard() {
  const { data, toast } = useStore()
  const [q, setQ] = useState('')
  const [kind, setKind] = useState<Kind>('all')
  const roles = discordRoles(data)
  const shown = roles.filter((r) => (kind === 'all' || r.kind === kind) && r.name.toLowerCase().includes(q.trim().toLowerCase().replace(/^@?/, '')))

  const copy = async (name: string) => {
    try { await navigator.clipboard.writeText(name) } catch { /* clipboard blocked — the toast still confirms intent */ }
    toast({ title: `Copied ${name}`, description: 'Paste it in Discord to mention everyone with this role.', tone: 'discord' })
  }

  return (
    <Card className="flex flex-col">
      <CardHeader
        icon={ShieldCheck} tone="rose" title="Roles" subtitle={`${roles.length} synced roles`}
        action={<Badge tone="brand" className="gap-1.5"><ClassyncMark size={12} />Managed by Classync</Badge>}
      />
      <div className="space-y-2.5 px-5 pt-4">
        <SearchInput value={q} onChange={setQ} placeholder="Search roles…" aria-label="Search roles" />
        <Segmented size="sm" aria-label="Role type" value={kind} onChange={setKind} className="w-full [&>button]:flex-1 [&>button]:justify-center"
          options={[{ value: 'all', label: 'All' }, { value: 'system', label: 'Staff' }, { value: 'class', label: 'Class' }, { value: 'group', label: 'Group' }]} />
      </div>
      {shown.length ? (
        <ul className="scrollbar-thin mt-2 max-h-[512px] overflow-y-auto px-2 pb-3">
          {shown.map((r, i) => {
            const src = roleSource(r, data)
            const t = tone(r.tone)
            return (
              <li key={r.name} className={cn('group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-subtle/70 animate-rise-in', src.isNew && 'animate-highlight')} style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}>
                <span className={cn('grid size-8 shrink-0 place-items-center rounded-lg', t.soft)}>
                  <span className={cn('size-2.5 rounded-full ring-4 ring-white/70', t.dot)} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className={cn('truncate text-[13.5px] font-semibold', t.text)}>{r.name}</span>
                    {src.isNew && <Badge tone="emerald" size="xs">New</Badge>}
                  </div>
                  <div className="text-[11.5px] text-ink-3">{KIND_LABEL[r.kind]} · <span className="tabular">{plural(r.count, 'member')}</span></div>
                </div>
                <AvatarStack ids={src.ids} max={3} size="xs" total={r.count} />
                <Menu
                  label={r.name} width={200}
                  trigger={<IconButton icon={MoreHorizontal} label={`Actions for ${r.name}`} size="xs" tooltip={false} />}
                  items={[
                    { label: 'View members', icon: Users, onSelect: () => navigate(src.to) },
                    { label: 'Copy mention', icon: Copy, onSelect: () => copy(r.name) },
                  ]}
                />
              </li>
            )
          })}
        </ul>
      ) : (
        <EmptyState compact icon={AtSign} tone="rose" title="No roles match" description={`Nothing found for “${q}”. Try a class letter or group name.`}
          action={{ label: 'Clear filters', onClick: () => { setQ(''); setKind('all') } }} />
      )}
    </Card>
  )
}
