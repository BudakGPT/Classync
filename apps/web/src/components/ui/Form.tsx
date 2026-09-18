import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { Check, ChevronDown, Minus, Search, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

const CONTROL = 'w-full rounded-xl border border-line bg-surface text-sm text-ink placeholder:text-ink-3 outline-none transition duration-150 hover:border-line-strong focus:border-brand-400 focus:ring-4 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-subtle disabled:text-ink-3'

export function Field({ label, hint, error, required, children, className, htmlFor, action }: {
  label?: ReactNode; hint?: ReactNode; error?: ReactNode; required?: boolean; children: ReactNode; className?: string; htmlFor?: string; action?: ReactNode
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={htmlFor} className="text-[13px] font-semibold text-ink">
            {label}{required && <span className="ml-0.5 text-rose-500" aria-hidden>*</span>}
          </label>
          {action}
        </div>
      )}
      {children}
      {error ? <p role="alert" className="text-xs font-medium text-rose-600">{error}</p> : hint && <p className="text-xs text-ink-3">{hint}</p>}
    </div>
  )
}

export function Input({ icon: Icon, className, trailing, ...props }: InputHTMLAttributes<HTMLInputElement> & { icon?: LucideIcon; trailing?: ReactNode }) {
  return (
    <div className="relative">
      {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />}
      <input {...props} className={cn(CONTROL, 'h-10 px-3', Icon && 'pl-9', trailing && 'pr-10', className)} />
      {trailing && <div className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</div>}
    </div>
  )
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> & { value: string; onChange: (v: string) => void }) {
  return <Input icon={Search} type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cn('h-9', className)} {...props} />
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(CONTROL, 'min-h-24 resize-y px-3 py-2.5 leading-relaxed', className)} />
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select {...props} className={cn(CONTROL, 'h-10 appearance-none pl-3 pr-9 font-medium', className)}>{children}</select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-3" />
    </div>
  )
}

/** Accessible switch. */
export function Toggle({ checked, onChange, label, description, disabled, className, size = 'md' }: {
  checked: boolean; onChange: (v: boolean) => void; label?: ReactNode; description?: ReactNode; disabled?: boolean; className?: string; size?: 'sm' | 'md'
}) {
  const id = useId()
  const sw = (
    <button
      id={id} type="button" role="switch" aria-checked={checked} disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-50',
        size === 'sm' ? 'h-5 w-9' : 'h-6 w-11',
        checked ? 'bg-brand-600' : 'bg-line-strong',
      )}
    >
      <span className={cn(
        'inline-block rounded-full bg-white shadow-[0_1px_3px_rgb(23_23_59/0.3)] transition-transform duration-200 ease-[var(--ease-spring)]',
        size === 'sm' ? 'size-4' : 'size-5',
        checked ? (size === 'sm' ? 'translate-x-[18px]' : 'translate-x-[22px]') : 'translate-x-0.5',
      )} />
    </button>
  )
  if (!label) return <span className={className}>{sw}</span>
  return (
    <div className={cn('flex items-start justify-between gap-4', className)}>
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block text-[13.5px] font-semibold text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-xs leading-relaxed text-ink-3">{description}</span>}
      </label>
      {sw}
    </div>
  )
}

export function Checkbox({ checked, onChange, indeterminate, label, disabled, className, 'aria-label': ariaLabel }: {
  checked: boolean; onChange: (v: boolean) => void; indeterminate?: boolean; label?: ReactNode; disabled?: boolean; className?: string; 'aria-label'?: string
}) {
  const on = checked || indeterminate
  return (
    <label className={cn('inline-flex cursor-pointer items-center gap-2 text-[13px] font-medium text-ink-2', disabled && 'cursor-not-allowed opacity-50', className)} onClick={(e) => e.stopPropagation()}>
      <span className="relative inline-grid size-4 shrink-0 place-items-center">
        <input
          type="checkbox" checked={checked} disabled={disabled} aria-label={ariaLabel}
          ref={(el) => { if (el) el.indeterminate = !!indeterminate }}
          onChange={(e) => onChange(e.target.checked)}
          className={cn('peer size-4 cursor-pointer appearance-none rounded-[5px] border transition duration-150', on ? 'border-brand-600 bg-brand-600' : 'border-line-strong bg-surface hover:border-brand-400')}
        />
        {indeterminate ? <Minus className="pointer-events-none absolute size-3 text-white" strokeWidth={3} /> : checked && <Check className="pointer-events-none absolute size-3 text-white animate-check-in" strokeWidth={3} />}
      </span>
      {label}
    </label>
  )
}

export interface Option<T extends string> { value: T; label: ReactNode; icon?: LucideIcon; description?: ReactNode; disabled?: boolean }

/** Compact pill switcher (views, modes). */
export function Segmented<T extends string>({ options, value, onChange, size = 'md', className, 'aria-label': ariaLabel }: {
  options: Option<T>[]; value: T; onChange: (v: T) => void; size?: 'sm' | 'md'; className?: string; 'aria-label'?: string
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn('inline-flex rounded-xl bg-subtle p-1', className)}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value} type="button" role="radio" aria-checked={active} disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg font-semibold transition duration-150 disabled:opacity-50',
              size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-[13px]',
              active ? 'bg-surface text-ink shadow-[0_1px_2px_rgb(23_23_59/0.1),0_0_0_1px_rgb(23_23_59/0.04)]' : 'text-ink-3 hover:text-ink',
            )}
          >
            {o.icon && <o.icon className="size-3.5" />}{o.label}
          </button>
        )
      })}
    </div>
  )
}

/** Selectable cards with icon + description (group type, audience, schedule mode...). */
export function OptionCards<T extends string>({ options, value, onChange, columns = 3, className }: {
  options: Option<T>[]; value: T; onChange: (v: T) => void; columns?: 2 | 3 | 4 | 5 | 6; className?: string
}) {
  const cols = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-4', 5: 'sm:grid-cols-5', 6: 'sm:grid-cols-6' }[columns]
  return (
    <div role="radiogroup" className={cn('grid grid-cols-2 gap-2', cols, className)}>
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value} type="button" role="radio" aria-checked={active} disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              'group relative flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition duration-150 disabled:opacity-50',
              active ? 'border-brand-400 bg-brand-50/60 ring-4 ring-brand-100' : 'border-line bg-surface hover:border-line-strong hover:bg-subtle/60',
            )}
          >
            {o.icon && <o.icon className={cn('size-4', active ? 'text-brand-600' : 'text-ink-3 group-hover:text-ink-2')} />}
            <span className={cn('text-[13px] font-semibold', active ? 'text-brand-800' : 'text-ink')}>{o.label}</span>
            {o.description && <span className="text-[11.5px] leading-snug text-ink-3">{o.description}</span>}
            {active && <span className="absolute right-2 top-2 grid size-4 place-items-center rounded-full bg-brand-600 text-white animate-check-in"><Check className="size-2.5" strokeWidth={3.5} /></span>}
          </button>
        )
      })}
    </div>
  )
}
