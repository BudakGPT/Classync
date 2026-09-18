import { ArrowRight, CalendarClock, Unplug } from 'lucide-react'
import { Avatar, AvatarStack, Button, Card, CardHeader, DiscordGlyph } from '@/components/ui'
import { navigate } from '@/lib/router'
import { shortName, studentsIn } from '@/lib/selectors'
import { tone as toneOf } from '@/lib/tones'
import { dueLabel, now } from '@/lib/time'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'

export function ClassOverview({ className }: { className?: string }) {
  const { data, person } = useStore()
  const t = now()

  return (
    <Card className={cn('animate-rise-in [animation-delay:340ms]', className)}>
      <CardHeader
        title="Class Overview"
        subtitle={`${data.classes.length} classes · ${data.settings.term}`}
        action={<Button variant="ghost" size="sm" iconRight={ArrowRight} onClick={() => navigate('/classes')}>Manage</Button>}
      />
      <div className="grid grid-cols-1 gap-3 p-5 pt-4 sm:grid-cols-2">
        {data.classes.map((c, i) => {
          const tn = toneOf(c.tone)
          const roster = studentsIn(data.people, c.id).sort((a, b) => Number(b.presence === 'online') - Number(a.presence === 'online') || Number(!!b.featured) - Number(!!a.featured))
          const online = roster.filter((p) => p.presence === 'online').length
          const lecturer = person(c.lecturerId)
          const next = data.assignments.filter((a) => a.classId === c.id && new Date(a.due) > t).sort((a, b) => a.due.localeCompare(b.due))[0]
          return (
            <button
              key={c.id} type="button" onClick={() => navigate(`/classes/${c.id}`)}
              aria-label={`Open ${c.name}, ${c.subject}`}
              className="group relative overflow-hidden rounded-2xl border border-line bg-surface p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift animate-rise-in"
              style={{ animationDelay: `${380 + i * 50}ms` }}
            >
              <span className={cn('absolute inset-x-0 top-0 h-1', tn.solid)} aria-hidden />
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl text-[16px] font-extrabold ring-1 ring-inset', tn.soft, tn.text, tn.ring)}>{c.id}</span>
                  <div className="min-w-0">
                    <div className="truncate text-[14.5px] font-bold text-ink">{c.name}</div>
                    <div className="truncate text-xs text-ink-3">{c.subject}</div>
                  </div>
                </div>
                {c.discord.connected
                  ? <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#5865f2]/10 px-2 py-0.5 text-[11px] font-semibold text-[#4752c4]"><DiscordGlyph className="size-3" />Synced</span>
                  : <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-subtle px-2 py-0.5 text-[11px] font-semibold text-ink-3"><Unplug className="size-3" />Connect</span>}
              </div>

              <div className="mt-3 flex items-center gap-2">
                {lecturer && <Avatar id={lecturer.id} size="sm" tooltip />}
                <div className="min-w-0 flex-1 text-xs leading-tight">
                  <div className="truncate font-semibold text-ink">{lecturer?.name}</div>
                  <div className="truncate text-ink-3">TA · {c.taIds.map((id) => shortName(person(id))).join(', ')}</div>
                </div>
                <AvatarStack ids={c.taIds} size="xs" max={2} />
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <AvatarStack ids={roster.map((p) => p.id)} max={4} total={roster.length} size="sm" />
                <div className="text-right text-xs leading-tight">
                  <div className="font-bold text-ink tabular">{roster.length} students</div>
                  <div className="mt-0.5 flex items-center justify-end gap-1 font-medium text-emerald-700"><span className="size-1.5 rounded-full bg-emerald-500" />{online} online</div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-subtle/80 px-2.5 py-1.5 text-xs text-ink-2">
                <CalendarClock className="size-3.5 shrink-0 text-ink-3" />
                {next ? <span className="truncate"><b className="font-semibold text-ink">{next.title}</b> · {dueLabel(next.due)}</span> : <span className="text-ink-3">No upcoming deadlines</span>}
              </div>
            </button>
          )
        })}
      </div>
    </Card>
  )
}
