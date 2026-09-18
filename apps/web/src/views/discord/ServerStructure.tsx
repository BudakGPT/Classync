import { useMemo, useState } from 'react'
import { BadgeCheck, ChevronDown, ChevronsDownUp, ChevronsUpDown, Hash, Lock, Network, Plus, Volume2 } from 'lucide-react'
import { Avatar, Badge, Button, Card, CardHeader, ClassyncMark, DiscordGlyph } from '@/components/ui'
import { navigate, useRoute } from '@/lib/router'
import { relTime } from '@/lib/time'
import { tone } from '@/lib/tones'
import type { ClassId } from '@/lib/types'
import { cn, wait } from '@/lib/utils'
import { useActions } from '@/store/actions'
import { useStore } from '@/store/store'
import { ChatPane, VoicePane } from './ChannelPreview'
import { MemberList } from './MemberList'
import { type Category, buildCategories, channelKey, voiceParticipants } from './server'

const DEFAULT = channelKey('class-B', 'announcement')

/** Hero visual: a mock Discord server mirroring connected classes and active groups. */
export function ServerStructure() {
  const { data, toast, person } = useStore()
  const actions = useActions()
  const { params } = useRoute()
  const cats = useMemo(() => buildCategories(data), [data])
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [connecting, setConnecting] = useState<ClassId | null>(null)
  const [fresh, setFresh] = useState<Set<string>>(new Set())

  const [catId, chName] = (params.get('ch') ?? DEFAULT).split(':')
  let cat = cats.find((c) => c.id === catId && c.connected)
  let channel = cat?.channels.find((c) => c.name === chName)
  if (!cat || !channel) {
    cat = cats.find((c) => c.kind === 'class' && c.connected) ?? cats[0]
    channel = cat.channels[0]
  }
  const select = (c: Category, name: string) => navigate(`/discord?ch=${encodeURIComponent(channelKey(c.id, name))}`)

  const toggle = (id: string) => setCollapsed((s) => {
    const n = new Set(s)
    if (n.has(id)) n.delete(id)
    else n.add(id)
    return n
  })
  const allCollapsed = collapsed.size >= cats.length
  const classCount = cats.filter((c) => c.kind === 'class')
  const groupCount = cats.filter((c) => c.kind === 'group').length

  const connect = async (c: Category) => {
    const room = c.classRoom!
    setConnecting(room.id)
    await wait(1100)
    actions.connectClassDiscord(room.id)
    setFresh((s) => new Set(s).add(c.id))
    setConnecting(null)
    toast({ title: `${room.name} connected to Discord`, description: `${room.discord.role} role and ${room.discord.text.length + room.discord.voice.length} channels created`, tone: 'discord' })
  }

  return (
    <Card>
      <CardHeader
        icon={Network}
        title="Server structure"
        subtitle="Live mirror of your classes and active groups — select a channel to preview what students see"
        action={<>
          <Badge tone="sky" dot className="hidden sm:inline-flex">{classCount.filter((c) => c.connected).length}/{classCount.length} classes</Badge>
          <Badge tone="teal" dot className="hidden sm:inline-flex">{groupCount} groups</Badge>
          <Button variant="ghost" size="sm" icon={allCollapsed ? ChevronsUpDown : ChevronsDownUp} onClick={() => setCollapsed(allCollapsed ? new Set() : new Set(cats.map((c) => c.id)))}>
            {allCollapsed ? 'Expand all' : 'Collapse all'}
          </Button>
        </>}
      />
      <div className="p-5 pt-4">
        <div className="flex h-[640px] overflow-hidden rounded-2xl bg-[#313338] text-[#dbdee1] shadow-lift ring-1 ring-black/10">
          {/* server rail (decorative) */}
          <div className="hidden w-[68px] shrink-0 flex-col items-center gap-2 bg-[#1e1f22] py-3 md:flex" aria-hidden>
            <span className="grid size-12 place-items-center rounded-2xl bg-[#313338] text-[#dbdee1]"><DiscordGlyph className="size-6" /></span>
            <span className="h-0.5 w-8 rounded-full bg-[#35363c]" />
            <span className="relative">
              <span className="absolute -left-3 top-1/2 h-10 w-1 -translate-y-1/2 rounded-r-full bg-white" />
              <span className="grid size-12 place-items-center overflow-hidden rounded-2xl"><ClassyncMark size={48} /></span>
            </span>
            {['HM', 'CP', 'ID'].map((s) => (
              <span key={s} className="grid size-12 place-items-center rounded-full bg-[#313338] text-[13px] font-semibold text-[#dbdee1]">{s}</span>
            ))}
            <span className="grid size-12 place-items-center rounded-full bg-[#313338] text-[#23a55a]"><Plus className="size-5" /></span>
          </div>

          {/* channel sidebar */}
          <nav aria-label="Discord channels" className="flex w-[244px] shrink-0 flex-col bg-[#2b2d31]">
            <div className="flex h-12 shrink-0 items-center gap-1.5 border-b border-black/25 px-4 shadow-[0_1px_0_rgb(0_0_0/0.15)]">
              <BadgeCheck className="size-4 shrink-0 fill-[#5865f2] text-[#2b2d31]" />
              <span className="truncate text-[15px] font-semibold text-white">{data.discord.server}</span>
              <ChevronDown className="ml-auto size-4 shrink-0 text-[#b5bac1]" />
            </div>
            <div className="mx-2 mt-2 flex items-center gap-2 rounded-md bg-[#5b57d6]/15 px-2.5 py-2 ring-1 ring-inset ring-[#8b88ea]/25">
              <ClassyncMark size={20} className="shrink-0" />
              <div className="min-w-0 leading-tight">
                <div className="text-[12px] font-semibold text-white">Managed by Classync</div>
                <div className="truncate text-[11px] text-[#b5bac1]">Synced {relTime(data.discord.lastSync).toLowerCase()}</div>
              </div>
              <span className="ml-auto size-2 shrink-0 rounded-full bg-[#23a55a]" aria-label="Bot online" />
            </div>

            <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto pb-3 pt-1 [scrollbar-color:#1a1b1e_transparent]">
              {cats.map((c) => {
                const open = !collapsed.has(c.id)
                const glow = c.isNew || fresh.has(c.id)
                return (
                  <div key={c.id} className={cn('mt-3 transition-colors', glow && 'mx-1.5 rounded-lg bg-emerald-400/[0.07] pb-1 shadow-[0_0_22px_-6px_rgb(52_211_153/0.55)] ring-1 ring-emerald-400/35 animate-highlight')}>
                    <div className={cn('flex items-center pr-2', glow ? 'pl-0.5 pt-1' : 'pl-2')}>
                      <button
                        type="button" onClick={() => toggle(c.id)} aria-expanded={open} disabled={!c.connected}
                        className={cn('group flex min-w-0 flex-1 items-center gap-0.5 rounded py-0.5 text-left text-[11.5px] font-semibold uppercase tracking-wide',
                          c.connected ? 'text-[#949ba4] hover:text-[#dbdee1]' : 'cursor-default text-[#5d6069]')}
                      >
                        {c.connected ? <ChevronDown className={cn('size-3 shrink-0 transition-transform duration-200', !open && '-rotate-90')} strokeWidth={3} /> : <Lock className="size-3 shrink-0" strokeWidth={2.5} />}
                        {c.kind === 'class' && <span className="ml-1 size-1.5 shrink-0 rounded-full" style={{ background: c.connected ? tone(c.tone).hex : '#5d6069' }} />}
                        <span className="ml-1 truncate">{c.label}</span>
                        {glow && <span className="ml-1.5 shrink-0 rounded-[4px] bg-emerald-500 px-1 py-px text-[9.5px] font-bold tracking-normal text-white">NEW</span>}
                      </button>
                      {!c.connected && (
                        <button
                          type="button" onClick={() => connect(c)} disabled={connecting !== null}
                          className="inline-flex h-6 shrink-0 items-center gap-1 rounded-[4px] bg-[#5865f2] px-2 text-[11.5px] font-semibold text-white transition hover:bg-[#4752c4] active:scale-[0.97] disabled:opacity-70"
                        >
                          {connecting === c.classRoom?.id ? <span className="size-3 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <DiscordGlyph className="size-3" />}
                          {connecting === c.classRoom?.id ? 'Connecting' : 'Connect'}
                        </button>
                      )}
                    </div>
                    {!c.connected && (
                      <p className="px-3 pt-1 text-[11.5px] leading-snug text-[#5d6069]">{c.classRoom?.subject} · {c.channels.length} channels ready from the Class template</p>
                    )}
                    {c.connected && open && (
                      <ul className="mt-0.5 space-y-px">
                        {c.channels.map((ch) => {
                          const active = c.id === cat.id && ch.name === channel.name
                          const Icon = ch.voice ? Volume2 : Hash
                          const inVoice = ch.voice ? voiceParticipants(c, ch.name, data) : []
                          return (
                            <li key={ch.name} className="animate-fade-in">
                              <button
                                type="button" onClick={() => select(c, ch.name)} aria-current={active ? 'true' : undefined}
                                className={cn('mx-2 flex w-[calc(100%-1rem)] items-center gap-1.5 rounded-[4px] px-2 py-[5px] text-left text-[14.5px] font-medium transition-colors duration-100',
                                  active ? 'bg-[#404249] text-white' : 'text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]')}
                              >
                                <Icon className="size-[18px] shrink-0 text-[#80848e]" />
                                <span className="truncate">{ch.name}</span>
                              </button>
                              {inVoice.length > 0 && (
                                <ul className="mb-1 ml-9 mt-0.5 space-y-0.5" aria-label={`${inVoice.length} connected to ${ch.name}`}>
                                  {inVoice.map((id) => (
                                    <li key={id} className="flex items-center gap-2 py-px text-[13px] text-[#949ba4]">
                                      <Avatar id={id} size="xs" />
                                      <span className="truncate">{person(id)?.name}</span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="flex h-[52px] shrink-0 items-center gap-2 bg-[#232428] px-2">
              <Avatar id="farhan" size="md" />
              <div className="min-w-0 leading-tight">
                <div className="truncate text-[13px] font-semibold text-white">Farhan Akbar</div>
                <div className="truncate text-[11.5px] text-[#949ba4]">@farhan.akbar</div>
              </div>
            </div>
          </nav>

          {channel.voice ? <VoicePane cat={cat} channel={channel.name} /> : <ChatPane cat={cat} channel={channel.name} />}
          <MemberList cat={cat} />
        </div>
      </div>
    </Card>
  )
}
