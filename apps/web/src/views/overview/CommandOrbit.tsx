import type { CSSProperties } from 'react'
import { CalendarClock, CircleCheck, Hash } from 'lucide-react'
import { ClassyncMark, DiscordGlyph, Tooltip } from '@/components/ui'
import { avatarUri } from '@/lib/avatar'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'

// "One academic command center connecting people, classes, schedules, tasks, assistance, and Discord."
const W = 440, H = 256, CX = 220, CY = 132, RX = 168, RY = 96

const NODES: { id: string; angle: number; size: number; delay: number }[] = [
  { id: 'nadia', angle: 196, size: 44, delay: 0 },
  { id: 'haekal', angle: 238, size: 50, delay: -1.6 },
  { id: 'maya', angle: 286, size: 54, delay: -3.1 },
  { id: 'kevin', angle: 334, size: 42, delay: -2.2 },
  { id: 'helven', angle: 18, size: 46, delay: -4.4 },
  { id: 'malik', angle: 118, size: 48, delay: -2.8 },
  { id: 'rania', angle: 160, size: 40, delay: -1.1 },
]
const DISCORD_ANGLE = 70

const pos = (angle: number, rx = RX, ry = RY) => ({ x: CX + rx * Math.cos((angle * Math.PI) / 180), y: CY + ry * Math.sin((angle * Math.PI) / 180) })

export function CommandOrbit({ className }: { className?: string }) {
  const { person, data } = useStore()
  const lastCompleted = data.activities.find((a) => a.type === 'assignments' && a.action === 'completed')
  const discord = pos(DISCORD_ANGLE)

  return (
    <div className={cn('relative shrink-0', className)} style={{ width: W, height: H }} aria-hidden>
      <style>{`
        @keyframes orbit-dash { to { stroke-dashoffset: -32 } }
        @keyframes orbit-pulse { 0%,100% { opacity: .55; transform: scale(1) } 50% { opacity: .9; transform: scale(1.06) } }
        .orbit-line { animation: orbit-dash 2.4s linear infinite }
        @media (prefers-reduced-motion: reduce) { .orbit-line { animation: none } }
      `}</style>

      <svg width={W} height={H} className="absolute inset-0">
        <defs>
          <radialGradient id="orbit-fade" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8b88ea" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8b88ea" stopOpacity="0.15" />
          </radialGradient>
        </defs>
        <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="none" stroke="#cdccf8" strokeWidth="1.2" strokeDasharray="2 6" />
        <ellipse cx={CX} cy={CY} rx={RX * 0.58} ry={RY * 0.58} fill="none" stroke="#e5e5fc" strokeWidth="1.2" />
        {[...NODES.map((n) => pos(n.angle)), discord].map((p, i) => (
          <line key={i} x1={CX} y1={CY} x2={p.x} y2={p.y} stroke="url(#orbit-fade)" strokeWidth="1.4" strokeDasharray="4 4" className="orbit-line" />
        ))}
      </svg>

      {/* hub */}
      <div className="absolute" style={{ left: CX, top: CY, transform: 'translate(-50%, -50%)' }}>
        <div className="absolute inset-0 -m-6 rounded-full bg-brand-400/30 blur-2xl" style={{ animation: 'orbit-pulse 4s ease-in-out infinite' }} />
        <div className="relative grid size-[76px] place-items-center rounded-[26px] bg-white shadow-lift ring-1 ring-brand-100">
          <ClassyncMark size={46} />
        </div>
      </div>

      {NODES.map((n) => {
        const p = pos(n.angle)
        const who = person(n.id)
        return (
          <div key={n.id} className="absolute" style={{ left: p.x, top: p.y, transform: 'translate(-50%, -50%)' }}>
            <Tooltip content={who ? `${who.name} · ${who.role === 'Student' ? `Class ${who.classId}` : who.role}` : ''}>
              <span className="pointer-events-auto relative block animate-float" style={{ animationDelay: `${n.delay}s` } as CSSProperties}>
                <img src={avatarUri(n.id)} alt="" width={n.size} height={n.size} className="rounded-full shadow-lift ring-[3px] ring-white" />
                {who?.presence === 'online' && <span className="absolute bottom-0.5 right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />}
              </span>
            </Tooltip>
          </div>
        )
      })}

      <div className="absolute" style={{ left: discord.x, top: discord.y, transform: 'translate(-50%, -50%)' }}>
        <span className="grid size-11 place-items-center rounded-2xl bg-discord text-white shadow-[0_10px_24px_-8px_rgb(88_101_242/0.7)] ring-[3px] ring-white animate-float [animation-delay:-3.6s]">
          <DiscordGlyph className="size-5" />
        </span>
      </div>

      {/* floating context chips */}
      <div className="absolute left-0 top-1 flex items-center gap-1.5 rounded-full bg-white/95 py-1 pl-1 pr-2.5 text-[11.5px] font-semibold text-ink shadow-lift ring-1 ring-line animate-rise-in [animation-delay:300ms]">
        <span className="grid size-5 place-items-center rounded-full bg-emerald-50 text-emerald-600"><CircleCheck className="size-3.5" /></span>
        {lastCompleted ? `${person(lastCompleted.actorId)?.name.split(' ')[0] ?? 'A student'} completed a task` : 'Tasks in sync'}
      </div>
      <div className="absolute bottom-1 right-0 flex items-center gap-1.5 rounded-full bg-white/95 py-1 pl-1 pr-2.5 text-[11.5px] font-semibold text-ink shadow-lift ring-1 ring-line animate-rise-in [animation-delay:450ms]">
        <span className="grid size-5 place-items-center rounded-full bg-brand-50 text-brand-600"><Hash className="size-3.5" /></span>
        announcement · reminder sent
      </div>
      <div className="absolute bottom-6 left-2 flex items-center gap-1.5 rounded-full bg-white/95 py-1 pl-1 pr-2.5 text-[11.5px] font-semibold text-ink shadow-lift ring-1 ring-line animate-rise-in [animation-delay:600ms]">
        <span className="grid size-5 place-items-center rounded-full bg-orange-50 text-orange-600"><CalendarClock className="size-3.5" /></span>
        Quiz 2 in 2 days
      </div>
    </div>
  )
}
