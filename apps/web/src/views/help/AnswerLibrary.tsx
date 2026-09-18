import { useState, type CSSProperties } from 'react'
import { Eye, Lightbulb, PencilLine, Repeat2, SearchX, Sparkles } from 'lucide-react'
import { Avatar, Badge, Button, Card, Donut, EmptyState, SearchInput, Segmented, Tooltip } from '@/components/ui'
import { shortName } from '@/lib/selectors'
import { relTime } from '@/lib/time'
import type { ReusableAnswer } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'
import { queueClusters } from './helpers'
import { SectionTitle } from './parts'

type Sort = 'used' | 'helpful' | 'recent'
interface Handlers { onView: (id: string) => void; onReuse: (a: ReusableAnswer) => void; onEdit: (id: string) => void }

export function AnswerLibrary({ className, ...handlers }: Handlers & { className?: string }) {
  const { data, person } = useStore()
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<Sort>('used')
  const needle = q.trim().toLowerCase()
  const list = data.answers
    .filter((a) => !needle || `${a.title} ${a.concept} ${a.body} ${person(a.authorId)?.name ?? ''}`.toLowerCase().includes(needle))
    .sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew)
      || (sort === 'used' ? b.usedCount - a.usedCount : sort === 'helpful' ? b.helpfulPct - a.helpfulPct : b.updatedAt.localeCompare(a.updatedAt)))

  return (
    <section id="answer-library" aria-labelledby="library-title" className={cn('scroll-mt-24', className)}>
      <SectionTitle
        id="library-title"
        title="Reusable answers"
        subtitle={`${data.helpStats.reusableAnswers} answers in your library · reuse one to reply to a whole group in seconds`}
        action={
          <>
            <SearchInput value={q} onChange={setQ} placeholder="Search answers…" aria-label="Search reusable answers" className="w-56" />
            <Segmented size="sm" aria-label="Sort answers" value={sort} onChange={setSort} options={[
              { value: 'used', label: 'Most used' }, { value: 'helpful', label: 'Most helpful' }, { value: 'recent', label: 'Recent' },
            ]} />
          </>
        }
      />
      {list.length === 0 ? (
        <Card>
          <EmptyState compact icon={SearchX} characters={['sarah', 'maya', 'farhan']} title={`No answers match “${q.trim()}”`}
            description="Try a concept name such as PCA, SQL JOIN or regression." action={{ label: 'Clear search', onClick: () => setQ('') }} />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((a, i) => <AnswerCard key={a.id} answer={a} {...handlers} style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }} />)}
        </div>
      )}
    </section>
  )
}

function AnswerCard({ answer: a, onView, onReuse, onEdit, style }: Handlers & { answer: ReusableAnswer; style?: CSSProperties }) {
  const { data, person } = useStore()
  const waiting = queueClusters(data).filter((h) => h.concept === a.concept).reduce((n, h) => n + h.requesterIds.length, 0)
  return (
    <Card
      style={a.isNew ? undefined : style}
      className={cn(
        'group flex flex-col p-5 transition duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift',
        a.isNew ? 'border-brand-300 shadow-[0_0_0_4px_rgb(109_106_226/0.12),0_18px_40px_-18px_rgb(91_87_214/0.55)] animate-highlight' : 'animate-rise-in',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Badge tone="brand" icon={Lightbulb} size="xs">{a.concept}</Badge>
        {a.isNew
          ? <Badge tone="emerald" icon={Sparkles} size="xs">New</Badge>
          : waiting > 0 && <Tooltip content="Students are waiting for help on this concept"><Badge tone="amber" dot size="xs">{waiting} waiting</Badge></Tooltip>}
      </div>
      <h3 className="mt-3 line-clamp-2 text-[15px] font-bold leading-snug tracking-tight text-ink">{a.title}</h3>
      <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-ink-3">{a.body}</p>
      <div className="mt-4 flex min-w-0 items-center gap-2">
        <Avatar id={a.authorId} size="xs" tooltip />
        <span className="truncate text-xs text-ink-3"><span className="font-semibold text-ink-2">{shortName(person(a.authorId))}</span> · updated {relTime(a.updatedAt)}</span>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-subtle/70 px-3 py-2">
        <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-2"><Repeat2 className="size-4 text-brand-600" />Used <b className="font-bold text-ink tabular">{a.usedCount}</b> times</span>
        <span className="inline-flex items-center gap-2 text-[12.5px] text-ink-2">
          <Donut value={a.helpfulPct} size={24} stroke={4} tone="emerald" label={`${a.helpfulPct}% helpful`}><span /></Donut>
          Helpful <b className="font-bold text-ink tabular">{a.helpfulPct}%</b>
        </span>
      </div>
      <div className="min-h-3 flex-1" />
      <div className="flex items-center gap-1.5 border-t border-line pt-3">
        <Button variant="ghost" size="xs" icon={Eye} onClick={() => onView(a.id)}>View</Button>
        <Button variant="soft" size="xs" icon={Repeat2} onClick={() => onReuse(a)}>Reuse</Button>
        <Button variant="ghost" size="xs" icon={PencilLine} className="ml-auto" onClick={() => onEdit(a.id)} aria-label={`Edit ${a.title}`}>Edit</Button>
      </div>
    </Card>
  )
}
