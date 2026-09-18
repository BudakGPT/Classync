import { useState } from 'react'
import { ArrowDownUp, CalendarRange, ChevronDown, ClipboardPlus, Gauge, LifeBuoy, MessageCircleQuestionMark, PartyPopper, SearchX } from 'lucide-react'
import { AvatarStack, Button, Card, EmptyState, Menu, PageHeader, ProgressBar, SearchInput, Segmented, StatCard, Tabs } from '@/components/ui'
import { navigate, useRoute } from '@/lib/router'
import { idsWithState, taskCounts } from '@/lib/selectors'
import { dueLabel } from '@/lib/time'
import type { Assignment } from '@/lib/types'
import { plural } from '@/lib/utils'
import { useStore } from '@/store/store'
import { inTab, lifecycle, type ListTab } from './lib'
import { TaskCard } from './TaskCard'

const TABS: { value: ListTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'stuck', label: 'Stuck' },
]

type Sort = 'due' | 'completion' | 'stuck'
const SORTS: Record<Sort, string> = { due: 'Due date', completion: 'Lowest completion', stuck: 'Most stuck' }
const WEEK = 7 * 86_400_000

const compare = (sort: Sort) => (x: Assignment, y: Assignment) =>
  Number(!!y.isNew) - Number(!!x.isNew)
  || Number(lifecycle(x) === 'completed') - Number(lifecycle(y) === 'completed')
  || (sort === 'completion' ? taskCounts(x).pct - taskCounts(y).pct : sort === 'stuck' ? taskCounts(y).stuck - taskCounts(x).stuck : 0)
  || x.due.localeCompare(y.due)

export function AssignmentList() {
  const { data, openModal } = useStore()
  const { params } = useRoute()
  const tab = TABS.find((t) => t.value === params.get('tab'))?.value ?? 'all'
  const [q, setQ] = useState('')
  const [cls, setCls] = useState('all')
  const [sort, setSort] = useState<Sort>('due')

  // Summary strip — active = not completed (due still ahead, <90% done).
  const active = data.assignments.filter((a) => lifecycle(a) !== 'completed').sort(compare('due'))
  const dueSoon = active.filter((a) => new Date(a.due).getTime() - Date.parse(new Date().toISOString()) < Infinity && Date.parse(a.due) - Date.parse(active[0]?.due ?? a.due) < WEEK)
  const avg = active.length ? Math.round(active.reduce((n, a) => n + taskCounts(a).pct, 0) / active.length) : 0
  const stuckTasks = active.filter((a) => taskCounts(a).stuck > 0)
  const stuckIds = [...new Set(stuckTasks.flatMap((a) => idsWithState(a, 'stuck')))]
  const linked = new Set(data.assignments.flatMap((a) => a.helpClusterIds))
  const clusters = data.helpClusters.filter((h) => linked.has(h.id))
  const openClusters = clusters.filter((h) => h.status === 'open')

  const term = q.trim().toLowerCase()
  const pool = data.assignments.filter((a) => (cls === 'all' || a.classId === cls) && (!term || a.title.toLowerCase().includes(term)))
  const shown = pool.filter((a) => inTab(a, tab)).sort(compare(sort))
  const filtered = cls !== 'all' || !!term
  const clear = () => { setQ(''); setCls('all') }

  return (
    <>
      <PageHeader
        title="Assignments"
        subtitle="Task checklists across your classes — who's done, who's working on it, and who's stuck."
        actions={<Button variant="primary" icon={ClipboardPlus} onClick={() => openModal({ type: 'createAssignment' })}>New Assignment</Button>}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Due this week" value={dueSoon.length} icon={CalendarRange} tone="amber"
          footer={dueSoon[0]
            ? <span className="block truncate">Next: <span className="font-semibold text-ink-2">{dueSoon[0].title}</span> · {dueLabel(dueSoon[0].due)}</span>
            : 'Nothing due in the next 7 days'}
        />
        <StatCard
          label="Average completion" value={`${avg}%`} icon={Gauge} tone="emerald"
          footer={<div className="flex items-center gap-3"><ProgressBar value={avg} tone="emerald" size="sm" label="Average completion" /><span className="shrink-0">{plural(active.length, 'active task')}</span></div>}
        />
        <StatCard
          label="Students stuck" value={stuckIds.length} icon={LifeBuoy} tone="rose" onClick={() => navigate('/assignments?tab=stuck')}
          footer={<div className="flex items-center gap-2"><AvatarStack ids={stuckIds} max={5} size="xs" /><span className="truncate">across {plural(stuckTasks.length, 'task')}</span></div>}
        />
        <StatCard
          label="Help requests linked" value={openClusters.reduce((n, h) => n + h.reports, 0)} icon={MessageCircleQuestionMark} tone="violet" onClick={() => navigate('/help')}
          footer={`${plural(openClusters.length, 'open topic')} · ${clusters.length - openClusters.length} answered`}
        />
      </div>

      <Tabs
        className="mt-8"
        items={TABS.map((t) => ({ ...t, count: pool.filter((a) => inTab(a, t.value)).length }))}
        value={tab}
        onChange={(v) => navigate(v === 'all' ? '/assignments' : `/assignments?tab=${v}`)}
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Search assignments…" aria-label="Search assignments" className="w-64" />
        <Segmented
          size="sm" aria-label="Filter by class" value={cls} onChange={setCls}
          options={[{ value: 'all', label: 'All classes' }, ...data.classes.map((c) => ({ value: c.id, label: c.name }))]}
        />
        <div className="ml-auto">
          <Menu
            label="Sort by" width={200}
            trigger={<Button variant="ghost" size="sm" icon={ArrowDownUp} iconRight={ChevronDown}>Sort: {SORTS[sort]}</Button>}
            items={(Object.keys(SORTS) as Sort[]).map((s) => ({ label: SORTS[s], hint: s === sort ? 'Active' : undefined, onSelect: () => setSort(s) }))}
          />
        </div>
      </div>

      {shown.length ? (
        <div key={`${tab}-${cls}-${sort}`} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((a, i) => <TaskCard key={a.id} a={a} index={i} />)}
        </div>
      ) : (
        <Card className="mt-4">
          {tab === 'stuck' && !filtered ? (
            <EmptyState icon={PartyPopper} tone="emerald" characters={['jessica', 'helven', 'nadia']} title="Nobody is stuck right now"
              description="When a student taps “I'm stuck” on Discord or in their checklist, the task shows up here." />
          ) : filtered ? (
            <EmptyState icon={SearchX} title="No assignments match your filters" description="Try another class or a different search term."
              action={{ label: 'Clear filters', onClick: clear }} />
          ) : (
            <EmptyState icon={ClipboardPlus} title="No assignments here yet" description="Create a task checklist and Classync will track completion and remind students on Discord."
              action={{ label: 'New Assignment', icon: ClipboardPlus, onClick: () => openModal({ type: 'createAssignment' }) }} />
          )}
        </Card>
      )}
    </>
  )
}
