import { Card, ChannelChip, RoleChip, DiscordGlyph, Badge } from '@/components/ui'
import { ConnectDiscord } from './ConnectDiscord'
import type { TabProps } from './lib'

export function DiscordTab({ cls }: TabProps) {
  if (!cls.discord.connected) {
    return <ConnectDiscord cls={cls} />
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DiscordGlyph className="size-8 text-discord" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-ink">Connected Discord Server</h3>
                <Badge tone="emerald" size="xs">Connected</Badge>
              </div>
              <p className="text-xs text-ink-3 mt-0.5">Role: <RoleChip name={cls.discord.role} /></p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl bg-canvas p-4 border border-line">
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider mb-2">Text Channels</h4>
            <div className="flex flex-wrap gap-1.5">
              {cls.discord.text.map((ch) => (
                <ChannelChip key={ch} name={ch} />
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-canvas p-4 border border-line">
            <h4 className="text-xs font-bold text-ink uppercase tracking-wider mb-2">Voice Channels</h4>
            <div className="flex flex-wrap gap-1.5">
              {cls.discord.voice.map((ch) => (
                <ChannelChip key={ch} name={ch} voice />
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
