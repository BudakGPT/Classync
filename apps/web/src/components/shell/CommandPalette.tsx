import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowRight, BellPlus, CalendarPlus, ClipboardList, ClipboardPlus, CornerDownLeft, FileSpreadsheet, Search, UserPlus, Users, UsersRound,
  type LucideIcon,
} from 'lucide-react'
import { ALL_NAV } from '@/app/nav'
import { Avatar, IconTile, Kbd } from '@/components/ui'
import { navigate } from '@/lib/router'
import type { AppData, ModalSpec } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'

interface Cmd {
  id: string
  group: 'Actions' | 'Navigate' | 'Classes' | 'People' | 'Groups' | 'Assignments'
  label: string
  hint?: string
  icon?: LucideIcon | React.ComponentType<{ className?: string }>
  avatarId?: string
  keywords?: string
  run: () => void
}

function buildCommands(data: AppData, openModal: (m: ModalSpec) => void): Cmd[] {
  const cmds: Cmd[] = [
    { id: 'a-notif', group: 'Actions', label: 'Create Notification', hint: 'Announcement, reminder, lecture', icon: BellPlus, keywords: 'schedule announce reminder', run: () => openModal({ type: 'createNotification' }) },
    { id: 'a-group', group: 'Actions', label: 'Create Group', hint: 'FGD, project, research', icon: UsersRound, keywords: 'fgd team', run: () => openModal({ type: 'createGroup' }) },
    { id: 'a-student', group: 'Actions', label: 'Add Student', icon: UserPlus, keywords: 'new member', run: () => openModal({ type: 'addStudent' }) },
    { id: 'a-import', group: 'Actions', label: 'Import Students', hint: 'XLSX, CSV, Google Sheets', icon: FileSpreadsheet, keywords: 'spreadsheet upload roster', run: () => openModal({ type: 'importStudents' }) },
    { id: 'a-event', group: 'Actions', label: 'Schedule Event', icon: CalendarPlus, keywords: 'calendar lecture quiz', run: () => openModal({ type: 'createEvent' }) },
    { id: 'a-assign', group: 'Actions', label: 'New Assignment', icon: ClipboardPlus, keywords: 'task checklist', run: () => openModal({ type: 'createAssignment' }) },
    ...ALL_NAV.map((n): Cmd => ({ id: `nav-${n.key}`, group: 'Navigate', label: `Open ${n.label}`, icon: n.icon, run: () => navigate(n.path) })),
    ...data.classes.map((c): Cmd => ({ id: `cls-${c.id}`, group: 'Classes', label: `Open ${c.name}`, hint: c.subject, icon: ArrowRight, keywords: c.subject, run: () => navigate(`/classes/${c.id}`) })),
    ...data.people.map((p): Cmd => ({
      id: `p-${p.id}`, group: 'People', label: p.name, avatarId: p.id, keywords: `${p.npm} ${p.discord ?? ''} ${p.email}`,
      hint: p.role === 'Student' ? `Student · Class ${p.classId}` : p.role, run: () => navigate(`/students/${p.id}`),
    })),
    ...data.groups.map((g): Cmd => ({ id: `g-${g.id}`, group: 'Groups', label: g.name, hint: `${g.type} · ${g.memberIds.length} members`, icon: Users, run: () => navigate(`/groups/${g.id}`) })),
    ...data.assignments.map((a): Cmd => ({ id: `as-${a.id}`, group: 'Assignments', label: a.title, hint: `Class ${a.classId}`, icon: ClipboardList, run: () => navigate(`/assignments/${a.id}`) })),
  ]
  return cmds
}

const GROUP_ORDER: Cmd['group'][] = ['Actions', 'Navigate', 'Classes', 'People', 'Groups', 'Assignments']
const SUGGESTED = ['a-notif', 'a-group', 'a-student', 'cls-B', 'nav-calendar', 'a-import', 'p-haekal']

export function CommandPalette() {
  const { paletteOpen: open, setPaletteOpen, data, openModal } = useStore()
  const [q, setQ] = useState('')
  const [active, setActive] = useState(0)
  const list = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen(!open) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setPaletteOpen])

  useEffect(() => { if (!open) { setQ(''); setActive(0) } }, [open])

  const commands = useMemo(() => buildCommands(data, openModal), [data, openModal])
  const results = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return SUGGESTED.map((id) => commands.find((c) => c.id === id)!).filter(Boolean).map((c) => ({ ...c, group: 'Actions' as const }))
    const scored = commands
      .map((c) => {
        const label = c.label.toLowerCase()
        const s = label.startsWith(term) ? 3 : label.split(' ').some((w) => w.startsWith(term)) ? 2 : label.includes(term) ? 1 : `${c.hint ?? ''} ${c.keywords ?? ''}`.toLowerCase().includes(term) ? 0.5 : 0
        return { c, s }
      })
      .filter((x) => x.s > 0)
    return GROUP_ORDER.flatMap((g) => scored.filter((x) => x.c.group === g).sort((a, b) => b.s - a.s).slice(0, g === 'People' ? 6 : 5).map((x) => x.c))
  }, [q, commands])

  useEffect(() => { setActive(0) }, [q])
  useEffect(() => { list.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' }) }, [active])

  if (!open) return null
  const close = () => setPaletteOpen(false)
  const run = (c?: Cmd) => { if (!c) return; close(); c.run() }

  let lastGroup = ''
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px] animate-fade-in" onClick={close} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label="Command palette" className="relative mx-auto mt-[11vh] w-[calc(100%-2rem)] max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-pop animate-scale-in">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="size-[18px] text-ink-3" />
          <input
            autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students, classes, groups, tasks..."
            role="combobox" aria-expanded aria-controls="palette-list" aria-activedescendant={results[active] ? `cmd-${results[active].id}` : undefined}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % Math.max(1, results.length)) }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a - 1 + results.length) % Math.max(1, results.length)) }
              else if (e.key === 'Enter') { e.preventDefault(); run(results[active]) }
              else if (e.key === 'Escape') { e.preventDefault(); close() }
            }}
            className="h-14 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-3"
          />
          <Kbd>Esc</Kbd>
        </div>
        <div ref={list} id="palette-list" role="listbox" className="scrollbar-thin max-h-[min(60vh,440px)] overflow-y-auto p-2">
          {!results.length && <div className="px-3 py-10 text-center text-[13px] text-ink-3">No results for “{q}”. Try a student name, class or group.</div>}
          {results.map((c, i) => {
            const heading = !q ? (i === 0 ? 'Suggested' : '') : c.group !== lastGroup ? c.group : ''
            lastGroup = c.group
            const Icon = c.icon
            return (
              <div key={c.id}>
                {heading && <div className="px-2.5 pb-1 pt-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-3">{heading}</div>}
                <button
                  id={`cmd-${c.id}`} type="button" role="option" aria-selected={i === active} data-active={i === active}
                  onMouseMove={() => setActive(i)} onClick={() => run(c)}
                  className={cn('flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors', i === active ? 'bg-brand-50' : 'hover:bg-subtle')}
                >
                  {c.avatarId ? <Avatar id={c.avatarId} size="sm" /> : Icon && <IconTile icon={Icon as LucideIcon} tone={i === active ? 'brand' : 'slate'} size="sm" />}
                  <span className={cn('min-w-0 flex-1 truncate text-[13.5px] font-semibold', i === active ? 'text-brand-800' : 'text-ink')}>
                    {c.group === 'People' && q ? <><span className="font-normal text-ink-3">Search </span>{c.label}</> : c.label}
                  </span>
                  {c.hint && <span className="truncate text-xs text-ink-3">{c.hint}</span>}
                  {i === active && <CornerDownLeft className="size-3.5 shrink-0 text-brand-600" />}
                </button>
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-4 border-t border-line bg-canvas/60 px-4 py-2.5 text-[11.5px] text-ink-3">
          <span className="flex items-center gap-1"><Kbd>↑</Kbd><Kbd>↓</Kbd> navigate</span>
          <span className="flex items-center gap-1"><Kbd>↵</Kbd> select</span>
          <span className="flex items-center gap-1"><Kbd>Esc</Kbd> close</span>
        </div>
      </div>
    </div>,
    document.body,
  )
}
