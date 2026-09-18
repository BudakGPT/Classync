import { useState } from 'react'
import { BellOff, BellRing, ChevronDown, CircleCheck, SearchX, X } from 'lucide-react'
import {
  AvatarStack, Button, Card, Checkbox, EmptyState, IconButton, Menu, PersonLine, SearchInput, Segmented, StatusBadge,
} from '@/components/ui'
import { shortName, studentsIn, taskCounts } from '@/lib/selectors'
import type { Assignment, TaskState } from '@/lib/types'
import { cn, plural, wait } from '@/lib/utils'
import { useActions } from '@/store/actions'
import { useStore } from '@/store/store'
import { STATE, STATES } from './lib'

const PAGE = 12
type Filter = TaskState | 'all'

export function StudentsTab({ a, filter, onFilter }: { a: Assignment; filter: Filter; onFilter: (f: Filter) => void }) {
  const { data, person, toast } = useStore()
  const actions = useActions()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<string[]>([])
  const [expanded, setExpanded] = useState(false)
  const [busy, setBusy] = useState<TaskState | null>(null)

  const c = taskCounts(a)
  const stateOf = (id: string): TaskState => a.progress[id] ?? 'not_started'
  const term = q.trim().toLowerCase()
  const rows = studentsIn(data.people, a.classId)
    .filter((p) => (filter === 'all' || stateOf(p.id) === filter) && (!term || p.name.toLowerCase().includes(term) || p.npm.includes(term)))
    .sort((x, y) => Number(!!y.featured) - Number(!!x.featured) || x.name.localeCompare(y.name))
  const shown = expanded ? rows : rows.slice(0, PAGE)
  const rowIds = rows.map((p) => p.id)
  const selectedHere = sel.filter((id) => rowIds.includes(id)).length
  const allOn = rows.length > 0 && selectedHere === rows.length

  const setOne = (id: string, s: TaskState) => {
    actions.setTaskState(a.id, id, s)
    const name = shortName(person(id))
    toast({
      title: `${name} → ${STATE[s].label}`,
      description: s === 'completed' ? 'Reminders disabled for this student.' : s === 'stuck' ? 'Added to the help queue for this assignment.' : `${a.title} updated.`,
      tone: s === 'completed' ? 'success' : s === 'stuck' ? 'warning' : 'info',
    })
  }

  const bulk = async (s: TaskState) => {
    const ids = sel.filter((id) => stateOf(id) !== s)
    setBusy(s)
    await wait(650)
    ids.forEach((id) => actions.setTaskState(a.id, id, s))
    setBusy(null)
    setSel([])
    toast({
      title: `${plural(sel.length, 'student')} marked as ${STATE[s].label.toLowerCase()}`,
      description: s === 'completed' ? 'Their reminders are now off.' : `${a.title} checklist updated.`,
      tone: s === 'completed' ? 'success' : 'info',
    })
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
        <SearchInput value={q} onChange={setQ} placeholder="Search name or NPM…" aria-label="Search students" className="w-60" />
        <Segmented
          size="sm" aria-label="Filter by status" value={filter} onChange={onFilter}
          options={[
            { value: 'all', label: <>All <span className="tabular opacity-60">{c.total}</span></> },
            ...STATES.map((s) => ({ value: s.value, icon: s.icon, label: <>{s.label} <span className="tabular opacity-60">{c[s.value]}</span></> })),
          ]}
        />
      </div>

      {sel.length > 0 && (
        <div className="flex flex-wrap items-center gap-2.5 border-b border-brand-100 bg-brand-50/70 px-4 py-2.5 animate-fade-in">
          <AvatarStack ids={sel} max={5} size="xs" ringClass="ring-brand-50" />
          <span className="text-[13px] font-semibold text-brand-800 tabular">{sel.length} selected</span>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button size="sm" variant="success" icon={CircleCheck} loading={busy === 'completed'} disabled={!!busy} onClick={() => bulk('completed')}>Mark as completed</Button>
            <Menu
              label="Set status for selected" width={220}
              trigger={<Button size="sm" variant="secondary" iconRight={ChevronDown} loading={!!busy && busy !== 'completed'}>Set status</Button>}
              items={STATES.filter((s) => s.value !== 'completed').map((s) => ({ label: `Mark as ${s.label.toLowerCase()}`, icon: s.icon, onSelect: () => bulk(s.value) }))}
            />
            <Button size="sm" variant="ghost" icon={X} onClick={() => setSel([])}>Clear</Button>
          </div>
        </div>
      )}

      {rows.length ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left">
            <thead>
              <tr className="border-b border-line bg-canvas/60 text-[11px] font-semibold uppercase tracking-wider text-ink-3">
                <th className="w-11 py-2.5 pl-4">
                  <Checkbox aria-label="Select all students in view" checked={allOn} indeterminate={!allOn && selectedHere > 0}
                    onChange={(v) => setSel(v ? [...new Set([...sel, ...rowIds])] : sel.filter((id) => !rowIds.includes(id)))} />
                </th>
                <th className="py-2.5 pr-4 font-semibold">Student</th>
                <th className="py-2.5 pr-4 font-semibold">NPM</th>
                <th className="py-2.5 pr-4 font-semibold">Status</th>
                <th className="py-2.5 pr-4 font-semibold">Reminders</th>
                <th className="py-2.5 pr-4 text-right font-semibold">Update</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((p) => {
                const s = stateOf(p.id)
                const on = sel.includes(p.id)
                return (
                  <tr key={p.id} className={cn('border-b border-line transition-colors last:border-0', on ? 'bg-brand-50/50' : 'hover:bg-subtle/50')}>
                    <td className="py-2.5 pl-4">
                      <Checkbox aria-label={`Select ${p.name}`} checked={on} onChange={(v) => setSel(v ? [...sel, p.id] : sel.filter((x) => x !== p.id))} />
                    </td>
                    <td className="py-2.5 pr-4"><PersonLine id={p.id} presence subtitle={p.discord ? `@${p.discord}` : 'Discord not connected'} /></td>
                    <td className="py-2.5 pr-4 text-[13px] text-ink-2 tabular">{p.npm}</td>
                    <td className="py-2.5 pr-4"><span key={s} className="inline-flex animate-scale-in"><StatusBadge status={s} /></span></td>
                    <td className="py-2.5 pr-4 text-xs">
                      {s === 'completed'
                        ? <span className="inline-flex items-center gap-1.5 text-ink-3"><BellOff className="size-3.5" />Off</span>
                        : <span className="inline-flex items-center gap-1.5 text-ink-2"><BellRing className="size-3.5 text-brand-500" />1 day · 1 hour before</span>}
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center justify-end gap-1">
                        {s !== 'completed' && (
                          <IconButton icon={CircleCheck} label={`Mark ${p.name.split(' ')[0]} as completed`} size="sm" className="hover:bg-emerald-50 hover:text-emerald-700" onClick={() => setOne(p.id, 'completed')} />
                        )}
                        <Menu
                          label={`Set status · ${p.name.split(' ')[0]}`} width={220}
                          trigger={<Button size="xs" variant="ghost" iconRight={ChevronDown}>Set status</Button>}
                          items={STATES.map((st) => ({ label: st.label, icon: st.icon, hint: st.value === s ? 'Current' : undefined, disabled: st.value === s, onSelect: () => setOne(p.id, st.value) }))}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          compact icon={filter === 'stuck' ? CircleCheck : SearchX} tone={filter === 'stuck' ? 'emerald' : 'brand'}
          title={filter === 'stuck' && !term ? 'Nobody is stuck on this task' : 'No students match'}
          description={term ? `Nothing matches “${q}” in this view.` : `No one in Class ${a.classId} is “${filter === 'all' ? 'listed' : STATE[filter].label.toLowerCase()}” right now.`}
          action={{ label: 'Show all students', onClick: () => { setQ(''); onFilter('all') } }}
        />
      )}

      {rows.length > PAGE && (
        <div className="flex items-center justify-between border-t border-line px-4 py-2.5 text-xs text-ink-3">
          <span className="tabular">Showing {shown.length} of {rows.length}</span>
          <Button size="xs" variant="ghost" iconRight={ChevronDown} className={cn(expanded && '[&>svg]:rotate-180')} onClick={() => setExpanded((e) => !e)}>
            {expanded ? 'Show less' : `Show all ${rows.length}`}
          </Button>
        </div>
      )}
    </Card>
  )
}
