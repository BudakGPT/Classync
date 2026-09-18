import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  ArrowDown, ArrowUp, FolderKanban, Hash, Info, LayoutTemplate, MessagesSquare, PencilLine, Plus, Presentation, School, Volume2, X, type LucideIcon,
} from 'lucide-react'
import { AvatarStack, Badge, Button, Card, CardHeader, IconButton, IconTile, Segmented } from '@/components/ui'
import type { ChannelTemplate, GroupType, Tone } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'

const META: Record<string, { icon: LucideIcon; tone: Tone; group?: GroupType }> = {
  class: { icon: School, tone: 'brand' },
  fgd: { icon: MessagesSquare, tone: 'teal', group: 'FGD' },
  project: { icon: FolderKanban, tone: 'orange', group: 'Project' },
  presentation: { icon: Presentation, tone: 'violet', group: 'Presentation' },
}

/** Discord-style channel names: lowercase, hyphens, no symbols. */
const channelName = (v: string) => v.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').slice(0, 32)

type Kind = 'text' | 'voice'
const problems = (t: ChannelTemplate) => {
  const all = [...t.text, ...t.voice]
  return all.some((n) => !n.trim()) ? 'Channel names can’t be empty' : new Set(all).size !== all.length ? 'Channel names must be unique' : null
}

export function TemplatesSection({ draft, setDraft, flash }: {
  draft: ChannelTemplate[] | null
  setDraft: (fn: (d: ChannelTemplate[] | null) => ChannelTemplate[] | null) => void
  flash: number
}) {
  const { data, update, toast, log, me } = useStore()
  const saved = data.discord.templates
  const editing = draft !== null
  const templates = draft ?? saved
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (flash) root.current?.querySelector<HTMLInputElement>('input[aria-label^="Rename"]')?.focus({ preventScroll: true })
  }, [flash])

  const changed = editing ? draft.filter((t) => JSON.stringify(t) !== JSON.stringify(saved.find((s) => s.id === t.id))) : []
  const invalid = editing && draft.some((t) => problems(t))
  const patch = (id: string, kind: Kind, fn: (list: string[]) => string[]) =>
    setDraft((ts) => ts && ts.map((t) => (t.id === id ? { ...t, [kind]: fn(t[kind]) } : t)))

  const save = () => {
    if (!draft || invalid) return
    update('discord', (d) => ({ ...d, templates: draft }))
    log({ actorId: me.id, action: 'updated channel templates', target: changed.map((t) => t.name).join(', '), detail: 'Applies to newly connected classes and new groups', type: 'discord' })
    toast({ title: 'Template updated', description: `${changed.map((t) => t.name).join(', ')} saved · used for new classes and groups`, tone: 'success' })
    setDraft(() => null)
  }

  const usage = (t: ChannelTemplate) => {
    const m = META[t.id]
    if (t.id === 'class') {
      const cs = data.classes.filter((c) => c.discord.connected)
      return { label: `${cs.length} classes`, ids: [...new Set(cs.flatMap((c) => [c.lecturerId, ...c.taIds]))] }
    }
    const gs = data.groups.filter((g) => g.status === 'Active' && m?.group && g.type === m.group)
    return { label: `${gs.length} ${gs.length === 1 ? 'group' : 'groups'}`, ids: [...new Set(gs.flatMap((g) => g.memberIds))] }
  }

  return (
    <Card className="relative h-full" >
      <span key={flash} className={cn('pointer-events-none absolute inset-0 rounded-2xl', flash > 0 && 'animate-highlight')} aria-hidden />
      <CardHeader
        icon={LayoutTemplate} tone="violet"
        title="Channel templates"
        subtitle="What Classync creates when a class connects or a group is formed"
        action={editing ? <>
          {changed.length > 0 && <Badge tone="amber" dot className="hidden sm:inline-flex">Unsaved changes</Badge>}
          <Button variant="ghost" size="sm" onClick={() => setDraft(() => null)}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={save} disabled={invalid || !changed.length}>Save</Button>
        </> : <Button variant="secondary" size="sm" icon={PencilLine} onClick={() => setDraft(() => structuredClone(saved))}>Edit</Button>}
      />
      {editing && (
        <div className="mx-5 mt-4 flex items-start gap-2 rounded-xl bg-brand-50 px-3 py-2.5 text-[12.5px] text-brand-800 ring-1 ring-inset ring-brand-100 animate-rise-in">
          <Info className="mt-px size-4 shrink-0" />
          <span>Rename, reorder, add or remove channels. Changes apply to newly connected classes and new groups — existing channels stay untouched.</span>
        </div>
      )}
      <div ref={root} className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2">
        {templates.map((t, i) => {
          const m = META[t.id] ?? { icon: LayoutTemplate, tone: 'slate' as Tone }
          const u = usage(t)
          const err = editing ? problems(t) : null
          return (
            <div key={t.id} className={cn('flex flex-col rounded-xl border p-4 transition duration-200 animate-rise-in', editing ? 'border-brand-200 bg-surface shadow-card' : 'border-line bg-subtle/40 hover:border-line-strong hover:bg-surface')} style={{ animationDelay: `${i * 40}ms` }}>
              <div className="flex items-start gap-3">
                <IconTile icon={m.icon} tone={m.tone} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-[14px] font-bold text-ink">{t.name}</h4>
                    <Badge size="xs" tone="slate">{t.text.length + t.voice.length} channels</Badge>
                  </div>
                  <p className="truncate text-xs text-ink-3">{t.description}</p>
                </div>
              </div>

              <ul className="mt-3 space-y-1">
                {(['text', 'voice'] as Kind[]).flatMap((kind) => t[kind].map((name, idx) => (
                  <ChannelRow
                    key={`${kind}-${idx}`} name={name} index={idx} voice={kind === 'voice'} editing={editing}
                    first={idx === 0} last={idx === t[kind].length - 1}
                    onRename={(v) => patch(t.id, kind, (l) => l.map((x, j) => (j === idx ? channelName(v) : x)))}
                    onMove={(dir) => patch(t.id, kind, (l) => { const n = [...l]; [n[idx], n[idx + dir]] = [n[idx + dir], n[idx]]; return n })}
                    onRemove={() => patch(t.id, kind, (l) => l.filter((_, j) => j !== idx))}
                  />
                )))}
                {!t.text.length && !t.voice.length && <li className="rounded-lg border border-dashed border-line px-3 py-3 text-center text-xs text-ink-3">No channels — add one below</li>}
              </ul>

              {editing ? (
                <>
                  {err && <p role="alert" className="mt-2 text-xs font-medium text-rose-600">{err}</p>}
                  <AddChannel taken={[...t.text, ...t.voice]} onAdd={(kind, name) => patch(t.id, kind, (l) => [...l, name])} />
                </>
              ) : (
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3 text-xs text-ink-3" style={{ marginTop: 12 }}>
                  <span>Used by <span className="font-semibold text-ink-2">{u.label}</span></span>
                  {u.ids.length > 0 && <AvatarStack ids={u.ids} max={3} size="xs" />}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function ChannelRow({ name, index, voice, editing, first, last, onRename, onMove, onRemove }: {
  name: string; index: number; voice: boolean; editing: boolean; first: boolean; last: boolean
  onRename: (v: string) => void; onMove: (dir: -1 | 1) => void; onRemove: () => void
}) {
  const Icon = voice ? Volume2 : Hash
  if (!editing) return (
    <li className="flex items-center gap-2 rounded-lg px-2 py-1 text-[13px] font-medium text-ink-2">
      <Icon className="size-3.5 shrink-0 text-ink-3" strokeWidth={2.5} />
      <span className="truncate">{name}</span>
      {voice && <span className="ml-auto text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">Voice</span>}
    </li>
  )
  return (
    <li className="group flex items-center gap-1 animate-fade-in">
      <div className="relative min-w-0 flex-1">
        <Icon className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-ink-3" strokeWidth={2.5} />
        <input
          value={name} onChange={(e) => onRename(e.target.value)} aria-label={`Rename ${voice ? 'voice' : 'text'} channel ${index + 1}`}
          className={cn('h-8 w-full rounded-lg border bg-surface pl-7 pr-2 text-[13px] font-medium text-ink outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100',
            name ? 'border-line hover:border-line-strong' : 'border-rose-300 bg-rose-50/40')}
          placeholder="channel-name"
        />
      </div>
      <IconButton icon={ArrowUp} label="Move up" size="xs" onClick={() => onMove(-1)} disabled={first} />
      <IconButton icon={ArrowDown} label="Move down" size="xs" onClick={() => onMove(1)} disabled={last} />
      <IconButton icon={X} label={`Remove ${name || 'channel'}`} size="xs" onClick={onRemove} className="hover:bg-rose-50 hover:text-rose-600" />
    </li>
  )
}

function AddChannel({ taken, onAdd }: { taken: string[]; onAdd: (kind: Kind, name: string) => void }) {
  const [kind, setKind] = useState<Kind>('text')
  const [name, setName] = useState('')
  const dup = !!name && taken.includes(name)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name || dup) return
    onAdd(kind, name)
    setName('')
  }
  return (
    <form onSubmit={submit} className="mt-3 border-t border-dashed border-line pt-3">
      <div className="flex items-center gap-1.5">
        <Segmented size="sm" aria-label="Channel type" value={kind} onChange={setKind}
          options={[{ value: 'text', label: 'Text', icon: Hash }, { value: 'voice', label: 'Voice', icon: Volume2 }]} />
        <input
          value={name} onChange={(e) => setName(channelName(e.target.value))} aria-label="New channel name"
          placeholder={kind === 'voice' ? 'voice-room' : 'new-channel'}
          className={cn('h-8 min-w-0 flex-1 rounded-lg border bg-surface px-2.5 text-[13px] text-ink outline-none transition placeholder:text-ink-3 focus:border-brand-400 focus:ring-4 focus:ring-brand-100', dup ? 'border-rose-300' : 'border-line')}
        />
        <IconButton icon={Plus} label="Add channel" variant="soft" size="sm" type="submit" disabled={!name || dup} />
      </div>
      {dup && <p className="mt-1.5 text-xs font-medium text-rose-600">#{name} already exists in this template</p>}
    </form>
  )
}
