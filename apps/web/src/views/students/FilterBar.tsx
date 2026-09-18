import type { ReactNode } from 'react'
import { BadgeCheck, ChevronDown, CircleDot, School, Sparkles, UserRound, X, type LucideIcon } from 'lucide-react'
import { Button, Checkbox, Popover, SearchInput } from '@/components/ui'
import { tone } from '@/lib/tones'
import type { Person } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'
import { matches, matchesFacet, ROLE_KEYS, STATUSES, VERIFICATIONS, type FacetKey, type Filters } from './lib'

const FACET_LABEL: Record<FacetKey, string> = { classes: 'Class', roles: 'Role', verification: 'Verification', status: 'Status' }
const DOTS: Record<string, string> = {
  Verified: 'bg-emerald-500', Pending: 'bg-amber-500', 'Not Connected': 'bg-slate-400',
  Active: 'bg-emerald-500', Inactive: 'bg-slate-400', 'On Leave': 'bg-amber-500',
  Student: 'bg-sky-500', 'Teaching Assistant': 'bg-teal-500', Lecturer: 'bg-brand-500', Admin: 'bg-violet-500',
}

export function FilterBar({ q, onSearch, filters, onChange, people, resultCount }: {
  q: string; onSearch: (v: string) => void; filters: Filters; onChange: (f: Filters) => void; people: Person[]; resultCount: number
}) {
  const { data } = useStore()
  const count = (key: FacetKey, value: string) => people.filter((p) => matches(p, filters, q, key) && matchesFacet(p, key, value)).length
  const set = (key: FacetKey, values: string[]) => onChange({ ...filters, [key]: values })
  const toggle = (key: FacetKey, value: string) => {
    const cur = filters[key] as string[]
    set(key, cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value])
  }

  const facets: { key: FacetKey; icon: LucideIcon; options: { value: string; label: ReactNode; dot: string }[] }[] = [
    { key: 'classes', icon: School, options: data.classes.map((c) => ({ value: c.id, label: `${c.name} · ${c.subject}`, dot: tone(c.tone).dot })) },
    { key: 'roles', icon: UserRound, options: ROLE_KEYS.map((r) => ({ value: r, label: r, dot: DOTS[r] })) },
    { key: 'verification', icon: BadgeCheck, options: VERIFICATIONS.map((v) => ({ value: v, label: v, dot: DOTS[v] })) },
    { key: 'status', icon: CircleDot, options: STATUSES.map((s) => ({ value: s, label: s, dot: DOTS[s] })) },
  ]

  const chips = facets.flatMap((f) => (filters[f.key] as string[]).map((v) => ({ key: f.key, value: v })))
  const active = chips.length > 0 || filters.onlyNew

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <SearchInput value={q} onChange={onSearch} placeholder="Search name, NPM, email or Discord…" aria-label="Search people" className="w-full bg-surface sm:w-80" />
        <div className="flex flex-wrap items-center gap-2">
          {facets.map((f) => {
            const selected = filters[f.key] as string[]
            return (
              <Popover key={f.key} align="start" width={260} trigger={
                <Button variant="secondary" size="sm" icon={f.icon} className={cn(selected.length > 0 && '!border-brand-300 !bg-brand-50 !text-brand-800')}>
                  {FACET_LABEL[f.key]}
                  {selected.length > 0 && <span className="grid h-4 min-w-4 place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white tabular">{selected.length}</span>}
                  <ChevronDown className="size-3.5 opacity-60" />
                </Button>
              }>
                {(close) => (
                  <div role="group" aria-label={`Filter by ${FACET_LABEL[f.key]}`}>
                    <div className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-3">Filter by {FACET_LABEL[f.key].toLowerCase()}</div>
                    {f.options.map((o) => (
                      <Checkbox
                        key={o.value} checked={selected.includes(o.value)} onChange={() => toggle(f.key, o.value)}
                        className="flex w-full rounded-lg px-2.5 py-2 transition-colors hover:bg-subtle"
                        label={<>
                          <span className={cn('size-2 shrink-0 rounded-full', o.dot)} />
                          <span className="min-w-0 flex-1 truncate text-ink">{o.label}</span>
                          <span className="text-xs text-ink-3 tabular">{count(f.key, o.value)}</span>
                        </>}
                      />
                    ))}
                    {selected.length > 0 && (
                      <>
                        <div className="my-1 h-px bg-line" />
                        <button type="button" onClick={() => { set(f.key, []); close() }} className="w-full rounded-lg px-2.5 py-1.5 text-left text-[12.5px] font-semibold text-brand-700 hover:bg-subtle">
                          Clear {FACET_LABEL[f.key].toLowerCase()} filter
                        </button>
                      </>
                    )}
                  </div>
                )}
              </Popover>
            )
          })}
        </div>
        <span className="ml-auto hidden text-[12.5px] text-ink-3 lg:inline"><span className="font-semibold text-ink tabular">{resultCount}</span> {resultCount === 1 ? 'person' : 'people'}</span>
      </div>

      {active && (
        <div className="flex flex-wrap items-center gap-1.5 animate-fade-in">
          {filters.onlyNew && (
            <Chip onRemove={() => onChange({ ...filters, onlyNew: false })} label="Recently added">
              <Sparkles className="size-3 text-brand-600" />Recently added
            </Chip>
          )}
          {chips.map((c) => (
            <Chip key={c.key + c.value} onRemove={() => toggle(c.key, c.value)} label={`${FACET_LABEL[c.key]} ${c.value}`}>
              <span className="font-medium text-ink-3">{FACET_LABEL[c.key]}:</span>{c.key === 'classes' ? `Class ${c.value}` : c.value}
            </Chip>
          ))}
          <Button variant="ghost" size="xs" onClick={() => onChange({ classes: [], roles: [], verification: [], status: [], onlyNew: false })}>Clear filters</Button>
        </div>
      )}
    </div>
  )
}

function Chip({ children, onRemove, label }: { children: ReactNode; onRemove: () => void; label: string }) {
  return (
    <span className="inline-flex h-7 items-center gap-1 rounded-full bg-surface pl-2.5 pr-1 text-xs font-semibold text-ink ring-1 ring-line animate-scale-in">
      {children}
      <button type="button" onClick={onRemove} aria-label={`Remove filter: ${label}`} className="grid size-5 place-items-center rounded-full text-ink-3 transition hover:bg-rose-50 hover:text-rose-600">
        <X className="size-3" />
      </button>
    </span>
  )
}
