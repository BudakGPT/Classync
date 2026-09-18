import { Fragment, useState } from 'react'
import {
  Bell, BellPlus, BookPlus, CalendarPlus, CheckCheck, ChevronRight, ClipboardPlus, FileSpreadsheet, LogOut, Menu as MenuIcon, Plus, Search,
  Settings, UserPlus, UserRound, UsersRound,
} from 'lucide-react'
import { ALL_NAV } from '@/app/nav'
import { Avatar, Button, IconButton, Kbd, Menu, Popover } from '@/components/ui'
import { href, navigate, useRoute } from '@/lib/router'
import { shortName } from '@/lib/selectors'
import { relTime } from '@/lib/time'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent)

function useCrumbs() {
  const { segments } = useRoute()
  const { data, person } = useStore()
  const [section, id] = segments
  const nav = ALL_NAV.find((n) => n.key === (section ?? ''))
  const crumbs: { label: string; path?: string }[] = [{ label: 'Fasilkom', path: '/' }, { label: nav?.label ?? 'Not found', path: nav?.path }]
  if (id) {
    const detail =
      section === 'classes' ? data.classes.find((c) => c.id === id)?.name
        : section === 'students' ? person(id)?.name
          : section === 'groups' ? data.groups.find((g) => g.id === id)?.name
            : section === 'assignments' ? data.assignments.find((a) => a.id === id)?.title
              : id.charAt(0).toUpperCase() + id.slice(1)
    crumbs.push({ label: detail ?? id })
  }
  return crumbs
}

export function TopNav({ onOpenMobile }: { onOpenMobile: () => void }) {
  const { data, me, setPaletteOpen, openModal, toast } = useStore()
  const crumbs = useCrumbs()

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-line bg-canvas/85 px-4 backdrop-blur-md md:gap-3 md:px-6 lg:px-8">
      <IconButton icon={MenuIcon} label="Open navigation" onClick={onOpenMobile} className="md:hidden" tooltip={false} />

      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex min-w-0 items-center gap-1.5 text-[13px]">
          {crumbs.map((c, i) => {
            const last = i === crumbs.length - 1
            return (
              <Fragment key={i}>
                {i > 0 && <ChevronRight className="size-3.5 shrink-0 text-ink-3/60" aria-hidden />}
                <li className={cn('min-w-0', i === 0 && 'hidden sm:block')}>
                  {last || !c.path
                    ? <span aria-current={last ? 'page' : undefined} className={cn('block truncate', last ? 'text-[14px] font-bold text-ink' : 'text-ink-3')}>{c.label}</span>
                    : <a href={href(c.path)} className="block truncate font-medium text-ink-3 transition hover:text-ink">{c.label}</a>}
                </li>
              </Fragment>
            )
          })}
        </ol>
      </nav>

      <button
        type="button" onClick={() => setPaletteOpen(true)}
        className="hidden h-9 w-[300px] items-center gap-2 rounded-xl border border-line bg-surface px-3 text-[13px] text-ink-3 shadow-card transition hover:border-line-strong hover:text-ink-2 lg:flex xl:w-[360px]"
      >
        <Search className="size-4" />
        <span className="flex-1 truncate text-left">Search students, classes, groups, tasks...</span>
        <span className="flex gap-0.5"><Kbd>{isMac ? '⌘' : 'Ctrl'}</Kbd><Kbd>K</Kbd></span>
      </button>
      <IconButton icon={Search} label="Search" onClick={() => setPaletteOpen(true)} className="lg:hidden" />



      <Inbox />

      <Menu
        label="Quick create" width={236}
        trigger={<Button variant="primary" icon={Plus} className="max-sm:px-2.5"><span className="max-sm:hidden">Create</span></Button>}
        items={[
          { label: 'New Notification', icon: BellPlus, onSelect: () => openModal({ type: 'createNotification' }) },
          { label: 'New Assignment', icon: ClipboardPlus, onSelect: () => openModal({ type: 'createAssignment' }) },
          { label: 'New Class', icon: BookPlus, onSelect: () => openModal({ type: 'createClass' }) },
          { label: 'New Group', icon: UsersRound, onSelect: () => openModal({ type: 'createGroup' }) },
          { label: 'Add Student', icon: UserPlus, onSelect: () => openModal({ type: 'addStudent' }) },
          { label: 'Schedule Event', icon: CalendarPlus, onSelect: () => openModal({ type: 'createEvent' }) },
          { label: 'Import spreadsheet', icon: FileSpreadsheet, divider: true, onSelect: () => openModal({ type: 'importStudents' }) },
        ]}
      />

      <Menu
        width={232}
        trigger={<button type="button" aria-label="Account menu" className="hidden rounded-full transition hover:ring-4 hover:ring-brand-100 sm:block"><Avatar id={me.id} size="md" presence /></button>}
        items={[
          { label: me.name, description: `${me.role} · Admin`, icon: UserRound, onSelect: () => navigate(`/students/${me.id}`) },
          { label: 'Settings', icon: Settings, onSelect: () => navigate('/settings') },
          { label: 'Sign out', icon: LogOut, divider: true, onSelect: () => toast({ title: 'Demo workspace', description: 'Authentication is mocked in this preview.', tone: 'info' }) },
        ]}
      />
    </header>
  )
}

function Inbox() {
  const { data, person } = useStore()
  const [readAt, setReadAt] = useState(3) // first N items unread
  const items = data.activities.filter((a) => a.actorId !== 'farhan').slice(0, 7)
  const unread = Math.min(readAt, items.length)
  return (
    <Popover
      width={380}
      trigger={
        <IconButton
          icon={Bell} label="Notifications" variant="ghost" tooltip={false}
          badge={unread > 0 && <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-4 text-white ring-2 ring-canvas">{unread}</span>}
        />
      }
    >
      {(close) => (
        <div>
          <div className="flex items-center justify-between px-3 pb-2 pt-2.5">
            <span className="text-sm font-bold text-ink">Inbox</span>
            <button type="button" onClick={() => setReadAt(0)} className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold text-brand-600 transition hover:bg-brand-50">
              <CheckCheck className="size-3.5" />Mark all read
            </button>
          </div>
          <ul className="scrollbar-thin max-h-[380px] overflow-y-auto">
            {items.map((a, i) => (
              <li key={a.id}>
                <button type="button" onClick={() => { close(); navigate('/activity') }} className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-subtle">
                  <Avatar id={a.actorId} size="md" />
                  <span className="min-w-0 flex-1 text-[13px] leading-snug text-ink-2">
                    <span className="font-semibold text-ink">{a.actorId === 'classync' ? 'Classync' : shortName(person(a.actorId))}</span> {a.action}{' '}
                    {a.target && <span className="font-semibold text-ink">{a.target}</span>}
                    <span className="mt-0.5 block text-[11.5px] text-ink-3">{relTime(a.at)}</span>
                  </span>
                  {i < unread && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-500" aria-label="Unread" />}
                </button>
              </li>
            ))}
          </ul>
          <div className="border-t border-line p-1.5">
            <button type="button" onClick={() => { close(); navigate('/activity') }} className="w-full rounded-lg py-2 text-center text-[13px] font-semibold text-ink-2 transition hover:bg-subtle hover:text-ink">
              Open activity log
            </button>
          </div>
        </div>
      )}
    </Popover>
  )
}
