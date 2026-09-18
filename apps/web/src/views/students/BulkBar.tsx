import { useState } from 'react'
import { BellRing, ChevronDown, Download, School, Trash2, Users, X } from 'lucide-react'
import { AvatarStack, Button, IconButton, Menu } from '@/components/ui'
import type { ClassId } from '@/lib/types'
import { plural, wait } from '@/lib/utils'
import { useStore } from '@/store/store'

export function BulkBar({ ids, matching, onSelectAll, onClear, onRemove }: {
  ids: string[]; matching: number; onSelectAll: () => void; onClear: () => void; onRemove: (ids: string[]) => void
}) {
  const { data, me, person, update, log, toast, openModal } = useStore()
  const [exporting, setExporting] = useState(false)

  const assign = (c: ClassId) => {
    const studs = ids.filter((id) => person(id)?.role === 'Student')
    if (!studs.length) { toast({ title: 'Only students can be assigned to a class', description: 'Staff stay linked to the classes they teach.', tone: 'warning' }); return }
    update('people', (ps) => ps.map((p) => (studs.includes(p.id) ? { ...p, classId: c } : p)))
    log({ actorId: me.id, action: `moved ${plural(studs.length, 'student')} to`, target: `Class ${c}`, detail: `@Class-${c} role synced on Discord`, type: 'students' })
    toast({ title: `${plural(studs.length, 'student')} assigned to Class ${c}`, description: `Discord roles updated to @Class-${c}${studs.length < ids.length ? ' · staff skipped' : ''}`, tone: 'success' })
  }

  const exportRows = async () => {
    setExporting(true)
    await wait(700)
    setExporting(false)
    toast({ title: `Exported ${plural(ids.length, 'row')} to classync-students.csv`, description: 'Name, NPM, email, class, role, verification, Discord', tone: 'success' })
  }

  return (
    <div className="pointer-events-none sticky bottom-4 z-20 mt-4 flex justify-center">
      <div role="toolbar" aria-label="Bulk actions" className="pointer-events-auto flex max-w-full flex-wrap items-center gap-1.5 rounded-2xl border border-brand-200 bg-surface/95 p-2 pl-3 shadow-pop backdrop-blur animate-rise-in">
        <AvatarStack ids={ids} max={4} size="sm" />
        <div className="mr-1 min-w-0 leading-tight">
          <p className="text-[13px] font-bold text-ink tabular">{ids.length} selected</p>
          {ids.length < matching
            ? <button type="button" onClick={onSelectAll} className="text-[11.5px] font-semibold text-brand-600 hover:text-brand-700">Select all {matching}</button>
            : <p className="text-[11.5px] text-ink-3">All matching people</p>}
        </div>
        <span className="mx-1 hidden h-7 w-px bg-line sm:block" />
        <Menu
          label="Assign to class" width={250} align="start"
          items={data.classes.map((c) => ({ label: c.name, description: c.subject, icon: School, onSelect: () => assign(c.id) }))}
          trigger={<Button size="sm" variant="ghost" icon={School} iconRight={ChevronDown}>Assign class</Button>}
        />
        <Button size="sm" variant="ghost" icon={Users} onClick={() => openModal({ type: 'createGroup', prefill: { memberIds: ids } })}>Create group</Button>
        <Button size="sm" variant="ghost" icon={BellRing} onClick={() => openModal({ type: 'createNotification', prefill: { audience: { type: 'students', classIds: [], groupIds: [], studentIds: ids } } })}>Notify</Button>
        <Button size="sm" variant="ghost" icon={Download} loading={exporting} onClick={exportRows}>Export</Button>
        <Button size="sm" variant="danger-soft" icon={Trash2} onClick={() => onRemove(ids)}>Remove</Button>
        <span className="mx-0.5 hidden h-7 w-px bg-line sm:block" />
        <IconButton icon={X} label="Clear selection" size="sm" onClick={onClear} />
      </div>
    </div>
  )
}
