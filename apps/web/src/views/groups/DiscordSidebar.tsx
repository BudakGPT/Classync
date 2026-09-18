import { ChevronDown, Hash, UserPlus, Volume2 } from 'lucide-react'
import { Avatar } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'

const ROLE_COLOR = '#1abc9c' // Discord's default teal role color

/** Dark mini Discord sidebar: server → group category → channels, plus the members holding the role. */
export function DiscordSidebar({ category, text, voice, roleName, memberIds, isNew, split, className }: {
  category: string; text: string[]; voice: string[]; roleName: string; memberIds?: string[]; isNew?: boolean; split?: boolean; className?: string
}) {
  const { data, person } = useStore()
  const channels = [...text.map((name) => ({ name, voice: false })), ...voice.map((name) => ({ name, voice: true }))]
  return (
    <div className={cn('overflow-hidden rounded-xl bg-[#2b2d31] text-[#949ba4] shadow-lift ring-1 ring-black/10', className)} role="img" aria-label={`Discord preview: ${roleName} role with channels ${channels.map((c) => c.name).join(', ')}`}>
      <div className="flex h-10 items-center justify-between gap-2 border-b border-black/30 px-3 text-[13px] font-semibold text-white">
        <span className="truncate">{data.discord.server}</span>
        <ChevronDown className="size-4 shrink-0" />
      </div>
      <div className={cn('grid', split && 'sm:grid-cols-2')}>
        <div className="p-2">
          <div className="flex items-center gap-0.5 px-0.5 pb-1 pt-1 text-[11px] font-bold uppercase tracking-wide">
            <ChevronDown className="size-3 shrink-0" /><span className="truncate">{category}</span>
          </div>
          {channels.map((c, i) => (
            <div key={`${c.name}-${i}`} className="flex h-8 items-center gap-1.5 rounded-md px-2 text-[14px] font-medium transition-colors hover:bg-[#35373c] hover:text-[#dbdee1] animate-rise-in" style={{ animationDelay: `${i * 50}ms` }}>
              {c.voice ? <Volume2 className="size-4 shrink-0 opacity-80" /> : <Hash className="size-4 shrink-0 opacity-80" />}
              <span className="truncate">{c.name}</span>
              {isNew && <span className="ml-auto rounded-[4px] bg-[#5865f2] px-1 py-px text-[9.5px] font-bold leading-none text-white">NEW</span>}
            </div>
          ))}
        </div>

        {memberIds && (
          <div className={cn('border-black/25 p-2', split ? 'border-t sm:border-l sm:border-t-0' : 'border-t')}>
            <div className="flex items-center justify-between gap-2 px-1 pb-1.5 pt-1">
              <span className="truncate text-[11px] font-bold uppercase tracking-wide">{roleName.replace(/^@/, '')} — {memberIds.length}</span>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-[4px] bg-[#1e1f22] px-1.5 py-0.5 text-[11px] font-medium text-[#dbdee1]">
                <span className="size-2 rounded-full" style={{ background: ROLE_COLOR }} />{roleName}
              </span>
            </div>
            {memberIds.length === 0 && (
              <div className="flex items-center gap-2 rounded-md border border-dashed border-white/10 px-2 py-2.5 text-[12px]">
                <UserPlus className="size-4 shrink-0" />Selected students will get this role
              </div>
            )}
            <div className="max-h-44 space-y-px overflow-y-auto scrollbar-thin">
              {memberIds.map((id) => {
                const p = person(id)
                return (
                  <div key={id} className={cn('flex h-9 items-center gap-2 rounded-md px-1.5 transition-colors hover:bg-[#35373c] animate-scale-in', p?.presence === 'offline' && 'opacity-50')}>
                    <span className="relative">
                      <Avatar id={id} size="sm" />
                      <span className={cn('absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-[2.5px] ring-[#2b2d31]', p?.presence === 'online' ? 'bg-[#23a55a]' : p?.presence === 'idle' ? 'bg-[#f0b232]' : 'bg-[#80848e]')} />
                    </span>
                    <span className="truncate text-[13.5px] font-medium" style={{ color: ROLE_COLOR }}>{p?.name ?? id}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
