import type { CSSProperties, ReactNode } from 'react'
import { ClipboardCheck, Clock3, Megaphone, Users, type LucideIcon } from 'lucide-react'
import { AvatarStack, Card, Donut, IconTile, ProgressBar } from '@/components/ui'
import { students } from '@/lib/selectors'
import { tone } from '@/lib/tones'
import type { Tone } from '@/lib/types'
import { useStore } from '@/store/store'
import { Delta, Sparkline, Tween } from './charts'
import { KPIS, PERIOD, type Range } from './data'

function Kpi({ label, icon, iconTone, value, delta, vs, visual, footer, index }: {
  label: string; icon: LucideIcon; iconTone: Tone; value: ReactNode; delta: ReactNode; vs: string; visual?: ReactNode; footer: ReactNode; index: number
}) {
  return (
    <Card className="flex flex-col p-5 animate-rise-in" style={{ animationDelay: `${index * 50}ms` } as CSSProperties}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[13px] font-medium text-ink-3">{label}</span>
        <IconTile icon={icon} tone={iconTone} size="sm" />
      </div>
      <div className="mt-3 flex flex-1 items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[30px] font-extrabold leading-none tracking-tight text-ink">{value}</div>
          <div className="mt-2.5 flex items-center gap-1.5 whitespace-nowrap text-xs text-ink-3">{delta}<span>{vs}</span></div>
        </div>
        {visual}
      </div>
      <div className="mt-4 border-t border-line pt-3 text-xs text-ink-3">{footer}</div>
    </Card>
  )
}

export function KpiRow({ range }: { range: Range }) {
  const { data } = useStore()
  const k = KPIS[range]
  const vs = PERIOD[range].vs
  const roster = students(data.people)
  const online = roster.filter((p) => p.presence === 'online').sort((a, b) => Number(!!b.featured) - Number(!!a.featured)).map((p) => p.id)
  const unit = (u: string) => <span className="ml-1 text-[15px] font-bold tracking-normal text-ink-3">{u}</span>

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi
        index={0} label="Assignment completion rate" icon={ClipboardCheck} iconTone="brand" vs={vs}
        value={<Tween value={k.completion} suffix="%" />}
        delta={<Delta value={k.completionDelta} />}
        visual={<Donut value={k.completion} size={58} stroke={7} tone="brand" label={`${k.completion}% of tasks completed`}><span /></Donut>}
        footer={<><span className="font-semibold text-ink-2 tabular">{k.tasksDone.toLocaleString('en-US')}</span> of {k.tasksTotal.toLocaleString('en-US')} tasks marked done</>}
      />
      <Kpi
        index={1} label="Average response time" icon={Clock3} iconTone="teal" vs={vs}
        value={<><Tween value={k.response} />{unit('min')}</>}
        delta={<Delta value={k.responseDelta} unit=" min" goodWhenUp={false} />}
        visual={<Sparkline key={range} values={k.responseTrend} color={tone('teal').hex} height={40} className="w-24" />}
        footer={<><span className="font-semibold text-ink-2 tabular">{k.within1h}%</span> of help requests answered within 1 hour</>}
      />
      <Kpi
        index={2} label="Active students" icon={Users} iconTone="sky" vs={vs}
        value={<Tween value={k.active} />}
        delta={<Delta value={k.activeDelta} unit="" />}
        visual={<AvatarStack ids={online} max={4} total={k.active} size="md" className="mb-0.5" />}
        footer={<>of <span className="font-semibold text-ink-2 tabular">{roster.length}</span> enrolled · {Math.round((k.active / roster.length) * 100)}% active on Discord or in class</>}
      />
      <Kpi
        index={3} label="Announcements delivered" icon={Megaphone} iconTone="amber" vs={vs}
        value={<Tween value={k.delivered} suffix="%" />}
        delta={<Delta value={k.deliveredDelta} />}
        visual={
          <dl className="mb-0.5 space-y-1 text-right text-[11.5px]">
            <div className="flex justify-end gap-2"><dt className="text-ink-3">Discord DM</dt><dd className="font-bold text-ink tabular">{Math.min(99, k.delivered + 2)}%</dd></div>
            <div className="flex justify-end gap-2"><dt className="text-ink-3">#announcement</dt><dd className="font-bold text-ink tabular">{k.delivered - 3}%</dd></div>
          </dl>
        }
        footer={
          <div className="space-y-2">
            <ProgressBar value={k.delivered} tone="amber" size="sm" label="Announcements delivered" />
            <div><span className="font-semibold text-ink-2 tabular">{k.deliveries.toLocaleString('en-US')}</span> of {k.deliveriesTotal.toLocaleString('en-US')} · rest pending verification</div>
          </div>
        }
      />
    </div>
  )
}
