import { useMemo, type ReactNode } from 'react'
import { ArrowLeft, CalendarDays, MapPin, SearchX, Send, Sparkles, UserPlus, UsersRound, type LucideIcon } from 'lucide-react'
import { AvatarStack, Badge, Button, Card, EmptyState, IconTile, PersonLine, Tabs, Tooltip, type TabItem } from '@/components/ui'
import { href, navigate, useRoute } from '@/lib/router'
import { tone } from '@/lib/tones'
import type { ClassRoom, Tone } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'
import { ActivityTab } from './ActivityTab'
import { AssignmentsTab } from './AssignmentsTab'
import { DiscordTab } from './DiscordTab'
import { GroupsTab } from './GroupsTab'
import { MembersTab } from './MembersTab'
import { OverviewTab } from './OverviewTab'
import { classActivities, classAudience, classPath, classStats, endTime, isNewClass, TABS, type ClassTab } from './lib'
import { ClassMark, DiscordStatus, Eyebrow, LiveBadge } from './parts'

export function ClassDetail({ id }: { id: string }) {
  const { data } = useStore()
  const cls = data.classes.find((c) => c.id === id.toUpperCase())
  if (!cls) {
    return (
      <Card>
        <EmptyState
          icon={SearchX} title="Class not found" description={`There is no class "${id}" in ${data.settings.term}.`}
          action={{ label: 'Back to classes', icon: ArrowLeft, onClick: () => navigate('/classes') }}
        />
      </Card>
    )
  }
  return <ClassView cls={cls} />
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <Eyebrow className="mb-2">{label}</Eyebrow>
      {children}
    </div>
  )
}

function IconText({ icon, tone: t, title, sub }: { icon: LucideIcon; tone: Tone; title: ReactNode; sub: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <IconTile icon={icon} tone={t} />
      <div className="min-w-0">
        <div className="truncate text-[13.5px] font-semibold text-ink">{title}</div>
        <div className="truncate text-xs text-ink-3">{sub}</div>
      </div>
    </div>
  )
}

function ClassView({ cls }: { cls: ClassRoom }) {
  const { data, person, openModal } = useStore()
  const { params } = useRoute()
  const s = useMemo(() => classStats(data, cls), [data, cls])
  const activityCount = useMemo(() => classActivities(data, cls, s).length, [data, cls, s])
  const raw = params.get('tab') ?? ''
  const tab: ClassTab = (TABS as readonly string[]).includes(raw) ? (raw as ClassTab) : 'overview'
  const t = tone(cls.tone)
  const { day, time, room } = cls.schedule
  const lecturer = person(cls.lecturerId)

  const items: TabItem<ClassTab>[] = [
    { value: 'overview', label: 'Overview' },
    { value: 'members', label: 'Members', count: s.roster.length },
    { value: 'assignments', label: 'Assignments', count: s.assignments.length },
    { value: 'groups', label: 'Groups', count: s.groups.length },
    {
      value: 'discord',
      label: <span className="inline-flex items-center gap-1.5">Discord{!cls.discord.connected && <span className="size-1.5 rounded-full bg-amber-500" aria-label="not connected" />}</span>,
    },
    { value: 'activity', label: 'Activity', count: activityCount },
  ]

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <a href={href('/classes')} className="inline-flex items-center gap-1.5 rounded-lg text-[13px] font-semibold text-ink-3 transition-colors hover:text-ink">
          <ArrowLeft className="size-4" />All classes
        </a>
        <nav aria-label="Switch class" className="flex items-center gap-1.5">
          {data.classes.map((c) => {
            const current = c.id === cls.id
            return (
              <Tooltip key={c.id} content={`${c.name} · ${c.subject}`} side="bottom">
                <a
                  href={href(classPath(c.id, tab))} aria-current={current ? 'page' : undefined} aria-label={`${c.name} · ${c.subject}`}
                  className={cn(
                    'grid size-8 place-items-center rounded-lg text-[13px] font-bold transition',
                    current ? cn(tone(c.tone).solid, 'text-white shadow-card') : 'bg-surface text-ink-2 ring-1 ring-inset ring-line hover:text-ink hover:ring-line-strong',
                  )}
                >{c.id}</a>
              </Tooltip>
            )
          })}
        </nav>
      </div>

      {/* Banner */}
      <Card className="relative overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(60% 150% at 100% 0%, ${t.hex}22 0%, transparent 62%), radial-gradient(40% 120% at 0% 0%, ${t.hex}10 0%, transparent 60%)` }} />
        <div aria-hidden className="bg-dots pointer-events-none absolute inset-y-0 right-0 w-2/5 [mask-image:linear-gradient(to_left,black,transparent)]" />

        <div className="relative flex flex-wrap items-start justify-between gap-5 px-6 pb-5 pt-6">
          <div className="flex min-w-0 items-center gap-5">
            <ClassMark cls={cls} size="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 text-[13px] font-semibold">
                <span className={t.text}>{cls.subject}</span>
                <span className="text-ink-3">·</span>
                <span className="text-ink-3 tabular">{cls.code}</span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-2.5">
                <h1 className="text-[30px] font-extrabold leading-tight tracking-tight text-ink">{cls.name}</h1>
                <DiscordStatus connected={cls.discord.connected} />
                {s.meeting?.live && <LiveBadge />}
                {isNewClass(cls) && <Badge tone="brand" icon={Sparkles}>New</Badge>}
              </div>
              <p className="mt-0.5 text-[13px] text-ink-3">{data.settings.term} · {s.groups.length} groups · {s.assignments.length} assignments</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" icon={UserPlus} onClick={() => openModal({ type: 'addStudent', classId: cls.id })}>Add student</Button>
            <Button variant="secondary" icon={UsersRound} onClick={() => openModal({ type: 'createGroup', prefill: { classId: cls.id } })}>Create group</Button>
            <Button variant="primary" icon={Send} onClick={() => openModal({ type: 'createNotification', prefill: { audience: classAudience(cls.id) } })}>Send notification</Button>
          </div>
        </div>

        <div className="relative grid grid-cols-1 gap-x-6 gap-y-4 border-t border-line bg-surface/70 px-6 py-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          <Fact label="Lecturer">
            <PersonLine id={cls.lecturerId} presence subtitle={lecturer?.discord ? `@${lecturer.discord}` : 'Lecturer'} />
          </Fact>
          <Fact label="Teaching assistants">
            {cls.taIds.length ? (
              <div className="flex min-w-0 items-center gap-2.5">
                <AvatarStack ids={cls.taIds} size="md" />
                <div className="min-w-0 text-[13px] font-semibold leading-snug text-ink">
                  {cls.taIds.map((id) => <span key={id} className="block truncate">{person(id)?.name}</span>)}
                </div>
              </div>
            ) : <span className="text-[13px] text-ink-3">None assigned</span>}
          </Fact>
          <Fact label="Schedule"><IconText icon={CalendarDays} tone={cls.tone} title={`Every ${day}`} sub={`${time}–${endTime(time)} WIB`} /></Fact>
          <Fact label="Room"><IconText icon={MapPin} tone="slate" title={room} sub="Fasilkom campus" /></Fact>
          <Fact label="Students">
            <button type="button" onClick={() => navigate(classPath(cls.id, 'members'))} className="group flex min-w-0 items-center gap-2.5 rounded-xl text-left">
              {s.roster.length > 0 && <AvatarStack ids={s.roster.map((p) => p.id)} max={3} size="md" />}
              <span className="min-w-0">
                <span className="block text-[13.5px] font-semibold text-ink tabular transition-colors group-hover:text-brand-700">{s.roster.length} enrolled</span>
                <span className="flex items-center gap-1.5 text-xs text-ink-3 tabular"><span className="size-1.5 rounded-full bg-emerald-500" />{s.online.length} online</span>
              </span>
            </button>
          </Fact>
        </div>
      </Card>

      <Tabs className="mt-6" items={items} value={tab} onChange={(v) => navigate(classPath(cls.id, v))} />

      <div key={tab} className="mt-6 animate-rise-in">
        {tab === 'overview' && <OverviewTab cls={cls} s={s} />}
        {tab === 'members' && <MembersTab cls={cls} s={s} />}
        {tab === 'assignments' && <AssignmentsTab cls={cls} s={s} />}
        {tab === 'groups' && <GroupsTab cls={cls} s={s} />}
        {tab === 'discord' && <DiscordTab cls={cls} s={s} />}
        {tab === 'activity' && <ActivityTab cls={cls} s={s} />}
      </div>
    </>
  )
}
