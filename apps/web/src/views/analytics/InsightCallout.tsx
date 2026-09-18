import { useState } from 'react'
import { BookOpen, CalendarPlus, Send, Sparkles, TrendingDown, Trophy, X, Zap, type LucideIcon } from 'lucide-react'
import { AnonStack, AvatarStack, Badge, Button, Card, IconButton, IconTile } from '@/components/ui'
import { navigate } from '@/lib/router'
import type { Audience, Tone } from '@/lib/types'
import { useStore } from '@/store/store'
import { PERIOD, type Range } from './data'

interface Insight {
  title: string; body: string; icon: LucideIcon; tone: Tone
  people: string[]; peopleLabel: string; anon?: number
  primary: { label: string; icon: LucideIcon; onClick: () => void }
  secondary: { label: string; to: string }
}

const CLASS_D: Audience = { type: 'class', classIds: ['D'], groupIds: [], studentIds: [] }

export function InsightCallout({ range }: { range: Range }) {
  const { openModal, toast } = useStore()
  const [dismissed, setDismissed] = useState<Range[]>([])
  if (dismissed.includes(range)) return null

  const insights: Record<Range, Insight> = {
    week: {
      title: 'Class D completion dipped 6% — Regression Assumptions reports are rising',
      body: '4 students are stuck on the Regression Report, due Monday 23:59. A short tips post with office hours usually recovers completion within two days.',
      icon: TrendingDown, tone: 'orange', people: ['maya', 'sarah'], peopleLabel: 'Class D teaching team', anon: 3,
      primary: {
        label: 'Send tips to Class D', icon: Send,
        onClick: () => openModal({ type: 'createNotification', prefill: { title: 'Regression Report: checking your assumptions', description: "Quick guide to residual plots, Q-Q plots and VIF before Monday's deadline. Office hours Thursday 15:00 in voice-class.", category: 'Material', audience: CLASS_D } }),
      },
      secondary: { label: 'View reports', to: '/help' },
    },
    month: {
      title: 'Help requests are answered 5 min faster than last month',
      body: 'Reusable answers now resolve 1 in 3 repeated questions. PCA and AWS still make up half of all difficulty reports — pinning a guide in those channels could cut more.',
      icon: Zap, tone: 'teal', people: ['farhan', 'sarah', 'maya'], peopleLabel: 'Top responders',
      primary: { label: 'Open reusable answers', icon: BookOpen, onClick: () => navigate('/help') },
      secondary: { label: 'Assignments', to: '/assignments' },
    },
    semester: {
      title: 'Class A leads completion at 88% this semester',
      body: "Weekly SQL practice posts in #material track closely with Class A's completion. Class D is 11% behind — the same cadence could help its Regression unit.",
      icon: Trophy, tone: 'sky', people: ['andi', 'nadia', 'erik', 'gilang'], peopleLabel: 'Class A',
      primary: {
        label: 'Schedule weekly practice', icon: CalendarPlus,
        onClick: () => openModal({ type: 'createNotification', prefill: { title: 'Weekly Regression Practice', description: 'Three short practice problems every Monday in #material, with worked solutions on Friday.', category: 'Material', mode: 'recurring', repeat: { day: 'Monday', time: '09:00' }, audience: CLASS_D } }),
      },
      secondary: { label: 'Open Class A', to: '/classes/A' },
    },
  }
  const d = insights[range]

  const dismiss = () => {
    setDismissed((x) => [...x, range])
    toast({ title: 'Insight dismissed', description: "We'll surface a new one when something changes.", tone: 'info', action: { label: 'Undo', onClick: () => setDismissed((x) => x.filter((r) => r !== range)) } })
  }

  return (
    <Card key={range} className="hero-gradient relative overflow-hidden p-5 animate-rise-in" role="region" aria-label="Insight">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <IconTile icon={d.icon} tone={d.tone} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Badge tone="brand" icon={Sparkles} size="xs">Insight</Badge>
            <span className="text-[11.5px] text-ink-3">{PERIOD[range].span}</span>
          </div>
          <h2 className="mt-1.5 text-base font-bold tracking-tight text-ink">{d.title}</h2>
          <p className="mt-1 max-w-3xl text-[13px] leading-relaxed text-ink-2">{d.body}</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-3">
            <span className="inline-flex items-center gap-2"><AvatarStack ids={d.people} size="xs" />{d.peopleLabel}</span>
            {d.anon != null && <span className="inline-flex items-center gap-2"><AnonStack count={d.anon} size="xs" />{d.anon} new anonymous reports</span>}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 md:pr-8">
          <Button variant="ghost" size="sm" onClick={() => navigate(d.secondary.to)}>{d.secondary.label}</Button>
          <Button variant="primary" size="sm" icon={d.primary.icon} onClick={d.primary.onClick}>{d.primary.label}</Button>
        </div>
      </div>
      <IconButton icon={X} label="Dismiss insight" size="xs" className="absolute right-3 top-3" onClick={dismiss} />
    </Card>
  )
}
