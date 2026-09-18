import type { ReactNode } from 'react'
import { Hash } from 'lucide-react'
import { Avatar } from '@/components/ui'
import { cn } from '@/lib/utils'

// Discord-styled previews (dark theme) so students' view of Classync messages is instantly recognisable.

export function DiscordWindow({ channel, dm, children, className }: { channel?: string; dm?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-2xl bg-[#313338] text-[#dbdee1] shadow-lift ring-1 ring-black/5', className)}>
      {(channel || dm) && (
        <div className="flex items-center gap-2 border-b border-black/25 px-4 py-2.5 text-[13px] font-semibold text-white">
          {channel ? <><Hash className="size-4 text-[#80848e]" />{channel}</> : <><span className="text-[#80848e]">@</span>{dm}</>}
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  )
}

export function DiscordMessage({ authorId = 'classync', author = 'Classync', bot = true, time = 'Today at 10:41', children }: {
  authorId?: string; author?: string; bot?: boolean; time?: string; children: ReactNode
}) {
  return (
    <div className="flex gap-3">
      <Avatar id={authorId} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-1.5">
          <span className="text-[14px] font-semibold text-white">{author}</span>
          {bot && <span className="rounded-[4px] bg-[#5865f2] px-1 py-px text-[10px] font-bold leading-none text-white">APP</span>}
          <span className="text-[11px] text-[#949ba4]">{time}</span>
        </div>
        <div className="mt-0.5 space-y-1 text-[14px] leading-[1.4]">{children}</div>
      </div>
    </div>
  )
}

export interface EmbedField { name: string; value: ReactNode; inline?: boolean }
export interface EmbedButton { label: ReactNode; style?: 'primary' | 'secondary' | 'success' | 'danger'; onClick?: () => void; disabled?: boolean }

const BTN = { primary: 'bg-[#5865f2] hover:bg-[#4752c4]', secondary: 'bg-[#4e5058] hover:bg-[#6d6f78]', success: 'bg-[#248046] hover:bg-[#1a6334]', danger: 'bg-[#da373c] hover:bg-[#a12828]' }

export function DiscordEmbed({ color = '#5b57d6', title, description, fields = [], footer, buttons = [] }: {
  color?: string; title?: ReactNode; description?: ReactNode; fields?: EmbedField[]; footer?: ReactNode; buttons?: EmbedButton[]
}) {
  return (
    <div>
      <div className="mt-1.5 max-w-[460px] rounded-[4px] border-l-4 bg-[#2b2d31] px-3.5 py-3" style={{ borderColor: color }}>
        {title && <div className="text-[15px] font-semibold text-white">{title}</div>}
        {description && <div className="mt-1 whitespace-pre-line text-[13.5px] leading-snug text-[#dbdee1]">{description}</div>}
        {fields.length > 0 && (
          <div className="mt-2.5 grid grid-cols-3 gap-x-4 gap-y-2">
            {fields.map((f, i) => (
              <div key={i} className={f.inline ? 'col-span-1' : 'col-span-3'}>
                <div className="text-[12px] font-bold text-white">{f.name}</div>
                <div className="text-[13px] text-[#dbdee1]">{f.value}</div>
              </div>
            ))}
          </div>
        )}
        {footer && <div className="mt-2.5 text-[11px] text-[#949ba4]">{footer}</div>}
      </div>
      {buttons.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {buttons.map((b, i) => (
            <button key={i} type="button" onClick={b.onClick} disabled={b.disabled}
              className={cn('inline-flex h-8 items-center gap-1.5 rounded-[4px] px-4 text-[13px] font-medium text-white transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50', BTN[b.style ?? 'secondary'])}>
              {b.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
