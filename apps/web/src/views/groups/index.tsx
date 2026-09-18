import { useMemo, useState } from 'react'
import { Download, Network, Plus, School, UsersRound } from 'lucide-react'
import { Button, Card, EmptyState, PageHeader, SearchInput, Segmented, Tabs } from '@/components/ui'
import { navigate, useRoute } from '@/lib/router'
import { fmtDate, now } from '@/lib/time'
import { tone } from '@/lib/tones'
import type { GroupType } from '@/lib/types'
import { cn, plural, wait } from '@/lib/utils'
import { useStore } from '@/store/store'
import { GroupCard, NewGroupTile } from './GroupCard'
import { GroupDetailDrawer } from './GroupDetailDrawer'
import { DeleteGroupDialog, EditGroupModal, useGroupDialog } from './GroupDialogs'
import { GroupStats } from './GroupStats'
import { GROUP_TYPES, groupPath, TYPE_LIST } from './meta'

type Tab = 'all' | 'active' | 'archived'
type Scope = 'all' | 'single' | 'cross'

export default function GroupsPage() {
  const { data, person, openModal, toast } = useStore()
  const { segments, params } = useRoute()
  const tabParam = params.get('tab')
  const tab: Tab = tabParam === 'active' || tabParam === 'archived' ? tabParam : 'all'
  const [types, setTypes] = useState<GroupType[]>([])
  const [scope, setScope] = useState<Scope>('all')
  const [q, setQ] = useState('')
  const [exporting, setExporting] = useState(false)
  const edit = useGroupDialog()
  const del = useGroupDialog()

  const create = () => openModal({ type: 'createGroup' })
  const setTab = (t: Tab) => navigate(`/groups${segments[1] ? `/${segments[1]}` : ''}${t === 'all' ? '' : `?tab=${t}`}`)
  const toggleType = (t: GroupType) => setTypes((ts) => (ts.includes(t) ? ts.filter((x) => x !== t) : [...ts, t]))
  const filtersActive = types.length > 0 || scope !== 'all' || q.trim() !== ''
  const clearFilters = () => { setTypes([]); setScope('all'); setQ('') }

  const counts = {
    all: data.groups.length,
    active: data.groups.filter((g) => g.status === 'Active').length,
    archived: data.groups.filter((g) => g.status === 'Archived').length,
  }

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    return data.groups
      .filter((g) => tab === 'all' || g.status.toLowerCase() === tab)
      .filter((g) => !types.length || types.includes(g.type))
      .filter((g) => scope === 'all' || g.scope === scope)
      .filter((g) => !term || [g.name, g.description, g.role, g.type, ...g.memberIds.map((id) => person(id)?.name)].join(' ').toLowerCase().includes(term))
      .sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew) || Number(a.status === 'Archived') - Number(b.status === 'Archived') || b.createdAt.localeCompare(a.createdAt))
  }, [data.groups, tab, types, scope, q, person])

  async function exportAll() {
    setExporting(true)
    await wait(900)
    setExporting(false)
    const file = `classync-groups-${fmtDate(now().toISOString()).replace(/ /g, '-').toLowerCase()}.csv`
    toast({ title: 'Groups exported', description: `${file} · ${plural(list.length, 'group')} with members, roles & channels`, tone: 'success' })
  }

  return (
    <>
      <PageHeader
        title="Groups"
        subtitle="Create temporary or long-term collaboration spaces."
        actions={
          <>
            <Button variant="secondary" icon={Download} loading={exporting} onClick={exportAll}>Export Groups</Button>
            <Button variant="primary" icon={Plus} onClick={create}>Create Group</Button>
          </>
        }
      />

      <GroupStats />

      <div className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-line">
          <Tabs<Tab> value={tab} onChange={setTab} className="-mb-px border-b-transparent" items={[
            { value: 'all', label: 'All', count: counts.all },
            { value: 'active', label: 'Active', count: counts.active },
            { value: 'archived', label: 'Archived', count: counts.archived },
          ]} />
          <div className="flex flex-wrap items-center gap-2 pb-2">
            <Segmented<Scope> size="sm" aria-label="Scope" value={scope} onChange={setScope} options={[
              { value: 'all', label: 'All scopes' },
              { value: 'single', label: 'Single class', icon: School },
              { value: 'cross', label: 'Cross-class', icon: Network },
            ]} />
            <SearchInput value={q} onChange={setQ} placeholder="Search groups or members…" aria-label="Search groups" className="w-60" />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2.5">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter by group type">
            {TYPE_LIST.map((t) => {
              const on = types.includes(t)
              const m = GROUP_TYPES[t]
              return (
                <button key={t} type="button" aria-pressed={on} onClick={() => toggleType(t)}
                  className={cn('inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-semibold transition duration-150 active:scale-[0.97]',
                    on ? cn(tone(m.tone).soft, tone(m.tone).text, tone(m.tone).border) : 'border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink')}>
                  <m.icon className={cn('size-3.5', !on && 'text-ink-3')} />{t}
                </button>
              )
            })}
            {filtersActive && <button type="button" onClick={clearFilters} className="ml-1 text-xs font-semibold text-brand-700 hover:underline">Clear filters</button>}
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Segmented<Scope> size="sm" aria-label="Scope" value={scope} onChange={setScope} options={[
              { value: 'all', label: 'All scopes' },
              { value: 'single', label: 'Single class', icon: School },
              { value: 'cross', label: 'Cross-class', icon: Network },
            ]} />
            <SearchInput value={q} onChange={setQ} placeholder="Search groups or members…" aria-label="Search groups" className="w-56" />
          </div>
        </div>
      </div>

      {list.length > 0 ? (
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((g, i) => <GroupCard key={g.id} group={g} index={i} onEdit={edit.show} onDelete={del.show} />)}
          {tab !== 'archived' && !filtersActive && <NewGroupTile onCreate={create} index={list.length} />}
        </div>
      ) : (
        <Card className="mt-5 animate-rise-in">
          <EmptyState
            title="No groups created yet"
            icon={UsersRound} tone="teal" characters={['helven', 'dylan', 'jessica']}
            description={filtersActive
              ? <>No {tab === 'all' ? '' : `${tab} `}groups match these filters. <button type="button" onClick={clearFilters} className="font-semibold text-brand-700 hover:underline">Clear filters</button> or start a new one.</>
              : tab === 'archived' ? 'Groups you archive when a collaboration wraps up will show here.' : 'Create an FGD, project or research group and Classync sets up Discord for it.'}
            action={{ label: 'Create Group', onClick: create, icon: Plus }}
          />
        </Card>
      )}

      <GroupDetailDrawer id={segments[1]} onEdit={edit.show} onDelete={del.show} />
      {edit.state && <EditGroupModal key={edit.state.key} groupId={edit.state.id} open={edit.state.open} onClose={edit.hide} />}
      {del.state && (
        <DeleteGroupDialog key={del.state.key} groupId={del.state.id} open={del.state.open} onClose={del.hide}
          onDeleted={() => { if (segments[1] === del.state?.id) navigate(groupPath()) }} />
      )}
    </>
  )
}
