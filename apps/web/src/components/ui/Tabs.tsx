import type { KeyboardEvent, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TabItem<T extends string> { value: T; label: ReactNode; count?: number; icon?: LucideIcon }

/** Underline tabs with counts; arrow keys move between tabs. */
export function Tabs<T extends string>({ items, value, onChange, className, variant = 'underline' }: {
  items: TabItem<T>[]; value: T; onChange: (v: T) => void; className?: string; variant?: 'underline' | 'pill'
}) {
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const i = items.findIndex((t) => t.value === value)
    const next = items[(i + (e.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length]
    onChange(next.value)
    requestAnimationFrame(() => (e.currentTarget.querySelector('[aria-selected="true"]') as HTMLElement | null)?.focus())
  }
  const pill = variant === 'pill'
  return (
    <div role="tablist" onKeyDown={onKey} className={cn('scrollbar-thin flex items-center overflow-x-auto', pill ? 'gap-1' : 'gap-5 border-b border-line', className)}>
      {items.map((t) => {
        const active = t.value === value
        return (
          <button
            key={t.value} type="button" role="tab" aria-selected={active} tabIndex={active ? 0 : -1}
            onClick={() => onChange(t.value)}
            className={cn(
              'group relative inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[13.5px] font-semibold transition-colors duration-150',
              pill
                ? cn('h-8 rounded-lg px-3', active ? 'bg-ink text-white' : 'text-ink-3 hover:bg-subtle hover:text-ink')
                : cn('pb-3 pt-1', active ? 'text-ink' : 'text-ink-3 hover:text-ink'),
            )}
          >
            {t.icon && <t.icon className="size-4" />}
            {t.label}
            {t.count != null && (
              <span className={cn(
                'rounded-full px-1.5 py-px text-[11px] font-bold tabular',
                pill ? (active ? 'bg-white/20 text-white' : 'bg-subtle text-ink-3') : (active ? 'bg-brand-50 text-brand-700' : 'bg-subtle text-ink-3'),
              )}>{t.count}</span>
            )}
            {!pill && <span className={cn('absolute inset-x-0 -bottom-px h-0.5 origin-center rounded-full bg-brand-600 transition-transform duration-200', active ? 'scale-x-100' : 'scale-x-0')} />}
          </button>
        )
      })}
    </div>
  )
}
