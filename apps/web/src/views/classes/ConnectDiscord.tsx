import { useState } from 'react'
import { Unplug } from 'lucide-react'
import { Button, ChannelChip, DiscordGlyph, RoleChip, Spinner, StepChecklist } from '@/components/ui'
import { studentsIn } from '@/lib/selectors'
import type { ClassRoom } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useActions } from '@/store/actions'
import { useStore } from '@/store/store'

/**
 * "Not connected" state + simulated provisioning (role → channels → role assignment), then connects the class.
 * compact: inline strip for class cards · otherwise: full panel for the Discord tab.
 */
export function ConnectDiscord({ cls, compact, onConnected, className }: { cls: ClassRoom; compact?: boolean; onConnected?: () => void; className?: string }) {
  const { data, toast } = useStore()
  const actions = useActions()
  const [running, setRunning] = useState(false)
  const { role, text, voice } = cls.discord
  const verified = studentsIn(data.people, cls.id).filter((p) => p.verification === 'Verified').length
  const steps = [
    <>Creating the <b>{role}</b> role</>,
    <>Creating {text.length} text channels from the Class template</>,
    <>Opening the <b>{voice.join(', ')}</b> voice channel</>,
    <>Assigning {role} to {verified} verified students</>,
  ]

  const finish = () => setTimeout(() => {
    actions.connectClassDiscord(cls.id)
    onConnected?.()
    toast({ title: `${cls.name} connected to Discord`, description: `${role} role and ${text.length + voice.length} channels created in ${data.discord.server}.`, tone: 'discord' })
  }, 400)

  if (running) {
    return (
      <div className={cn('rounded-xl border border-discord/25 bg-discord/5 p-3.5 animate-fade-in', !compact && 'p-5', className)} aria-live="polite">
        <div className="mb-2.5 flex items-center gap-2 text-[13px] font-semibold text-ink"><Spinner className="text-discord" />Connecting to {data.discord.server}…</div>
        <StepChecklist steps={steps} interval={compact ? 420 : 520} onDone={finish} />
      </div>
    )
  }

  const button = (
    <Button variant="discord" size={compact ? 'sm' : 'md'} onClick={() => setRunning(true)}>
      <DiscordGlyph className={compact ? 'size-3.5' : 'size-4'} />Connect Discord
    </Button>
  )

  if (compact) {
    return (
      <div className={cn('flex items-center gap-3 rounded-xl border border-dashed border-line-strong bg-canvas/70 p-3', className)}>
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-subtle text-ink-3"><Unplug className="size-[18px]" /></span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-ink">Not connected</div>
          <div className="truncate text-xs text-ink-3">Creates {role} and {text.length + voice.length} channels from the Class template</div>
        </div>
        {button}
      </div>
    )
  }

  return (
    <div className={cn('rounded-2xl border border-dashed border-line-strong bg-canvas/60 p-6', className)}>
      <div className="flex flex-wrap items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-discord text-white shadow-[0_10px_24px_-10px_#5865f2]"><DiscordGlyph className="size-6" /></span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-bold text-ink">{cls.name} isn't connected to Discord yet</h3>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-ink-3">
            Classync will create the class role and channels in <b className="text-ink-2">{data.discord.server}</b>, then give the role to every verified student so announcements and reminders reach them automatically.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <RoleChip name={role} tone={cls.tone} count={verified} />
            {text.map((c) => <ChannelChip key={c} name={c} tone="new" />)}
            {voice.map((c) => <ChannelChip key={c} name={c} voice tone="new" />)}
          </div>
        </div>
        {button}
      </div>
    </div>
  )
}
