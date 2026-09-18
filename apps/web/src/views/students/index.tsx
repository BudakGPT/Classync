import { useEffect, useMemo, useRef, useState } from 'react'
import { Download, FileSpreadsheet, SearchX, UserPlus } from 'lucide-react'
import { Button, Card, ConfirmDialog, EmptyState, PageHeader } from '@/components/ui'
import { navigate, useRoute } from '@/lib/router'
import type { ClassId } from '@/lib/types'
import { plural, wait } from '@/lib/utils'
import { useStore } from '@/store/store'
import { BulkBar } from './BulkBar'
import { ClassStrip } from './ClassStrip'
import { FilterBar } from './FilterBar'
import { EMPTY_FILTERS, matches, PAGE_SIZE, sortPeople, type Filters, type Sort, type SortKey } from './lib'
import { StudentDrawer } from './StudentDrawer'
import { Pagination, StudentTable } from './StudentTable'

const STAFF_ROLES: Filters['roles'] = ['Teaching Assistant', 'Lecturer']

export default function StudentsPage() {
  const { data, me, person, update, log, toast, openModal } = useStore()
  const { segments, params } = useRoute()
  const [q, setQ] = useState('')
  const [filters, setFiltersRaw] = useState<Filters>(EMPTY_FILTERS)
  const [sort, setSort] = useState<Sort | null>(null)
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<string[]>([])
  const [removing, setRemoving] = useState<string[] | null>(null)
  const [exporting, setExporting] = useState(false)

  const setFilters = (f: Filters) => { setFiltersRaw(f); setPage(1) }
  const search = (v: string) => { setQ(v); setPage(1) }

  // Deep links: /students?show=new (after an import) · /students?class=B
  const show = params.get('show'), cls = params.get('class')
  useEffect(() => {
    if (show === 'new') { setFiltersRaw((f) => ({ ...f, onlyNew: true })); setPage(1) }
    if (cls && data.classes.some((c) => c.id === cls)) { setFiltersRaw((f) => ({ ...f, classes: [cls as ClassId] })); setPage(1) }
  }, [show, cls]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => sortPeople(data.people.filter((p) => matches(p, filters, q)), sort), [data.people, filters, q, sort])
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)
  const liveSelected = selected.filter((id) => person(id))

  // Drawer lives in the URL. The shell scrolls to top on route change — keep the table where the user left it.
  const openId = segments[1]
  const openPerson = person(openId)
  const lastPerson = useRef(openPerson)
  if (openPerson) lastPerson.current = openPerson
  const scrollY = useRef(0)
  const openProfile = (id: string) => { scrollY.current = window.scrollY; navigate(`/students/${id}`) }
  useEffect(() => {
    const y = scrollY.current
    const r = requestAnimationFrame(() => window.scrollTo({ top: y }))
    return () => cancelAnimationFrame(r)
  }, [openId])

  const onSort = (key: SortKey) => setSort((s) => (s?.key !== key ? { key, dir: 'asc' } : s.dir === 'asc' ? { key, dir: 'desc' } : null))
  const onSelect = (ids: string[], on: boolean) => setSelected((s) => (on ? [...new Set([...s, ...ids])] : s.filter((id) => !ids.includes(id))))

  const toggleClass = (id: ClassId) => setFilters({ ...filters, classes: filters.classes.includes(id) ? filters.classes.filter((c) => c !== id) : [id], roles: filters.roles.filter((r) => r === 'Student' || r === 'Admin') })
  const staffActive = STAFF_ROLES.every((r) => filters.roles.includes(r)) && filters.roles.length === 2
  const toggleStaff = () => setFilters({ ...filters, classes: [], roles: staffActive ? [] : STAFF_ROLES })

  const exportAll = async () => {
    setExporting(true)
    await wait(800)
    setExporting(false)
    toast({ title: `Exported ${filtered.length} rows to classync-students.csv`, description: filtered.length < data.people.length ? 'Only people matching the current filters were included.' : 'Full roster · 10 columns', tone: 'success' })
  }

  const confirmRemove = () => {
    if (!removing) return
    const names = removing.map((id) => person(id)?.name).filter(Boolean) as string[]
    update('people', (ps) => ps.filter((p) => !removing.includes(p.id)))
    log({ actorId: me.id, action: 'removed', target: names.length === 1 ? names[0] : plural(names.length, 'person', 'people'), detail: 'Discord roles revoked · removed from groups and reminders', type: 'students' })
    toast({ title: names.length === 1 ? `${names[0]} removed` : `${plural(names.length, 'person', 'people')} removed`, description: 'Their Discord class roles were revoked.', tone: 'success' })
    setSelected((s) => s.filter((id) => !removing.includes(id)))
    if (openId && removing.includes(openId)) navigate('/students')
    setRemoving(null)
  }

  const removingNames = (removing ?? []).map((id) => person(id)?.name).filter(Boolean) as string[]

  return (
    <>
      <PageHeader
        title="Students"
        subtitle={`${data.people.length} people across ${data.classes.length} classes — synced with the academic database and Discord roles in ${data.discord.server}.`}
        actions={<>
          <Button icon={FileSpreadsheet} onClick={() => openModal({ type: 'importStudents' })}>Import spreadsheet</Button>
          <Button icon={Download} loading={exporting} onClick={exportAll}>Export</Button>
          <Button variant="primary" icon={UserPlus} onClick={() => openModal({ type: 'addStudent', classId: filters.classes.length === 1 ? filters.classes[0] : undefined })}>Add student</Button>
        </>}
      />

      <div className="space-y-4">
        <ClassStrip activeClasses={filters.classes} staffActive={staffActive} onPickClass={toggleClass} onPickStaff={toggleStaff} />

        <FilterBar q={q} onSearch={search} filters={filters} onChange={setFilters} people={data.people} resultCount={filtered.length} />

        <Card className="overflow-hidden">
          {filtered.length ? (
            <>
              <StudentTable rows={rows} selected={selected} onSelect={onSelect} sort={sort} onSort={onSort} onOpen={openProfile} onRemove={setRemoving} />
              <Pagination page={current} pages={pages} total={filtered.length} pageSize={PAGE_SIZE} onPage={(n) => { setPage(n); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
            </>
          ) : (
            <EmptyState
              icon={SearchX} tone="sky" characters={['jessica', 'erik', 'citra']}
              title="No one matches these filters"
              description={q ? `Nobody matches “${q}”. Try a name, a 10-digit NPM, an email or a Discord username.` : 'Try removing a filter, or import a roster to add more students.'}
              action={{ label: 'Clear search & filters', onClick: () => { setFilters(EMPTY_FILTERS); setQ('') } }}
            />
          )}
        </Card>
      </div>

      {liveSelected.length > 0 && (
        <BulkBar
          ids={liveSelected} matching={filtered.length}
          onSelectAll={() => setSelected(filtered.map((p) => p.id))}
          onClear={() => setSelected([])}
          onRemove={setRemoving}
        />
      )}

      <StudentDrawer person={openPerson ?? lastPerson.current} open={!!openPerson} onClose={() => navigate('/students')} />

      <ConfirmDialog
        open={!!removing} onClose={() => setRemoving(null)} onConfirm={confirmRemove} confirmLabel={removingNames.length > 1 ? `Remove ${removingNames.length} people` : 'Remove'}
        title={removingNames.length === 1 ? `Remove ${removingNames[0]}?` : `Remove ${removingNames.length} people?`}
        description={`${removingNames.length === 1 ? 'They' : 'They'} will lose their Discord class roles and stop receiving reminders. Assignment history is kept for reporting.`}
      />
    </>
  )
}
