import {
  cloneElement, isValidElement, useEffect, useId, useLayoutEffect, useRef, useState,
  type ReactElement, type ReactNode, type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { TriangleAlert, X, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './Button'

// ── shared overlay plumbing ────────────────────────────────────────────────
const FOCUSABLE = 'input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
const layers: object[] = []

/** Keep an element mounted briefly after `open` flips false so it can animate out. */
function usePresence(open: boolean, ms = 150) {
  const [mounted, setMounted] = useState(open)
  const [closing, setClosing] = useState(false)
  useEffect(() => {
    if (open) { setMounted(true); setClosing(false); return }
    setClosing(true)
    const t = setTimeout(() => { setMounted(false); setClosing(false) }, ms)
    return () => clearTimeout(t)
  }, [open, ms])
  return { mounted: open || mounted, closing: !open && closing }
}

/** Esc to close (topmost layer only), focus trap, focus restore, body scroll lock. */
function useLayer(open: boolean, onClose: () => void, panel: RefObject<HTMLElement | null>) {
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    if (!open) return
    const token = {}
    layers.push(token)
    const previous = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    const raf = requestAnimationFrame(() => {
      const el = panel.current
      const target = el?.querySelector<HTMLElement>('[data-autofocus]') ?? el?.querySelector<HTMLElement>('input:not([type="checkbox"]):not([type="radio"]), textarea')
      ;(target ?? el)?.focus({ preventScroll: true })
    })
    const onKey = (e: KeyboardEvent) => {
      if (layers[layers.length - 1] !== token) return
      if (e.key === 'Escape') { e.preventDefault(); close.current() }
      if (e.key === 'Tab' && panel.current) {
        const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => n.offsetParent !== null)
        if (!items.length) return
        const first = items[0], last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', onKey)
      layers.splice(layers.indexOf(token), 1)
      if (!layers.length) document.body.style.overflow = ''
      previous?.focus?.({ preventScroll: true })
    }
  }, [open, panel])
}

// ── Modal ─────────────────────────────────────────────────────────────────
const MODAL_SIZE = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', '2xl': 'max-w-6xl' }

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  icon?: LucideIcon
  size?: keyof typeof MODAL_SIZE
  children: ReactNode
  footer?: ReactNode
  className?: string
  bodyClassName?: string
}

export function Modal({ open, onClose, title, description, icon: Icon, size = 'md', children, footer, className, bodyClassName }: ModalProps) {
  const { mounted, closing } = usePresence(open)
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useLayer(open, onClose, ref)
  if (!mounted) return null
  return createPortal(
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className={cn('fixed inset-0 bg-ink/45 backdrop-blur-[2px] transition-opacity duration-150', closing ? 'opacity-0' : 'animate-fade-in')} onClick={onClose} aria-hidden />
      <div className="relative flex min-h-full items-start justify-center p-4 sm:p-8 sm:pt-[7vh]">
        <div
          ref={ref} role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined} tabIndex={-1}
          className={cn('relative w-full rounded-2xl bg-surface shadow-pop outline-none transition duration-150', MODAL_SIZE[size], closing ? 'scale-[0.98] opacity-0' : 'animate-scale-in', className)}
        >
          {title && (
            <header className="flex items-start gap-3 border-b border-line px-6 py-4 pr-14">
              {Icon && <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon className="size-[18px]" /></span>}
              <div className="min-w-0">
                <h2 id={titleId} className="text-base font-bold tracking-tight text-ink">{title}</h2>
                {description && <p className="mt-0.5 text-[13px] text-ink-3">{description}</p>}
              </div>
            </header>
          )}
          <button type="button" onClick={onClose} aria-label="Close dialog" className="absolute right-3.5 top-3.5 grid size-8 place-items-center rounded-lg text-ink-3 transition hover:bg-subtle hover:text-ink">
            <X className="size-4" />
          </button>
          <div className={cn('px-6 py-5', bodyClassName)}>{children}</div>
          {footer && <footer className="flex flex-wrap items-center justify-end gap-2 rounded-b-2xl border-t border-line bg-canvas/60 px-6 py-3.5">{footer}</footer>}
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ── Drawer ────────────────────────────────────────────────────────────────
const DRAWER_SIZE = { md: 'max-w-md', lg: 'max-w-xl', xl: 'max-w-3xl' }

export interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  size?: keyof typeof DRAWER_SIZE
  children: ReactNode
  footer?: ReactNode
  bodyClassName?: string
}

export function Drawer({ open, onClose, title, subtitle, actions, size = 'md', children, footer, bodyClassName }: DrawerProps) {
  const { mounted, closing } = usePresence(open, 200)
  const ref = useRef<HTMLElement>(null)
  const titleId = useId()
  useLayer(open, onClose, ref)
  if (!mounted) return null
  return createPortal(
    <div className="fixed inset-0 z-40">
      <div className={cn('absolute inset-0 bg-ink/30 transition-opacity duration-200', closing ? 'opacity-0' : 'animate-fade-in')} onClick={onClose} aria-hidden />
      <aside
        ref={ref} role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined} tabIndex={-1}
        className={cn('absolute inset-y-0 right-0 flex w-full flex-col bg-surface shadow-pop outline-none transition-transform duration-200 ease-in', DRAWER_SIZE[size], closing ? 'translate-x-full' : 'animate-slide-in-right')}
      >
        <header className="flex items-start gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0 flex-1">
            {title && <h2 id={titleId} className="truncate text-base font-bold tracking-tight text-ink">{title}</h2>}
            {subtitle && <div className="mt-0.5 text-[13px] text-ink-3">{subtitle}</div>}
          </div>
          {actions}
          <button type="button" onClick={onClose} aria-label="Close panel" className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-3 transition hover:bg-subtle hover:text-ink">
            <X className="size-4" />
          </button>
        </header>
        <div className={cn('scrollbar-thin flex-1 overflow-y-auto px-5 py-5', bodyClassName)}>{children}</div>
        {footer && <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-canvas/60 px-5 py-3.5">{footer}</footer>}
      </aside>
    </div>,
    document.body,
  )
}

// ── ConfirmDialog ─────────────────────────────────────────────────────────
export function ConfirmDialog({
  open, onClose, onConfirm, title, description, confirmLabel = 'Confirm', tone = 'danger', loading, children,
}: {
  open: boolean; onClose: () => void; onConfirm: () => void; title: ReactNode; description?: ReactNode
  confirmLabel?: string; tone?: 'danger' | 'primary'; loading?: boolean; children?: ReactNode
}) {
  return (
    <Modal open={open} onClose={onClose} size="sm" bodyClassName="px-6 pb-2 pt-6" footer={
      <>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading} data-autofocus>{confirmLabel}</Button>
      </>
    }>
      <div className="flex gap-4">
        <span className={cn('grid size-10 shrink-0 place-items-center rounded-full', tone === 'danger' ? 'bg-rose-50 text-rose-600' : 'bg-brand-50 text-brand-600')}>
          <TriangleAlert className="size-5" />
        </span>
        <div className="min-w-0 pb-3">
          <h2 className="text-base font-bold text-ink">{title}</h2>
          {description && <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{description}</p>}
          {children}
        </div>
      </div>
    </Modal>
  )
}

// ── Tooltip ───────────────────────────────────────────────────────────────
export function Tooltip({ content, children, side = 'top', className }: { content: ReactNode; children: ReactNode; side?: 'top' | 'bottom' | 'right'; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  const show = () => {
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    setPos(side === 'right' ? { x: r.right + 10, y: r.top + r.height / 2 } : side === 'bottom' ? { x: r.left + r.width / 2, y: r.bottom + 6 } : { x: r.left + r.width / 2, y: r.top - 6 })
  }
  const hide = () => setPos(null)
  return (
    <span ref={ref} className={className ?? 'inline-flex'} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide} onClick={hide}>
      {children}
      {pos && content != null && createPortal(
        <span
          role="tooltip" style={{ left: pos.x, top: pos.y }}
          className={cn(
            'pointer-events-none fixed z-[70] max-w-xs rounded-lg bg-ink px-2 py-1 text-xs font-medium leading-snug text-white shadow-pop animate-fade-in',
            side === 'top' && '-translate-x-1/2 -translate-y-full', side === 'bottom' && '-translate-x-1/2', side === 'right' && '-translate-y-1/2',
          )}
        >{content}</span>,
        document.body,
      )}
    </span>
  )
}

// ── Popover / Menu ────────────────────────────────────────────────────────
export function Popover({
  trigger, children, align = 'end', width = 240, className,
}: {
  trigger: ReactElement
  children: ReactNode | ((close: () => void) => ReactNode)
  align?: 'start' | 'end'
  width?: number
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const [style, setStyle] = useState<React.CSSProperties>({})
  const anchor = useRef<HTMLSpanElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const close = () => setOpen(false)

  useLayoutEffect(() => {
    if (!open || !anchor.current) return
    const r = anchor.current.getBoundingClientRect()
    const h = panel.current?.offsetHeight ?? 0
    const below = r.bottom + 6 + h < window.innerHeight - 8
    const left = align === 'end' ? Math.max(8, r.right - width) : Math.min(r.left, window.innerWidth - width - 8)
    setStyle({ left, width, top: below ? r.bottom + 6 : Math.max(8, r.top - 6 - h) })
  }, [open, align, width])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (!panel.current?.contains(t) && !anchor.current?.contains(t)) close()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { close(); (anchor.current?.querySelector(FOCUSABLE) as HTMLElement | null)?.focus() }
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const items = [...(panel.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? [])]
        if (!items.length) return
        e.preventDefault()
        const i = items.indexOf(document.activeElement as HTMLElement)
        items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus()
      }
    }
    const onScroll = (e: Event) => { if (!panel.current?.contains(e.target as Node)) close() }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', close)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', close)
    }
  }, [open])

  const triggerEl = isValidElement(trigger)
    ? cloneElement(trigger as ReactElement<Record<string, unknown>>, { 'aria-expanded': open, 'aria-haspopup': 'menu' })
    : trigger

  return (
    <>
      <span ref={anchor} className="inline-flex" onClick={(e) => { e.stopPropagation(); setOpen((o) => !o) }}>{triggerEl}</span>
      {open && createPortal(
        <div
          ref={panel} style={style} onClick={(e) => e.stopPropagation()}
          className={cn('fixed z-[60] origin-top rounded-xl border border-line bg-surface p-1 shadow-pop animate-scale-in', className)}
        >
          {typeof children === 'function' ? children(close) : children}
        </div>,
        document.body,
      )}
    </>
  )
}

export interface MenuItem {
  label: string
  icon?: LucideIcon
  onSelect?: () => void
  hint?: string
  description?: string
  danger?: boolean
  disabled?: boolean
  divider?: boolean // draw a separator above this item
}

export function Menu({ trigger, items, align = 'end', width = 220, label }: { trigger: ReactElement; items: MenuItem[]; align?: 'start' | 'end'; width?: number; label?: string }) {
  return (
    <Popover trigger={trigger} align={align} width={width}>
      {(close) => (
        <div role="menu" aria-label={label}>
          {label && <div className="px-2.5 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-3">{label}</div>}
          {items.map((it, i) => (
            <div key={it.label + i}>
              {it.divider && <div className="my-1 h-px bg-line" />}
              <button
                type="button" role="menuitem" disabled={it.disabled} autoFocus={i === 0}
                onClick={() => { close(); it.onSelect?.() }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium outline-none transition-colors disabled:opacity-50',
                  it.danger ? 'text-rose-600 hover:bg-rose-50 focus:bg-rose-50' : 'text-ink-2 hover:bg-subtle hover:text-ink focus:bg-subtle focus:text-ink',
                )}
              >
                {it.icon && <it.icon className="size-4 shrink-0 opacity-80" />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{it.label}</span>
                  {it.description && <span className="block truncate text-xs font-normal text-ink-3">{it.description}</span>}
                </span>
                {it.hint && <span className="text-[11px] text-ink-3">{it.hint}</span>}
              </button>
            </div>
          ))}
        </div>
      )}
    </Popover>
  )
}
