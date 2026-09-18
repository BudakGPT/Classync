import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { Check, Loader2, type LucideIcon } from 'lucide-react'
import { tone as toneOf } from '@/lib/tones'
import type { Tone } from '@/lib/types'
import { cn } from '@/lib/utils'
import { avatarUri } from '@/lib/avatar'
import { Button } from './Button'

/** Animates from 0 to `value` on mount / change. */
function useAnimatedValue(value: number) {
  const [v, setV] = useState(0)
  useEffect(() => {
    const r = requestAnimationFrame(() => setV(value))
    return () => cancelAnimationFrame(r)
  }, [value])
  return v
}

export function ProgressBar({ value, tone = 'brand', size = 'md', className, label }: { value: number; tone?: Tone; size?: 'sm' | 'md' | 'lg'; className?: string; label?: string }) {
  const v = Math.max(0, Math.min(100, useAnimatedValue(value)))
  return (
    <div role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} aria-label={label}
      className={cn('relative w-full overflow-hidden rounded-full bg-subtle', size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2', className)}>
      <div className={cn('h-full w-full rounded-full transition-transform duration-700 ease-[var(--ease-out)]', toneOf(tone).solid)} style={{ transform: `translateX(${v - 100}%)` }} />
    </div>
  )
}

/** Multi-segment bar, e.g. completed / in progress / stuck. */
export function StackedProgress({ segments, total, size = 'md', className }: {
  segments: { value: number; tone: Tone; label: string }[]; total: number; size?: 'sm' | 'md' | 'lg'; className?: string
}) {
  const [ready, setReady] = useState(false)
  useEffect(() => { const r = requestAnimationFrame(() => setReady(true)); return () => cancelAnimationFrame(r) }, [])
  return (
    <div className={cn('flex w-full gap-0.5 overflow-hidden rounded-full bg-subtle', size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2', className)}
      role="img" aria-label={segments.map((s) => `${s.label}: ${s.value}`).join(', ')}>
      {segments.map((s) => (
        <div key={s.label} title={`${s.label}: ${s.value}`}
          className={cn('h-full rounded-full transition-[width] duration-700 ease-[var(--ease-out)]', toneOf(s.tone).solid)}
          style={{ width: ready && total ? `${(s.value / total) * 100}%` : '0%' }} />
      ))}
    </div>
  )
}

/** Circular progress ring with centered content. */
export function Donut({ value, size = 64, stroke = 7, tone = 'brand', children, className, label }: {
  value: number; size?: number; stroke?: number; tone?: Tone; children?: ReactNode; className?: string; label?: string
}) {
  const v = useAnimatedValue(value)
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className={cn('relative inline-grid shrink-0 place-items-center', className)} style={{ width: size, height: size }} role="img" aria-label={label ?? `${Math.round(value)}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-subtle" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} strokeLinecap="round" stroke={toneOf(tone).hex}
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0, Math.min(100, v)) / 100)} className="transition-[stroke-dashoffset] duration-700 ease-[var(--ease-out)]" />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children ?? <span className="text-sm font-bold text-ink tabular">{Math.round(value)}%</span>}</div>
    </div>
  )
}

export const Spinner = ({ className }: { className?: string }) => <Loader2 className={cn('size-4 animate-spin text-brand-600', className)} />
export const Kbd = ({ children, className }: { children: ReactNode; className?: string }) => (
  <kbd className={cn('inline-flex h-5 min-w-5 items-center justify-center rounded-md border border-line bg-surface px-1 font-sans text-[10.5px] font-semibold text-ink-3 shadow-[0_1px_0_var(--color-line)]', className)}>{children}</kbd>
)
export const Skeleton = ({ className }: { className?: string }) => <div className={cn('skeleton rounded-lg', className)} />

/** Three friendly characters in a soft blob with an icon badge — used by empty states and success screens. */
export function CharacterScene({ ids = ['nadia', 'haekal', 'kevin'], icon: Icon, tone = 'brand', className }: { ids?: string[]; icon?: LucideIcon; tone?: Tone; className?: string }) {
  const t = toneOf(tone)
  return (
    <div className={cn('relative mx-auto h-28 w-44', className)} aria-hidden>
      <div className={cn('absolute inset-x-3 bottom-2 top-4 rounded-[45%]', t.soft)} />
      <div className="bg-dots absolute inset-x-6 bottom-0 top-8 rounded-[45%] opacity-60" />
      {ids[1] && <img src={avatarUri(ids[1])} alt="" className="absolute left-4 top-10 size-12 rounded-full ring-4 ring-white animate-float [animation-delay:-2s]" />}
      {ids[0] && <img src={avatarUri(ids[0])} alt="" className="absolute left-1/2 top-2 size-16 -translate-x-1/2 rounded-full ring-4 ring-white shadow-lift animate-float" />}
      {ids[2] && <img src={avatarUri(ids[2])} alt="" className="absolute right-4 top-11 size-11 rounded-full ring-4 ring-white animate-float [animation-delay:-4s]" />}
      {Icon && (
        <span className={cn('absolute bottom-0 left-1/2 grid size-9 -translate-x-1/2 place-items-center rounded-xl bg-surface shadow-lift ring-1 ring-line', t.text)}>
          <Icon className="size-[18px]" />
        </span>
      )}
    </div>
  )
}

export function EmptyState({ title, description, action, icon, characters, tone = 'brand', compact, className }: {
  title: ReactNode; description?: ReactNode; action?: { label: string; onClick: () => void; icon?: LucideIcon }
  icon?: LucideIcon; characters?: string[]; tone?: Tone; compact?: boolean; className?: string
}) {
  return (
    <div className={cn('flex flex-col items-center text-center', compact ? 'px-4 py-8' : 'px-6 py-14', className)}>
      <CharacterScene ids={characters} icon={icon} tone={tone} />
      <h3 className="mt-5 text-[15px] font-bold text-ink">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-ink-3">{description}</p>}
      {action && <Button variant="primary" size="sm" icon={action.icon} onClick={action.onClick} className="mt-4">{action.label}</Button>}
    </div>
  )
}

const CONFETTI = ['bg-brand-500', 'bg-teal-400', 'bg-amber-400', 'bg-pink-400', 'bg-sky-400', 'bg-emerald-400']

/** Animated check + confetti pop. */
export function SuccessBurst({ className, size = 72 }: { className?: string; size?: number }) {
  return (
    <div className={cn('relative mx-auto grid place-items-center', className)} style={{ width: size * 1.8, height: size * 1.8 }} aria-hidden>
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2
        const d = size * (0.8 + (i % 3) * 0.12)
        return (
          <span key={i} className={cn('absolute size-2 rounded-[3px] animate-confetti', CONFETTI[i % CONFETTI.length])}
            style={{ '--dx': `${Math.cos(a) * d}px`, '--dy': `${Math.sin(a) * d}px`, animationDelay: `${120 + (i % 4) * 30}ms`, rotate: `${i * 26}deg` } as CSSProperties} />
        )
      })}
      <span className="grid place-items-center rounded-full bg-emerald-500 text-white shadow-[0_12px_30px_-8px_rgb(16_185_129/0.6)] animate-pop" style={{ width: size, height: size }}>
        <svg viewBox="0 0 24 24" className="size-1/2" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.5 4.5L19 7.5" strokeDasharray="48" className="animate-draw" />
        </svg>
      </span>
    </div>
  )
}

/** Steps that tick off one by one — simulates background work (sync, import, provisioning). */
export function StepChecklist({ steps, interval = 550, onDone, className }: { steps: ReactNode[]; interval?: number; onDone?: () => void; className?: string }) {
  const [done, setDone] = useState(0)
  useEffect(() => {
    if (done >= steps.length) { onDone?.(); return }
    const t = setTimeout(() => setDone((d) => d + 1), interval)
    return () => clearTimeout(t)
  }, [done, steps.length, interval]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <ul className={cn('space-y-2', className)}>
      {steps.map((s, i) => {
        const state = i < done ? 'done' : i === done ? 'active' : 'idle'
        return (
          <li key={i} className={cn('flex items-center gap-2.5 text-[13px] transition-opacity duration-200', state === 'idle' ? 'opacity-40' : 'opacity-100')}>
            <span className={cn('grid size-5 shrink-0 place-items-center rounded-full', state === 'done' ? 'bg-emerald-500 text-white' : 'bg-subtle')}>
              {state === 'done' ? <Check className="size-3 animate-check-in" strokeWidth={3} /> : state === 'active' ? <Loader2 className="size-3 animate-spin text-brand-600" /> : null}
            </span>
            <span className={cn('font-medium', state === 'done' ? 'text-ink' : 'text-ink-2')}>{s}</span>
          </li>
        )
      })}
    </ul>
  )
}
