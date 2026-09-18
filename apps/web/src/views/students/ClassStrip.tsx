import { Briefcase } from 'lucide-react'
import { AvatarStack, Badge, Card, StackedProgress } from '@/components/ui'
import { staff, students } from '@/lib/selectors'
import { tone } from '@/lib/tones'
import type { ClassId, Person } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'

// New faces first, then the recurring characters, so the strip visibly changes after an import.
const faces = (list: Person[]) => [...list].sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew) || Number(!!b.featured) - Number(!!a.featured)).slice(0, 3).map((p) => p.id)

export function ClassStrip({ activeClasses, staffActive, onPickClass, onPickStaff }: {
  activeClasses: ClassId[]; staffActive: boolean; onPickClass: (id: ClassId) => void; onPickStaff: () => void
}) {
  const { data } = useStore()
  const all = students(data.people)
  const team = staff(data.people)
  const verified = all.filter((p) => p.verification === 'Verified').length
  const pending = all.filter((p) => p.verification === 'Pending').length
  const perClass = data.classes.map((c) => ({ c, list: all.filter((p) => p.classId === c.id) })).filter((x) => x.list.length)

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold tracking-tight text-ink">Class distribution</h2>
          <p className="text-xs text-ink-3">Auto-categorized from spreadsheet imports and Discord onboarding · click a class to filter</p>
        </div>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-3">
          <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-emerald-500" /><b className="font-semibold text-ink tabular">{verified}</b> verified</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-amber-500" /><b className="font-semibold text-ink tabular">{pending}</b> pending</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-slate-400" /><b className="font-semibold text-ink tabular">{all.length - verified - pending}</b> not connected</span>
        </p>
      </div>

      <StackedProgress className="mt-3" size="sm" total={all.length} segments={perClass.map(({ c, list }) => ({ value: list.length, tone: c.tone, label: c.name }))} />

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {perClass.map(({ c, list }, i) => {
          const t = tone(c.tone)
          const on = activeClasses.includes(c.id)
          const fresh = list.filter((p) => p.isNew).length
          return (
            <button
              key={c.id} type="button" aria-pressed={on} onClick={() => onPickClass(c.id)}
              style={{ animationDelay: `${i * 40}ms` }}
              className={cn(
                'group relative flex min-w-0 items-center gap-3 rounded-xl border bg-surface p-2.5 text-left transition duration-150 animate-rise-in hover:-translate-y-px hover:shadow-lift active:translate-y-0',
                on ? cn(t.border, 'ring-4 ring-brand-100') : 'border-line hover:border-line-strong',
                fresh > 0 && 'animate-highlight',
              )}
            >
              <span className={cn('grid size-9 shrink-0 place-items-center rounded-lg text-[15px] font-extrabold', t.soft, t.text)}>{c.id}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline gap-1.5">
                  <span className="text-[13px] font-bold text-ink">{c.name}</span>
                  <span className="text-[13px] font-semibold text-ink-2 tabular">{list.length}</span>
                </span>
                <span className="block truncate text-[11.5px] text-ink-3">{c.subject}</span>
              </span>
              <AvatarStack ids={faces(list)} max={3} size="xs" />
              {fresh > 0 && <Badge tone="brand" size="xs" className="absolute -top-2 right-2 shadow-card">+{fresh} new</Badge>}
            </button>
          )
        })}
        <button
          type="button" aria-pressed={staffActive} onClick={onPickStaff}
          className={cn(
            'group flex min-w-0 items-center gap-3 rounded-xl border border-dashed bg-canvas/60 p-2.5 text-left transition duration-150 hover:-translate-y-px hover:bg-surface hover:shadow-lift',
            staffActive ? 'border-violet-300 ring-4 ring-brand-100' : 'border-line-strong',
          )}
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-700"><Briefcase className="size-4" /></span>
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline gap-1.5">
              <span className="text-[13px] font-bold text-ink">Staff</span>
              <span className="text-[13px] font-semibold text-ink-2 tabular">{team.length}</span>
            </span>
            <span className="block truncate text-[11.5px] text-ink-3">Lecturers & TAs</span>
          </span>
          <AvatarStack ids={team.map((p) => p.id)} max={3} size="xs" />
        </button>
      </div>
    </Card>
  )
}
