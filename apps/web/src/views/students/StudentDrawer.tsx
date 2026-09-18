import type { ReactNode } from 'react'
import { BadgeCheck, CalendarDays, GraduationCap, Mail, PencilLine, School, Send, Unplug, UserPlus, Users } from 'lucide-react'
import { ActivityItem } from '@/components/domain/ActivityItem'
import {
  Avatar, AvatarStack, Badge, Button, DiscordGlyph, Drawer, IconTile, RoleChip, StatusBadge,
} from '@/components/ui'
import { CATEGORY, tone } from '@/lib/tones'
import { dueLabel, fmtDate, urgency } from '@/lib/time'
import type { Person } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useActions } from '@/store/actions'
import { useStore } from '@/store/store'
import { taughtClasses } from './lib'
import { AdminBadge, ClassChip, NewBadge, StatusDot } from './parts'

export function StudentDrawer({ person: p, open, onClose }: { person?: Person; open: boolean; onClose: () => void }) {
  if (!p) return null
  return (
    <Drawer
      open={open} onClose={onClose} size="lg"
      title={p.role === 'Student' ? 'Student profile' : 'Staff profile'}
      subtitle="Synced with the academic database and Fasilkom Academic Hub"
      footer={<Footer p={p} />}
    >
      <Profile p={p} />
    </Drawer>
  )
}

function Footer({ p }: { p: Person }) {
  const { data, toast, openModal } = useStore()
  const first = p.name.split(' ')[0]
  const next = data.assignments
    .filter((a) => a.classId === p.classId && a.progress[p.id] && a.progress[p.id] !== 'completed' && urgency(a.due) !== 'overdue')
    .sort((a, b) => a.due.localeCompare(b.due))[0]
  const remind = () => p.discord
    ? toast({ title: `Reminder DM sent to ${first}`, description: next ? `Classync Bot · ${next.title} is due ${dueLabel(next.due)}` : 'Classync Bot · personal check-in message', tone: 'discord' })
    : toast({ title: `${first} isn't on Discord yet`, description: 'An onboarding invite was re-sent by email instead.', tone: 'warning' })
  return (
    <>
      <Button variant="ghost" icon={PencilLine} className="mr-auto" onClick={() => toast({ title: 'Editing coming soon', description: 'Profile fields are synced from the academic database.', tone: 'info' })}>Edit</Button>
      <Button icon={UserPlus} onClick={() => openModal({ type: 'createGroup', prefill: { memberIds: [p.id], classId: p.classId } })}>Add to group</Button>
      <Button variant="discord" icon={Send} onClick={remind}>Send reminder DM</Button>
    </>
  )
}

function Section({ title, count, children, action }: { title: string; count?: number; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="animate-rise-in">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">{title}{count != null && <span className="ml-1.5 tabular text-ink-3/80">{count}</span>}</h4>
        {action}
      </div>
      {children}
    </section>
  )
}

function Profile({ p }: { p: Person }) {
  const { data, toast } = useStore()
  const actions = useActions()
  const first = p.name.split(' ')[0]
  const isStudent = p.role === 'Student'
  const cls = data.classes.find((c) => c.id === p.classId)
  const teaches = taughtClasses(data, p.id)
  const groups = data.groups.filter((g) => g.memberIds.includes(p.id) || (!isStudent && g.createdBy === p.id))
  const tasks = data.assignments.filter((a) => isStudent && a.classId === p.classId && a.progress[p.id]).sort((a, b) => a.due.localeCompare(b.due))
  const activity = data.activities.filter((a) => a.actorId === p.id || a.target?.includes(p.name)).slice(0, 6)

  const roles = [
    ...(p.isAdmin ? [{ name: '@Admin', tone: 'violet' as const }] : []),
    ...(p.role === 'Lecturer' ? [{ name: '@Lecturer', tone: 'brand' as const }] : p.role === 'Teaching Assistant' ? [{ name: '@Teaching-Assistant', tone: 'teal' as const }] : []),
    ...(cls && p.verification === 'Verified' ? [{ name: cls.discord.role, tone: cls.tone }] : []),
    ...groups.filter((g) => g.memberIds.includes(p.id) && g.status === 'Active').map((g) => ({ name: g.role, tone: 'teal' as const })),
  ]

  const verify = () => {
    actions.verifyStudent(p.id)
    toast({ title: `${first} is now verified`, description: `@Class-${p.classId} role assigned · class channels unlocked`, tone: 'success' })
  }

  return (
    <div className="space-y-6">
      {/* hero */}
      <div className="flex items-start gap-4">
        <span className={cn('rounded-full', p.isNew && 'animate-highlight')}><Avatar id={p.id} size="2xl" presence pulse /></span>
        <div className="min-w-0 flex-1 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-extrabold tracking-tight text-ink">{p.name}</h3>
            {p.isNew && <NewBadge />}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone={isStudent ? 'sky' : p.role === 'Lecturer' ? 'brand' : 'teal'} icon={isStudent ? GraduationCap : School}>{p.role}</Badge>
            {p.isAdmin && <AdminBadge />}
            <StatusBadge status={p.verification} />
          </div>
          <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-3">
            <span className="tabular">NPM {p.npm}</span>
            <span className="inline-flex items-center gap-1"><Mail className="size-3.5" />{p.email}</span>
          </p>
        </div>
      </div>

      {/* verification callout */}
      {p.verification !== 'Verified' && (
        <div className={cn('flex items-start gap-3 rounded-xl border p-3.5', p.verification === 'Pending' ? 'border-amber-200 bg-amber-50/70' : 'border-line bg-subtle/60')}>
          <IconTile icon={p.verification === 'Pending' ? BadgeCheck : Unplug} tone={p.verification === 'Pending' ? 'amber' : 'slate'} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-ink">{p.verification === 'Pending' ? `${first} joined Discord but isn't verified yet` : `${first} hasn't connected Discord`}</p>
            <p className="mt-0.5 text-xs text-ink-3">{p.verification === 'Pending' ? `Verify to assign @Class-${p.classId} and unlock class channels.` : 'Reminders fall back to email until they join the server.'}</p>
          </div>
          {p.verification === 'Pending'
            ? <Button size="sm" variant="success" icon={BadgeCheck} onClick={verify}>Verify manually</Button>
            : <Button size="sm" onClick={() => toast({ title: `Invite sent to ${p.email}`, description: 'Includes the Fasilkom Academic Hub link', tone: 'info' })}>Send invite</Button>}
        </div>
      )}

      {/* facts */}
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line">
        <Fact label={isStudent ? 'Class' : 'Teaches'}>
          {isStudent
            ? <span className="flex items-center gap-2"><ClassChip classId={p.classId} />{cls && <span className="truncate text-xs text-ink-3">{cls.subject}</span>}</span>
            : teaches.length ? <span className="flex flex-wrap gap-1">{teaches.map((c) => <Badge key={c.id} tone={c.tone} dot size="xs">{c.name}</Badge>)}</span> : '—'}
        </Fact>
        <Fact label="Discord">
          {p.discord ? <span className="inline-flex items-center gap-1.5"><DiscordGlyph className="size-4 text-discord" />{p.discord}</span> : <span className="text-ink-3">Not connected</span>}
        </Fact>
        <Fact label="Status"><StatusDot status={p.status} /></Fact>
        <Fact label="Joined"><span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5 text-ink-3" />{fmtDate(p.joinedAt)}</span></Fact>
      </dl>

      {/* roles */}
      <Section title="Discord roles" count={roles.length}>
        {roles.length
          ? <div className="flex flex-wrap gap-1.5">{roles.map((r) => <RoleChip key={r.name} name={r.name} tone={r.tone} />)}</div>
          : <p className="text-[13px] text-ink-3">No roles yet — roles are assigned after Discord verification.</p>}
      </Section>

      {/* staff: classes taught */}
      {!isStudent && teaches.length > 0 && (
        <Section title="Classes taught" count={teaches.length}>
          <div className="grid gap-2 sm:grid-cols-2">
            {teaches.map((c) => {
              const n = data.people.filter((x) => x.role === 'Student' && x.classId === c.id).length
              return (
                <div key={c.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                  <span className={cn('grid size-9 place-items-center rounded-lg text-[15px] font-extrabold', tone(c.tone).soft, tone(c.tone).text)}>{c.id}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">{c.subject}</p>
                    <p className="text-xs text-ink-3">{c.lecturerId === p.id ? 'Lecturer' : 'Teaching assistant'} · {n} students</p>
                  </div>
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {/* groups */}
      <Section title={isStudent ? 'Groups' : 'Groups created'} count={groups.length}>
        {groups.length ? (
          <ul className="divide-y divide-line rounded-xl border border-line">
            {groups.map((g) => (
              <li key={g.id}>
                <a href={`#/groups/${g.id}`} className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-subtle/60">
                  <IconTile icon={Users} tone={g.status === 'Active' ? 'teal' : 'slate'} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">{g.name}</p>
                    <p className="truncate text-xs text-ink-3">{g.type} · {g.classIds.map((c) => `Class ${c}`).join(', ')}</p>
                  </div>
                  {g.status === 'Archived' && <StatusBadge status="Archived" size="xs" />}
                  <AvatarStack ids={g.memberIds} max={3} size="xs" />
                </a>
              </li>
            ))}
          </ul>
        ) : <p className="text-[13px] text-ink-3">{isStudent ? `${first} isn't in any group yet.` : 'No groups created yet.'}</p>}
      </Section>

      {/* tasks */}
      {isStudent && (
        <Section title="Tasks" count={tasks.length}>
          {tasks.length ? (
            <ul className="space-y-1.5">
              {tasks.map((a) => {
                const u = urgency(a.due)
                return (
                  <li key={a.id}>
                    <a href={`#/assignments/${a.id}`} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2.5 transition hover:border-line-strong hover:bg-subtle/40">
                      <IconTile icon={CATEGORY[a.category === 'Project' ? 'Assignment' : a.category].icon} tone={CATEGORY[a.category === 'Project' ? 'Assignment' : a.category].tone} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-ink">{a.title}</p>
                        <p className={cn('text-xs', u === 'urgent' && a.progress[p.id] !== 'completed' ? 'font-semibold text-orange-600' : 'text-ink-3')}>{u === 'overdue' ? `Closed ${fmtDate(a.due)}` : `Due ${dueLabel(a.due)}`}</p>
                      </div>
                      <StatusBadge status={a.progress[p.id]} size="xs" />
                    </a>
                  </li>
                )
              })}
            </ul>
          ) : <p className="text-[13px] text-ink-3">No assignments for this class yet.</p>}
        </Section>
      )}

      {/* activity */}
      <Section title="Recent activity" count={activity.length}>
        {activity.length
          ? <div className="space-y-3.5">{activity.map((a) => <ActivityItem key={a.id} activity={a} compact />)}</div>
          : <p className="text-[13px] text-ink-3">No recent activity from {first}.</p>}
      </Section>
    </div>
  )
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 bg-surface px-3.5 py-3">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">{label}</dt>
      <dd className="mt-1 truncate text-[13px] font-medium text-ink">{children}</dd>
    </div>
  )
}
