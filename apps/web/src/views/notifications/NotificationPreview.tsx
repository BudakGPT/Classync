import { useState } from 'react'
import { Bell, CircleCheck, Clock, Hash, LayoutDashboard, MessageCircle, PencilLine, Send, Trash2 } from 'lucide-react'
import { DiscordEmbed, DiscordMessage, DiscordWindow } from '@/components/domain/Discord'
import {
  AvatarStack, Badge, Button, CategoryBadge, Drawer, IconTile, Segmented, StatusBadge,
} from '@/components/ui'
import { audienceIds, audienceLabel } from '@/lib/selectors'
import { dueLabel, fmtDate, fmtTime } from '@/lib/time'
import { CATEGORY, tone as toneOf } from '@/lib/tones'
import type { NotificationItem, NotificationStatus } from '@/lib/types'
import { plural } from '@/lib/utils'
import { useStore } from '@/store/store'
import { DEFAULT_DESC, reminderSummary, scheduleLabel, shortReminder } from './lib'
import { DeadlineInfo, DeliveryChips, MetaCell, ReminderChips, ScheduleInfo, SentStats, type CardHandlers } from './parts'

export type PreviewSource = Pick<NotificationItem, 'title' | 'description' | 'category' | 'audience' | 'mode' | 'sendAt' | 'repeat' | 'deadline' | 'reminders' | 'delivery'> & { status?: NotificationStatus }
export type PreviewMode = 'channel' | 'dm' | 'dashboard'

const MODES = [
  { value: 'channel' as const, label: 'Channel', icon: Hash },
  { value: 'dm' as const, label: 'DM', icon: MessageCircle },
  { value: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
]

const toastPreview = (toast: ReturnType<typeof useStore>['toast']) => () =>
  toast({ title: 'Preview only', description: 'Students get working buttons in Discord once it is sent.', tone: 'discord' })

function useView(n: PreviewSource) {
  const { data, person } = useStore()
  const cat = CATEGORY[n.category]
  const a = n.audience
  const ids = audienceIds(a, data)
  const byClass = a.type === 'class' || a.type === 'classes'
  const mentions = a.type === 'group'
    ? a.groupIds.map((g) => data.groups.find((x) => x.id === g)?.role ?? `@${g}`)
    : a.type === 'students'
      ? a.studentIds.slice(0, 2).map((id) => `@${person(id)?.discord ?? person(id)?.name.split(' ')[0].toLowerCase()}`)
      : a.classIds.map((c) => `@Class-${c}`)
  const recipient = person(ids.find((id) => person(id)?.featured) ?? ids[0] ?? 'haekal')
  return {
    cat, ids, recipient,
    title: n.title.trim() || 'Untitled notification',
    description: n.description.trim() || DEFAULT_DESC[n.category],
    mentions: a.type === 'students' && a.studentIds.length > 2 ? [...mentions, `+${a.studentIds.length - 2}`] : mentions,
    audienceField: { name: byClass ? (a.classIds.length > 1 ? 'Classes' : 'Class') : 'Audience', value: byClass ? a.classIds.join(', ') || '—' : audienceLabel(a, data) },
    when: n.status === 'Sent' || n.mode === 'now' ? 'Today at 10:41' : n.mode === 'recurring' && n.repeat ? `Every ${n.repeat.day} at ${n.repeat.time}` : n.sendAt ? `Scheduled · ${dueLabel(n.sendAt)}` : 'Draft',
  }
}

export function ChannelPreview({ n, compact }: { n: PreviewSource; compact?: boolean }) {
  const { toast } = useStore()
  const v = useView(n)
  const fields = [
    n.deadline ? { name: 'Deadline', value: `${fmtDate(n.deadline)} · ${fmtTime(n.deadline)}`, inline: true } : n.mode === 'recurring' && n.repeat ? { name: 'Schedule', value: `Every ${n.repeat.day.slice(0, 3)} · ${n.repeat.time}`, inline: true } : null,
    { ...v.audienceField, inline: true },
    { name: 'Reminders', value: n.reminders.length ? n.reminders.map(shortReminder).join(' · ') : 'None', inline: !n.deadline || n.reminders.length < 2 },
  ].filter((f) => !!f)
  return (
    <DiscordWindow channel="announcement">
      {!compact && (
        <div className="mb-3 flex gap-3 opacity-45" aria-hidden>
          <span className="size-10 shrink-0 rounded-full bg-[#4e5058]" />
          <div className="min-w-0 flex-1 space-y-1.5 pt-1">
            <div className="h-2.5 w-28 rounded bg-[#4e5058]" />
            <div className="h-2.5 w-3/4 rounded bg-[#3f4147]" />
          </div>
        </div>
      )}
      <DiscordMessage time={v.when}>
        <p>
          {v.mentions.map((m) => <span key={m} className="mr-1 rounded-[3px] bg-[#5865f2]/30 px-0.5 font-medium text-[#c9cdfb]">{m}</span>)}
          {v.cat.emoji} New {n.category.toLowerCase()} posted
        </p>
        <DiscordEmbed
          color={toneOf(v.cat.tone).hex}
          title={`${v.cat.emoji} ${v.title}`}
          description={compact ? undefined : v.description}
          fields={fields}
          footer={compact ? undefined : 'Classync · Fasilkom Academic Hub'}
          buttons={[
            { label: 'View Task', style: 'primary', onClick: toastPreview(toast) },
            { label: <><CircleCheck className="size-4" />Mark as Done</>, style: 'success', onClick: toastPreview(toast) },
          ]}
        />
      </DiscordMessage>
    </DiscordWindow>
  )
}

function DmPreview({ n }: { n: PreviewSource }) {
  const { toast } = useStore()
  const v = useView(n)
  const first = v.recipient?.name.split(' ')[0] ?? 'there'
  const lead = n.reminders[0] ? shortReminder(n.reminders[0]) : undefined
  return (
    <DiscordWindow dm={`${v.recipient?.discord ?? first.toLowerCase()} · Direct Message`}>
      <DiscordMessage time={lead ? `Reminder · ${lead} before` : v.when}>
        <p>Hi {first} 👋</p>
        <p>
          <span className="font-semibold text-white">{v.title}</span>{' '}
          {n.deadline ? `is due in ${lead ?? dueLabel(n.deadline).toLowerCase()}.` : n.mode === 'recurring' && n.repeat ? `happens every ${n.repeat.day} at ${n.repeat.time}.` : 'was just posted for you.'}
        </p>
        <p className="text-[#b5bac1]">You can stop reminders after completing the task.</p>
        <DiscordEmbed
          color={toneOf(v.cat.tone).hex}
          title={`${v.cat.emoji} ${v.title}`}
          fields={[
            { ...v.audienceField, inline: true },
            n.deadline ? { name: 'Deadline', value: `${fmtDate(n.deadline)} · ${fmtTime(n.deadline)}`, inline: true } : { name: 'When', value: v.when, inline: true },
          ]}
          buttons={[
            { label: <><CircleCheck className="size-4" />Mark as Done</>, style: 'success', onClick: toastPreview(toast) },
            { label: <><Clock className="size-4" />Remind Me Later</>, style: 'secondary', onClick: toastPreview(toast) },
          ]}
        />
      </DiscordMessage>
    </DiscordWindow>
  )
}

function DashboardPreview({ n }: { n: PreviewSource }) {
  const { toast } = useStore()
  const v = useView(n)
  const Icon = v.cat.icon
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-lift">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <Bell className="size-4 text-ink-2" />
        <span className="text-[13.5px] font-bold text-ink">Notifications</span>
        <Badge tone="brand" size="xs">1 new</Badge>
        <span className="ml-auto text-[11.5px] text-ink-3">{v.recipient?.name.split(' ')[0]}’s dashboard</span>
      </div>
      <div className="relative flex gap-3 bg-brand-50/50 px-4 py-3.5">
        <span className="absolute right-4 top-4 size-2 rounded-full bg-brand-600" aria-label="Unread" />
        <IconTile icon={Icon} tone={v.cat.tone} />
        <div className="min-w-0 flex-1 pr-4">
          <div className="text-[11.5px] font-semibold text-ink-3">New {n.category.toLowerCase()} · {v.audienceField.name === 'Class' ? `Class ${v.audienceField.value}` : v.audienceField.value}</div>
          <div className="text-[14px] font-bold leading-snug text-ink">{v.title}</div>
          <p className="mt-0.5 line-clamp-2 text-[12.5px] text-ink-2">{v.description}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {n.deadline && <Badge tone="rose" icon={Clock} size="xs">Due {dueLabel(n.deadline)}</Badge>}
            {n.reminders.length > 0 && <Badge tone="amber" icon={Bell} size="xs">{reminderSummary(n.reminders)}</Badge>}
          </div>
          <div className="mt-3 flex gap-2">
            <Button size="xs" variant="primary" onClick={toastPreview(toast)}>View task</Button>
            <Button size="xs" variant="secondary" icon={CircleCheck} onClick={toastPreview(toast)}>Mark as done</Button>
          </div>
        </div>
      </div>
      {[
        { t: 'FGD-B2 Discussion Prompt', m: 'FGD · 2 h ago', c: 'FGD' as const },
        { t: 'Week 4 Material: PCA & Dimensionality Reduction', m: 'Material · Yesterday', c: 'Material' as const },
      ].map((x) => (
        <div key={x.t} className="flex items-center gap-3 border-t border-line px-4 py-2.5 opacity-60">
          <IconTile icon={CATEGORY[x.c].icon} tone={CATEGORY[x.c].tone} size="sm" />
          <div className="min-w-0">
            <div className="truncate text-[12.5px] font-semibold text-ink">{x.t}</div>
            <div className="text-[11px] text-ink-3">{x.m}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function NotificationPreview({ n, mode, onModeChange }: { n: PreviewSource; mode: PreviewMode; onModeChange: (m: PreviewMode) => void }) {
  const off = (mode === 'channel' && !n.delivery.announcement) || (mode === 'dm' && !n.delivery.dm) || (mode === 'dashboard' && !n.delivery.dashboard)
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Segmented size="sm" aria-label="Preview surface" options={MODES} value={mode} onChange={onModeChange} />
        {off && <Badge tone="slate" size="xs">This channel is turned off</Badge>}
      </div>
      <div key={mode} className={off ? 'mt-3 opacity-50 grayscale-[40%] transition' : 'mt-3 animate-fade-in'}>
        {mode === 'channel' ? <ChannelPreview n={n} /> : mode === 'dm' ? <DmPreview n={n} /> : <DashboardPreview n={n} />}
      </div>
    </div>
  )
}

export const firstMode = (n: PreviewSource): PreviewMode => (n.delivery.announcement ? 'channel' : n.delivery.dm ? 'dm' : 'dashboard')

/** Card "Preview" → side drawer with the three delivery surfaces and the notification's details. */
export function PreviewDrawer({ n, open, onClose, h }: { n?: NotificationItem; open: boolean; onClose: () => void; h: CardHandlers }) {
  const { data } = useStore()
  const [mode, setMode] = useState<PreviewMode | null>(null)
  if (!n) return null
  const ids = audienceIds(n.audience, data)
  const sending = h.ops.sendingId === n.id
  return (
    <Drawer
      open={open} onClose={() => { onClose(); setMode(null) }} size="lg"
      title={n.title}
      subtitle={<span className="flex flex-wrap items-center gap-1.5"><CategoryBadge category={n.category} size="xs" /><StatusBadge status={n.status} size="xs" /><span className="ml-1">{scheduleLabel(n)}</span></span>}
      footer={
        <>
          <Button variant="ghost" icon={Trash2} className="mr-auto text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => { onClose(); h.askDelete(n) }}>Delete</Button>
          <Button variant="secondary" icon={PencilLine} onClick={() => { onClose(); h.ops.edit(n) }}>Edit</Button>
          {n.status !== 'Sent' && <Button variant="primary" icon={Send} loading={sending} onClick={() => h.ops.sendNow(n)}>{sending ? 'Sending…' : 'Send now'}</Button>}
        </>
      }
    >
      <NotificationPreview n={n} mode={mode ?? firstMode(n)} onModeChange={setMode} />
      <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4 rounded-2xl border border-line p-4">
        <MetaCell label="Target" className="col-span-2">
          <div className="flex items-center gap-2.5">
            <AvatarStack ids={ids} max={6} size="sm" />
            <span className="text-[13px] font-semibold text-ink">{audienceLabel(n.audience, data)}</span>
            <span className="text-[12px] text-ink-3">· {plural(ids.length, 'student')}</span>
          </div>
        </MetaCell>
        <MetaCell label="Schedule"><ScheduleInfo n={n} /></MetaCell>
        <MetaCell label="Deadline"><DeadlineInfo iso={n.deadline} /></MetaCell>
        <MetaCell label="Reminders" className="col-span-2"><ReminderChips reminders={n.reminders} /></MetaCell>
        <MetaCell label="Delivery"><DeliveryChips delivery={n.delivery} /></MetaCell>
        {n.stats && <MetaCell label="Engagement"><SentStats stats={n.stats} /></MetaCell>}
      </div>
    </Drawer>
  )
}
