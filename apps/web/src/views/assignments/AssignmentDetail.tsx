import { useEffect, useReducer, useState } from 'react'
import { ArrowLeft, BellRing, CalendarClock, CircleCheck, LayoutDashboard, LifeBuoy, Megaphone, SearchX, Users } from 'lucide-react'
import { Avatar, AvatarStack, Badge, Button, Card, EmptyState, IconTile, PersonLine, Tabs } from '@/components/ui'
import { href, navigate, useRoute } from '@/lib/router'
import { shortName, taskCounts } from '@/lib/selectors'
import { dueLabel, fmtLong, now, nowIso, relTime, timeLeft, urgency } from '@/lib/time'
import type { TaskState } from '@/lib/types'
import { cn, plural, wait } from '@/lib/utils'
import { useStore } from '@/store/store'
import { AnnouncementsTab } from './AnnouncementsTab'
import { HelpTab } from './HelpTab'
import {
  categoryMeta, DETAIL_TABS, linkedClusters, linkedNotifications, notificationCategory, STATES, type DetailTab,
} from './lib'
import { OverviewTab } from './OverviewTab'
import { ClassChip, DueBadge, TaskCategoryBadge } from './parts'
import { StudentsTab } from './StudentsTab'

const Eyebrow = ({ children }: { children: string }) => <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">{children}</div>

export function AssignmentDetail({ id }: { id: string }) {
  const { data, person, toast, log, openModal } = useStore()
  const { params } = useRoute()
  const [reminding, setReminding] = useState(false)
  const [remindedAt, setRemindedAt] = useState<string | null>(null)
  const a = data.assignments.find((x) => x.id === id)

  if (!a) {
    return (
      <Card>
        <EmptyState icon={SearchX} title="Assignment not found" description="It may have been removed, or the link is out of date."
          action={{ label: 'Back to assignments', icon: ArrowLeft, onClick: () => navigate('/assignments') }} />
      </Card>
    )
  }

  const cls = data.classes.find((c) => c.id === a.classId)
  const c = taskCounts(a)
  const incomplete = c.total - c.completed
  const openHelp = linkedClusters(a, data.helpClusters).filter((h) => h.status === 'open').length
  const announcements = linkedNotifications(a, data.notifications)
  const closed = urgency(a.due) === 'overdue'
  const cat = categoryMeta(a.category)
  const tab = DETAIL_TABS.find((t) => t === params.get('tab')) ?? 'overview'
  const filter = STATES.find((s) => s.value === params.get('state'))?.value ?? 'all'
  const go = (t: DetailTab, state?: TaskState | 'all') => navigate(`/assignments/${a.id}?tab=${t}${state && state !== 'all' ? `&state=${state}` : ''}`)

  const remind = async () => {
    if (!incomplete) {
      toast({ title: 'Everyone is done 🎉', description: 'No reminders needed — every student completed this task.', tone: 'success' })
      return
    }
    setReminding(true)
    await wait(900)
    setReminding(false)
    setRemindedAt(nowIso())
    log({ actorId: 'classync', action: 'sent a reminder to', target: plural(incomplete, 'student'), detail: `${a.title} · due ${dueLabel(a.due).toLowerCase()}`, type: 'notifications' })
    toast({ title: `Reminder sent to ${plural(incomplete, 'student')}`, description: `Discord DMs delivered to everyone in ${cls?.name ?? `Class ${a.classId}`} who hasn't marked it done.`, tone: 'discord' })
  }

  const notify = () => openModal({
    type: 'createNotification',
    prefill: {
      title: a.title, category: notificationCategory(a.category), description: a.description, deadline: a.due,
      reminders: ['1 day before', '1 hour before'], audience: { type: 'class', classIds: [a.classId], groupIds: [], studentIds: [] },
    },
  })

  return (
    <>
      <a href={href('/assignments')} className="group mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-3 transition-colors hover:text-ink">
        <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />All assignments
      </a>

      <Card className={cn('hero-gradient overflow-hidden p-6', a.isNew && 'animate-highlight')}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 max-w-3xl flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <ClassChip classId={a.classId} size="md" />
              <TaskCategoryBadge category={a.category} size="md" />
              <DueBadge iso={a.due} size="md" />
              {a.isNew && <Badge tone="brand" size="md">New</Badge>}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <IconTile icon={cat.icon} tone={cat.tone} size="lg" />
              <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-ink">{a.title}</h1>
            </div>
            <p className="mt-2.5 text-[14px] leading-relaxed text-ink-2">{a.description}</p>
            <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-4">
              {cls && <PersonLine id={cls.lecturerId} presence subtitle={`Lecturer · ${cls.subject}`} />}
              {cls && cls.taIds.length > 0 && (
                <div><Eyebrow>Teaching assistants</Eyebrow><AvatarStack ids={cls.taIds} className="mt-1" /></div>
              )}
              <div>
                <Eyebrow>Created</Eyebrow>
                <div className="mt-1 flex items-center gap-1.5 text-[13px] text-ink-2">
                  <Avatar id={a.createdBy} size="xs" />{shortName(person(a.createdBy))} · {relTime(a.createdAt)}
                </div>
              </div>
            </div>
          </div>
          <Countdown iso={a.due} />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-line/80 pt-4">
          <Button variant="discord" icon={BellRing} loading={reminding} disabled={closed} onClick={remind}>
            Remind incomplete students
            {incomplete > 0 && <span className="rounded-full bg-white/20 px-1.5 text-[11px] tabular">{incomplete}</span>}
          </Button>
          <Button variant="secondary" icon={Megaphone} onClick={notify}>Notify class</Button>
          <Button variant="ghost" icon={LifeBuoy} onClick={() => go('help')}>
            View help requests{openHelp > 0 && <Badge tone="rose" size="xs">{openHelp} open</Badge>}
          </Button>
          {remindedAt && (
            <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 animate-fade-in">
              <CircleCheck className="size-3.5" />Reminder sent {relTime(remindedAt).toLowerCase()} · reminders stop once students mark it done
            </span>
          )}
        </div>
      </Card>

      <Tabs
        className="mt-6" value={tab} onChange={(t) => go(t)}
        items={[
          { value: 'overview', label: 'Overview', icon: LayoutDashboard },
          { value: 'students', label: 'Students', icon: Users, count: c.total },
          { value: 'help', label: 'Help Requests', icon: LifeBuoy, count: openHelp },
          { value: 'announcements', label: 'Announcements', icon: Megaphone, count: announcements.length },
        ]}
      />

      <div key={tab} className="mt-5 animate-rise-in">
        {tab === 'overview' && <OverviewTab a={a} go={go} />}
        {tab === 'students' && <StudentsTab a={a} filter={filter} onFilter={(s) => go('students', s)} />}
        {tab === 'help' && <HelpTab a={a} />}
        {tab === 'announcements' && <AnnouncementsTab a={a} items={announcements} onCreate={notify} />}
      </div>
    </>
  )
}

/** Days / hours / minutes to the deadline; re-renders every 20 s so the demo clock visibly ticks. */
function Countdown({ iso }: { iso: string }) {
  const [, tick] = useReducer((x: number) => x + 1, 0)
  useEffect(() => {
    const t = setInterval(tick, 20_000)
    return () => clearInterval(t)
  }, [])
  const ms = new Date(iso).getTime() - now().getTime()
  const urgent = urgency(iso) === 'urgent'
  const parts: [number, string][] = [[Math.floor(ms / 86_400_000), 'days'], [Math.floor(ms / 3_600_000) % 24, 'hours'], [Math.floor(ms / 60_000) % 60, 'min']]

  return (
    <div className="w-full shrink-0 rounded-2xl bg-surface/85 p-4 shadow-card ring-1 ring-line backdrop-blur-sm lg:w-72">
      <div className="flex items-center justify-between gap-3">
        <Eyebrow>{ms > 0 ? 'Time left' : 'Deadline'}</Eyebrow>
        {ms > 0 ? <Badge tone={urgent ? 'rose' : 'slate'} size="xs" dot>{timeLeft(iso)}</Badge> : <Badge tone="slate" size="xs">Closed</Badge>}
      </div>
      {ms > 0 ? (
        <div className="mt-2.5 grid grid-cols-3 gap-2">
          {parts.map(([v, label]) => (
            <div key={label} className="rounded-xl bg-canvas px-2 py-2.5 text-center">
              <div key={v} className={cn('text-[26px] font-extrabold leading-none tracking-tight tabular animate-fade-in', urgent ? 'text-rose-600' : 'text-ink')}>{String(v).padStart(2, '0')}</div>
              <div className="mt-1 text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">{label}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-2.5 rounded-xl bg-canvas px-3 py-3 text-[13px] font-semibold text-ink-2">Submissions closed {relTime(iso).toLowerCase()}</div>
      )}
      <div className="mt-2.5 flex items-center gap-1.5 text-xs text-ink-3"><CalendarClock className="size-3.5" />{fmtLong(iso)}</div>
    </div>
  )
}
