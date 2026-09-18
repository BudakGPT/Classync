import type { ReactNode } from 'react'
import { AtSign, Bell, FileText, Hash, Headphones, Mic, Pin, Search, Users, Volume2 } from 'lucide-react'
import { DiscordEmbed, DiscordMessage } from '@/components/domain/Discord'
import { Avatar } from '@/components/ui'
import { taskCounts } from '@/lib/selectors'
import { at, dueLabel, fmtLong, now, timeLeft } from '@/lib/time'
import { CATEGORY, tone } from '@/lib/tones'
import type { AppData, NotificationItem } from '@/lib/types'
import { hash } from '@/lib/utils'
import { useStore } from '@/store/store'
import { type Category, discordTime, voiceParticipants } from './server'

const TOPIC: Record<string, string> = {
  welcome: 'Start here — how Classync keeps your classes organised',
  'verify-identity': 'Verify your NPM to unlock your class channels',
  announcement: 'Official announcements · posted by Classync',
  discussion: 'Questions, ideas and peer discussion',
  material: 'Slides, notebooks and readings',
  assignment: 'Assignments, deadlines and progress check-ins',
  submission: 'Upload deliverables before the deadline',
  slides: 'Share and review presentation slides',
}

export const Mention = ({ children }: { children: ReactNode }) => (
  <span className="rounded-[3px] bg-[#5865f2]/30 px-0.5 font-medium text-[#c9cdfb]">{children}</span>
)

function Attachment({ name, size }: { name: string; size: string }) {
  return (
    <div className="mt-1.5 flex max-w-[380px] items-center gap-3 rounded-lg border border-[#1e1f22] bg-[#2b2d31] px-3 py-2.5">
      <FileText className="size-8 shrink-0 text-[#a3a6ff]" strokeWidth={1.5} />
      <div className="min-w-0">
        <div className="truncate text-[14px] font-medium text-[#00a8fc]">{name}</div>
        <div className="text-[11.5px] text-[#949ba4]">{size}</div>
      </div>
    </div>
  )
}

function DateDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-1" role="separator">
      <span className="h-px flex-1 bg-[#3f4147]" />
      <span className="text-[11px] font-semibold text-[#949ba4]">{label}</span>
      <span className="h-px flex-1 bg-[#3f4147]" />
    </div>
  )
}

const sentAt = (n: NotificationItem) => n.sendAt ?? n.createdAt

function NotificationEmbed({ n, role }: { n: NotificationItem; role: string }) {
  const { person, data } = useStore()
  const c = CATEGORY[n.category]
  return (
    <DiscordMessage time={discordTime(sentAt(n))}>
      <div><Mention>{role}</Mention> {c.emoji} New {n.category.toLowerCase()} from <span className="font-medium text-white">{person(n.createdBy)?.name}</span></div>
      <DiscordEmbed
        color={tone(c.tone).hex}
        title={`${c.emoji} ${n.title}`}
        description={n.description}
        fields={[
          ...(n.deadline ? [{ name: 'Deadline', value: fmtLong(n.deadline), inline: true }] : []),
          ...(n.repeat ? [{ name: 'Repeats', value: `Every ${n.repeat.day}, ${n.repeat.time}`, inline: true }] : []),
          ...(n.reminders.length ? [{ name: 'Reminders', value: n.reminders.join(' · '), inline: true }] : []),
          ...(n.stats ? [{ name: 'Seen by', value: `${n.stats.read} of ${n.stats.delivered}`, inline: true }] : []),
        ]}
        footer={`Classync · ${data.discord.server}`}
      />
    </DiscordMessage>
  )
}

function classMessages(cat: Category, channel: string, d: AppData, toast: (t: { title: string; description?: string; tone?: 'discord' | 'info' }) => void) {
  const c = cat.classRoom!
  const role = c.discord.role
  const out: ReactNode[] = []
  const classNotes = d.notifications.filter((n) => n.status !== 'Draft' && n.audience.classIds.includes(c.id))
  const posted = (list: NotificationItem[]) => list.filter((n) => n.status !== 'Scheduled').sort((a, b) => sentAt(a).localeCompare(sentAt(b)))

  if (channel === 'announcement') {
    posted(classNotes.filter((n) => n.delivery.announcement && n.category !== 'Material')).slice(-3)
      .forEach((n) => out.push(<NotificationEmbed key={n.id} n={n} role={role} />))
  } else if (channel === 'material') {
    const mats = posted(classNotes.filter((n) => n.category === 'Material'))
    mats.forEach((n) => out.push(<NotificationEmbed key={n.id} n={n} role={role} />))
    out.push(
      <DiscordMessage key="file" authorId={c.lecturerId} author={d.people.find((p) => p.id === c.lecturerId)?.name} bot={false} time={discordTime(at(-1, '16:20'))}>
        <div>Slides from this week's {c.subject} lecture 👇</div>
        <Attachment name={`${c.subject.replace(/\s+/g, '_')}_Week4_Slides.pdf`} size="2.4 MB" />
      </DiscordMessage>,
    )
  } else if (channel === 'assignment') {
    const list = d.assignments.filter((a) => a.classId === c.id).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 2)
    list.forEach((a) => {
      const k = taskCounts(a)
      out.push(
        <DiscordMessage key={a.id} time={discordTime(a.createdAt)}>
          <div><Mention>{role}</Mention> 📚 A new {a.category.toLowerCase()} has been posted</div>
          <DiscordEmbed
            color={tone('brand').hex}
            title={`📚 ${a.title}`}
            description={a.description}
            fields={[
              { name: 'Due', value: dueLabel(a.due), inline: true },
              { name: 'Time left', value: timeLeft(a.due), inline: true },
              { name: 'Progress', value: `${k.completed}/${k.total} done`, inline: true },
            ]}
            footer="Update your progress below — reminders stop once you're done"
            buttons={[
              { label: '✅ Mark as Done', style: 'success', onClick: () => toast({ title: 'Students press this in Discord', description: 'Classync marks the task complete and stops their reminders.', tone: 'discord' }) },
              { label: '🆘 I’m stuck', style: 'secondary', onClick: () => toast({ title: 'Stuck requests go to Help Center', description: 'Grouped anonymously once enough students report the same concept.', tone: 'discord' }) },
            ]}
          />
        </DiscordMessage>,
      )
      const pending = k.total - k.completed
      if (pending > 0 && new Date(a.due) > now()) out.push(
        <DiscordMessage key={`${a.id}-rem`} time={discordTime(at(0, '09:00'))}>
          <div>⏰ <span className="font-semibold text-white">Reminder:</span> {a.title} is due <span className="font-semibold text-white">{dueLabel(a.due)}</span>. {pending} students still have it open — personal DMs sent.</div>
        </DiscordMessage>,
      )
    })
    if (!list.length) out.push(<DiscordMessage key="none" time={discordTime(at(-2, '08:00'))}><div>📭 No assignments for {c.name} yet. They appear here as soon as a lecturer publishes one.</div></DiscordMessage>)
  } else {
    // discussion (and any custom text channel)
    const students = d.people.filter((p) => p.classId === c.id && p.role === 'Student' && p.verification === 'Verified')
    const s1 = students.find((p) => p.featured) ?? students[0]
    const s2 = students.filter((p) => p.featured)[1] ?? students[1]
    const upcoming = d.events.filter((e) => e.classId === c.id && new Date(e.start) > now()).sort((a, b) => a.start.localeCompare(b.start)).slice(0, 3)
    if (s1) out.push(
      <DiscordMessage key="q" authorId={s1.id} author={s1.name} bot={false} time={discordTime(at(0, '08:52'))}>
        <div>Morning! Is the {c.subject} session still in {c.schedule.room} this week?</div>
      </DiscordMessage>,
    )
    const ta = c.taIds[0]
    out.push(
      <DiscordMessage key="a" authorId={ta} author={d.people.find((p) => p.id === ta)?.name} bot={false} time={discordTime(at(0, '08:57'))}>
        <div>Yes — {c.schedule.room}, {c.schedule.day} {c.schedule.time}. Bring your laptop 💻</div>
      </DiscordMessage>,
    )
    if (s2) out.push(
      <DiscordMessage key="t" authorId={s2.id} author={s2.name} bot={false} time={discordTime(at(0, '09:03'))}>
        <div>Thanks! Anyone want to review last week's notes together in voice after class?</div>
      </DiscordMessage>,
    )
    if (upcoming.length) out.push(
      <DiscordMessage key="sched" time={discordTime(at(0, '09:30'))}>
        <DiscordEmbed
          color={tone(c.tone).hex}
          title={`🗓️ Coming up in ${c.name}`}
          fields={upcoming.map((e) => ({ name: `${CATEGORY[e.category].emoji} ${e.title}`, value: dueLabel(e.start) }))}
          footer="Synced from the Classync calendar"
        />
      </DiscordMessage>,
    )
  }

  const scheduled = classNotes.filter((n) => n.status === 'Scheduled' && n.sendAt && (channel === 'announcement' ? n.category !== 'Material' : channel === 'material' ? n.category === 'Material' : false))
  return { out, scheduled }
}

function groupMessages(cat: Category, channel: string, d: AppData) {
  const g = cat.group!
  const out: ReactNode[] = []
  const creator = d.people.find((p) => p.id === g.createdBy)
  const first = d.people.find((p) => p.id === g.memberIds[0])
  const channels = [...g.text.map((t) => `#${t}`), ...g.voice.map((v) => `🔊 ${v}`)].join(' · ')
  if (channel === g.text[0]) {
    out.push(
      <DiscordMessage key="welcome" time={discordTime(g.createdAt)}>
        <div>👋 Welcome {g.memberIds.slice(0, 4).map((id) => <Mention key={id}>@{d.people.find((p) => p.id === id)?.name.split(' ')[0]}</Mention>).reduce<ReactNode[]>((acc, el, i) => (i ? [...acc, ' ', el] : [el]), [])}{g.memberIds.length > 4 && ` and ${g.memberIds.length - 4} more`}!</div>
        <DiscordEmbed
          color={tone('teal').hex}
          title={`💬 ${g.name} is ready`}
          description={g.description ?? `Private space for ${g.name}.`}
          fields={[
            { name: 'Role', value: g.role, inline: true },
            { name: 'Members', value: String(g.memberIds.length), inline: true },
            { name: 'Ends', value: g.endDate ? dueLabel(g.endDate) : 'Permanent', inline: true },
            { name: 'Channels', value: channels },
          ]}
          footer={`Created by ${creator?.name ?? 'Classync'} via Classync`}
        />
      </DiscordMessage>,
    )
    d.notifications.filter((n) => n.audience.groupIds.includes(g.id) && n.status === 'Sent')
      .forEach((n) => out.push(<NotificationEmbed key={n.id} n={n} role={g.role} />))
    if (first) out.push(
      <DiscordMessage key="hi" authorId={first.id} author={first.name} bot={false} time={discordTime(at(0, '09:14'))}>
        <div>Hi all! I'll drop our dataset draft here tonight so we can split the work 📊</div>
      </DiscordMessage>,
    )
  } else {
    const submitted = g.memberIds.length ? 1 + (hash(g.id) % g.memberIds.length) : 0
    out.push(
      <DiscordMessage key="sub" time={discordTime(g.createdAt)}>
        <DiscordEmbed
          color={tone('violet').hex}
          title={`📌 #${channel}`}
          description={channel === 'submission' || channel === 'slides'
            ? `Upload your ${channel === 'slides' ? 'slides' : 'deliverables'} here. Classync tracks who has submitted and reminds the rest.`
            : `Channel created for ${g.name}. Only ${g.role} members and staff can see it.`}
          fields={[
            ...(g.endDate ? [{ name: 'Deadline', value: dueLabel(g.endDate), inline: true }] : []),
            ...(channel === 'submission' || channel === 'slides' ? [{ name: 'Submitted', value: `${Math.min(submitted, g.memberIds.length - 1)}/${g.memberIds.length}`, inline: true }] : []),
            { name: 'Visible to', value: g.role, inline: true },
          ]}
          footer="Pinned by Classync"
        />
      </DiscordMessage>,
    )
  }
  return { out, scheduled: [] as NotificationItem[] }
}

function startMessages(channel: string, d: AppData, toast: (t: { title: string; description?: string; tone?: 'discord' }) => void) {
  const out: ReactNode[] = []
  if (channel === 'welcome') {
    out.push(
      <DiscordMessage key="w" time={discordTime(at(-14, '08:00'))}>
        <DiscordEmbed
          color="#5865f2"
          title={`👋 Welcome to ${d.discord.server}`}
          description={'This server is managed by Classync. Channels, roles and reminders stay in sync with your classes automatically.'}
          fields={[
            { name: '1 · Verify', value: 'Use #verify-identity with your NPM' },
            { name: '2 · Get your class', value: 'Your @Class role and channels unlock instantly' },
            { name: '3 · Stay on track', value: 'Deadlines and reminders arrive by DM' },
          ]}
          footer="Be kind · keep course discussion in class channels"
        />
      </DiscordMessage>,
    )
  } else {
    const latest = d.activities.find((a) => a.type === 'discord' && a.action.startsWith('assigned'))
    out.push(
      <DiscordMessage key="v" time={discordTime(at(-14, '08:01'))}>
        <DiscordEmbed
          color={tone('emerald').hex}
          title="🎓 Verify your academic identity"
          description="Press the button and enter your NPM. Classync matches it with the academic database and assigns your class role — no manual approval needed."
          footer="Your NPM is never shown to other students"
          buttons={[{ label: 'Verify with NPM', style: 'primary', onClick: () => toast({ title: 'Students verify from this button', description: 'A private form asks for their NPM, then roles are assigned automatically.', tone: 'discord' }) }]}
        />
      </DiscordMessage>,
    )
    if (latest) out.push(
      <DiscordMessage key="ok" time={discordTime(latest.at)}>
        <div>✅ <span className="font-semibold text-white">{latest.target}</span> verified — {latest.action.replace('assigned the ', '').replace(' role to', '')} role assigned</div>
      </DiscordMessage>,
    )
  }
  return { out, scheduled: [] as NotificationItem[] }
}

/** Right side of the mock server: channel header, recent Classync messages, read-only composer. */
export function ChatPane({ cat, channel }: { cat: Category; channel: string }) {
  const { data, toast } = useStore()
  const { out, scheduled } = cat.kind === 'class' ? classMessages(cat, channel, data, toast)
    : cat.kind === 'group' ? groupMessages(cat, channel, data) : startMessages(channel, data, toast)

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-black/25 px-4 shadow-[0_1px_0_rgb(0_0_0/0.15)]">
        <Hash className="size-5 shrink-0 text-[#80848e]" />
        <span className="shrink-0 text-[15px] font-semibold text-white">{channel}</span>
        <span className="mx-1 hidden h-5 w-px shrink-0 bg-[#3f4147] md:block" />
        <span className="hidden min-w-0 truncate text-[13px] text-[#949ba4] md:block">{TOPIC[channel] ?? `${cat.label.toLowerCase()} channel`}</span>
        <span className="ml-auto flex shrink-0 items-center gap-3.5 text-[#b5bac1]" aria-hidden>
          <Bell className="size-[18px]" /><Pin className="size-[18px]" /><Users className="size-[18px]" />
          <span className="hidden h-6 w-32 items-center justify-between rounded-[4px] bg-[#1e1f22] px-1.5 text-[12px] text-[#949ba4] lg:flex">Search<Search className="size-3.5" /></span>
        </span>
      </div>

      <div key={`${cat.id}:${channel}`} className="scrollbar-thin min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 animate-fade-in [scrollbar-color:#1a1b1e_transparent]">
        <div className="pb-1">
          <span className="grid size-14 place-items-center rounded-full bg-[#41434a]"><Hash className="size-8 text-white" /></span>
          <h4 className="mt-2 text-[22px] font-bold text-white">Welcome to #{channel}!</h4>
          <p className="text-[13px] text-[#b5bac1]">This is the start of the #{channel} channel{cat.kind !== 'start' && <> in <span className="font-semibold text-[#dbdee1]">{cat.label}</span></>}.</p>
        </div>
        <DateDivider label="Recent" />
        {out}
      </div>

      {scheduled.length > 0 && (
        <div className="mx-4 mb-2 flex items-center gap-2 rounded-md bg-[#2b2d31] px-3 py-2 text-[12.5px] text-[#b5bac1]">
          <span className="grid size-5 place-items-center rounded-full bg-[#5865f2]/25 text-[11px]">🕒</span>
          <span className="min-w-0 truncate"><span className="font-semibold text-white">{scheduled.length} scheduled</span> · {scheduled[0].title} posts {dueLabel(scheduled[0].sendAt!)}</span>
        </div>
      )}
      <div className="px-4 pb-4">
        <div className="flex h-11 items-center gap-3 rounded-lg bg-[#383a40] px-4 text-[14px] text-[#6d6f78]">
          <span className="grid size-6 place-items-center rounded-full bg-[#b5bac1] text-[#383a40]" aria-hidden><AtSign className="size-3.5" strokeWidth={3} /></span>
          <span className="truncate">Message #{channel} — preview only, Classync posts here for you</span>
        </div>
      </div>
    </div>
  )
}

/** Voice channel stage: connected people as tiles. */
export function VoicePane({ cat, channel }: { cat: Category; channel: string }) {
  const { data, person, toast } = useStore()
  const ids = voiceParticipants(cat, channel, data)
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-[#000]/30">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-black/25 px-4">
        <Volume2 className="size-5 text-[#80848e]" />
        <span className="text-[15px] font-semibold text-white">{channel}</span>
        <span className="ml-2 rounded-full bg-[#248046] px-2 py-px text-[11px] font-bold text-white">{ids.length} connected</span>
      </div>
      <div key={`${cat.id}:${channel}`} className="grid flex-1 place-items-center p-6 animate-fade-in">
        <div className="grid w-full max-w-[560px] grid-cols-2 gap-3">
          {ids.map((id, i) => (
            <div key={id} className={`relative grid aspect-video place-items-center rounded-xl bg-[#2b2d31] ${ids.length === 3 && i === 2 ? 'col-span-2 mx-auto w-1/2' : ''} ${i === 0 ? 'ring-2 ring-[#23a55a]' : ''}`}>
              <Avatar id={id} size="xl" />
              <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-black/50 px-1.5 py-0.5 text-[12px] font-medium text-white">
                {i !== 0 && <Mic className="size-3 text-[#b5bac1]" />}{person(id)?.name}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-col items-center gap-2 text-center">
          <p className="text-[13px] text-[#b5bac1]">{voiceHint(cat)}</p>
          <button type="button" onClick={() => toast({ title: `Opening ${channel} in Discord`, description: 'Voice runs in the Discord app — Classync only manages access.', tone: 'discord' })}
            className="inline-flex h-9 items-center gap-2 rounded-[4px] bg-[#248046] px-4 text-[13.5px] font-medium text-white transition hover:bg-[#1a6334] active:scale-[0.97]">
            <Headphones className="size-4" />Join Voice
          </button>
        </div>
      </div>
    </div>
  )
}

const voiceHint = (cat: Category) => cat.kind === 'class'
  ? `Only ${cat.role} members and staff can join this voice channel.`
  : `Private voice room for ${cat.group?.name} · ${cat.role}`
