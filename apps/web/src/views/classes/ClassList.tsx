import { useMemo, type ReactNode } from 'react'
import { GraduationCap, LifeBuoy, Plus, School, TrendingUp, Upload, type LucideIcon } from 'lucide-react'
import { AvatarStack, Button, Card, IconTile, PageHeader, ProgressBar } from '@/components/ui'
import { navigate } from '@/lib/router'
import { openRequestCount, students } from '@/lib/selectors'
import type { Tone } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'
import { ClassCard } from './ClassCard'
import { byPresence, classStats } from './lib'

function Summary({ icon, tone, label, value, sub, onClick }: { icon: LucideIcon; tone: Tone; label: string; value: ReactNode; sub: ReactNode; onClick?: () => void }) {
  const body = (
    <>
      <IconTile icon={icon} tone={tone} size="lg" />
      <span className="min-w-0 flex-1">
        <span className="block text-[12.5px] font-medium text-ink-3">{label}</span>
        <span className="block text-[22px] font-extrabold leading-tight tracking-tight text-ink tabular">{value}</span>
        <span className="mt-0.5 flex items-center gap-2 truncate text-xs text-ink-3">{sub}</span>
      </span>
    </>
  )
  const base = 'flex min-w-0 items-center gap-3.5 px-5 py-4 text-left'
  return onClick
    ? <button type="button" onClick={onClick} className={cn(base, 'transition-colors hover:bg-subtle/60')}>{body}</button>
    : <div className={base}>{body}</div>
}

export function ClassList() {
  const { data, openModal } = useStore()
  const sum = useMemo(() => {
    const all = students(data.people)
    const withWork = data.classes.map((c) => classStats(data, c)).filter((s) => s.assignments.length)
    return {
      students: all.length,
      online: all.filter((p) => p.presence === 'online').sort(byPresence),
      connected: data.classes.filter((c) => c.discord.connected).length,
      completion: withWork.length ? Math.round(withWork.reduce((n, s) => n + s.completion, 0) / withWork.length) : 0,
      requests: openRequestCount(data),
      topics: data.helpClusters.filter((h) => h.status === 'open').length,
    }
  }, [data])

  return (
    <>
      <PageHeader
        title="Classes"
        subtitle={`${data.settings.term} · rosters, teaching teams and Discord spaces for every class.`}
        actions={
          <>
            <Button variant="secondary" icon={Upload} onClick={() => openModal({ type: 'importStudents' })}>Import roster</Button>
            <Button variant="primary" icon={Plus} onClick={() => openModal({ type: 'createClass' })}>New Class</Button>
          </>
        }
      />

      <Card className="grid grid-cols-1 overflow-hidden sm:grid-cols-2 lg:grid-cols-4 lg:divide-x lg:divide-line">
        <Summary
          icon={GraduationCap} tone="sky" label="Students" value={sum.students}
          sub={<><AvatarStack ids={sum.online.map((p) => p.id)} max={3} size="xs" total={sum.online.length} /><span className="tabular">online now</span></>}
        />
        <Summary icon={School} tone="brand" label="Classes" value={data.classes.length} sub={`${sum.connected} connected to Discord`} />
        <Summary
          icon={TrendingUp} tone="emerald" label="Avg. completion" value={`${sum.completion}%`}
          sub={<><ProgressBar value={sum.completion} tone="emerald" size="sm" className="w-20" label="Average completion" /><span>across assignments</span></>}
        />
        <Summary icon={LifeBuoy} tone="amber" label="Open help requests" value={sum.requests} sub={`${sum.topics} topics waiting for an answer`} onClick={() => navigate('/help')} />
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
        {data.classes.map((c, i) => <ClassCard key={c.id} cls={c} index={i} />)}
      </div>
    </>
  )
}
