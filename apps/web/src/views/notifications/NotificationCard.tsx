import type { CSSProperties } from 'react'
import { Eye, PencilLine, Send, Sparkles, Timer } from 'lucide-react'
import { Avatar, AvatarStack, Badge, Button, Card, CategoryBadge, IconTile, Spinner, StatusBadge } from '@/components/ui'
import { audienceIds, audienceLabel, shortName } from '@/lib/selectors'
import { relTime } from '@/lib/time'
import { CATEGORY } from '@/lib/tones'
import type { NotificationItem } from '@/lib/types'
import { cn, plural } from '@/lib/utils'
import { useStore } from '@/store/store'
import { untilLabel } from './lib'
import { ChannelPreview } from './NotificationPreview'
import { CardMenu, DeadlineInfo, DeliveryChips, Eyebrow, MetaCell, ReminderChips, ScheduleInfo, SentStats, type CardHandlers } from './parts'

function SendingOverlay({ reach }: { reach: number }) {
  return (
    <div className="absolute inset-0 z-10 grid place-items-center rounded-2xl bg-white/75 backdrop-blur-[1.5px] animate-fade-in" role="status">
      <div className="flex items-center gap-2 rounded-full bg-surface px-3.5 py-2 text-[13px] font-semibold text-ink shadow-lift ring-1 ring-line">
        <Spinner />Sending to {plural(reach, 'student')}…
      </div>
    </div>
  )
}

function Target({ n, size = 'xs' }: { n: NotificationItem; size?: 'xs' | 'sm' }) {
  const { data } = useStore()
  const ids = audienceIds(n.audience, data)
  return (
    <div className="flex min-w-0 items-center gap-2">
      <AvatarStack ids={ids} max={4} size={size} />
      <div className="min-w-0 leading-tight">
        <div className="truncate text-[12.5px] font-semibold text-ink">{audienceLabel(n.audience, data)}</div>
        <div className="text-[11.5px] text-ink-3 tabular">{plural(ids.length, 'student')}</div>
      </div>
    </div>
  )
}

export function NotificationCard({ n, h, index }: { n: NotificationItem; h: CardHandlers; index: number }) {
  const { data } = useStore()
  const c = CATEGORY[n.category]
  const sending = h.ops.sendingId === n.id
  return (
    <Card
      className={cn(
        'group relative flex flex-col p-5 transition duration-200 hover:border-line-strong hover:shadow-lift',
        n.isNew ? 'ring-2 ring-brand-300 animate-highlight' : 'animate-rise-in',
      )}
      style={{ animationDelay: n.isNew ? undefined : `${Math.min(index, 8) * 40}ms` } as CSSProperties}
    >
      {sending && <SendingOverlay reach={audienceIds(n.audience, data).length} />}
      <div className="flex items-start gap-3">
        <IconTile icon={c.icon} tone={c.tone} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <CategoryBadge category={n.category} size="xs" />
            <StatusBadge status={n.status} size="xs" />
            {n.isNew && <Badge tone="brand" icon={Sparkles} size="xs">New</Badge>}
          </div>
          <button type="button" onClick={() => h.preview(n)} className="mt-1 line-clamp-2 text-left text-[15px] font-bold leading-snug tracking-tight text-ink transition-colors hover:text-brand-700">
            {n.title}
          </button>
        </div>
        <CardMenu n={n} h={h} />
      </div>
      <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-ink-3">{n.description}</p>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3.5 rounded-xl bg-canvas p-3.5">
        <MetaCell label="Target"><Target n={n} /></MetaCell>
        <MetaCell label="Schedule"><ScheduleInfo n={n} /></MetaCell>
        <MetaCell label="Deadline"><DeadlineInfo iso={n.deadline} /></MetaCell>
        <MetaCell label="Delivery"><DeliveryChips delivery={n.delivery} /></MetaCell>
      </div>

      <div className="mt-3.5 flex items-center gap-2">
        <Eyebrow className="shrink-0">Reminders</Eyebrow>
        <ReminderChips reminders={n.reminders} />
      </div>

      <div className="mt-auto pt-4">
        <div className="flex min-h-9 items-center justify-between gap-3 border-t border-line pt-3.5">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar id={n.createdBy} size="xs" tooltip />
            <span className="truncate text-[12px] text-ink-3"><b className="font-semibold text-ink-2">{shortName(data.people.find((p) => p.id === n.createdBy))}</b> · {relTime(n.createdAt)}</span>
          </div>
          {n.stats
            ? <SentStats stats={n.stats} />
            : n.status === 'Draft'
              ? <Button size="xs" variant="soft" icon={PencilLine} onClick={() => h.ops.edit(n)}>Continue editing</Button>
              : <Button size="xs" variant="ghost" icon={Eye} onClick={() => h.preview(n)}>Preview</Button>}
        </div>
      </div>
    </Card>
  )
}

/** The next scheduled send gets a hero treatment with a live Discord preview. */
export function FeaturedNotification({ n, h, next }: { n: NotificationItem; h: CardHandlers; next: Date }) {
  const { data } = useStore()
  const c = CATEGORY[n.category]
  const sending = h.ops.sendingId === n.id
  return (
    <Card className={cn('hero-gradient relative overflow-hidden', n.isNew ? 'ring-2 ring-brand-300 animate-highlight' : 'animate-rise-in')}>
      {sending && <SendingOverlay reach={audienceIds(n.audience, data).length} />}
      <div className="grid lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="flex flex-col p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-2.5 py-1 text-[11.5px] font-bold text-white shadow-glow">
                <Timer className="size-3.5" />Next send · {untilLabel(next)}
              </span>
              <CategoryBadge category={n.category} />
              <StatusBadge status={n.status} />
              {n.isNew && <Badge tone="brand" icon={Sparkles}>New</Badge>}
            </div>
            <CardMenu n={n} h={h} />
          </div>
          <div className="mt-3 flex items-start gap-3">
            <IconTile icon={c.icon} tone={c.tone} size="lg" className="bg-white shadow-card" />
            <div className="min-w-0">
              <button type="button" onClick={() => h.preview(n)} className="text-left text-[21px] font-extrabold leading-tight tracking-tight text-ink transition-colors hover:text-brand-700">{n.title}</button>
              <p className="mt-1 line-clamp-2 max-w-xl text-[13.5px] leading-relaxed text-ink-2">{n.description}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 rounded-2xl border border-white/80 bg-white/70 p-4 backdrop-blur-sm sm:grid-cols-3">
            <MetaCell label="Target"><Target n={n} size="sm" /></MetaCell>
            <MetaCell label="Schedule"><ScheduleInfo n={n} /></MetaCell>
            <MetaCell label="Deadline"><DeadlineInfo iso={n.deadline} /></MetaCell>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="flex items-center gap-2"><Eyebrow>Reminders</Eyebrow><ReminderChips reminders={n.reminders} /></div>
            <div className="flex items-center gap-2"><Eyebrow>Delivery</Eyebrow><DeliveryChips delivery={n.delivery} /></div>
          </div>

          <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
            <Button variant="soft" icon={Send} loading={sending} onClick={() => h.ops.sendNow(n)}>Send now</Button>
            <Button variant="secondary" icon={Eye} onClick={() => h.preview(n)}>Preview</Button>
            <Button variant="ghost" icon={PencilLine} onClick={() => h.ops.edit(n)}>Edit</Button>
            <span className="ml-auto flex items-center gap-2 text-[12px] text-ink-3">
              <Avatar id={n.createdBy} size="xs" tooltip />
              Scheduled by <b className="font-semibold text-ink-2">{shortName(data.people.find((p) => p.id === n.createdBy))}</b> · {relTime(n.createdAt)}
            </span>
          </div>
        </div>
        <div className="border-t border-white/70 bg-white/35 p-5 lg:border-l lg:border-t-0">
          <Eyebrow className="mb-2.5 flex items-center justify-between">
            <span>What students will see</span>
            <span className="normal-case tracking-normal">#announcement</span>
          </Eyebrow>
          <ChannelPreview n={n} compact />
        </div>
      </div>
    </Card>
  )
}
