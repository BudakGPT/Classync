import { ArrowDown, ArrowUp, BadgeCheck, BellRing, ChevronLeft, ChevronRight, ChevronsUpDown, Ellipsis, Trash2, UserPlus, UserRound } from 'lucide-react'
import { Avatar, Checkbox, IconButton, Menu, StatusBadge, type MenuItem } from '@/components/ui'
import { href, navigate } from '@/lib/router'
import type { Person } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useActions } from '@/store/actions'
import { useStore } from '@/store/store'
import type { Sort, SortKey } from './lib'
import { ClassCell, DiscordHandle, NewBadge, RoleCell, StatusDot, TaskIndicator } from './parts'

interface TableProps {
  rows: Person[]
  selected: string[]
  onSelect: (ids: string[], on: boolean) => void
  sort: Sort | null
  onSort: (k: SortKey) => void
  onOpen: (id: string) => void
  onRemove: (ids: string[]) => void
}

export function StudentTable({ rows, selected, onSelect, sort, onSort, onOpen, onRemove }: TableProps) {
  const ids = rows.map((r) => r.id)
  const onPage = ids.filter((id) => selected.includes(id)).length
  const all = rows.length > 0 && onPage === rows.length

  return (
    <>
      {/* ≥ md: data table */}
      <div className="scrollbar-thin hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1080px] table-fixed text-left">
          <colgroup>
            <col className="w-11" /><col className="w-[25%]" /><col className="w-[110px]" /><col className="w-[92px]" /><col className="w-[150px]" />
            <col className="w-[128px]" /><col className="w-[13%]" /><col className="w-[96px]" /><col className="w-[88px]" /><col className="w-12" />
          </colgroup>
          <thead>
            <tr className="border-b border-line bg-canvas/70 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
              <th className="py-2.5 pl-4 pr-1">
                <Checkbox aria-label="Select all rows on this page" checked={all} indeterminate={onPage > 0 && !all} onChange={() => onSelect(ids, !all)} />
              </th>
              <SortTh label="Student" k="name" sort={sort} onSort={onSort} />
              <SortTh label="Student ID" k="npm" sort={sort} onSort={onSort} />
              <SortTh label="Class" k="class" sort={sort} onSort={onSort} />
              <th className="px-3 py-2.5 font-semibold">Role</th>
              <th className="px-3 py-2.5 font-semibold">Verification</th>
              <th className="px-3 py-2.5 font-semibold">Discord</th>
              <th className="px-3 py-2.5 font-semibold">Tasks</th>
              <th className="px-3 py-2.5 font-semibold">Status</th>
              <th className="px-2 py-2.5"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => {
              const on = selected.includes(p.id)
              return (
                <tr
                  key={p.id} onClick={() => onOpen(p.id)} style={{ animationDelay: `${Math.min(i, 8) * 25}ms` }}
                  className={cn(
                    'group cursor-pointer border-b border-line transition-colors duration-150 last:border-0 animate-fade-in',
                    on ? 'bg-brand-50/70 hover:bg-brand-50' : p.isNew ? 'bg-brand-50/35 hover:bg-subtle/70' : 'hover:bg-subtle/60',
                  )}
                >
                  <td className="py-2.5 pl-4 pr-1" onClick={(e) => e.stopPropagation()}>
                    <Checkbox aria-label={`Select ${p.name}`} checked={on} onChange={(v) => onSelect([p.id], v)} />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className={cn('rounded-full', p.isNew && 'animate-highlight')}><Avatar id={p.id} size="md" presence /></span>
                      <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <a href={href(`/students/${p.id}`)} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onOpen(p.id) }} className="truncate text-[13.5px] font-semibold text-ink hover:text-brand-700">{p.name}</a>
                          {p.isNew && <NewBadge />}
                        </div>
                        <div className="truncate text-xs text-ink-3">{p.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-[13px] font-medium text-ink-2 tabular">{p.npm}</td>
                  <td className="px-3 py-2.5"><ClassCell p={p} /></td>
                  <td className="px-3 py-2.5"><RoleCell p={p} /></td>
                  <td className="px-3 py-2.5"><StatusBadge status={p.verification} /></td>
                  <td className="px-3 py-2.5"><DiscordHandle p={p} className="max-w-full" /></td>
                  <td className="px-3 py-2.5"><TaskIndicator p={p} /></td>
                  <td className="px-3 py-2.5"><StatusDot status={p.status} /></td>
                  <td className="py-2.5 pl-1 pr-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <RowMenu p={p} onRemove={onRemove} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* < md: card list */}
      <ul className="divide-y divide-line md:hidden">
        {rows.map((p) => (
          <li key={p.id} onClick={() => onOpen(p.id)} className={cn('flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-subtle/60', selected.includes(p.id) && 'bg-brand-50/70')}>
            <span className="pt-2" onClick={(e) => e.stopPropagation()}>
              <Checkbox aria-label={`Select ${p.name}`} checked={selected.includes(p.id)} onChange={(v) => onSelect([p.id], v)} />
            </span>
            <span className={cn('rounded-full', p.isNew && 'animate-highlight')}><Avatar id={p.id} size="lg" presence /></span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-[14px] font-semibold text-ink">{p.name}</span>
                {p.isNew && <NewBadge />}
              </div>
              <div className="truncate text-xs text-ink-3">{p.npm} · {p.email}</div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <ClassCell p={p} />
                <StatusBadge status={p.verification} size="xs" />
                <DiscordHandle p={p} />
              </div>
            </div>
            <span onClick={(e) => e.stopPropagation()}><RowMenu p={p} onRemove={onRemove} /></span>
          </li>
        ))}
      </ul>
    </>
  )
}

function SortTh({ label, k, sort, onSort }: { label: string; k: SortKey; sort: Sort | null; onSort: (k: SortKey) => void }) {
  const active = sort?.key === k
  const Icon = !active ? ChevronsUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown
  return (
    <th className="px-3 py-2.5 font-semibold" aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <button type="button" onClick={() => onSort(k)} className={cn('-mx-1 inline-flex items-center gap-1 rounded-md px-1 py-0.5 uppercase tracking-wider transition hover:bg-subtle hover:text-ink', active && 'text-brand-700')}>
        {label}<Icon className={cn('size-3.5', !active && 'opacity-50')} />
      </button>
    </th>
  )
}

function RowMenu({ p, onRemove }: { p: Person; onRemove: (ids: string[]) => void }) {
  const { openModal, toast } = useStore()
  const actions = useActions()
  const first = p.name.split(' ')[0]
  const items: MenuItem[] = [
    { label: 'View profile', icon: UserRound, onSelect: () => navigate(`/students/${p.id}`) },
    { label: 'Send notification', icon: BellRing, onSelect: () => openModal({ type: 'createNotification', prefill: { audience: { type: 'students', classIds: [], groupIds: [], studentIds: [p.id] } } }) },
    { label: 'Add to group', icon: UserPlus, onSelect: () => openModal({ type: 'createGroup', prefill: { memberIds: [p.id], classId: p.classId } }) },
    ...(p.verification === 'Pending' ? [{
      label: 'Verify manually', icon: BadgeCheck, description: 'Match NPM & assign class role',
      onSelect: () => {
        actions.verifyStudent(p.id)
        toast({ title: `${first} is now verified`, description: `@Class-${p.classId} role assigned in Fasilkom Academic Hub`, tone: 'success' })
      },
    }] : []),
    { label: 'Remove', icon: Trash2, danger: true, divider: true, onSelect: () => onRemove([p.id]) },
  ]
  return <Menu label={first} width={230} items={items} trigger={<IconButton icon={Ellipsis} label={`Actions for ${p.name}`} size="sm" tooltip={false} />} />
}

export function Pagination({ page, pages, total, pageSize, onPage }: { page: number; pages: number; total: number; pageSize: number; onPage: (p: number) => void }) {
  if (!total) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)
  // 1 … 4 5 6 … 9
  const nums = [...new Set([1, page - 1, page, page + 1, pages])].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b)
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
      <p className="text-[12.5px] text-ink-3">Showing <b className="font-semibold text-ink tabular">{from}–{to}</b> of <b className="font-semibold text-ink tabular">{total}</b></p>
      <nav className="flex items-center gap-1" aria-label="Pagination">
        <IconButton icon={ChevronLeft} label="Previous page" size="sm" variant="ghost" disabled={page === 1} onClick={() => onPage(page - 1)} />
        {nums.map((n, i) => (
          <span key={n} className="flex items-center gap-1">
            {i > 0 && n - nums[i - 1] > 1 && <span className="px-1 text-xs text-ink-3">…</span>}
            <button
              type="button" onClick={() => onPage(n)} aria-current={n === page ? 'page' : undefined}
              className={cn('grid h-8 min-w-8 place-items-center rounded-lg px-2 text-[13px] font-semibold transition tabular', n === page ? 'bg-brand-600 text-white shadow-card' : 'text-ink-2 hover:bg-subtle hover:text-ink')}
            >{n}</button>
          </span>
        ))}
        <IconButton icon={ChevronRight} label="Next page" size="sm" variant="ghost" disabled={page === pages} onClick={() => onPage(page + 1)} />
      </nav>
    </div>
  )
}
