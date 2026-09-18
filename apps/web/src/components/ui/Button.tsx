import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip } from './Overlay'

const VARIANT = {
  primary: 'bg-brand-600 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.16),0_1px_2px_rgb(23_23_59/0.18)] hover:bg-brand-700',
  secondary: 'border border-line bg-surface text-ink shadow-card hover:border-line-strong hover:bg-subtle',
  ghost: 'text-ink-2 hover:bg-subtle hover:text-ink',
  soft: 'bg-brand-50 text-brand-700 hover:bg-brand-100',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  'danger-soft': 'bg-rose-50 text-rose-700 hover:bg-rose-100',
  discord: 'bg-discord text-white hover:bg-[#4752c4]',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700',
}
const SIZE = {
  xs: 'h-7 gap-1 rounded-lg px-2 text-xs',
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-[13px]',
  md: 'h-9 gap-2 rounded-xl px-3.5 text-sm',
  lg: 'h-11 gap-2 rounded-xl px-5 text-[15px]',
}
const ICON = { xs: 'size-3.5', sm: 'size-3.5', md: 'size-4', lg: 'size-[18px]' }

export type ButtonVariant = keyof typeof VARIANT
export type ButtonSize = keyof typeof SIZE

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: LucideIcon
  iconRight?: LucideIcon
  loading?: boolean
  'data-autofocus'?: boolean
}

export function Button({ variant = 'secondary', size = 'md', icon: Icon, iconRight: IconRight, loading, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap font-semibold transition duration-150 ease-out active:scale-[0.97] disabled:pointer-events-none disabled:opacity-55',
        VARIANT[variant], SIZE[size], className,
      )}
    >
      {loading ? <Loader2 className={cn(ICON[size], 'animate-spin')} /> : Icon && <Icon className={ICON[size]} />}
      {children}
      {IconRight && !loading && <IconRight className={cn(ICON[size], 'opacity-70')} />}
    </button>
  )
}

const ICON_BTN = { xs: 'size-7 rounded-lg', sm: 'size-8 rounded-lg', md: 'size-9 rounded-xl', lg: 'size-11 rounded-xl' }

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon
  label: string // accessible name + tooltip
  variant?: ButtonVariant
  size?: ButtonSize
  tooltip?: boolean
  badge?: ReactNode
}

export function IconButton({ icon: Icon, label, variant = 'ghost', size = 'md', tooltip = true, badge, className, ...props }: IconButtonProps) {
  const btn = (
    <button
      type="button" aria-label={label} {...props}
      className={cn('relative inline-grid shrink-0 place-items-center transition duration-150 active:scale-[0.94] disabled:pointer-events-none disabled:opacity-50', VARIANT[variant], ICON_BTN[size], className)}
    >
      <Icon className={ICON[size]} />
      {badge}
    </button>
  )
  return tooltip ? <Tooltip content={label}>{btn}</Tooltip> : btn
}
