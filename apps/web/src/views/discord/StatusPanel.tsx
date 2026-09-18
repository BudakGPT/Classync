import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { BadgeCheck, CircleCheck, LayoutTemplate, RefreshCw } from 'lucide-react'
import { AvatarStack, Button, Card, ClassyncMark, DiscordGlyph, Spinner, StepChecklist } from '@/components/ui'
import { discordRoles } from '@/lib/selectors'
import { fmtTime, relTime } from '@/lib/time'
import { cn } from '@/lib/utils'
import { useActions } from '@/store/actions'
import { useStore } from '@/store/store'
import { buildCategories } from './server'

const STEPS = ['Fetching members', 'Updating roles', 'Syncing channels', 'Posting schedules']

function Stat({ label, children, sub }: { label: string; children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl bg-white/75 px-3.5 py-3 ring-1 ring-line backdrop-blur-sm">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">{label}</div>
      <div className="mt-1 flex min-h-6 items-center gap-2 text-[15px] font-bold text-ink">{children}</div>
      {sub && <div className="mt-0.5 truncate text-[11.5px] text-ink-3">{sub}</div>}
    </div>
  )
}

const LiveDot = ({ pulse }: { pulse?: boolean }) => (
  <span className="relative inline-flex size-2.5 shrink-0">
    {pulse && <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping-soft" />}
    <span className="relative size-2.5 rounded-full bg-emerald-500" />
  </span>
)

export function StatusPanel({ onManageTemplates }: { onManageTemplates: () => void }) {
  const { data, toast } = useStore()
  const actions = useActions()
  const d = data.discord
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle')
  const [jitter, setJitter] = useState(0)
  useEffect(() => {
    // ponytail: fake live latency wobble so the panel feels connected
    const t = setInterval(() => setJitter(Math.round(Math.random() * 8 - 4)), 3000)
    return () => clearInterval(t)
  }, [])

  const roles = discordRoles(data).length
  const channels = useMemo(() => buildCategories(data).filter((c) => c.connected).reduce((n, c) => n + c.channels.length, 0), [data])
  const faces = data.people.filter((p) => p.featured && p.presence === 'online' && p.verification === 'Verified').map((p) => p.id)
  const latency = d.latencyMs + jitter

  const sync = async () => {
    if (phase === 'running') return
    setPhase('running')
    await actions.syncDiscord()
    setPhase('done')
    toast({ title: 'Discord roles synchronized', description: `${d.members} members · ${roles} roles · ${channels} channels up to date`, tone: 'discord' })
    setTimeout(() => setPhase('idle'), 2400)
  }

  return (
    <Card className="hero-gradient relative p-6">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="flex min-w-0 items-center gap-4">
          <div className="relative shrink-0">
            <span className="grid size-16 place-items-center rounded-2xl bg-discord text-white shadow-[0_12px_28px_-10px_rgb(88_101_242/0.7)]">
              <DiscordGlyph className="size-9" />
            </span>
            <span className="absolute -bottom-1.5 -right-1.5 rounded-[10px] ring-[3px] ring-white"><ClassyncMark size={26} /></span>
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">Connected server</div>
            <div className="flex items-center gap-2">
              <h2 className="truncate text-[22px] font-extrabold tracking-tight text-ink">{d.server}</h2>
              <BadgeCheck className="size-5 shrink-0 fill-discord text-white" aria-label="Verified server" />
            </div>
            <p className="truncate text-[13px] text-ink-3">discord.gg/fasilkom-hub · Bot <span className="font-semibold text-ink-2">Classync#4821</span> · Admin access</p>
          </div>
        </div>

        <div className="relative flex items-center gap-2">
          <Button variant="secondary" icon={LayoutTemplate} onClick={onManageTemplates}>Manage Templates</Button>
          <Button variant="primary" onClick={sync} aria-busy={phase === 'running' || undefined} aria-disabled={phase === 'running' || undefined} className={cn('min-w-[136px]', phase === 'running' && 'cursor-progress bg-brand-700')}>
            <RefreshCw className={cn('size-4', phase === 'running' && 'animate-spin')} />
            {phase === 'running' ? 'Syncing…' : 'Sync Discord'}
          </Button>

          {phase !== 'idle' && (
            <div role="status" aria-live="polite" className="absolute right-0 top-full z-20 mt-2 w-72 rounded-2xl border border-line bg-surface p-4 shadow-pop animate-scale-in">
              <div className="mb-3 flex items-center gap-2">
                {phase === 'running' ? <Spinner /> : <CircleCheck className="size-4 text-emerald-600 animate-check-in" />}
                <span className="text-[13.5px] font-bold text-ink">{phase === 'running' ? 'Syncing with Discord…' : 'Everything is in sync'}</span>
              </div>
              <StepChecklist steps={STEPS} interval={420} />
              {phase === 'done' && <p className="mt-3 border-t border-line pt-2.5 text-xs text-ink-3 animate-fade-in">{roles} roles and {channels} channels verified at {fmtTime(d.lastSync)}</p>}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Status" sub="OAuth2 · full sync enabled">
          <LiveDot pulse /><span className="text-emerald-700">{d.connected ? 'Connected' : 'Disconnected'}</span>
        </Stat>
        <Stat label="Members" sub="Across all channels">
          <span className="tabular">{d.members}</span>
          <AvatarStack ids={faces} max={3} size="xs" total={d.members} />
        </Stat>
        <Stat label="Bot status" sub="Classync#4821">
          <span className={cn('size-2 rounded-full', d.botOnline ? 'bg-emerald-500' : 'bg-slate-400')} />{d.botOnline ? 'Online' : 'Offline'}
        </Stat>
        <Stat label="Latency" sub={latency < 60 ? 'Excellent' : 'Good'}>
          <span className="tabular">{latency} ms</span>
          <span className="flex items-end gap-0.5" aria-hidden>
            {[6, 9, 12].map((h) => <span key={h} className="w-1 rounded-sm bg-emerald-500" style={{ height: h }} />)}
          </span>
        </Stat>
        <Stat label="Last sync" sub="Auto-sync every 15 min">
          <span key={d.lastSync} className="animate-fade-in">{relTime(d.lastSync)}</span>
        </Stat>
        <Stat label="Managed" sub="By Classync templates">
          <span className="tabular">{roles}</span><span className="text-[13px] font-semibold text-ink-3">roles</span>
          <span className="tabular">{channels}</span><span className="text-[13px] font-semibold text-ink-3">channels</span>
        </Stat>
      </div>
    </Card>
  )
}
