import { useState } from 'react'
import { AtSign, Bell, CalendarPlus, Check, GraduationCap, Hash, LayoutDashboard, MapPin, Users } from 'lucide-react'
import { AvatarStack, Button, Field, Input, Modal, Segmented, Select, Textarea, Toggle } from '@/components/ui'
import { navigate } from '@/lib/router'
import { eventParticipantIds, staff } from '@/lib/selectors'
import { fmtDay, fmtTime, fromInputs, nowIso, toDateInput } from '@/lib/time'
import { CATEGORIES, CATEGORY, tone } from '@/lib/tones'
import type { CalEvent, ClassId, Delivery, EventCategory, ModalHostProps } from '@/lib/types'
import { cn, wait } from '@/lib/utils'
import { useActions } from '@/store/actions'
import { useStore } from '@/store/store'

const ALL_CATS: EventCategory[] = [...CATEGORIES, 'Extra Class']
const REMINDERS = ['15 minutes before', '30 minutes before', '1 hour before', '3 hours before', '1 day before']
const CLASS_IDS: ClassId[] = ['A', 'B', 'C', 'D']
const DELIVERY_OPTS = [
  { key: 'announcement', label: '#announcement', icon: Hash },
  { key: 'dm', label: 'Direct message', icon: AtSign },
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
] as const

/** spec.date may be 'YYYY-MM-DD' (day click) or an ISO datetime (slot click). */
function prefill(raw?: string) {
  if (!raw) return { date: toDateInput(nowIso()), time: '' }
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return { date: raw, time: '' }
  const t = fmtTime(raw)
  return { date: toDateInput(raw), time: t === '00:00' ? '' : t }
}
const plusHour = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h >= 23 ? '23:59' : `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export default function CreateEventModal({ open, onClose, spec }: ModalHostProps<'createEvent'>) {
  const { data, me, toast } = useStore()
  const actions = useActions()
  const init = prefill(spec.date)
  const groups = data.groups.filter((g) => g.status === 'Active')

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<EventCategory>('FGD')
  const [audience, setAudience] = useState<'class' | 'group'>('class')
  const [classId, setClassId] = useState<ClassId>('B')
  const [groupId, setGroupId] = useState(groups[0]?.id ?? '')
  const [date, setDate] = useState(init.date)
  const [start, setStart] = useState(init.time || '09:00')
  const [end, setEnd] = useState(plusHour(init.time || '09:00'))
  const [location, setLocation] = useState('')
  const [hostId, setHostId] = useState(me.id)
  const [reminders, setReminders] = useState<string[]>(data.settings.defaultReminders)
  const [delivery, setDelivery] = useState<Delivery>({ announcement: true, dm: true, dashboard: true })
  const [description, setDescription] = useState('')
  const [tried, setTried] = useState(false)
  const [saving, setSaving] = useState(false)

  const pickCategory = (c: EventCategory) => {
    setCategory(c)
    if (c === 'Deadline' || c === 'Assignment') { setStart('23:59'); setEnd('') }
    else if (start === '23:59') { setStart('09:00'); setEnd('10:00') }
  }
  const pickClass = (c: ClassId) => {
    setClassId(c)
    setHostId(data.classes.find((x) => x.id === c)?.lecturerId ?? hostId)
  }

  const group = groups.find((g) => g.id === groupId)
  const target = audience === 'class'
    ? { classId, groupId: undefined }
    : { classId: group?.classIds.length === 1 ? group.classIds[0] : undefined, groupId: group?.id }
  const reach = eventParticipantIds({ ...target, participantIds: [] } as unknown as CalEvent, data)

  const errors = {
    title: title.trim() ? '' : 'Give the event a title',
    date: date ? '' : 'Pick a date',
    end: end && end <= start ? 'End must be after the start time' : '',
  }

  const submit = async () => {
    setTried(true)
    if (Object.values(errors).some(Boolean)) return
    setSaving(true)
    await wait(650)
    const s = fromInputs(date, start)
    const ev = actions.addEvent({
      title: title.trim(), category, ...target, start: s, end: end ? fromInputs(date, end) : undefined,
      location: location.trim() || undefined, hostId, participantIds: [], reminders, delivery, description: description.trim(),
    })
    toast({
      title: 'Event scheduled',
      description: `${ev.title} · ${fmtDay(s)}, ${fmtTime(s)}${delivery.announcement || delivery.dm ? ' · Discord reminders on' : ''}`,
      tone: 'success',
      action: { label: 'View', onClick: () => navigate(`/calendar?view=week&date=${date}&event=${ev.id}`) },
    })
    onClose()
  }

  return (
    <Modal
      open={open} onClose={onClose} size="lg" icon={CalendarPlus} title="Schedule event"
      description="Add it to the academic calendar — Classync Bot reminds everyone on Discord."
      footer={
        <>
          <div className="mr-auto flex min-w-0 items-center gap-2.5">
            {reach.length > 0
              ? <><AvatarStack ids={reach} max={4} size="sm" /><span className="text-[12.5px] text-ink-3">Reaches <b className="font-semibold text-ink tabular">{reach.length}</b> {reach.length === 1 ? 'person' : 'people'}</span></>
              : <span className="text-[12.5px] text-ink-3">No participants yet</span>}
          </div>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="create-event" icon={CalendarPlus} loading={saving}>Schedule event</Button>
        </>
      }
    >
      <form id="create-event" className="space-y-5" onSubmit={(ev) => { ev.preventDefault(); submit() }} noValidate>
        <Field label="Title" required htmlFor="ev-title" error={tried && errors.title}>
          <Input id="ev-title" data-autofocus value={title} onChange={(ev) => setTitle(ev.target.value)} placeholder="e.g. FGD-B2 Discussion: PCA case studies" />
        </Field>

        <Field label="Category">
          <div role="radiogroup" aria-label="Category" className="flex flex-wrap gap-1.5">
            {ALL_CATS.map((c) => {
              const meta = CATEGORY[c]
              const t = tone(meta.tone)
              const on = c === category
              return (
                <button key={c} type="button" role="radio" aria-checked={on} onClick={() => pickCategory(c)}
                  className={cn('inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-semibold transition duration-150 active:scale-[0.97]',
                    on ? cn(t.soft, t.text, t.border, 'ring-2', t.ring) : 'border-line bg-surface text-ink-2 hover:border-line-strong hover:bg-subtle')}>
                  <meta.icon className={cn('size-3.5', !on && 'text-ink-3')} />{c}
                </button>
              )
            })}
          </div>
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="For" action={
            <Segmented size="sm" aria-label="Audience type" value={audience} onChange={setAudience}
              options={[{ value: 'class', label: 'Class', icon: GraduationCap }, { value: 'group', label: 'Group', icon: Users }]} />
          }>
            {audience === 'class'
              ? <Segmented aria-label="Class" className="flex w-full [&>button]:flex-1 [&>button]:justify-center" value={classId} onChange={pickClass} options={CLASS_IDS.map((c) => ({ value: c, label: `Class ${c}` }))} />
              : (
                <Select aria-label="Group" value={groupId} onChange={(ev) => setGroupId(ev.target.value)}>
                  {groups.map((g) => <option key={g.id} value={g.id}>{g.name} · {g.memberIds.length} members</option>)}
                </Select>
              )}
          </Field>
          <Field label="Host" htmlFor="ev-host">
            <Select id="ev-host" value={hostId} onChange={(ev) => setHostId(ev.target.value)}>
              {staff(data.people).map((p) => <option key={p.id} value={p.id}>{p.name} — {p.role}</option>)}
            </Select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Date" htmlFor="ev-date" required error={tried && errors.date}>
            <Input id="ev-date" type="date" value={date} onChange={(ev) => setDate(ev.target.value)} />
          </Field>
          <Field label="Start" htmlFor="ev-start">
            <Input id="ev-start" type="time" value={start} onChange={(ev) => setStart(ev.target.value)} />
          </Field>
          <Field label="End" htmlFor="ev-end" error={tried && errors.end} hint={end ? undefined : 'Empty = deadline / reminder'}>
            <Input id="ev-end" type="time" value={end} onChange={(ev) => setEnd(ev.target.value)} />
          </Field>
        </div>

        <Field label="Location" htmlFor="ev-loc">
          <Input id="ev-loc" icon={MapPin} value={location} onChange={(ev) => setLocation(ev.target.value)} placeholder="Room 3.3114, Lab 1.1201 or voice-fgd" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Reminders">
            <div className="flex flex-wrap gap-1.5">
              {REMINDERS.map((r) => {
                const on = reminders.includes(r)
                return (
                  <button key={r} type="button" aria-pressed={on} onClick={() => setReminders(on ? reminders.filter((x) => x !== r) : [...reminders, r])}
                    className={cn('inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-[12px] font-semibold transition duration-150 active:scale-[0.97]',
                      on ? 'border-brand-200 bg-brand-50 text-brand-700' : 'border-line bg-surface text-ink-3 hover:border-line-strong hover:text-ink-2')}>
                    {on ? <Check className="size-3 animate-check-in" strokeWidth={3} /> : <Bell className="size-3" />}{r}
                  </button>
                )
              })}
            </div>
          </Field>
          <Field label="Discord delivery">
            <div className="divide-y divide-line rounded-xl border border-line px-3">
              {DELIVERY_OPTS.map((o) => (
                <Toggle key={o.key} size="sm" className="items-center py-2" checked={delivery[o.key]} onChange={(v) => setDelivery({ ...delivery, [o.key]: v })}
                  label={<span className="inline-flex items-center gap-2 text-[13px]"><o.icon className="size-4 text-ink-3" />{o.label}</span>} />
              ))}
            </div>
          </Field>
        </div>

        <Field label="Description" htmlFor="ev-desc">
          <Textarea id="ev-desc" rows={3} className="min-h-20" value={description} onChange={(ev) => setDescription(ev.target.value)} placeholder="What should participants prepare or bring?" />
        </Field>
      </form>
    </Modal>
  )
}
