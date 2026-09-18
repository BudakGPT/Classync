import type { CSSProperties, ReactNode } from 'react'
import { ArrowUpRight, Trophy, Unplug } from 'lucide-react'
import { AvatarStack, Badge, Card, Donut, IconButton, PersonLine } from '@/components/ui'
import { navigate } from '@/lib/router'
import { shortName, studentsIn } from '@/lib/selectors'
import { tone } from '@/lib/tones'
import type { ClassRoom } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'
import { Delta, Sparkline, Tween } from './charts'
import { CLASS_IDS, CONNECTED_FALLBACK_MESSAGES, ENGAGEMENT, PERIOD, type ClassEngagement, type Range } from './data'

const Eyebrow = ({ children }: { children: ReactNode }) => <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">{children}</div>

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 px-3 first:pl-0 last:pr-0">
      <div className="truncate text-[11.5px] text-ink-3">{label}</div>
      <div className="mt-1 flex items-center gap-1.5 text-[17px] font-bold leading-tight text-ink tabular">{children}</div>
    </div>
  )
}

function EngagementCard({ cls, s, range, index }: { cls: ClassRoom; s: ClassEngagement; range: Range; index: number }) {
  const { data, person } = useStore()
  const t = tone(cls.tone)
  const roster = studentsIn(data.people, cls.id)
  // Most active first: named characters, then whoever is online right now.
  const activeIds = [...roster.filter((p) => p.featured), ...roster.filter((p) => !p.featured && p.presence === 'online')].map((p) => p.id)
  const connected = cls.discord.connected

  return (
    <Card className="flex flex-col p-5 animate-rise-in" style={{ animationDelay: `${index * 60}ms` } as CSSProperties}>
      <div className="flex items-start gap-3">
        <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl text-[15px] font-extrabold text-white', t.solid)} aria-hidden>{cls.id}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-[15px] font-bold tracking-tight text-ink">{cls.name}</h3>
            {!connected && <Badge tone="slate" size="xs" icon={Unplug}>No Discord</Badge>}
          </div>
          <p className="truncate text-xs text-ink-3">{cls.subject} · {shortName(person(cls.lecturerId))} · {roster.length} students</p>
        </div>
        <IconButton icon={ArrowUpRight} label={`Open ${cls.name}`} size="sm" onClick={() => navigate(`/classes/${cls.id}`)} />
      </div>

      <div className="mt-5 flex items-center gap-5">
        <Donut value={s.score} size={78} stroke={7} tone={cls.tone} label={`Engagement score ${s.score} out of 100`}>
          <span className="text-center leading-none">
            <span className="block text-xl font-extrabold text-ink tabular"><Tween value={s.score} /></span>
            <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-wide text-ink-3">score</span>
          </span>
        </Donut>
        <div className="grid min-w-0 flex-1 grid-cols-3 divide-x divide-line">
          <Stat label="Messages / wk">
            {connected
              ? <><Tween value={s.messages || CONNECTED_FALLBACK_MESSAGES} />{s.messagesDelta !== 0 && <Delta value={s.messagesDelta} className="px-1 py-0 text-[10.5px]" />}</>
              : <button type="button" onClick={() => navigate(`/classes/${cls.id}`)} className="text-[12.5px] font-semibold text-brand-700 hover:underline">Connect</button>}
          </Stat>
          <Stat label="Attendance"><Tween value={s.attendance} suffix="%" /></Stat>
          <Stat label="Active"><Tween value={s.active} /><span className="text-[12px] font-medium text-ink-3">/{roster.length}</span></Stat>
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between gap-2 text-[11.5px] text-ink-3">
          <span>Engagement score · {PERIOD[range].granularity.toLowerCase()}, {PERIOD[range].points[0]}–{PERIOD[range].points[PERIOD[range].points.length - 1]}</span>
          <span className="inline-flex items-center gap-1.5"><Delta value={s.scoreDelta} unit=" pts" />{PERIOD[range].vs}</span>
        </div>
        <Sparkline key={range} values={s.trend} color={t.hex} height={44} />
      </div>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-3 border-t border-line pt-4">
        <div className="min-w-0 flex-1">
          <Eyebrow>Top contributor</Eyebrow>
          <PersonLine
            id={s.topId} subtitle={s.topDetail} className="mt-2" presence
            trailing={<Badge tone="amber" size="xs" icon={Trophy} className="hidden sm:inline-flex">Top</Badge>}
          />
        </div>
        <div className="shrink-0">
          <Eyebrow>Most active</Eyebrow>
          <AvatarStack ids={activeIds} max={5} total={s.active} className="mt-2" />
        </div>
      </div>
    </Card>
  )
}

export function ClassEngagementCards({ range }: { range: Range }) {
  const { data } = useStore()
  const classes = CLASS_IDS.flatMap((id) => data.classes.filter((c) => c.id === id))
  return (
    <section aria-labelledby="class-engagement-title" className="pt-3">
      <div className="mb-4">
        <h2 id="class-engagement-title" className="text-[15px] font-bold tracking-tight text-ink">Class engagement</h2>
        <p className="text-xs text-ink-3">Who's showing up, chatting and helping out · {PERIOD[range].span}</p>
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {classes.map((c, i) => <EngagementCard key={c.id} cls={c} s={ENGAGEMENT[range][c.id as keyof (typeof ENGAGEMENT)['week']]} range={range} index={i} />)}
      </div>
    </section>
  )
}
