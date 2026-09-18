import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Mail, MessageCircle, Upload, UserPlus, Users } from 'lucide-react'
import {
  Avatar, Badge, Button, Card, DiscordGlyph, EmptyState, IconButton, PersonLine, SearchInput, Segmented, Select, StatusBadge,
} from '@/components/ui'
import { navigate, useRoute } from '@/lib/router'
import type { Person, Verification } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'
import { byPresence, type TabProps } from './lib'
import { Eyebrow } from './parts'

type Filter = 'all' | Verification
type Sort = 'presence' | 'name' | 'npm'
const FILTERS: Filter[] = ['all', 'Verified', 'Pending', 'Not Connected']
const PAGE = 10
const SORTS: Record<Sort, (a: Person, b: Person) => number> = {
  presence: byPresence,
  name: (a, b) => a.name.localeCompare(b.name),
  npm: (a, b) => a.npm.localeCompare(b.npm),
}

function StaffCard({ id, i }: { id: string; i: number }) {
  const { person, me, toast } = useStore()
  const p = person(id)
  if (!p) return null
  const lecturer = p.role === 'Lecturer'
  return (
    <Card className="flex items-center gap-3.5 p-4 animate-rise-in" style={{ animationDelay: `${i * 50}ms` }}>
      <Avatar id={id} size="xl" presence pulse />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[14px] font-bold text-ink">{p.name}</span>
          {p.id === me.id && <Badge size="xs" tone="slate">You</Badge>}
        </div>
        <Badge size="xs" tone={lecturer ? 'violet' : 'sky'} className="mt-1">{lecturer ? 'Lecturer' : 'Teaching Assistant'}</Badge>
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-3">
          <DiscordGlyph className="size-3 shrink-0 text-discord" /><span className="truncate">@{p.discord} · {p.presence}</span>
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <IconButton icon={Mail} label={`Email ${p.name}`} size="sm" onClick={() => toast({ title: 'Email draft opened', description: `To: ${p.email}`, tone: 'info' })} />
        {p.id !== me.id && (
          <IconButton icon={MessageCircle} label={`Message @${p.discord} on Discord`} size="sm" onClick={() => toast({ title: `DM to @${p.discord}`, description: 'Opening a Discord direct message…', tone: 'discord' })} />
        )}
      </div>
    </Card>
  )
}

export function MembersTab({ cls, s }: TabProps) {
  const { openModal } = useStore()
  const { params } = useRoute()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<Filter>(() => FILTERS.find((f) => f === params.get('status')) ?? 'all')
  const [sort, setSort] = useState<Sort>('presence')
  const [page, setPage] = useState(0)
  const task = s.upcoming[0] ?? s.assignments[s.assignments.length - 1]

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return s.roster
      .filter((p) => (filter === 'all' || p.verification === filter) && (!needle || `${p.name} ${p.npm} ${p.discord ?? ''} ${p.email}`.toLowerCase().includes(needle)))
      .sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew) || SORTS[sort](a, b))
  }, [s.roster, q, filter, sort])

  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const current = Math.min(page, pages - 1)
  const shown = rows.slice(current * PAGE, (current + 1) * PAGE)
  const count = (f: Filter) => (f === 'all' ? s.roster.length : s.roster.filter((p) => p.verification === f).length)
  const pickFilter = (f: Filter) => { setFilter(f); setPage(0) }
  const addStudent = () => openModal({ type: 'addStudent', classId: cls.id })
  const open = (id: string) => navigate(`/students/${id}`)

  return (
    <div className="space-y-5">
      <section>
        <Eyebrow className="mb-2.5">Teaching team</Eyebrow>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {[cls.lecturerId, ...cls.taIds].map((id, i) => <StaffCard key={id} id={id} i={i} />)}
        </div>
      </section>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
          <div className="mr-auto min-w-0">
            <h3 className="text-[15px] font-bold tracking-tight text-ink">Students</h3>
            <p className="text-xs text-ink-3 tabular">{s.verified} of {s.roster.length} verified on Discord · select a student to open their profile</p>
          </div>
          <Button variant="secondary" size="sm" icon={Upload} onClick={() => openModal({ type: 'importStudents' })}>Import</Button>
          <Button variant="soft" size="sm" icon={UserPlus} onClick={addStudent}>Add student</Button>
        </div>

        {s.roster.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 px-5 py-3">
            <div className="w-full sm:w-64">
              <SearchInput value={q} onChange={(v) => { setQ(v); setPage(0) }} placeholder="Search name, NPM or Discord…" aria-label="Search students" />
            </div>
            <Segmented
              size="sm" aria-label="Verification filter" value={filter} onChange={pickFilter}
              options={FILTERS.map((f) => ({ value: f, label: <>{f === 'all' ? 'All' : f}<span className="ml-0.5 font-medium text-ink-3 tabular">{count(f)}</span></> }))}
            />
            <div className="w-40 sm:ml-auto">
              <Select aria-label="Sort students" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-9 text-[13px]">
                <option value="presence">Online first</option>
                <option value="name">Name A–Z</option>
                <option value="npm">NPM</option>
              </Select>
            </div>
          </div>
        )}

        {shown.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] text-left text-[13px]">
                <thead>
                  <tr className="border-y border-line bg-canvas/70 text-[11px] uppercase tracking-wider text-ink-3">
                    <th scope="col" className="px-5 py-2.5 font-semibold">Student</th>
                    <th scope="col" className="px-3 py-2.5 font-semibold">NPM</th>
                    <th scope="col" className="px-3 py-2.5 font-semibold">Verification</th>
                    <th scope="col" className="px-3 py-2.5 font-semibold">Discord</th>
                    <th scope="col" className="px-3 py-2 font-semibold">
                      Current task
                      {task && <span className="block max-w-[190px] truncate text-[11px] font-medium normal-case tracking-normal text-ink-3/80">{task.title}</span>}
                    </th>
                    <th scope="col" className="w-10"><span className="sr-only">Open</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {shown.map((p) => (
                    <tr
                      key={p.id} tabIndex={0} onClick={() => open(p.id)} onKeyDown={(e) => e.key === 'Enter' && open(p.id)} aria-label={`Open ${p.name}`}
                      className={cn('group cursor-pointer transition-colors hover:bg-subtle/60 focus-visible:bg-brand-50/60', p.isNew && 'animate-highlight')}
                    >
                      <td className="max-w-[300px] px-5 py-2.5">
                        <PersonLine id={p.id} presence subtitle={p.email} trailing={p.isNew ? <Badge tone="brand" size="xs">New</Badge> : undefined} />
                      </td>
                      <td className="px-3 py-2.5 text-ink-2 tabular">{p.npm}</td>
                      <td className="px-3 py-2.5"><StatusBadge status={p.verification} size="xs" /></td>
                      <td className="px-3 py-2.5">
                        {p.discord
                          ? <span className="inline-flex items-center gap-1.5 font-medium text-ink-2"><DiscordGlyph className="size-3.5 text-discord" />{p.discord}</span>
                          : <span className="text-ink-3">Not linked</span>}
                      </td>
                      <td className="px-3 py-2.5">{task?.progress[p.id] ? <StatusBadge status={task.progress[p.id]} size="xs" /> : <span className="text-ink-3">—</span>}</td>
                      <td className="pr-4"><ChevronRight className="size-4 text-ink-3 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3 text-xs text-ink-3">
              <span className="tabular">Showing {current * PAGE + 1}–{Math.min(rows.length, (current + 1) * PAGE)} of {rows.length} students</span>
              <nav aria-label="Pagination" className="flex items-center gap-1">
                <IconButton icon={ChevronLeft} label="Previous page" size="sm" disabled={current === 0} onClick={() => setPage(current - 1)} />
                {Array.from({ length: pages }, (_, i) => (
                  <button
                    key={i} type="button" aria-current={i === current ? 'page' : undefined} onClick={() => setPage(i)}
                    className={cn('grid size-8 place-items-center rounded-lg text-[13px] font-semibold tabular transition', i === current ? 'bg-ink text-white' : 'text-ink-2 hover:bg-subtle')}
                  >{i + 1}</button>
                ))}
                <IconButton icon={ChevronRight} label="Next page" size="sm" disabled={current >= pages - 1} onClick={() => setPage(current + 1)} />
              </nav>
            </div>
          </>
        ) : s.roster.length ? (
          <EmptyState
            compact icon={Users} title="No students match" description="Try another name, NPM or verification filter."
            action={{ label: 'Clear filters', onClick: () => { setQ(''); pickFilter('all') } }}
          />
        ) : (
          <EmptyState
            icon={Users} tone={cls.tone} title={`No students in ${cls.name} yet`}
            description="Import the roster spreadsheet or add students one by one — they get the class role once verified on Discord."
            action={{ label: 'Add student', icon: UserPlus, onClick: addStudent }}
          />
        )}
      </Card>
    </div>
  )
}
