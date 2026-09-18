import { useState } from 'react'
import { ArrowRight, BellRing, FolderPlus, Megaphone, UserCheck, Workflow, type LucideIcon } from 'lucide-react'
import { ActivityItem } from '@/components/domain/ActivityItem'
import { AvatarStack, Badge, Card, CardHeader, EmptyState, IconTile, Toggle } from '@/components/ui'
import { href } from '@/lib/router'
import type { Tone } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'

interface Rule { id: string; icon: LucideIcon; tone: Tone; title: string; description: string; checked: boolean; set: (v: boolean) => void; stat: string; ids: string[] }

export function Automations({ className }: { className?: string }) {
  const { data, update, log, toast, me } = useStore()
  // ponytail: no store field for these two yet — local state, resets on reload
  const [mirror, setMirror] = useState(true)
  const [autoChannels, setAutoChannels] = useState(true)
  const verified = data.people.filter((p) => p.featured && p.verification === 'Verified').map((p) => p.id)
  const groups = data.groups.filter((g) => g.status === 'Active')
  const mirrored = data.notifications.filter((n) => n.delivery.announcement && n.status !== 'Draft').length

  const rules: Rule[] = [
    {
      id: 'roles', icon: UserCheck, tone: 'emerald', title: 'Auto-assign roles on verification',
      description: 'Give students their @Class role the moment their NPM is verified.',
      checked: data.settings.autoAssignRoles, set: (v) => update('settings', (s) => ({ ...s, autoAssignRoles: v })),
      stat: '46 roles assigned this week', ids: verified.slice(0, 3),
    },
    {
      id: 'dm', icon: BellRing, tone: 'amber', title: 'DM reminders',
      description: 'Personal deadline reminders that stop once a student marks the task done.',
      checked: data.settings.dmReminders, set: (v) => update('settings', (s) => ({ ...s, dmReminders: v })),
      stat: '312 DMs sent · 94% opened', ids: verified.slice(3, 6),
    },
    {
      id: 'mirror', icon: Megaphone, tone: 'sky', title: 'Mirror announcements to #announcement',
      description: 'Every class announcement is also posted in its Discord channel.',
      checked: mirror, set: setMirror, stat: `${mirrored} announcements mirrored`, ids: ['maya', 'andi', 'sarah'],
    },
    {
      id: 'channels', icon: FolderPlus, tone: 'teal', title: 'Create channels for new groups',
      description: 'New groups get a role plus text and voice channels from their template.',
      checked: autoChannels, set: setAutoChannels, stat: `${groups.length} group spaces managed`, ids: groups.flatMap((g) => g.memberIds).slice(0, 3),
    },
  ]

  const onToggle = (r: Rule, v: boolean) => {
    r.set(v)
    log({ actorId: me.id, action: v ? 'enabled automation' : 'paused automation', target: r.title, type: 'discord' })
    toast({ title: `${r.title} ${v ? 'enabled' : 'paused'}`, description: v ? 'Classync will handle this automatically.' : 'You can turn it back on any time.', tone: v ? 'success' : 'info' })
  }

  return (
    <Card className={className}>
      <CardHeader icon={Workflow} tone="teal" title="Automations" subtitle="What the Classync bot does for you in Discord"
        action={<Badge tone="emerald" dot>{rules.filter((r) => r.checked).length} of {rules.length} active</Badge>} />
      <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2">
        {rules.map((r, i) => (
          <div key={r.id} className={cn('flex flex-col rounded-xl border p-4 transition duration-200 animate-rise-in', r.checked ? 'border-line bg-surface' : 'border-dashed border-line-strong bg-subtle/50')} style={{ animationDelay: `${i * 40}ms` }}>
            <IconTile icon={r.icon} tone={r.checked ? r.tone : 'slate'} size="sm" className="mb-2.5 transition-colors" />
            <Toggle checked={r.checked} onChange={(v) => onToggle(r, v)} label={r.title} description={r.description} />
            <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3 text-xs" style={{ marginTop: 14 }}>
              <span className={cn('inline-flex items-center gap-1.5 font-medium', r.checked ? 'text-ink-2' : 'text-ink-3')}>
                <span className={cn('size-1.5 rounded-full', r.checked ? 'bg-emerald-500' : 'bg-slate-400')} />
                {r.checked ? r.stat : 'Paused'}
              </span>
              {r.checked && r.ids.length > 0 && <AvatarStack ids={r.ids} max={3} size="xs" />}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export function BotActivity({ className }: { className?: string }) {
  const { data } = useStore()
  const feed = data.activities.filter((a) => a.type === 'discord' || a.actorId === 'classync').slice(0, 6)
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader title="Bot activity" subtitle="Latest Discord actions" icon={BellRing} tone="violet"
        action={<a href={href('/activity')} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[12.5px] font-semibold text-brand-700 hover:bg-brand-50">View all<ArrowRight className="size-3.5" /></a>} />
      {feed.length ? (
        <ul className="space-y-1 p-3 pt-3">
          {feed.map((a, i) => (
            <li key={a.id} className="rounded-xl px-2 py-2 transition-colors hover:bg-subtle/60 animate-rise-in" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
              <ActivityItem activity={a} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState compact title="No bot activity yet" description="Sync Discord or connect a class to see Classync at work." icon={Workflow} tone="violet" />
      )}
    </Card>
  )
}
