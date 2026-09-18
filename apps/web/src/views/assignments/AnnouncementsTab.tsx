import { BellRing, Megaphone, Send } from 'lucide-react'
import { DiscordEmbed, DiscordMessage, DiscordWindow } from '@/components/domain/Discord'
import { Badge, Button, Card, CategoryBadge, ChannelChip, EmptyState, PersonLine, ProgressBar, StatusBadge } from '@/components/ui'
import { audienceIds, audienceLabel } from '@/lib/selectors'
import { dueLabel, fmtLong, fmtTime, relTime, sameDay, now, fmtDay } from '@/lib/time'
import { CATEGORY, tone } from '@/lib/tones'
import type { Assignment, NotificationItem } from '@/lib/types'
import { plural } from '@/lib/utils'
import { useStore } from '@/store/store'

export function AnnouncementsTab({ a, items, onCreate }: { a: Assignment; items: NotificationItem[]; onCreate: () => void }) {
  const { data } = useStore()
  const cls = data.classes.find((c) => c.id === a.classId)

  if (!items.length) {
    return (
      <Card>
        <EmptyState
          icon={Megaphone} tone="amber" characters={['maya', 'haekal', 'jessica']}
          title="No announcements for this assignment yet"
          description={`Post it to ${cls?.discord.role ?? `Class ${a.classId}`} on Discord — Classync DMs reminders 1 day and 1 hour before the deadline and stops once a student marks it done.`}
          action={{ label: 'Create announcement', icon: Megaphone, onClick: onCreate }}
        />
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-bold tracking-tight text-ink">Discord announcements</h3>
          <p className="text-xs text-ink-3">{plural(items.length, 'announcement')} linked · previews of what Class {a.classId} sees in #announcement</p>
        </div>
        <Button variant="secondary" icon={Megaphone} onClick={onCreate}>New announcement</Button>
      </div>
      {items.map((n, i) => <AnnouncementRow key={n.id} n={n} index={i} />)}
    </div>
  )
}

function AnnouncementRow({ n, index }: { n: NotificationItem; index: number }) {
  const { data } = useStore()
  const reach = audienceIds(n.audience, data).length
  const when = n.status === 'Sent' && n.sendAt ? `Sent ${relTime(n.sendAt).toLowerCase()}`
    : n.status === 'Scheduled' && n.sendAt ? `Sends ${dueLabel(n.sendAt)}`
      : n.status === 'Recurring' && n.repeat ? `Every ${n.repeat.day}, ${n.repeat.time}` : 'Not scheduled yet'
  const discordTime = n.sendAt && n.status === 'Sent'
    ? (sameDay(n.sendAt, now()) ? `Today at ${fmtTime(n.sendAt)}` : `${fmtDay(n.sendAt)} at ${fmtTime(n.sendAt)}`)
    : n.status === 'Draft' ? 'Draft preview' : 'Scheduled preview'
  const role = n.audience.type === 'group'
    ? data.groups.find((g) => g.id === n.audience.groupIds[0])?.role ?? '@group'
    : n.audience.classIds.length === 1 ? `@Class-${n.audience.classIds[0]}` : '@everyone'
  const cat = CATEGORY[n.category]

  return (
    <Card className={`grid grid-cols-1 gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] ${n.isNew ? 'animate-highlight' : 'animate-rise-in'}`} style={{ animationDelay: `${index * 50}ms` }}>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <CategoryBadge category={n.category} size="xs" />
          <StatusBadge status={n.status} size="xs" />
          {n.isNew && <Badge tone="brand" size="xs">New</Badge>}
        </div>
        <h4 className="mt-2.5 text-[16px] font-bold tracking-tight text-ink">{n.title}</h4>
        <p className="mt-1 line-clamp-3 text-[13px] leading-relaxed text-ink-2">{n.description}</p>

        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-[13px]">
          <div><dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">Audience</dt><dd className="mt-0.5 font-medium text-ink">{audienceLabel(n.audience, data)} · {reach}</dd></div>
          <div><dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">Delivery</dt><dd className="mt-0.5 text-ink">{when}</dd></div>
          {n.deadline && <div><dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">Deadline</dt><dd className="mt-0.5 text-ink">{fmtLong(n.deadline)}</dd></div>}
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">Channels</dt>
            <dd className="mt-1 flex flex-wrap gap-1">
              {n.delivery.announcement && <ChannelChip name="announcement" />}
              {n.delivery.dm && <Badge tone="violet" size="xs" icon={Send}>DM</Badge>}
            </dd>
          </div>
        </dl>

        {n.reminders.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {n.reminders.map((r) => <Badge key={r} tone="slate" size="xs" icon={BellRing}>{r}</Badge>)}
          </div>
        )}

        {n.stats && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-ink-3"><span>Read by <span className="font-semibold text-ink-2 tabular">{n.stats.read}</span> of {n.stats.delivered}</span><span className="tabular">{Math.round((n.stats.read / Math.max(1, n.stats.delivered)) * 100)}%</span></div>
            <ProgressBar className="mt-1.5" size="sm" tone="teal" value={(n.stats.read / Math.max(1, n.stats.delivered)) * 100} label="Read rate" />
          </div>
        )}

        <PersonLine className="mt-4 border-t border-line pt-3.5" id={n.createdBy} size="sm" subtitle={`Created ${relTime(n.createdAt).toLowerCase()}`} />
      </div>

      <DiscordWindow channel="announcement">
        <DiscordMessage time={discordTime}>
          <p><span className="rounded-[3px] bg-[#5865f2]/30 px-0.5 font-medium text-[#c9cdfb]">{role}</span> new {n.category.toLowerCase()} {cat.emoji}</p>
          <DiscordEmbed
            color={tone(cat.tone).hex}
            title={n.title}
            description={n.description}
            fields={[
              { name: 'Audience', value: audienceLabel(n.audience, data), inline: true },
              ...(n.deadline ? [{ name: 'Deadline', value: fmtLong(n.deadline), inline: true }] : []),
              ...(n.reminders.length ? [{ name: 'Reminders', value: n.reminders.join(' · '), inline: true }] : []),
            ]}
            footer="Classync · Fasilkom Academic Hub"
          />
        </DiscordMessage>
      </DiscordWindow>
    </Card>
  )
}
