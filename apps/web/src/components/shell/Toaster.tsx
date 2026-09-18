import { CircleCheck, CircleX, Info, TriangleAlert, X } from 'lucide-react'
import { DiscordGlyph } from '@/components/ui'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'

const TONE = {
  success: { icon: CircleCheck, cls: 'bg-emerald-50 text-emerald-600', bar: 'bg-emerald-500' },
  info: { icon: Info, cls: 'bg-brand-50 text-brand-600', bar: 'bg-brand-500' },
  warning: { icon: TriangleAlert, cls: 'bg-amber-50 text-amber-600', bar: 'bg-amber-500' },
  error: { icon: CircleX, cls: 'bg-rose-50 text-rose-600', bar: 'bg-rose-500' },
  discord: { icon: DiscordGlyph, cls: 'bg-discord text-white', bar: 'bg-discord' },
}

export function Toaster() {
  const { toasts, dismissToast } = useStore()
  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((t) => {
        const tone = TONE[t.tone ?? 'success']
        const Icon = tone.icon
        return (
          <div key={t.id} role="status" className="pointer-events-auto relative flex items-start gap-3 overflow-hidden rounded-2xl border border-line bg-surface p-3.5 pr-10 shadow-pop animate-toast-in">
            <span className={cn('grid size-8 shrink-0 place-items-center rounded-xl', tone.cls)}><Icon className="size-4" /></span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[13.5px] font-bold text-ink">{t.title}</p>
              {t.description && <p className="mt-0.5 text-[12.5px] leading-snug text-ink-3">{t.description}</p>}
              {t.action && (
                <button type="button" onClick={() => { t.action!.onClick(); dismissToast(t.id) }} className="mt-2 text-[12.5px] font-bold text-brand-600 hover:text-brand-700">
                  {t.action.label}
                </button>
              )}
            </div>
            <button type="button" onClick={() => dismissToast(t.id)} aria-label="Dismiss" className="absolute right-2 top-2 grid size-7 place-items-center rounded-lg text-ink-3 transition hover:bg-subtle hover:text-ink">
              <X className="size-3.5" />
            </button>
            <span className={cn('absolute inset-x-0 bottom-0 h-0.5 origin-left opacity-60 animate-countdown', tone.bar)} />
          </div>
        )
      })}
    </div>
  )
}
