import { useEffect, useState } from 'react'
import { BookmarkPlus, Check, Loader2, Lock, MessageSquareReply, Send, ShieldCheck, Sparkles, WandSparkles } from 'lucide-react'
import { Avatar, AvatarStack, Badge, Button, Checkbox, Field, Input, Modal, ProgressBar, StatusBadge, SuccessBurst, Textarea } from '@/components/ui'
import { shortName } from '@/lib/selectors'
import { cn, plural } from '@/lib/utils'
import { useActions } from '@/store/actions'
import { useStore } from '@/store/store'
import { firstName } from './helpers'
import { AnswerDM, ClassChip, EYEBROW } from './parts'

type Phase = 'compose' | 'sending' | 'done'

/** One answer → private Discord DM to every student who asked about the concept. */
export function RespondModal({ open, onClose, clusterId, initialAnswerId }: {
  open: boolean; onClose: () => void; clusterId: string | null; initialAnswerId?: string
}) {
  const { data, person, toast } = useStore()
  const actions = useActions()
  const cluster = data.helpClusters.find((h) => h.id === clusterId)
  const suggestion = data.answers.find((a) => a.id === initialAnswerId) ?? data.answers.find((a) => a.concept === cluster?.concept)
  const [recipients] = useState(() => cluster?.requesterIds ?? [])
  const [body, setBody] = useState(() => (initialAnswerId && suggestion?.id === initialAnswerId ? suggestion.body : ''))
  const [saveReusable, setSaveReusable] = useState(false)
  const [title, setTitle] = useState(`Understanding ${cluster?.concept ?? ''}`)
  const [previewId, setPreviewId] = useState(recipients[0])
  const [error, setError] = useState('')
  const [phase, setPhase] = useState<Phase>('compose')
  const [delivered, setDelivered] = useState(0)
  const reusing = !!suggestion && body.trim() === suggestion.body.trim()
  const n = recipients.length

  // Delivery animation: tick one recipient at a time, then commit the answer.
  useEffect(() => {
    if (phase !== 'sending' || !cluster) return
    if (delivered < n) {
      const t = setTimeout(() => setDelivered((d) => d + 1), delivered === 0 ? 450 : 230)
      return () => clearTimeout(t)
    }
    const save = saveReusable && !reusing
    actions.answerCluster(cluster.id, body.trim(), { saveAsReusable: save, title: title.trim() || undefined, reuseAnswerId: reusing ? suggestion?.id : undefined })
    toast({
      tone: 'success',
      title: `Answer sent privately to ${plural(n, 'student')}`,
      description: save ? `Saved “${title.trim() || `Understanding ${cluster.concept}`}” to reusable answers` : reusing ? `Reused “${suggestion?.title}”` : `${cluster.concept} marked as resolved`,
    })
    setPhase('done')
  }, [phase, delivered]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase !== 'done') return
    const t = setTimeout(onClose, 1300)
    return () => clearTimeout(t)
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!cluster) return null
  const assignment = data.assignments.find((a) => a.id === cluster.assignmentId)

  const send = () => {
    if (!body.trim()) { setError('Write an answer or use the saved one first.'); return }
    if (!n) { setError('No students have requested help on this concept yet.'); return }
    setError('')
    setPhase('sending')
  }

  return (
    <Modal
      open={open}
      onClose={() => phase === 'compose' && onClose()}
      size="xl"
      icon={MessageSquareReply}
      title="Respond to help request"
      description="Write one answer — Classync delivers it privately to every student who asked."
      bodyClassName="p-0"
      footer={phase === 'compose' ? (
        <>
          <span className="mr-auto hidden items-center gap-1.5 text-xs text-ink-3 sm:inline-flex"><Lock className="size-3.5" />{plural(n, 'private DM')} · nothing is posted in class channels</span>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon={Send} onClick={send}>Send Answer</Button>
        </>
      ) : phase === 'sending' ? (
        <Button variant="primary" loading>Sending…</Button>
      ) : (
        <Button variant="success" icon={Check} onClick={onClose}>Done</Button>
      )}
    >
      {phase === 'compose' ? (
        <div className="grid lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5 px-6 py-5">
            <div className="grid gap-4 rounded-xl border border-line p-4 sm:grid-cols-2">
              <div className="min-w-0">
                <div className={EYEBROW}>Concept</div>
                <div className="mt-1 text-[17px] font-bold tracking-tight text-ink">{cluster.concept}</div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5"><ClassChip classId={cluster.classId} subject /><StatusBadge status={cluster.priority} size="xs" /></div>
              </div>
              <div className="min-w-0">
                <div className={EYEBROW}>Students requesting help</div>
                <div className="mt-1 flex items-center gap-3">
                  <span className="text-[26px] font-extrabold leading-none text-ink tabular">{n}</span>
                  <AvatarStack ids={recipients} max={6} size="md" />
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-[12.5px] font-medium text-emerald-800 sm:col-span-2">
                <Lock className="size-3.5 shrink-0" />Each student receives this answer privately via Discord DM
              </div>
            </div>

            <p className="text-[12.5px] leading-relaxed text-ink-3"><span className="font-semibold text-ink-2">Typical question: </span>“{cluster.sampleQuestion}”</p>

            {suggestion && (
              <div className={cn('rounded-xl border p-4 transition-colors duration-200', reusing ? 'border-emerald-200 bg-emerald-50/50' : 'border-brand-200 bg-brand-50/50')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-brand-700"><Sparkles className="size-3.5" />Suggested saved answer</div>
                    <div className="mt-1 text-[14px] font-bold text-ink">{suggestion.title}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-ink-3">
                      <Avatar id={suggestion.authorId} size="xs" />{shortName(person(suggestion.authorId))} · Used {suggestion.usedCount} times · Helpful {suggestion.helpfulPct}%
                    </div>
                  </div>
                  {reusing
                    ? <Badge tone="emerald" icon={Check} size="md">Applied</Badge>
                    : <Button variant="soft" size="sm" icon={WandSparkles} onClick={() => { setBody(suggestion.body); setError('') }}>Use saved answer</Button>}
                </div>
                <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-ink-2">{suggestion.body}</p>
              </div>
            )}

            <Field
              label="Your answer" htmlFor="respond-body" required error={error}
              hint={reusing ? 'Using the saved answer — edit it to send a tailored version.' : `${body.trim().length} characters · explain the intuition first, then the steps`}
              action={body && <button type="button" onClick={() => setBody('')} className="rounded text-xs font-semibold text-ink-3 hover:text-ink">Clear</button>}
            >
              <Textarea
                id="respond-body" rows={7} value={body} data-autofocus
                onChange={(e) => { setBody(e.target.value); if (error) setError('') }}
                placeholder={`Explain ${cluster.concept} in a way that unblocks all ${n} students…`}
              />
            </Field>

            <div className="rounded-xl border border-line p-3.5">
              <Checkbox
                checked={saveReusable && !reusing} disabled={reusing} onChange={setSaveReusable}
                label={<span className="inline-flex items-center gap-1.5 text-ink"><BookmarkPlus className="size-4 text-brand-600" />Save as reusable answer</span>}
              />
              <p className="ml-6 mt-0.5 text-xs text-ink-3">{reusing ? 'Already in your library — its usage count goes up instead.' : 'Suggested automatically next time students ask about this concept.'}</p>
              {saveReusable && !reusing && (
                <Field label="Answer title" htmlFor="respond-title" className="ml-6 mt-3 animate-rise-in">
                  <Input id="respond-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`Understanding ${cluster.concept}`} />
                </Field>
              )}
            </div>
          </div>

          <aside className="border-t border-line bg-canvas/70 px-5 py-5 lg:rounded-br-none lg:border-l lg:border-t-0" aria-label="Student preview">
            <div className={EYEBROW}>Live preview</div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-[13px] text-ink-2">What <b className="font-semibold text-ink">{firstName(person(previewId)?.name)}</b> receives</span>
              <div className="flex -space-x-1" role="group" aria-label="Preview as">
                {recipients.slice(0, 6).map((id) => (
                  <button key={id} type="button" aria-pressed={id === previewId} aria-label={`Preview as ${person(id)?.name}`} onClick={() => setPreviewId(id)}
                    className={cn('rounded-full ring-2 transition duration-150 hover:z-10 hover:-translate-y-0.5', id === previewId ? 'z-10 ring-brand-500' : 'opacity-70 ring-white hover:opacity-100')}>
                    <Avatar id={id} size="xs" />
                  </button>
                ))}
              </div>
            </div>
            <AnswerDM className="mt-3" concept={cluster.concept} classId={cluster.classId} assignment={assignment?.title} body={body} studentId={previewId} />
            <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-ink-3">
              <ShieldCheck className="size-4 shrink-0 text-emerald-600" />Recipients can't see who else asked. Follow-up questions come back to this queue.
            </p>
          </aside>
        </div>
      ) : (
        <div className="px-6 py-8 text-center" aria-live="polite">
          {phase === 'done' ? <SuccessBurst size={56} className="-my-6" /> : (
            <div className="relative mx-auto grid size-14 place-items-center rounded-2xl bg-[#5865f2]/10 text-[#5865f2]">
              <Send className="size-6" />
              <span className="absolute inset-0 rounded-2xl ring-2 ring-[#5865f2]/30 animate-ping-soft" />
            </div>
          )}
          <h3 className="mt-4 text-[17px] font-bold text-ink">
            {phase === 'done' ? `Answer sent privately to ${plural(n, 'student')}` : `Sending privately to ${plural(n, 'student')}…`}
          </h3>
          <p className="mt-1 text-[13px] text-ink-3">Delivered one by one as Discord DMs — no one can see who else asked.</p>
          <ul className="mx-auto mt-6 flex max-w-xl flex-wrap justify-center gap-x-3 gap-y-4">
            {recipients.map((id, i) => {
              const done = i < delivered
              return (
                <li key={id} className="flex w-[72px] flex-col items-center gap-1.5">
                  <span className="relative">
                    <Avatar id={id} size="lg" className={cn('transition duration-300', !done && 'opacity-40 grayscale')} />
                    {done ? (
                      <span className="absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full bg-emerald-500 text-white ring-2 ring-white animate-check-in"><Check className="size-3" strokeWidth={3} /></span>
                    ) : i === delivered && (
                      <span className="absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full bg-surface shadow-card ring-2 ring-white"><Loader2 className="size-3 animate-spin text-brand-600" /></span>
                    )}
                  </span>
                  <span className={cn('max-w-full truncate text-[11.5px] font-medium', done ? 'text-ink-2' : 'text-ink-3')}>{shortName(person(id))}</span>
                </li>
              )
            })}
          </ul>
          <div className="mx-auto mt-6 max-w-xs">
            <ProgressBar value={n ? (delivered / n) * 100 : 100} tone="emerald" size="sm" label="Delivery progress" />
            <div className="mt-1.5 text-xs text-ink-3 tabular">{delivered} of {n} delivered</div>
          </div>
        </div>
      )}
    </Modal>
  )
}
