import { ChevronsUpDown, LogOut, PanelLeftClose, PanelLeftOpen, Settings, UserRound } from 'lucide-react'
import { NAV_LOWER, NAV_MAIN, type NavItem } from '@/app/nav'
import { Avatar, DiscordGlyph, IconButton, Logo, Menu, Tooltip } from '@/components/ui'
import { href, navigate, useRoute } from '@/lib/router'
import { openRequestCount } from '@/lib/selectors'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'

export function Sidebar({ collapsed, onToggle, mobileOpen, onCloseMobile }: {
  collapsed: boolean; onToggle: () => void; mobileOpen: boolean; onCloseMobile: () => void
}) {
  const { segments } = useRoute()
  const current = segments[0] ?? ''
  const { data, me, toast } = useStore()
  const c = collapsed && !mobileOpen
  const badges: Record<string, number> = {
    help: openRequestCount(data),
    notifications: data.notifications.filter((n) => n.status === 'Scheduled').length,
  }

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-ink/30 animate-fade-in md:hidden" onClick={onCloseMobile} aria-hidden />}
      <aside
        aria-label="Sidebar"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-dvh w-[272px] shrink-0 flex-col border-r border-line bg-surface transition-[width,transform] duration-200 ease-out md:sticky md:top-0 md:z-30',
          c ? 'md:w-[76px]' : 'md:w-[252px]',
          mobileOpen ? 'translate-x-0 shadow-pop' : '-translate-x-full md:translate-x-0',
        )}
      >
        <div className={cn('flex h-16 shrink-0 items-center', c ? 'justify-center' : 'justify-between pl-5 pr-3')}>
          <a href={href('/')} aria-label="Classync overview"><Logo collapsed={c} /></a>
          {!c && <IconButton icon={PanelLeftClose} label="Collapse sidebar" size="sm" onClick={mobileOpen ? onCloseMobile : onToggle} />}
        </div>

        {c ? (
          <div className="flex justify-center pb-2"><IconButton icon={PanelLeftOpen} label="Expand sidebar" size="sm" onClick={onToggle} /></div>
        ) : (
          <div className="px-3 pb-2">
            <Menu
              align="start" width={228} label="Academic term"
              trigger={
                <button type="button" className="flex w-full items-center gap-2.5 rounded-xl border border-line bg-canvas px-2.5 py-2 text-left transition hover:border-line-strong">
                  <span className="grid size-7 place-items-center rounded-lg bg-ink text-[11px] font-extrabold text-white">FK</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-bold text-ink">Fasilkom</span>
                    <span className="block truncate text-[11px] text-ink-3">{data.settings.term}</span>
                  </span>
                  <ChevronsUpDown className="size-3.5 text-ink-3" />
                </button>
              }
              items={[
                { label: 'Odd Semester 2026/2027', description: 'Current term · 4 classes', onSelect: () => {} },
                { label: 'Even Semester 2025/2026', description: 'Archived · read-only', onSelect: () => toast({ title: 'Archived term', description: 'Past terms are read-only in this preview.', tone: 'info' }) },
              ]}
            />
          </div>
        )}

        <nav aria-label="Main" className="scrollbar-thin flex-1 overflow-y-auto px-3 py-2">
          <ul className="space-y-0.5">
            {NAV_MAIN.map((item) => <li key={item.key}><NavLink item={item} active={current === item.key} collapsed={c} badge={badges[item.key]} /></li>)}
          </ul>
          <div className="mx-2 my-3 h-px bg-line" />
          <ul className="space-y-0.5">
            {NAV_LOWER.map((item) => <li key={item.key}><NavLink item={item} active={current === item.key} collapsed={c} /></li>)}
          </ul>
        </nav>

        <div className="shrink-0 border-t border-line p-3">
          {!c && (
            <a href={href('/discord')} className="mb-2 flex items-center gap-2.5 rounded-xl border border-line bg-canvas px-2.5 py-2 transition hover:border-line-strong">
              <span className="grid size-7 place-items-center rounded-lg bg-discord text-white"><DiscordGlyph className="size-4" /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-bold text-ink">{data.discord.server}</span>
                <span className="flex items-center gap-1.5 text-[11px] text-ink-3">
                  <span className="relative size-1.5"><span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping-soft" /><span className="absolute inset-0 rounded-full bg-emerald-500" /></span>
                  Bot online · {data.discord.members} members
                </span>
              </span>
            </a>
          )}
          <Menu
            align="start" width={232}
            trigger={
              <button type="button" aria-label="Account menu" className={cn('flex w-full items-center gap-2.5 rounded-xl p-1.5 text-left transition hover:bg-subtle', c && 'justify-center')}>
                <Avatar id={me.id} size="md" presence pulse />
                {!c && (
                  <>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-bold text-ink">{me.name}</span>
                      <span className="block truncate text-[11.5px] text-ink-3">{me.role} · Admin</span>
                    </span>
                    <ChevronsUpDown className="size-3.5 text-ink-3" />
                  </>
                )}
              </button>
            }
            items={[
              { label: 'View profile', icon: UserRound, onSelect: () => navigate(`/students/${me.id}`) },
              { label: 'Settings', icon: Settings, onSelect: () => navigate('/settings') },
              { label: 'Sign out', icon: LogOut, divider: true, onSelect: () => toast({ title: 'Demo workspace', description: 'Authentication is mocked in this preview.', tone: 'info' }) },
            ]}
          />
        </div>
      </aside>
    </>
  )
}

function NavLink({ item, active, collapsed, badge }: { item: NavItem; active: boolean; collapsed: boolean; badge?: number }) {
  const Icon = item.icon
  const link = (
    <a
      href={href(item.path)} aria-current={active ? 'page' : undefined} aria-label={collapsed ? item.label : undefined}
      className={cn(
        'group relative flex h-9 w-full items-center gap-3 rounded-xl text-[13.5px] font-semibold transition-colors duration-150',
        collapsed ? 'justify-center' : 'px-2.5',
        active ? 'bg-brand-50 text-brand-700' : 'text-ink-2 hover:bg-subtle hover:text-ink',
      )}
    >
      {active && <span className="absolute -left-3 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand-600" />}
      <Icon className={cn('size-[18px] shrink-0 transition-colors', active ? 'text-brand-600' : 'text-ink-3 group-hover:text-ink-2')} />
      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
      {!!badge && (collapsed
        ? <span className="absolute right-2 top-1.5 size-2 rounded-full bg-rose-500 ring-2 ring-white" />
        : <span className={cn('rounded-full px-1.5 py-px text-[11px] font-bold tabular', item.key === 'help' ? 'bg-rose-50 text-rose-600' : 'bg-subtle text-ink-3')}>{badge}</span>)}
    </a>
  )
  return collapsed ? <Tooltip content={item.label} side="right" className="flex w-full">{link}</Tooltip> : link
}
