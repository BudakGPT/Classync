import { useMemo, useState, type ReactNode } from 'react'
import {
  ArrowRight, BellRing, CalendarClock, CalendarDays, Ellipsis, Link2, MapPin, Sparkles, UserPlus, Users, UsersRound, type LucideIcon,
} from 'lucide-react'
import {
  AvatarStack, Badge, Button, Card, ChannelChip, DiscordGlyph, IconButton, IconTile, Menu, PersonLine, ProgressBar, RoleChip,
} from '@/components/ui'
import { href, navigate } from '@/lib/router'
import { dueLabel, relTime, urgency } from '@/lib/time'
import { tone } from '@/lib/tones'
import type { ClassRoom, Tone } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'
import { ConnectDiscord } from './ConnectDiscord'
import { classAudience, classPath, classStats, endTime, isNewClass, type ClassTab } from './lib'
import { ClassMark, DueBadge, Eyebrow, LiveBadge } from './parts'

export function ClassMenu({ cls }: { cls: ClassRoom }) {
  const { openModal, toast } = useStore()
  const copyInvite = () => {
    navigator.clipboard?.writeText(`https://classync.app/join/${cls.code.toLowerCase()}`).catch(() => {})
    toast({ title: 'Invite link copied', description: `Students who join get ${cls.discord.role} after verifying their NPM.`, tone: 'success' })
  }
  return (
    <Menu
      label={cls.name} width={240}
      trigger={<IconButton icon={Ellipsis} label={`More actions for ${cls.name}`} size="sm" />}
      items={[
        { label: 'Send notification', icon: BellRing, onSelect: () => openModal({ type: 'createNotification', prefill: { audience: classAudience(cls.id) } }) },
        { label: 'Create group', icon: UsersRound, onSelect: () => openModal({ type: 'createGroup', prefill: { classId: cls.id } }) },
        { label: 'Add student', icon: UserPlus, onSelect: () => openModal({ type: 'addStudent', classId: cls.id }) },
        { label: 'Open calendar', icon: CalendarDays, onSelect: () => navigate('/calendar') },
        { label: 'Copy invite link', icon: Link2, description: 'Discord onboarding for students', divider: true, onSelect: copyInvite },
      ]}
    />
  )
}

function InfoTile({ icon, tone: t, label, title, meta, badge, onClick }: {
  icon: LucideIcon; tone: Tone; label: string; title: ReactNode; meta: ReactNode; badge?: ReactNode; onClick?: () => void
}) {
  const body = (
    <>
      <IconTile icon={icon} tone={t} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">{label}</span>
          {badge}
        </span>
        <span className="mt-0.5 block truncate text-[13px] font-semibold text-ink">{title}</span>
        <span className="mt-0.5 flex items-center gap-1 truncate text-[11.5px] text-ink-3">{meta}</span>
      </span>
    </>
  )
  const base = 'flex min-w-0 items-start gap-2.5 rounded-xl bg-canvas p-3 text-left ring-1 ring-inset ring-line'
  return onClick
    ? <button type="button" onClick={onClick} className={cn(base, 'transition hover:bg-subtle hover:ring-line-strong')}>{body}</button>
    : <div className={base}>{body}</div>
}

const DEADLINE_TONE: Record<string, Tone> = { urgent: 'rose', soon: 'amber', later: 'sky', overdue: 'slate' }

/** Rich class card for the Classes list. */
export function ClassCard({ cls, index = 0 }: { cls: ClassRoom; index?: number }) {
  const { data, person, openModal } = useStore()
  const s = useMemo(() => classStats(data, cls), [data, cls])
  const [justConnected, setJustConnected] = useState(false)
  const t = tone(cls.tone)
  const lecturer = person(cls.lecturerId)
  const next = s.upcoming[0]
  const open = (tab?: ClassTab) => navigate(classPath(cls.id, tab))
  const { day, time, room } = cls.schedule
  const fresh = isNewClass(cls)

  return (
    <div className={cn('flex rounded-2xl', fresh ? 'animate-highlight' : 'animate-rise-in')} style={{ animationDelay: fresh ? undefined : `${index * 60}ms` }}>
      <Card className="flex flex-1 flex-col overflow-hidden transition duration-200 ease-out hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift">
        {/* Identity */}
        <div className="px-5 pb-4 pt-5" style={{ backgroundImage: `linear-gradient(180deg, ${t.hex}14 0%, transparent 100%)` }}>
          <div className="flex items-start gap-3.5">
            <ClassMark cls={cls} />
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <a href={href(classPath(cls.id))} className="rounded text-[17px] font-bold tracking-tight text-ink transition-colors hover:text-brand-700">{cls.name}</a>
                {s.meeting?.live && <LiveBadge />}
                {fresh && <Badge tone="brand" size="xs" icon={Sparkles}>New</Badge>}
              </div>
              <p className="mt-0.5 truncate text-[13px]">
                <span className={cn('font-semibold', t.text)}>{cls.subject}</span>
                <span className="text-ink-3 tabular"> · {cls.code}</span>
              </p>
            </div>
            <ClassMenu cls={cls} />
          </div>

          {/* Students + completion */}
          <div className="mt-4 flex items-center justify-between gap-4">
            {s.roster.length ? (
              <button
                type="button" onClick={() => open('members')}
                className="group/st flex min-w-0 items-center gap-3 rounded-xl text-left"
                aria-label={`${s.roster.length} students, ${s.online.length} online. Manage members`}
              >
                <AvatarStack ids={s.roster.map((p) => p.id)} max={5} size="md" />
                <span className="min-w-0">
                  <span className="block text-[14px] font-bold text-ink tabular transition-colors group-hover/st:text-brand-700">{s.roster.length} Students</span>
                  <span className="flex items-center gap-1.5 text-xs text-ink-3 tabular"><span className="size-1.5 rounded-full bg-emerald-500" />{s.online.length} online now</span>
                </span>
              </button>
            ) : (
              <div className="flex min-w-0 items-center gap-3">
                <IconTile icon={Users} tone="slate" />
                <div className="min-w-0">
                  <div className="text-[14px] font-bold text-ink">No students yet</div>
                  <div className="truncate text-xs text-ink-3">Import a roster or add students</div>
                </div>
                <Button size="xs" variant="soft" icon={UserPlus} onClick={() => openModal({ type: 'addStudent', classId: cls.id })}>Add</Button>
              </div>
            )}
            <div className="w-32 shrink-0">
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="text-ink-3">Completion</span>
                <span className="font-bold text-ink tabular">{s.assignments.length ? `${s.completion}%` : '—'}</span>
              </div>
              <ProgressBar value={s.completion} tone={cls.tone} size="sm" className="mt-1.5" label={`${cls.name} average completion`} />
            </div>
          </div>
        </div>

        {/* Teaching team */}
        <div className="grid grid-cols-2 gap-4 border-t border-line px-5 py-4">
          <div className="min-w-0">
            <Eyebrow>Lecturer</Eyebrow>
            <PersonLine id={cls.lecturerId} presence className="mt-2" subtitle={lecturer?.discord ? `@${lecturer.discord}` : 'Lecturer'} />
          </div>
          <div className="min-w-0">
            <Eyebrow>Teaching assistants</Eyebrow>
            {cls.taIds.length === 1 ? (
              <PersonLine id={cls.taIds[0]} presence className="mt-2" subtitle={person(cls.taIds[0])?.discord ? `@${person(cls.taIds[0])?.discord}` : 'Teaching Assistant'} />
            ) : cls.taIds.length ? (
              <div className="mt-2 flex min-w-0 items-center gap-2.5">
                <AvatarStack ids={cls.taIds} size="md" />
                <div className="min-w-0 text-[13px] font-semibold leading-snug text-ink">
                  {cls.taIds.map((id) => <span key={id} className="block truncate">{person(id)?.name}</span>)}
                </div>
              </div>
            ) : (
              <p className="mt-2 text-[13px] text-ink-3">No TAs assigned</p>
            )}
          </div>
        </div>

        {/* Schedule + next deadline */}
        <div className="grid grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-3 px-5 pb-4">
          <InfoTile icon={CalendarDays} tone={cls.tone} label="Weekly" title={`${day}, ${time}–${endTime(time)}`} meta={<><MapPin className="size-3 shrink-0" />{room}</>} />
          {next ? (
            <InfoTile
              icon={CalendarClock} tone={DEADLINE_TONE[urgency(next.due)]} label="Next deadline" title={next.title}
              meta={dueLabel(next.due)} badge={<DueBadge iso={next.due} />} onClick={() => navigate(`/assignments/${next.id}`)}
            />
          ) : (
            <InfoTile icon={CalendarClock} tone="slate" label="Next deadline" title="No upcoming deadlines" meta="All caught up" />
          )}
        </div>

        {/* Discord */}
        <div className="border-t border-line px-5 py-4">
          <div className="flex items-center justify-between gap-2">
            <Eyebrow className="flex items-center gap-1.5"><DiscordGlyph className="size-3.5 text-discord" />Discord</Eyebrow>
            {cls.discord.connected && <span className="text-[11.5px] text-ink-3">Synced {relTime(data.discord.lastSync)}</span>}
          </div>
          {cls.discord.connected ? (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 animate-fade-in">
              <RoleChip name={cls.discord.role} tone={cls.tone} count={s.verified} />
              {cls.discord.text.map((c) => <ChannelChip key={c} name={c} tone={justConnected ? 'new' : 'default'} />)}
              {cls.discord.voice.map((c) => <ChannelChip key={c} name={c} voice tone={justConnected ? 'new' : 'default'} />)}
            </div>
          ) : (
            <ConnectDiscord cls={cls} compact onConnected={() => setJustConnected(true)} className="mt-2.5" />
          )}
        </div>

        {/* Actions */}
        <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-line bg-canvas/50 px-4 py-3">
          <Button size="sm" variant="ghost" icon={UsersRound} onClick={() => open('members')}>Manage Members</Button>
          <Button size="sm" variant="ghost" onClick={() => open('discord')}><DiscordGlyph className="size-3.5" />Discord Channels</Button>
          <Button size="sm" variant="secondary" iconRight={ArrowRight} className="ml-auto" onClick={() => open()}>Open Class</Button>
        </div>
      </Card>
    </div>
  )
}
