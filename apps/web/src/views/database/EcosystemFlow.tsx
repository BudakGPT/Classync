import type { ReactNode } from 'react'
import {
  AtSign, CalendarDays, ChevronDown, Database, ChevronLeft, ChevronRight, ChevronUp, FileSpreadsheet, GraduationCap, Hash, IdCard, LifeBuoy,
  ListChecks, Megaphone, School, Send, ShieldCheck, Users, Volume2, type LucideIcon,
} from 'lucide-react'
import { AvatarStack, Badge, ClassyncMark, DiscordGlyph, IconTile } from '@/components/ui'
import { href } from '@/lib/router'
import { discordRoles, openRequestCount, students } from '@/lib/selectors'
import { tone as toneOf } from '@/lib/tones'
import { now, relTime } from '@/lib/time'
import type { Tone } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'
import { FileIcon } from './DataSources'

interface FlowItem { label: string; count: number; icon: LucideIcon; tone: Tone; to?: string; onClick?: () => void; hint?: string }

// Flowing dots along the connectors. Local keyframes; hidden entirely for reduced motion (static chevrons remain).
const FLOW_CSS = `
@keyframes cs-flow-x { 0% { transform: translateX(0); opacity: 0 } 15%, 85% { opacity: 1 } 100% { transform: translateX(100%); opacity: 0 } }
@keyframes cs-flow-y { 0% { transform: translateY(0); opacity: 0 } 15%, 85% { opacity: 1 } 100% { transform: translateY(100%); opacity: 0 } }
.cs-x { animation: cs-flow-x 2.7s linear infinite }
.cs-y { animation: cs-flow-y 2.7s linear infinite }
.cs-rev { animation-direction: reverse }
@media (prefers-reduced-motion: reduce) { .cs-x, .cs-y { animation: none !important; display: none } }
`

const FEATURED_STUDENTS = ['haekal', 'nadia', 'kevin', 'citra', 'malik', 'erik']
const WEEK = 7 * 24 * 60 * 60 * 1000

export function EcosystemFlow() {
  const { data } = useStore()
  const roster = students(data.people)
  const connected = data.classes.filter((c) => c.discord.connected)
  const activeGroups = data.groups.filter((g) => g.status === 'Active')
  const sent = data.notifications.filter((n) => n.status !== 'Draft')
  const t = now().getTime()
  const roles = discordRoles(data).length

  const source: FlowItem[] = [
    { label: 'Students', count: roster.length, icon: GraduationCap, tone: 'sky', to: '/students' },
    { label: 'Classes', count: data.classes.length, icon: School, tone: 'brand', to: '/classes' },
    { label: 'NPM records', count: roster.filter((p) => p.npm).length, icon: IdCard, tone: 'violet', to: '/students' },
    { label: 'Data sources', count: 3, icon: FileSpreadsheet, tone: 'emerald', onClick: () => document.getElementById('data-sources')?.scrollIntoView({ behavior: 'smooth' }) },
  ]
  const hub: FlowItem[] = [
    { label: 'Classes', count: data.classes.length, icon: School, tone: 'brand', to: '/classes' },
    { label: 'Students', count: roster.length, icon: GraduationCap, tone: 'sky', to: '/students' },
    { label: 'Roles', count: roles, icon: AtSign, tone: 'violet', to: '/discord' },
    { label: 'Groups', count: activeGroups.length, icon: Users, tone: 'teal', to: '/groups' },
    { label: 'Tasks', count: data.assignments.length, icon: ListChecks, tone: 'emerald', to: '/assignments' },
    { label: 'Schedules', count: data.events.filter((e) => { const s = new Date(e.start).getTime(); return s >= t && s < t + WEEK }).length, icon: CalendarDays, tone: 'orange', to: '/calendar', hint: 'this week' },
    { label: 'Help Requests', count: openRequestCount(data), icon: LifeBuoy, tone: 'amber', to: '/help', hint: 'open' },
  ]
  const discord: FlowItem[] = [
    { label: 'Channels', count: [...connected.map((c) => c.discord.text.length), ...activeGroups.map((g) => g.text.length)].reduce((a, b) => a + b, 0), icon: Hash, tone: 'slate', to: '/discord' },
    { label: 'Roles', count: roles, icon: AtSign, tone: 'violet', to: '/discord' },
    { label: 'Announcements', count: sent.filter((n) => n.delivery.announcement).length, icon: Megaphone, tone: 'amber', to: '/notifications' },
    { label: 'DM Reminders', count: sent.filter((n) => n.delivery.dm).length, icon: Send, tone: 'sky', to: '/notifications' },
    { label: 'Voice Channels', count: [...connected.map((c) => c.discord.voice.length), ...activeGroups.map((g) => g.voice.length)].reduce((a, b) => a + b, 0), icon: Volume2, tone: 'teal', to: '/discord' },
  ]

  return (
    <section
      aria-labelledby="eco-title"
      className="relative overflow-hidden rounded-3xl border border-line shadow-card"
      style={{ background: 'radial-gradient(55% 90% at 0% 0%, #e3f2fd 0%, rgb(227 242 253 / 0) 60%), radial-gradient(45% 80% at 50% 100%, #ebeaff 0%, rgb(235 234 255 / 0) 65%), radial-gradient(45% 90% at 100% 0%, #e7e9ff 0%, rgb(231 233 255 / 0) 60%), #ffffff' }}
    >
      <style>{FLOW_CSS}</style>
      <div className="bg-dots pointer-events-none absolute inset-0 opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" aria-hidden />
      <div className="relative p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">How Classync works</div>
            <h2 id="eco-title" className="mt-1 text-[19px] font-extrabold tracking-tight text-ink">From academic records to a living Discord server</h2>
            <p className="mt-1 max-w-2xl text-[13.5px] text-ink-3">Verified records flow into Classync, which organizes classes and groups, then keeps every Discord role and channel in sync.</p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-surface/80 px-3 py-1.5 text-xs text-ink-3 ring-1 ring-line backdrop-blur">
            <span className="relative flex size-2"><span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping-soft" /><span className="relative size-2 rounded-full bg-emerald-500" /></span>
            <span className="font-semibold text-ink-2">All systems in sync</span>
            <span aria-hidden>·</span>
            <span className="tabular">{relTime(data.discord.lastSync)}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col items-stretch xl:grid xl:grid-cols-[minmax(0,1fr)_116px_minmax(0,1.25fr)_116px_minmax(0,1fr)] xl:items-center">
          {/* 1 · Academic database */}
          <Node>
            <NodeHeader
              icon={<IconTile icon={Database} tone="sky" />}
              title="Academic Database" subtitle="Spreadsheets · SIAK export"
            />
            <div className="mt-3 flex items-center gap-3 px-1">
              <FileIcon kind="xlsx" size="sm" /><FileIcon kind="csv" size="sm" /><FileIcon kind="sheets" size="sm" />
              <span className="text-[11.5px] leading-tight text-ink-3">Rosters matched<br />by NPM</span>
            </div>
            <ul className="mt-3 space-y-0.5">{source.map((it) => <li key={it.label}><RowItem item={it} /></li>)}</ul>
            <NodeFooter><ShieldCheck className="size-3.5 text-emerald-600" />Source of truth for identities</NodeFooter>
          </Node>

          <Connector forward="Verify & import" />

          {/* 2 · Classync */}
          <Node featured>
            <div className="flex items-center gap-3">
              <span className="relative grid shrink-0 place-items-center">
                <span className="absolute inset-0 rounded-[12px] bg-brand-400/40 animate-ping-soft" aria-hidden />
                <ClassyncMark size={40} className="relative drop-shadow-[0_6px_14px_rgb(91_87_214/0.4)]" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-extrabold tracking-tight text-ink">Classync</div>
                <div className="truncate text-xs text-ink-3">Academic workspace</div>
              </div>
              <AvatarStack ids={FEATURED_STUDENTS} max={4} size="sm" total={roster.length} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {hub.map((it, i) => <TileItem key={it.label} item={it} wide={i === hub.length - 1} />)}
            </div>
          </Node>

          <Connector forward="Sync & notify" back="Help requests" />

          {/* 3 · Discord */}
          <Node>
            <NodeHeader
              icon={<span className="grid size-9 shrink-0 place-items-center rounded-xl bg-discord text-white shadow-[0_6px_14px_-4px_rgb(88_101_242/0.55)]"><DiscordGlyph className="size-[18px]" /></span>}
              title="Discord" subtitle={data.discord.server}
            />
            <ul className="mt-3 space-y-0.5">{discord.map((it) => <li key={it.label}><RowItem item={it} /></li>)}</ul>
            <NodeFooter>
              <span className={cn('size-2 rounded-full', data.discord.botOnline ? 'bg-emerald-500' : 'bg-slate-300')} />
              Bot {data.discord.botOnline ? 'online' : 'offline'} · <span className="tabular">{data.discord.members}</span> members
            </NodeFooter>
          </Node>
        </div>
      </div>
    </section>
  )
}

function Node({ children, featured }: { children: ReactNode; featured?: boolean }) {
  return (
    <div className={cn(
      'relative rounded-2xl bg-surface/95 p-4 backdrop-blur animate-rise-in',
      featured ? 'shadow-[0_18px_40px_-18px_rgb(91_87_214/0.45)] ring-2 ring-brand-200' : 'shadow-lift ring-1 ring-line',
    )}>
      {children}
    </div>
  )
}

function NodeHeader({ icon, title, subtitle }: { icon: ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <div className="min-w-0">
        <div className="text-[14.5px] font-bold tracking-tight text-ink">{title}</div>
        <div className="truncate text-xs text-ink-3">{subtitle}</div>
      </div>
    </div>
  )
}

const NodeFooter = ({ children }: { children: ReactNode }) => (
  <div className="mt-3 flex items-center gap-1.5 border-t border-line pt-3 text-[11.5px] font-medium text-ink-3">{children}</div>
)

function Clickable({ item, className, children }: { item: FlowItem; className: string; children: ReactNode }) {
  const label = `${item.label}: ${item.count}${item.hint ? ` ${item.hint}` : ''}`
  return item.to
    ? <a href={href(item.to)} className={className} aria-label={label}>{children}</a>
    : <button type="button" onClick={item.onClick} className={className} aria-label={label}>{children}</button>
}

function RowItem({ item }: { item: FlowItem }) {
  const t = toneOf(item.tone)
  return (
    <Clickable item={item} className="group flex w-full items-center gap-2.5 rounded-xl px-1.5 py-1.5 text-left transition duration-150 hover:bg-subtle active:scale-[0.99]">
      <span className={cn('grid size-7 shrink-0 place-items-center rounded-lg', t.soft, t.text)}><item.icon className="size-3.5" /></span>
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink-2 group-hover:text-ink">{item.label}</span>
      <span className="text-[13px] font-bold text-ink tabular">{item.count}</span>
      <ChevronRight className="size-3.5 text-ink-3 opacity-0 transition duration-150 group-hover:translate-x-0.5 group-hover:opacity-100 group-focus-visible:opacity-100" />
    </Clickable>
  )
}

function TileItem({ item, wide }: { item: FlowItem; wide?: boolean }) {
  const t = toneOf(item.tone)
  return (
    <Clickable item={item} className={cn(
      'group flex items-center gap-2.5 rounded-xl border border-line bg-surface px-2.5 py-2 text-left transition duration-150 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-lift active:translate-y-0',
      wide && 'col-span-2',
    )}>
      <span className={cn('grid size-8 shrink-0 place-items-center rounded-lg', t.soft, t.text)}><item.icon className="size-4" /></span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12px] font-semibold text-ink-3 group-hover:text-ink-2">{item.label}</span>
        <span className="flex items-baseline gap-1">
          <span className="text-[17px] font-extrabold leading-tight text-ink tabular">{item.count}</span>
          {wide && item.hint && <span className="truncate text-[11px] font-medium text-ink-3">{item.hint}</span>}
        </span>
      </span>
      <ChevronRight className="size-3.5 shrink-0 text-ink-3 opacity-0 transition duration-150 group-hover:translate-x-0.5 group-hover:opacity-100" />
    </Clickable>
  )
}

/** Dashed lane with dots flowing along it. */
function Lane({ vertical, reverse, dot }: { vertical?: boolean; reverse?: boolean; dot: 'brand' | 'teal' }) {
  const color = dot === 'brand' ? 'bg-brand-500 shadow-[0_0_0_3px_rgb(109_106_226/0.2)]' : 'bg-teal-500 shadow-[0_0_0_3px_rgb(20_184_166/0.2)]'
  const Head = vertical ? (reverse ? ChevronUp : ChevronDown) : (reverse ? ChevronLeft : ChevronRight)
  return (
    <div className={cn('relative', vertical ? 'h-full w-3' : 'h-3 w-full')}>
      <span className={cn('absolute border-dashed', dot === 'brand' ? 'border-brand-300' : 'border-teal-300',
        vertical ? 'inset-y-0 left-1/2 -translate-x-1/2 border-l-2' : 'inset-x-0 top-1/2 -translate-y-1/2 border-t-2')} />
      <Head className={cn('absolute size-3.5', dot === 'brand' ? 'text-brand-400' : 'text-teal-400',
        vertical ? cn('left-1/2 -translate-x-1/2', reverse ? '-top-1.5' : '-bottom-1.5') : cn('top-1/2 -translate-y-1/2', reverse ? '-left-1.5' : '-right-1.5'))} strokeWidth={3} />
      <span className="absolute inset-0 overflow-hidden">
        {[0, 1, 2].map((i) => (
          <span key={i} className={cn('absolute inset-0', vertical ? 'cs-y' : 'cs-x', reverse && 'cs-rev')} style={{ animationDelay: `${-i * 0.9}s` }}>
            <span className={cn('absolute size-2 rounded-full', color, vertical ? 'left-1/2 top-0 -translate-x-1/2' : 'left-0 top-1/2 -translate-y-1/2')} />
          </span>
        ))}
      </span>
    </div>
  )
}

function Connector({ forward, back }: { forward: string; back?: string }) {
  const pill = 'whitespace-nowrap rounded-full bg-surface/90 px-2 py-0.5 text-center text-[10.5px] font-semibold leading-tight ring-1 ring-line'
  return (
    <div aria-hidden className="flex justify-center">
      {/* desktop: horizontal lanes */}
      <div className="hidden w-full flex-col items-center gap-1.5 px-1 xl:flex">
        <span className={cn(pill, 'text-brand-700')}>{forward}</span>
        <Lane dot="brand" />
        {back && <><Lane dot="teal" reverse /><span className={cn(pill, 'text-teal-700')}>{back}</span></>}
      </div>
      {/* narrow: vertical lanes */}
      <div className="flex h-20 items-stretch gap-3 py-2 xl:hidden">
        <Lane vertical dot="brand" />
        {back && <Lane vertical reverse dot="teal" />}
        <div className="flex flex-col justify-center gap-1">
          <Badge tone="brand" size="xs">{forward}</Badge>
          {back && <Badge tone="teal" size="xs">{back}</Badge>}
        </div>
      </div>
    </div>
  )
}
