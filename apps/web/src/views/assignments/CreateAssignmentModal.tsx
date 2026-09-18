import { useEffect, useRef, useState } from 'react'
import { BellRing, CalendarDays, ClipboardPlus, Clock, Send, TriangleAlert } from 'lucide-react'
import {
  AvatarStack, Badge, Button, ChannelChip, Field, Input, Modal, OptionCards, Segmented, Spinner, StepChecklist, SuccessBurst, Textarea, Toggle,
} from '@/components/ui'
import { navigate } from '@/lib/router'
import { studentsIn } from '@/lib/selectors'
import { at, fmtLong, fromInputs, now, nowIso, timeLeft, toDateInput } from '@/lib/time'
import type { Assignment, ClassId, ModalHostProps } from '@/lib/types'
import { plural, wait } from '@/lib/utils'
import { useActions } from '@/store/actions'
import { useStore } from '@/store/store'
import { categoryMeta } from './lib'

const CATS: Assignment['category'][] = ['Assignment', 'Quiz', 'Presentation', 'FGD', 'Project']
const REMINDERS = ['1 day before', '1 hour before']
const QUICK = [{ label: 'Tomorrow', days: 1 }, { label: '3 days', days: 3 }, { label: '1 week', days: 7 }, { label: '2 weeks', days: 14 }]

export default function CreateAssignmentModal({ open, onClose, spec }: ModalHostProps<'createAssignment'>) {
  const { data, toast } = useStore()
  const actions = useActions()
  const [title, setTitle] = useState('')
  const [classId, setClassId] = useState<ClassId>(spec.classId ?? 'B')
  const [category, setCategory] = useState<Assignment['category']>('Assignment')
  const [date, setDate] = useState(() => toDateInput(at(7, '23:59')))
  const [time, setTime] = useState('23:59')
  const [description, setDescription] = useState('')
  const [announce, setAnnounce] = useState(true)
  const [tried, setTried] = useState(false)
  const [saving, setSaving] = useState(false)
  const [created, setCreated] = useState<Assignment | null>(null)
  const scheduled = useRef(false)

  const cls = data.classes.find((c) => c.id === classId)
  const roster = studentsIn(data.people, classId)
  const due = date && time ? fromInputs(date, time) : ''
  const errors = {
    title: title.trim() ? undefined : 'Give the assignment a title',
    due: !due ? 'Pick a deadline' : new Date(due) <= now() ? 'The deadline must be in the future' : undefined,
  }

  const submit = async () => {
    setTried(true)
    if (errors.title || errors.due || saving) return
    setSaving(true)
    await wait(650)
    setCreated(actions.createAssignment({
      title: title.trim(), classId, category, due,
      description: description.trim() || `Task checklist for ${title.trim()} in ${cls?.name ?? `Class ${classId}`}.`,
    }))
    setSaving(false)
  }

  // Announce only after the new assignment is in the store: scheduleNotification matches by title, so calling it in
  // the same tick (stale `data`) would create a duplicate assignment with the same id.
  useEffect(() => {
    if (!created || !announce || scheduled.current || !data.assignments.some((x) => x.id === created.id)) return
    scheduled.current = true
    actions.scheduleNotification({
      title: created.title, description: created.description, category: 'Assignment', mode: 'now', sendAt: nowIso(), extras: [],
      audience: { type: 'class', classIds: [created.classId], groupIds: [], studentIds: [] },
      deadline: created.due, reminders: REMINDERS, delivery: { announcement: true, dm: true, dashboard: true },
    })
  }, [created, announce, data.assignments, actions])

  const finish = () => {
    if (!created) return
    toast({
      title: 'Assignment created',
      description: announce ? `${created.title} was announced to ${cls?.name} with reminders.` : `${created.title} is live for ${plural(roster.length, 'student')}.`,
      tone: 'success',
    })
    navigate(`/assignments/${created.id}`)
    onClose()
  }

  useEffect(() => {
    if (!created || announce) return
    const t = setTimeout(finish, 1100)
    return () => clearTimeout(t)
  }, [created]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal
      open={open} onClose={onClose} size="lg" icon={ClipboardPlus} title="New assignment"
      description={created ? undefined : 'Create a task checklist — students tick it off on Discord or in Classync.'}
      footer={created ? undefined : (
        <>
          <span className="mr-auto hidden items-center gap-2 text-xs text-ink-3 sm:inline-flex">
            <AvatarStack ids={roster.map((p) => p.id)} max={4} size="xs" />
            Assigned to {plural(roster.length, 'student')} in {cls?.name}
          </span>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon={ClipboardPlus} loading={saving} onClick={submit}>Create assignment</Button>
        </>
      )}
    >
      {created ? (
        <div className="py-2 text-center animate-fade-in">
          <SuccessBurst size={60} />
          <h3 className="text-lg font-bold tracking-tight text-ink">Assignment created</h3>
          <p className="mt-1 text-[13px] text-ink-3"><span className="font-semibold text-ink-2">{created.title}</span> is live for {plural(roster.length, 'student')} in {cls?.name}.</p>
          {announce ? (
            <StepChecklist
              className="mx-auto mt-5 w-fit text-left" interval={420} onDone={() => setTimeout(finish, 450)}
              steps={[
                `Checklist created for ${plural(roster.length, 'student')}`,
                `Posted to #announcement · ${cls?.discord.role ?? `@Class-${classId}`}`,
                'DM reminders scheduled · 1 day & 1 hour before',
                'Deadline added to the calendar',
              ]}
            />
          ) : (
            <p className="mt-5 inline-flex items-center gap-2 text-xs text-ink-3"><Spinner className="size-3.5" />Opening the checklist…</p>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <Field label="Title" required htmlFor="assignment-title" error={tried && errors.title}>
            <Input id="assignment-title" data-autofocus value={title} onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submit() }} placeholder="e.g. Clustering Lab Report" />
          </Field>

          <Field label="Class" hint={cls ? `${cls.subject} · ${plural(roster.length, 'student')} · every student gets a personal checklist` : undefined}>
            <Segmented aria-label="Class" value={classId} onChange={setClassId} options={data.classes.map((c) => ({ value: c.id, label: c.name }))} />
          </Field>

          <Field label="Type">
            <OptionCards columns={5} value={category} onChange={setCategory} options={CATS.map((c) => ({ value: c, label: c, icon: categoryMeta(c).icon }))} />
          </Field>

          <Field
            label="Deadline" required error={tried && errors.due}
            hint={due && !errors.due ? `${fmtLong(due)} · ${timeLeft(due)}` : undefined}
            action={
              <div className="flex items-center gap-0.5">
                {QUICK.map((q) => (
                  <button key={q.label} type="button" onClick={() => setDate(toDateInput(at(q.days, '23:59')))}
                    className="rounded-md px-1.5 py-0.5 text-[11.5px] font-semibold text-brand-700 transition-colors hover:bg-brand-50">
                    {q.label}
                  </button>
                ))}
              </div>
            }
          >
            <div className="grid grid-cols-[minmax(0,1fr)_150px] gap-2">
              <Input type="date" icon={CalendarDays} aria-label="Due date" value={date} min={toDateInput(nowIso())} onChange={(e) => setDate(e.target.value)} />
              <Input type="time" icon={Clock} aria-label="Due time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </Field>

          <Field label="Description" htmlFor="assignment-description" hint="Shown in the Discord announcement and each student's checklist.">
            <Textarea id="assignment-description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="What should students deliver? Link the dataset or brief…" />
          </Field>

          <div className="rounded-xl border border-line bg-canvas/60 p-4">
            <Toggle
              checked={announce} onChange={setAnnounce} label="Also announce on Discord with reminders"
              description={`Posts to #announcement for ${cls?.discord.role ?? `Class ${classId}`} and DMs students 1 day and 1 hour before the deadline.`}
            />
            {announce && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5 animate-fade-in">
                <ChannelChip name="announcement" />
                <Badge tone="violet" size="xs" icon={Send}>DM reminders</Badge>
                {REMINDERS.map((r) => <Badge key={r} tone="slate" size="xs" icon={BellRing}>{r}</Badge>)}
              </div>
            )}
            {announce && cls && !cls.discord.connected && (
              <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-amber-700">
                <TriangleAlert className="size-3.5" />{cls.name} isn't connected to Discord yet — students will see it in the dashboard until it is.
              </p>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
