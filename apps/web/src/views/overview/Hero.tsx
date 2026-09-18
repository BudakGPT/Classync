import { ArrowRight, BellPlus, BellRing, CalendarDays, Database, GraduationCap, LifeBuoy, type LucideIcon } from 'lucide-react'
import { Button, ClassyncMark, DiscordGlyph } from '@/components/ui'
import { navigate } from '@/lib/router'
import { openRequestCount, students, taskCounts } from '@/lib/selectors'
import { tone as toneOf } from '@/lib/tones'
import { greeting, now, relTime, sameDay, WEEKDAYS } from '@/lib/time'
import type { Tone } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'
import { CommandOrbit } from './CommandOrbit'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export function Hero() {
  const { data, me, openModal } = useStore()
  const t = now()
  const lectures = data.events.filter((e) => sameDay(e.start, t) && (e.category === 'Lecture' || e.category === 'Extra Class')).length
  const ml = data.assignments.find((a) => a.id === 'ml-assignment')
  const reminders = ml ? taskCounts(ml).total - taskCounts(ml).completed : 0
  const help = openRequestCount(data)

  return (
    <section className="hero-gradient relative overflow-hidden rounded-3xl border border-line shadow-card animate-rise-in">
      <div className="bg-dots pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(55%_90%_at_82%_45%,black,transparent)]" />
      <div className="relative flex items-center justify-between gap-6 px-6 py-6 md:px-8 md:py-7">
        <div className="min-w-0 max-w-[560px]">
          <p className="text-[11.5px] font-semibold uppercase tracking-wider text-brand-700">
            {WEEKDAYS[t.getDay()]}, {t.getDate()} {MONTHS[t.getMonth()]} · {data.settings.term}
          </p>
          <h1 className="mt-2 text-[30px] font-extrabold leading-tight tracking-tight text-ink md:text-[34px]">
            {greeting()}, {me.name.split(' ')[0]} <span className="inline-block origin-[70%_75%]" style={{ animation: 'wave 1.8s ease-in-out 400ms 1' }}>👋</span>
          </h1>
          <style>{'@keyframes wave{0%,60%,100%{transform:rotate(0)}10%,30%{transform:rotate(14deg)}20%{transform:rotate(-8deg)}40%{transform:rotate(-4deg)}50%{transform:rotate(10deg)}}'}</style>
          <p className="mt-1.5 text-[15px] text-ink-2">Here's what's happening across your classes today.</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Chip icon={GraduationCap} tone="sky" onClick={() => navigate('/calendar')}>{lectures} lectures today</Chip>
            <Chip icon={BellRing} tone="amber" onClick={() => navigate('/notifications')}>{reminders} reminders queued</Chip>
            <Chip icon={LifeBuoy} tone="rose" onClick={() => navigate('/help')}>{help} students need help</Chip>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button variant="primary" icon={BellPlus} onClick={() => openModal({ type: 'createNotification' })}>Schedule notification</Button>
            <Button variant="secondary" icon={CalendarDays} onClick={() => navigate('/calendar')}>Open calendar</Button>
          </div>

          {/* Academic database → Classync → Discord, at a glance */}
          <button type="button" onClick={() => navigate('/database')} className="group mt-5 flex max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-xl border border-line bg-white/70 px-3 py-2 text-[12px] font-medium text-ink-2 backdrop-blur transition hover:border-line-strong hover:bg-white">
            <span className="flex items-center gap-1.5"><Database className="size-3.5 text-teal-600" />Academic DB · <b className="text-ink tabular">{students(data.people).length}</b> records</span>
            <ArrowRight className="size-3 text-ink-3" />
            <span className="flex items-center gap-1.5"><ClassyncMark size={14} className="rounded" />Classync</span>
            <ArrowRight className="size-3 text-ink-3" />
            <span className="flex items-center gap-1.5"><DiscordGlyph className="size-3.5 text-discord" /><b className="text-ink tabular">{data.discord.members}</b> members</span>
            <span className="hidden items-center gap-1.5 text-ink-3 min-[1400px]:flex"><span className="size-1.5 rounded-full bg-emerald-500" />synced {relTime(data.discord.lastSync)}</span>
          </button>
        </div>
        <CommandOrbit className="hidden xl:block" />
      </div>
    </section>
  )
}

function Chip({ icon: Icon, tone, children, onClick }: { icon: LucideIcon; tone: Tone; children: React.ReactNode; onClick: () => void }) {
  const t = toneOf(tone)
  return (
    <button type="button" onClick={onClick} className={cn('inline-flex items-center gap-1.5 rounded-full bg-white/80 py-1 pl-1 pr-3 text-[12.5px] font-semibold text-ink shadow-card ring-1 ring-line backdrop-blur transition hover:-translate-y-px hover:ring-line-strong')}>
      <span className={cn('grid size-6 place-items-center rounded-full', t.soft, t.text)}><Icon className="size-3.5" /></span>
      {children}
    </button>
  )
}
