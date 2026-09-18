import { useId, type ReactNode } from 'react'
import { ChevronRight, EyeOff, HandHelping, ShieldCheck, UsersRound, type LucideIcon } from 'lucide-react'
import { DiscordEmbed, DiscordMessage, DiscordWindow } from '@/components/domain/Discord'
import { Badge, IconTile } from '@/components/ui'
import { shortName } from '@/lib/selectors'
import { fmtTime, nowIso } from '@/lib/time'
import { tone as toneOf } from '@/lib/tones'
import type { ClassId, Tone } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'
import { firstName } from './helpers'

export const EYEBROW = 'text-[11px] font-semibold uppercase tracking-wider text-ink-3'

export function SectionTitle({ id, title, subtitle, action, className }: {
  id?: string; title: ReactNode; subtitle?: ReactNode; action?: ReactNode; className?: string
}) {
  return (
    <div className={cn('mb-4 flex flex-wrap items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 id={id} className="text-[17px] font-bold tracking-tight text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-[13px] text-ink-3">{subtitle}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  )
}

/** 'Class B' (or 'Class B · Data Science') in the class tone. */
export function ClassChip({ classId, subject }: { classId: ClassId; subject?: boolean }) {
  const { data } = useStore()
  const c = data.classes.find((x) => x.id === classId)
  return <Badge tone={c?.tone ?? 'slate'} dot size="xs">{c?.name ?? `Class ${classId}`}{subject && c ? ` · ${c.subject}` : ''}</Badge>
}

export function Sparkline({ values, tone = 'brand', width = 88, height = 28, className }: {
  values: number[]; tone?: Tone; width?: number; height?: number; className?: string
}) {
  const gid = `spark${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const max = Math.max(...values, 1)
  const step = width / (values.length - 1)
  const pts = values.map((v, i) => [i * step, height - 3 - (v / max) * (height - 6)] as const)
  const line = pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const [lx, ly] = pts[pts.length - 1]
  const hex = toneOf(tone).hex
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={cn('overflow-visible', className)} aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={hex} stopOpacity="0.24" />
          <stop offset="1" stopColor={hex} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M0,${height} L${line.split(' ').join(' L')} L${width},${height} Z`} fill={`url(#${gid})`} />
      <polyline points={line} fill="none" stroke={hex} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lx} cy={ly} r="2.75" fill={hex} stroke="white" strokeWidth="1.5" />
    </svg>
  )
}

const STEPS: { icon: LucideIcon; tone: Tone; title: (t: number) => string; text: (t: number) => string }[] = [
  { icon: EyeOff, tone: 'sky', title: () => 'Anonymous reports', text: () => 'Students flag a difficulty from Discord — no names attached.' },
  { icon: UsersRound, tone: 'violet', title: (t) => `Aggregated at ${t}+`, text: (t) => `A concept only appears once ${t} students have reported it.` },
  { icon: HandHelping, tone: 'emerald', title: () => 'Identity on request', text: () => 'Names are shown only when a student explicitly asks for help.' },
]

export function PrivacyExplainer({ threshold, className }: { threshold: number; className?: string }) {
  return (
    <div role="region" aria-label="How privacy works" className={cn('grid gap-1 rounded-2xl border border-line bg-surface p-1.5 shadow-card md:grid-cols-[auto_repeat(3,minmax(0,1fr))]', className)}>
      <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-emerald-800">
        <ShieldCheck className="size-5 shrink-0" />
        <div>
          <div className="whitespace-nowrap text-[13px] font-bold leading-tight">How privacy works</div>
          <div className="text-[11.5px] text-emerald-700/80">Built into every report</div>
        </div>
      </div>
      {STEPS.map((s, i) => (
        <div key={i} className="relative flex items-start gap-3 rounded-xl px-3 py-2.5">
          <IconTile icon={s.icon} tone={s.tone} size="sm" />
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-ink"><span className="mr-1.5 text-ink-3 tabular">{i + 1}</span>{s.title(threshold)}</div>
            <p className="mt-0.5 text-xs leading-snug text-ink-3">{s.text(threshold)}</p>
          </div>
          {i < STEPS.length - 1 && <ChevronRight className="absolute -right-2 top-1/2 hidden size-4 -translate-y-1/2 text-line-strong md:block" aria-hidden />}
        </div>
      ))}
    </div>
  )
}

/** The private Discord DM a student receives for an answer. */
export function AnswerDM({ concept, classId, assignment, body, studentId, className }: {
  concept: string; classId?: ClassId; assignment?: string; body: string; studentId?: string; className?: string
}) {
  const { data, me, person, toast } = useStore()
  const cls = data.classes.find((c) => c.id === classId)
  const previewOnly = () => toast({ tone: 'discord', title: 'Preview only', description: 'Students use these buttons inside Discord.' })
  return (
    <DiscordWindow dm="Classync" className={className}>
      <DiscordMessage time={`Today at ${fmtTime(nowIso())}`}>
        <p>Hi {firstName(person(studentId)?.name)} 👋 You asked for help with <span className="font-semibold text-white">{concept}</span>. Here's an answer from the teaching team:</p>
        <DiscordEmbed
          title={`💡 ${concept}`}
          description={body.trim() || <span className="italic text-[#949ba4]">Your answer will appear here as you type…</span>}
          fields={[
            { name: 'Class', value: cls?.name ?? '—', inline: true },
            { name: 'Answered by', value: shortName(me), inline: true },
            ...(assignment ? [{ name: 'Assignment', value: assignment }] : []),
          ]}
          footer="🔒 Sent privately · other students can't see who asked"
          buttons={[{ label: '👍 This helped', style: 'success', onClick: previewOnly }, { label: 'Ask a follow-up', style: 'secondary', onClick: previewOnly }]}
        />
      </DiscordMessage>
    </DiscordWindow>
  )
}
