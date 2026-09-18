import type { HTMLAttributes, KeyboardEvent, ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react'
import type { Tone } from '@/lib/types'
import { cn } from '@/lib/utils'
import { IconTile } from './Badge'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Lift on hover + keyboard activation (Enter/Space trigger onClick). */
  interactive?: boolean
}

export function Card({ interactive, className, onClick, children, ...props }: CardProps) {
  const onKeyDown = interactive && onClick
    ? (e: KeyboardEvent<HTMLDivElement>) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick(e as never) } }
    : undefined
  return (
    <div
      {...props}
      onClick={onClick}
      onKeyDown={onKeyDown}
      role={interactive && onClick ? 'button' : props.role}
      tabIndex={interactive && onClick ? 0 : props.tabIndex}
      className={cn(
        'rounded-2xl border border-line bg-surface shadow-card',
        interactive && 'cursor-pointer transition duration-200 ease-out hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift active:translate-y-0',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, icon, tone = 'brand', action, className }: {
  title: ReactNode; subtitle?: ReactNode; icon?: LucideIcon; tone?: Tone; action?: ReactNode; className?: string
}) {
  return (
    <div className={cn('flex items-start justify-between gap-3 px-5 pt-5', className)}>
      <div className="flex min-w-0 items-center gap-3">
        {icon && <IconTile icon={icon} tone={tone} size="sm" />}
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-bold tracking-tight text-ink">{title}</h3>
          {subtitle && <p className="truncate text-xs text-ink-3">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex shrink-0 items-center gap-1.5">{action}</div>}
    </div>
  )
}

/** Standard page top: title, subtitle, actions on the right. */
export function PageHeader({ title, subtitle, actions, eyebrow, children, className }: {
  title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode; children?: ReactNode; className?: string
}) {
  return (
    <div className={cn('mb-6 flex flex-wrap items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        {eyebrow && <div className="mb-1.5">{eyebrow}</div>}
        <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-[14px] text-ink-3">{subtitle}</p>}
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/** Compact KPI card. trend.good decides color (defaults to up = good). */
export function StatCard({ label, value, icon, tone = 'brand', trend, footer, className, onClick }: {
  label: string; value: ReactNode; icon: LucideIcon; tone?: Tone
  trend?: { value: string; up: boolean; good?: boolean; label?: string }
  footer?: ReactNode; className?: string; onClick?: () => void
}) {
  const good = trend ? (trend.good ?? trend.up) : true
  return (
    <Card interactive={!!onClick} onClick={onClick} className={cn('p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <span className="text-[13px] font-medium text-ink-3">{label}</span>
        <IconTile icon={icon} tone={tone} size="sm" />
      </div>
      <div className="mt-2 flex items-end gap-2">
        <span className="text-[28px] font-extrabold leading-none tracking-tight text-ink tabular">{value}</span>
        {trend && (
          <span className={cn('mb-0.5 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold', good ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}>
            {trend.up ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}{trend.value}
          </span>
        )}
      </div>
      {(footer || trend?.label) && <div className="mt-3 text-xs text-ink-3">{footer ?? trend?.label}</div>}
    </Card>
  )
}
