import { useMemo } from 'react'
import { CalendarDays, ChevronRight, CircleCheck, GraduationCap, History, LifeBuoy, ListChecks, Users } from 'lucide-react'
import { ActivityItem } from '@/components/domain/ActivityItem'
import {
  AnonStack, Avatar, AvatarStack, Button, Card, CardHeader, CategoryBadge, EmptyState, ProgressBar, StackedProgress, StatCard, StatusBadge,
} from '@/components/ui'
import { navigate } from '@/lib/router'
import { eventParticipantIds, taskCounts } from '@/lib/selectors'
import { CATEGORY, tone } from '@/lib/tones'
import { dueLabel, fmtDay, fmtTime, urgency } from '@/lib/time'
import type { Assignment } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'
import { classActivities, classPath, upcomingItems, type ClassStats, type TabProps, type UpcomingItem } from './lib'
import { DueBadge, PresenceDot } from './parts'

export function OverviewTab({ cls, s }: TabProps) {
  const { data } = useStore()
  const upcoming = useMemo(() => upcomingItems(data, cls, s), [data, cls, s])
  const activity = useMemo(() => classActivities(data, cls, s).slice(0, 5), [data, cls, s])
  const go = (tab: 'members' | 'assignments' | 'activity') => navigate(classPath(cls.id, tab))
  const active = s.roster.filter((p) => p.status === 'Active').length
  const dueSoon = s.upcoming.filter((a) => urgency(a.due) === 'urgent').length
  const m = s.meeting

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Active students" value={active} icon={Users} tone="brand" onClick={() => go('members')}
          footer={<span className="flex items-center gap-1.5 tabular"><PresenceDot className="size-1.5" />{s.online.length} online now</span>}
        />
        <StatCard
          label="Open tasks" value={s.upcoming.length} icon={ListChecks} tone="sky" onClick={() => go('assignments')}
          footer={dueSoon ? <span className="font-semibold text-rose-600">{dueSoon} due within 48 hours</span> : `${s.assignments.length} assignments this term`}
        />
        <StatCard
          label="Next meeting" icon={GraduationCap} tone="teal" onClick={() => navigate('/calendar')}
          value={m ? (m.live ? 'Live now' : `${fmtDay(m.event.start).slice(0, 3)} ${fmtTime(m.event.start)}`) : '—'}
          footer={
            <span className="block truncate">
              {m ? (m.live ? `Until ${fmtTime(m.event.end ?? m.event.start)} · ${m.event.location ?? cls.schedule.room}` : `${fmtDay(m.event.start)} · ${m.event.location ?? cls.schedule.room}`) : 'No lectures scheduled'}
            </span>
          }
        />
        <StatCard
          label="Open help requests" value={s.helpRequests} icon={LifeBuoy} tone="amber" onClick={() => navigate('/help')}
          footer={<span className="block truncate">{s.openHelp.length ? s.openHelp.map((h) => h.concept).join(', ') : 'Nobody is stuck right now'}</span>}
        />
        <StatCard
          label="Completion rate" value={`${s.completion}%`} icon={CircleCheck} tone="emerald" onClick={() => go('assignments')}
          footer={<ProgressBar value={s.completion} tone="emerald" size="sm" label="Completion rate" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="min-w-0 space-y-5 lg:col-span-2">
          <Card>
            <CardHeader
              title="Upcoming deadlines" subtitle="Assignments and sessions for this class" icon={CalendarDays} tone={cls.tone}
              action={<Button size="sm" variant="ghost" iconRight={ChevronRight} onClick={() => navigate('/calendar')}>Calendar</Button>}
            />
            {upcoming.length ? (
              <ul className="mt-3 px-3 pb-3">
                {upcoming.map((it, i) => <UpcomingRow key={it.kind === 'assignment' ? it.a.id : it.e.id} item={it} i={i} />)}
              </ul>
            ) : (
              <EmptyState compact title="Nothing due soon" description="New assignments and sessions for this class will show up here." icon={CalendarDays} tone={cls.tone} />
            )}
          </Card>

          <Card>
            <CardHeader
              title="Recent class activity" subtitle="Students, assignments, groups and Discord" icon={History} tone="slate"
              action={<Button size="sm" variant="ghost" iconRight={ChevronRight} onClick={() => go('activity')}>View all</Button>}
            />
            {activity.length ? (
              <div className="space-y-4 px-5 pb-5 pt-4">{activity.map((a) => <ActivityItem key={a.id} activity={a} />)}</div>
            ) : (
              <EmptyState compact title="No activity yet" description={`Things that happen in ${cls.name} will appear here.`} icon={History} tone={cls.tone} />
            )}
          </Card>
        </div>

        <div className="min-w-0 space-y-5">
          <WhoIsOnline cls={cls} s={s} />
          <HelpCard s={s} />
        </div>
      </div>
    </div>
  )
}

function AssignmentMini({ a }: { a: Assignment }) {
  const c = taskCounts(a)
  return (
    <span className="hidden w-44 shrink-0 sm:block">
      <span className="flex items-center justify-between gap-2 text-[11.5px]">
        <span className="text-ink-3 tabular"><b className="font-bold text-ink">{c.completed}</b>/{c.total} done</span>
        <DueBadge iso={a.due} />
      </span>
      <StackedProgress
        size="sm" className="mt-1.5" total={c.total}
        segments={[{ value: c.completed, tone: 'emerald', label: 'Completed' }, { value: c.in_progress, tone: 'sky', label: 'In progress' }, { value: c.stuck, tone: 'rose', label: 'Stuck' }]}
      />
    </span>
  )
}

function UpcomingRow({ item, i }: { item: UpcomingItem; i: number }) {
  const { data } = useStore()
  const cat = item.kind === 'assignment' ? item.a.category : item.e.category
  const t = tone(CATEGORY[cat].tone)
  const title = item.kind === 'assignment' ? item.a.title : item.e.title
  const where = item.kind === 'assignment' ? 'Submit in #assignment' : item.e.location
  return (
    <li className="animate-rise-in" style={{ animationDelay: `${i * 40}ms` }}>
      <button
        type="button" onClick={() => navigate(item.kind === 'assignment' ? `/assignments/${item.a.id}` : '/calendar')}
        className="flex w-full items-center gap-4 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-subtle/70"
      >
        <span className={cn('flex w-12 shrink-0 flex-col items-center rounded-xl py-1.5 leading-none', t.soft, t.text)}>
          <span className="text-[10px] font-bold uppercase tracking-wider">{fmtDay(item.at).slice(0, 3)}</span>
          <span className="mt-1 text-lg font-extrabold tabular">{new Date(item.at).getDate()}</span>
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-[13.5px] font-semibold text-ink">{title}</span>
            <CategoryBadge category={cat} size="xs" />
          </span>
          <span className="mt-0.5 block truncate text-xs text-ink-3">{dueLabel(item.at)}{where ? ` · ${where}` : ''}</span>
        </span>
        {item.kind === 'assignment' ? <AssignmentMini a={item.a} /> : <AvatarStack ids={eventParticipantIds(item.e, data)} max={3} size="sm" />}
      </button>
    </li>
  )
}

function WhoIsOnline({ cls, s }: TabProps) {
  const { person } = useStore()
  const MAX = 17
  const shown = s.online.slice(0, MAX)
  const rest = s.online.length - shown.length
  const idle = s.roster.filter((p) => p.presence === 'idle').length
  const team = [cls.lecturerId, ...cls.taIds]
  const teamOnline = team.filter((id) => person(id)?.presence === 'online')

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-bold tracking-tight text-ink">Who's online</h3>
          <p className="text-xs text-ink-3">Live presence from Discord</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200 tabular">
          <PresenceDot className="size-1.5" />{s.online.length} online
        </span>
      </div>

      {shown.length ? (
        <div className="mt-4 grid grid-cols-6 gap-2">
          {shown.map((p) => (
            <button key={p.id} type="button" onClick={() => navigate(`/students/${p.id}`)} aria-label={`Open ${p.name}`} className="grid place-items-center rounded-full transition hover:-translate-y-0.5">
              <Avatar id={p.id} size="lg" presence tooltip />
            </button>
          ))}
          {rest > 0 && (
            <button type="button" onClick={() => navigate(classPath(cls.id, 'members'))} className="grid size-10 place-items-center justify-self-center rounded-full bg-subtle text-xs font-bold text-ink-2 transition hover:bg-line tabular" aria-label={`${rest} more online`}>
              +{rest}
            </button>
          )}
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-canvas p-4 text-center text-[13px] text-ink-3">No students online right now.</p>
      )}

      <div className="mt-4 flex items-center gap-2.5 rounded-xl bg-canvas px-3 py-2 ring-1 ring-inset ring-line">
        <AvatarStack ids={team} size="sm" />
        <span className="min-w-0 truncate text-xs text-ink-2">
          {teamOnline.length ? <><b className="font-semibold text-ink">{teamOnline.length} of {team.length}</b> teaching staff online</> : 'Teaching staff are away'}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-ink-3 tabular">
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-emerald-500" />{s.online.length} online</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber-400" />{idle} idle</span>
        <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-slate-300" />{s.roster.length - s.online.length - idle} offline</span>
      </div>
    </Card>
  )
}

function HelpCard({ s }: { s: ClassStats }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-bold tracking-tight text-ink">Help requests</h3>
          <p className="text-xs text-ink-3">Grouped by concept · identities protected</p>
        </div>
        <Button size="xs" variant="ghost" iconRight={ChevronRight} onClick={() => navigate('/help')}>Help Center</Button>
      </div>
      {s.openHelp.length ? (
        <ul className="-mx-2 mt-3 space-y-0.5">
          {s.openHelp.map((h) => (
            <li key={h.id}>
              <button type="button" onClick={() => navigate('/help')} className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-subtle/70">
                <AnonStack count={h.reports} max={3} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13.5px] font-semibold text-ink">{h.concept}</span>
                  <span className="block truncate text-xs text-ink-3 tabular">{h.reports} reports{h.requesterIds.length ? ` · ${h.requesterIds.length} asked for help` : ''}</span>
                </span>
                <StatusBadge status={h.priority} size="xs" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState compact className="pb-2 pt-5" title="No open help requests" description="Nobody in this class is stuck right now 🎉" icon={LifeBuoy} tone="emerald" />
      )}
    </Card>
  )
}
