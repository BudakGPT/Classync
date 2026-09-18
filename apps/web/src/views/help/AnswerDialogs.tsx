import { useState } from 'react'
import { Lightbulb, PencilLine, Repeat2, Sparkles } from 'lucide-react'
import { Badge, Button, Donut, Drawer, Field, Input, Modal, PersonLine, Select, StatusBadge, Textarea } from '@/components/ui'
import { nowIso, relTime } from '@/lib/time'
import type { ReusableAnswer } from '@/lib/types'
import { wait } from '@/lib/utils'
import { useStore } from '@/store/store'
import { AnswerDM, ClassChip, EYEBROW } from './parts'

export function AnswerDrawer({ open, onClose, answerId, onReuse, onEdit }: {
  open: boolean; onClose: () => void; answerId: string | null; onReuse: (a: ReusableAnswer) => void; onEdit: (id: string) => void
}) {
  const { data, person } = useStore()
  const a = data.answers.find((x) => x.id === answerId)
  if (!a) return null
  const linked = data.helpClusters.filter((h) => h.concept === a.concept)
  const sample = linked.find((h) => h.requesterIds.length) ?? linked[0]

  return (
    <Drawer
      open={open} onClose={onClose} size="lg" title={a.title}
      subtitle={<span className="mt-1 inline-flex items-center gap-1.5"><Badge tone="brand" icon={Lightbulb} size="xs">{a.concept}</Badge>{a.isNew && <Badge tone="emerald" icon={Sparkles} size="xs">New</Badge>}</span>}
      footer={
        <>
          <Button variant="secondary" icon={PencilLine} onClick={() => onEdit(a.id)}>Edit</Button>
          <Button variant="primary" icon={Repeat2} onClick={() => onReuse(a)}>Reuse answer</Button>
        </>
      }
    >
      <PersonLine id={a.authorId} subtitle={`${person(a.authorId)?.role ?? 'Author'} · updated ${relTime(a.updatedAt)}`} />

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-line p-3">
          <div className="text-[22px] font-extrabold leading-none text-ink tabular">{a.usedCount}</div>
          <div className="mt-1 text-xs text-ink-3">Times used</div>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl border border-line p-3">
          <Donut value={a.helpfulPct} size={40} stroke={5} tone="emerald" label={`${a.helpfulPct}% helpful`}><span /></Donut>
          <div>
            <div className="text-[17px] font-extrabold leading-none text-ink tabular">{a.helpfulPct}%</div>
            <div className="mt-1 text-xs text-ink-3">Helpful</div>
          </div>
        </div>
        <div className="rounded-xl border border-line p-3">
          <div className="text-[22px] font-extrabold leading-none text-ink tabular">{linked.length}</div>
          <div className="mt-1 text-xs text-ink-3">Linked difficulties</div>
        </div>
      </div>

      <h3 className={`${EYEBROW} mt-6`}>Full answer</h3>
      <div className="mt-2 whitespace-pre-line rounded-xl border border-line bg-canvas/60 p-4 text-[14px] leading-relaxed text-ink">{a.body}</div>

      <h3 className={`${EYEBROW} mt-6`}>What students receive</h3>
      <AnswerDM className="mt-2" concept={a.concept} classId={sample?.classId} assignment={data.assignments.find((x) => x.id === sample?.assignmentId)?.title} body={a.body} studentId={sample?.requesterIds[0]} />

      {linked.length > 0 && (
        <>
          <h3 className={`${EYEBROW} mt-6`}>Linked difficulties</h3>
          <ul className="mt-2 divide-y divide-line rounded-xl border border-line">
            {linked.map((h) => (
              <li key={h.id} className="flex items-center gap-3 px-3.5 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-semibold text-ink">{h.concept}</div>
                  <div className="text-xs text-ink-3">{h.reports} reports · first {relTime(h.firstReportAt).toLowerCase()}</div>
                </div>
                <ClassChip classId={h.classId} />
                <StatusBadge status={h.status} size="xs" />
              </li>
            ))}
          </ul>
        </>
      )}
    </Drawer>
  )
}

export function EditAnswerModal({ open, onClose, answerId }: { open: boolean; onClose: () => void; answerId: string | null }) {
  const { data, update, log, toast, me } = useStore()
  const a = data.answers.find((x) => x.id === answerId)
  const [title, setTitle] = useState(a?.title ?? '')
  const [concept, setConcept] = useState(a?.concept ?? '')
  const [body, setBody] = useState(a?.body ?? '')
  const [saving, setSaving] = useState(false)
  const [tried, setTried] = useState(false)
  if (!a) return null
  const concepts = [...new Set([...data.helpClusters.map((h) => h.concept), ...data.answers.map((x) => x.concept)])]

  const save = async () => {
    setTried(true)
    if (!title.trim() || !body.trim()) return
    setSaving(true)
    await wait(550)
    update('answers', (as) => as.map((x) => (x.id === a.id ? { ...x, title: title.trim(), concept, body: body.trim(), updatedAt: nowIso() } : x)))
    log({ actorId: me.id, action: 'updated reusable answer', target: title.trim(), detail: concept, type: 'help' })
    toast({ tone: 'success', title: 'Answer updated', description: `“${title.trim()}” will be used for future replies.` })
    onClose()
  }

  return (
    <Modal
      open={open} onClose={onClose} size="lg" icon={PencilLine} title="Edit reusable answer"
      description="Changes apply to future replies. Students who already received it keep their copy."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={save}>Save changes</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Title" htmlFor="edit-answer-title" required error={tried && !title.trim() ? 'Give the answer a title.' : undefined}>
          <Input id="edit-answer-title" value={title} onChange={(e) => setTitle(e.target.value)} data-autofocus />
        </Field>
        <Field label="Concept" htmlFor="edit-answer-concept" hint="Suggested automatically when students ask about this concept.">
          <Select id="edit-answer-concept" value={concept} onChange={(e) => setConcept(e.target.value)}>
            {concepts.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="Answer" htmlFor="edit-answer-body" required error={tried && !body.trim() ? 'The answer cannot be empty.' : undefined} hint={`${body.trim().length} characters`}>
          <Textarea id="edit-answer-body" rows={8} value={body} onChange={(e) => setBody(e.target.value)} />
        </Field>
      </div>
    </Modal>
  )
}
