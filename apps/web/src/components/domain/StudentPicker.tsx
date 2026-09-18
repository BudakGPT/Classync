import { useMemo, useState } from 'react'
import { Check, X } from 'lucide-react'
import { Avatar, SearchInput, Segmented } from '@/components/ui'
import { students } from '@/lib/selectors'
import type { ClassId } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'

/** Searchable multi-select of students as avatar cards. `classIds` limits the pool (e.g. single-class groups). */
export function StudentPicker({ value, onChange, classIds, className, maxHeight = 300 }: {
  value: string[]; onChange: (ids: string[]) => void; classIds?: ClassId[]; className?: string; maxHeight?: number
}) {
  const { data, person } = useStore()
  const [q, setQ] = useState('')
  const [cls, setCls] = useState<string>('all')
  const available = useMemo(() => [...new Set(students(data.people).map((p) => p.classId!))].filter((c) => !classIds || classIds.includes(c)).sort(), [data.people, classIds])

  const pool = useMemo(() => {
    const term = q.trim().toLowerCase()
    return students(data.people)
      .filter((p) => (!classIds || classIds.includes(p.classId!)) && (cls === 'all' || p.classId === cls))
      .filter((p) => !term || p.name.toLowerCase().includes(term) || p.npm.includes(term))
      .sort((a, b) => Number(!!b.featured) - Number(!!a.featured) || a.name.localeCompare(b.name))
  }, [data.people, classIds, cls, q])

  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id])

  return (
    <div className={cn('rounded-2xl border border-line bg-canvas/50 p-3', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={setQ} placeholder="Search by name or NPM…" className="min-w-48 flex-1 bg-surface" aria-label="Search students" />
        {available.length > 1 && (
          <Segmented size="sm" aria-label="Filter by class" value={cls} onChange={setCls}
            options={[{ value: 'all', label: 'All' }, ...available.map((c) => ({ value: c, label: `Class ${c}` }))]} />
        )}
      </div>

      <div className="mt-2.5 flex min-h-8 flex-wrap items-center gap-1.5">
        {value.length === 0 && <span className="text-xs text-ink-3">No students selected yet — click cards below.</span>}
        {value.map((id) => (
          <button key={id} type="button" onClick={() => toggle(id)} aria-label={`Remove ${person(id)?.name}`}
            className="group inline-flex items-center gap-1.5 rounded-full bg-surface py-0.5 pl-0.5 pr-2 text-xs font-semibold text-ink ring-1 ring-line transition hover:ring-rose-200 animate-scale-in">
            <Avatar id={id} size="xs" />{person(id)?.name.split(' ')[0]}
            <X className="size-3 text-ink-3 group-hover:text-rose-500" />
          </button>
        ))}
        {value.length > 0 && <span className="ml-auto text-xs font-semibold text-brand-700 tabular">{value.length} selected</span>}
      </div>

      <div className="scrollbar-thin -mx-1 mt-2 grid grid-cols-2 gap-2 overflow-y-auto px-1 py-1 sm:grid-cols-3 lg:grid-cols-4" style={{ maxHeight }} role="listbox" aria-multiselectable>
        {pool.map((p) => {
          const on = value.includes(p.id)
          return (
            <button key={p.id} type="button" role="option" aria-selected={on} onClick={() => toggle(p.id)}
              className={cn('relative flex items-center gap-2.5 rounded-xl border bg-surface p-2 text-left transition duration-150 active:scale-[0.98]',
                on ? 'border-brand-400 ring-4 ring-brand-100' : 'border-line hover:-translate-y-px hover:border-line-strong hover:shadow-card')}>
              <Avatar id={p.id} size="md" presence />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] font-semibold text-ink">{p.name}</span>
                <span className="block truncate text-[11px] text-ink-3">Class {p.classId} · {p.npm}</span>
              </span>
              <span className={cn('grid size-4 shrink-0 place-items-center rounded-full border transition', on ? 'border-brand-600 bg-brand-600 text-white' : 'border-line-strong')}>
                {on && <Check className="size-2.5 animate-check-in" strokeWidth={3.5} />}
              </span>
            </button>
          )
        })}
        {pool.length === 0 && <p className="col-span-full py-6 text-center text-xs text-ink-3">No students match “{q}”.</p>}
      </div>
    </div>
  )
}
