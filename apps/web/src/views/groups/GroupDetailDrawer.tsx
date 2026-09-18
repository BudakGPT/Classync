import { useRef, type ReactNode } from 'react'
import { Archive, ArchiveRestore, BellRing, CalendarDays, CalendarPlus, Hash, PencilLine, Sparkles, UsersRound } from 'lucide-react'
import { ActivityItem } from '@/components/domain/ActivityItem'
import { Badge, Button, CategoryBadge, Drawer, IconTile, PersonLine, StatusBadge } from '@/components/ui'
import { href, navigate } from '@/lib/router'
import { shortName } from '@/lib/selectors'
import { dueLabel, fmtDate, fmtTime, relTime } from '@/lib/time'
import { CATEGORY } from '@/lib/tones'
import type { Activity, Group, NotificationItem } from '@/lib/types'
import { plural } from '@/lib/utils'
import { useStore } from '@/store/store'
import { DiscordSidebar } from './DiscordSidebar'
import { ClassChips, ClassStripe, DurationInfo, GroupMenu, TypeBadge, useClassTone, useGroupOps } from './GroupBits'
import { GROUP_TYPES, groupPath } from './meta'

function Section({ title, count, action, children }: { title: string; count?: number; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-7">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
          {title}{count != null && <span className="rounded-full bg-subtle px-1.5 py-px text-[10.5px] text-ink-2 tabular">{count}</span>}
        </h3>
        {action}
      </div>
      {children}
    </section>
  )
}

function Empty({ children, action }: { children: ReactNode; action: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-line-strong px-3.5 py-3 text-[12.5px] text-ink-3">
      {children}{action}
    </div>
  )
}

function notificationMeta(n: NotificationItem) {
  const read = n.stats ? ` · ${n.stats.read}/${n.stats.delivered} read` : ''
  if (n.status === 'Sent' && n.sendAt) return `Sent ${relTime(n.sendAt)}${read}`
  if (n.status === 'Scheduled' && n.sendAt) return `Sends ${dueLabel(n.sendAt)}`
  if (n.status === 'Recurring' && n.repeat) return `Every ${n.repeat.day}, ${n.repeat.time}`
  return 'Draft'
}

export function GroupDetailDrawer({ id, onEdit, onDelete }: { id?: string; onEdit: (id: string) => void; onDelete: (id: string) => void }) {
  const { data, person, openModal } = useStore()
  const ops = useGroupOps()
  const classTone = useClassTone()
  const found = data.groups.find((g) => g.id === id)
  const last = useRef<Group | undefined>(found)
  if (found) last.current = found
  const g = found ?? last.current // keep content while the drawer animates out
  if (!g) return null

  const meta = GROUP_TYPES[g.type]
  const archived = g.status === 'Archived'
  const events = data.events.filter((e) => e.groupId === g.id).sort((a, b) => a.start.localeCompare(b.start))
  const notifications = data.notifications.filter((n) => n.audience.groupIds.includes(g.id))
  const logged = data.activities.filter((a) => a.target === g.name)
  const created: Activity = { id: `created-${g.id}`, actorId: g.createdBy, action: 'created group', target: g.name, detail: `${plural(g.memberIds.length, 'member')} · ${g.role} role and ${plural(g.text.length + g.voice.length, 'channel')} created`, type: 'groups', at: g.createdAt }
  const activity = [...logged, ...(logged.some((a) => a.action === 'created group') ? [] : [created])].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 5)

  const notify = () => openModal({
    type: 'createNotification',
    prefill: { category: g.type === 'Presentation' ? 'Presentation' : g.type === 'FGD' ? 'FGD' : 'Announcement', audience: { type: 'group', classIds: g.classIds, groupIds: [g.id], studentIds: [] } },
  })
  const close = () => navigate(groupPath())

  return (
    <Drawer
      open={!!found} onClose={close} size="lg"
      title={g.name}
      subtitle={
        <div className="mt-1 flex flex-wrap items-center gap-1">
          <TypeBadge type={g.type} />
          <ClassChips group={g} />
          <StatusBadge status={g.status} size="xs" />
          {g.isNew && <Badge tone="brand" icon={Sparkles} size="xs">New</Badge>}
        </div>
      }
      actions={<GroupMenu group={g} onEdit={onEdit} onDelete={onDelete} />}
      footer={
        <>
          <Button variant="ghost" icon={archived ? ArchiveRestore : Archive} onClick={() => ops.archive(g)} className="mr-auto">{archived ? 'Restore' : 'Archive'}</Button>
          <Button variant="secondary" icon={BellRing} onClick={notify}>Notify group</Button>
          <Button variant="primary" icon={PencilLine} onClick={() => onEdit(g.id)}>Edit group</Button>
        </>
      }
    >
      {/* Overview */}
      <div className="overflow-hidden rounded-2xl border border-line">
        <ClassStripe classIds={g.classIds} muted={archived} />
        <div className="p-4">
          <div className="flex items-start gap-3">
            <IconTile icon={meta.icon} tone={archived ? 'slate' : meta.tone} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] leading-relaxed text-ink-2">{g.description ?? `${g.type} group`}</p>
              <p className="mt-1 text-xs text-ink-3">Created by <span className="font-semibold text-ink-2">{shortName(person(g.createdBy))}</span> · {relTime(g.createdAt)}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { icon: UsersRound, label: 'Members', value: g.memberIds.length },
              { icon: Hash, label: 'Channels', value: g.text.length + g.voice.length },
              { icon: CalendarDays, label: 'Events', value: events.length },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-subtle/70 px-3 py-2.5">
                <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-ink-3"><s.icon className="size-3.5" />{s.label}</div>
                <div className="mt-0.5 text-lg font-extrabold leading-tight text-ink tabular">{s.value}</div>
              </div>
            ))}
          </div>
          <div className="mt-4"><DurationInfo group={g} /></div>
        </div>
      </div>

      <Section title="Members" count={g.memberIds.length} action={<Button variant="ghost" size="xs" icon={PencilLine} onClick={() => onEdit(g.id)}>Edit members</Button>}>
        <div className="divide-y divide-line overflow-hidden rounded-xl border border-line">
          {g.memberIds.map((mid) => {
            const p = person(mid)
            return (
              <a key={mid} href={href(`/students/${mid}`)} className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-subtle/60">
                <PersonLine id={mid} presence className="flex-1" subtitle={`${p?.npm ?? ''} · ${p?.discord ? `@${p.discord}` : 'Discord not connected'}`} />
                <Badge tone={classTone(p?.classId)} dot size="xs">Class {p?.classId}</Badge>
              </a>
            )
          })}
        </div>
      </Section>

      <Section title="Discord resources" count={g.text.length + g.voice.length + 1}>
        <DiscordSidebar category={g.name} text={g.text} voice={g.voice} roleName={g.role} memberIds={g.memberIds} split />
        <p className="mt-2.5 flex items-center gap-1.5 text-xs text-ink-3">
          <span className={archived ? 'size-1.5 rounded-full bg-slate-400' : 'size-1.5 rounded-full bg-emerald-500'} />
          {archived ? 'Channels are read-only while the group is archived' : `Managed by Classync · synced ${relTime(data.discord.lastSync)}`}
        </p>
      </Section>

      <Section title="Related events" count={events.length}>
        {events.length === 0
          ? <Empty action={<Button size="xs" variant="soft" icon={CalendarPlus} onClick={() => openModal({ type: 'createEvent' })}>Schedule</Button>}>No sessions scheduled for this group yet.</Empty>
          : (
            <div className="space-y-2">
              {events.map((e) => {
                const [day, mon] = fmtDate(e.start).split(' ')
                return (
                  <a key={e.id} href={href('/calendar')} className="flex items-center gap-3 rounded-xl border border-line p-2.5 transition hover:border-line-strong hover:bg-subtle/50">
                    <span className="grid w-11 shrink-0 place-items-center rounded-lg bg-subtle py-1 text-center">
                      <span className="text-[10px] font-bold uppercase text-ink-3">{mon}</span>
                      <span className="text-[17px] font-extrabold leading-none text-ink tabular">{day}</span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-semibold text-ink">{e.title}</span>
                      <span className="block truncate text-xs text-ink-3">{relTime(e.start)}{e.end && `–${fmtTime(e.end)}`}{e.location && ` · ${e.location}`}</span>
                    </span>
                    <CategoryBadge category={e.category} size="xs" />
                  </a>
                )
              })}
            </div>
          )}
      </Section>

      <Section title="Notifications" count={notifications.length}>
        {notifications.length === 0
          ? <Empty action={<Button size="xs" variant="soft" icon={BellRing} onClick={notify}>Notify</Button>}>No notifications have targeted this group.</Empty>
          : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <a key={n.id} href={href('/notifications')} className="flex items-center gap-3 rounded-xl border border-line p-2.5 transition hover:border-line-strong hover:bg-subtle/50">
                  <IconTile icon={CATEGORY[n.category].icon} tone={CATEGORY[n.category].tone} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-ink">{n.title}</span>
                    <span className="block truncate text-xs text-ink-3">{notificationMeta(n)}</span>
                  </span>
                  <StatusBadge status={n.status} size="xs" />
                </a>
              ))}
            </div>
          )}
      </Section>

      <Section title="Recent activity">
        <div className="space-y-3.5">
          {activity.map((a) => <ActivityItem key={a.id} activity={a} />)}
        </div>
      </Section>
    </Drawer>
  )
}
