import { useRef, useState, type ReactNode } from 'react'
import {
  ArrowUpRight, AtSign, Bell, BellRing, Check, ChevronDown, ChevronUp, Clock3, Hash, LayoutDashboard, MapPin, Megaphone, PencilLine, Repeat, Trash2,
  type LucideIcon,
} from 'lucide-react'
import { AvatarStack, Badge, Button, CategoryBadge, ConfirmDialog, Drawer, IconTile, PersonLine, StatusBadge } from '@/components/ui'
import { href } from '@/lib/router'
import { dueLabel, fmtDate, fmtDay, now, urgency, WEEKDAYS } from '@/lib/time'
import { CATEGORY } from '@/lib/tones'
import type { CalEvent, Tone } from '@/lib/types'
import { cn, plural, wait } from '@/lib/utils'
import { useStore } from '@/store/store'
import { ClassTag, NewBadge } from './EventBits'
import { durationLabel, isDeadline, POINT_MIN, timeRange, useCal } from './lib'

const DELIVERY = [
  { key: 'announcement', label: '#announcement', description: 'Posted to the class announcement channel', icon: Hash },
  { key: 'dm', label: 'Direct message', description: 'Personal DM from Classync Bot', icon: AtSign },
  { key: 'dashboard', label: 'Dashboard', description: 'In-app notification in Classync', icon: LayoutDashboard },
] as const

function status(e: CalEvent): { label: string; tone: Tone } {
  const t = now().getTime()
  const start = new Date(e.start).getTime()
  const end = e.end ? new Date(e.end).getTime() : start + (isDeadline(e) ? 0 : POINT_MIN * 60_000)
  if (t < start) return { label: dueLabel(e.start), tone: isDeadline(e) && urgency(e.start) === 'urgent' ? 'rose' : 'brand' }
  if (t < end) return { label: 'Happening now', tone: 'emerald' }
  return { label: 'Ended', tone: 'slate' }
}

const SectionTitle = ({ title, meta }: { title: string; meta?: ReactNode }) => (
  <div className="mb-2 flex items-center justify-between gap-2">
    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">{title}</h3>
    {meta && <span className="text-[11.5px] text-ink-3">{meta}</span>}
  </div>
)

const Row = ({ icon: Icon, children }: { icon: LucideIcon; children: ReactNode }) => (
  <div className="flex items-center gap-2.5 text-[13px] text-ink-2"><Icon className="size-4 shrink-0 text-ink-3" />{children}</div>
)

export function EventDrawer({ event, onClose }: { event?: CalEvent; onClose: () => void }) {
  // Keep the last event while the drawer animates out.
  const last = useRef(event)
  if (event) last.current = event
  const e = event ?? last.current
  const { update, log, toast, me } = useStore()
  const cal = useCal()
  const [sending, setSending] = useState(false)
  const [confirm, setConfirm] = useState(false)
  if (!e) return null

  const c = CATEGORY[e.category]
  const ids = cal.participants(e)
  const d = new Date(e.start)
  const st = status(e)
  const dur = durationLabel(e)
  const channels = DELIVERY.filter((x) => e.delivery[x.key]).map((x) => x.label)

  const sendReminder = async () => {
    setSending(true)
    await wait(900)
    setSending(false)
    log({ actorId: 'classync', action: 'sent a reminder for', target: e.title, detail: `${plural(ids.length, 'participant')} · ${channels.join(' + ') || 'Dashboard'}`, type: 'notifications' })
    toast({ title: 'Reminder sent on Discord', description: `${e.title} → ${plural(ids.length, 'participant')} via ${channels.join(', ') || 'Dashboard'}`, tone: 'discord' })
  }

  const remove = () => {
    const removed = e
    update('events', (es) => es.filter((x) => x.id !== removed.id))
    log({ actorId: me.id, action: 'deleted event', target: removed.title, detail: `${removed.category} · ${fmtDay(removed.start)}`, type: 'notifications' })
    toast({ title: 'Event deleted', description: `${removed.title} was removed from the calendar.`, tone: 'success', action: { label: 'Undo', onClick: () => update('events', (es) => [...es, removed]) } })
    setConfirm(false)
    onClose()
  }

  return (
    <>
      <Drawer
        open={!!event} onClose={onClose} size="lg" title={e.title}
        subtitle={
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <CategoryBadge category={e.category} size="xs" />
            <ClassTag event={e} />
            {e.source === 'recurring' && <StatusBadge status="Recurring" size="xs" />}
            {e.isNew && <NewBadge />}
          </div>
        }
        footer={
          <>
            <Button variant="danger-soft" size="sm" icon={Trash2} onClick={() => setConfirm(true)} className="mr-auto">Delete</Button>
            <Button variant="secondary" size="sm" icon={PencilLine}
              onClick={() => toast({ title: 'Editor opening soon', description: 'Event editing is read-only in this demo workspace.', tone: 'info' })}>
              Edit
            </Button>
            <Button variant="discord" size="sm" icon={BellRing} loading={sending} onClick={sendReminder}>{sending ? 'Sending…' : 'Send reminder now'}</Button>
          </>
        }
      >
        <div className="space-y-6">
          <section className={cn('rounded-2xl border border-line bg-canvas/60 p-4', e.isNew && 'border-brand-200 bg-brand-50/40')}>
            <div className="flex items-start gap-3.5">
              <IconTile icon={c.icon} tone={c.tone} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-bold text-ink">{WEEKDAYS[d.getDay()]}, {fmtDate(e.start)}</div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px] text-ink-2 tabular">
                  <Clock3 className="size-3.5 text-ink-3" />{timeRange(e)}{dur && <span className="text-ink-3">· {dur}</span>}
                </div>
              </div>
              <Badge tone={st.tone} dot size="sm">{st.label}</Badge>
            </div>
            {(e.source !== 'manual' || e.location) && (
              <div className="mt-3.5 space-y-2 border-t border-line pt-3.5">
                {e.source === 'recurring' && <Row icon={Repeat}>Repeats weekly on {WEEKDAYS[d.getDay()]}s</Row>}
                {e.location && <Row icon={MapPin}>{e.location}</Row>}
                {e.source === 'notification' && (
                  <a href={href('/notifications')} className="group inline-flex items-center gap-2.5 rounded-md text-[13px] font-semibold text-brand-700 hover:text-brand-800">
                    <Megaphone className="size-4" />Created from Notification Center
                    <ArrowUpRight className="size-3.5 transition group-hover:-translate-y-px group-hover:translate-x-px" />
                  </a>
                )}
              </div>
            )}
          </section>

          {e.description && (
            <section>
              <SectionTitle title="Description" />
              <p className="text-[13.5px] leading-relaxed text-ink-2">{e.description}</p>
            </section>
          )}

          <Participants key={e.id} ids={ids} />

          {e.hostId && (
            <section>
              <SectionTitle title={e.category === 'Lecture' || e.category === 'Extra Class' ? 'Lecturer' : 'Host'} />
              <HostCard id={e.hostId} />
            </section>
          )}

          <section>
            <SectionTitle title="Reminders" meta={e.reminders.length ? plural(e.reminders.length, 'reminder') : undefined} />
            {e.reminders.length ? (
              <div className="flex flex-wrap gap-1.5">
                {e.reminders.map((r) => (
                  <span key={r} className="inline-flex items-center gap-1.5 rounded-full bg-subtle px-2.5 py-1 text-[12px] font-semibold text-ink-2">
                    <Bell className="size-3.5 text-ink-3" />{r}
                  </span>
                ))}
              </div>
            ) : <p className="text-[13px] text-ink-3">No reminders — delivered once at the scheduled time.</p>}
          </section>

          <section>
            <SectionTitle title="Discord delivery" meta={`${channels.length} of 3 on`} />
            <ul className="divide-y divide-line rounded-2xl border border-line">
              {DELIVERY.map((x) => {
                const on = e.delivery[x.key]
                return (
                  <li key={x.key} className="flex items-center gap-3 px-3 py-2.5">
                    <span className={cn('grid size-8 shrink-0 place-items-center rounded-lg', on ? 'bg-discord/10 text-discord' : 'bg-subtle text-ink-3')}><x.icon className="size-4" /></span>
                    <div className="min-w-0 flex-1">
                      <div className={cn('text-[13px] font-semibold', on ? 'text-ink' : 'text-ink-3')}>{x.label}</div>
                      <div className="truncate text-[11.5px] text-ink-3">{x.description}</div>
                    </div>
                    {on ? <Badge tone="emerald" icon={Check} size="xs">On</Badge> : <Badge tone="slate" size="xs">Off</Badge>}
                  </li>
                )
              })}
            </ul>
          </section>
        </div>
      </Drawer>

      <ConfirmDialog
        open={confirm} onClose={() => setConfirm(false)} onConfirm={remove} confirmLabel="Delete event"
        title={`Delete “${e.title}”?`}
        description={e.source === 'recurring'
          ? 'Only this occurrence is removed — the weekly lecture series stays on the calendar.'
          : 'Participants will no longer see this event and any pending Discord reminders are cancelled.'}
      />
    </>
  )
}

function HostCard({ id }: { id: string }) {
  const { person } = useStore()
  const p = person(id)
  if (!p) return null
  return (
    <div className="rounded-2xl border border-line p-3">
      <PersonLine id={id} presence subtitle={`${p.email}${p.discord ? ` · @${p.discord}` : ''}`}
        trailing={<Badge tone={p.role === 'Lecturer' ? 'violet' : 'sky'} size="xs">{p.role === 'Lecturer' ? 'Lecturer' : 'Teaching Assistant'}</Badge>} />
    </div>
  )
}

function Participants({ ids }: { ids: string[] }) {
  const { person } = useStore()
  const [open, setOpen] = useState(false)
  return (
    <section>
      <SectionTitle title="Participants" meta={plural(ids.length, 'person', 'people')} />
      {ids.length ? (
        <div className="rounded-2xl border border-line p-3">
          <div className="flex items-center gap-3">
            <AvatarStack ids={ids} max={8} size="md" onClick={() => setOpen((o) => !o)} />
            <div className="min-w-0 flex-1 text-[12.5px] text-ink-3"><span className="font-semibold text-ink tabular">{ids.length}</span> invited</div>
            <Button size="xs" variant="ghost" iconRight={open ? ChevronUp : ChevronDown} onClick={() => setOpen((o) => !o)} aria-expanded={open}>
              {open ? 'Hide list' : 'Show all'}
            </Button>
          </div>
          {open && (
            <ul className="scrollbar-thin mt-3 max-h-64 space-y-2.5 overflow-y-auto border-t border-line pt-3 animate-fade-in">
              {ids.map((id) => {
                const p = person(id)
                return (
                  <li key={id}>
                    <PersonLine id={id} size="sm" presence
                      subtitle={p ? (p.role === 'Student' ? `${p.npm} · Class ${p.classId}` : p.role) : undefined}
                      trailing={p?.role === 'Student' ? <StatusBadge status={p.verification} size="xs" /> : undefined} />
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      ) : <p className="rounded-xl bg-subtle px-3 py-2.5 text-[13px] text-ink-3">Faculty-wide — visible to every class, no individual invitees.</p>}
    </section>
  )
}
