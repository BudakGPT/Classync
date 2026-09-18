import type { ReactNode } from 'react'
import {
  Bell, BellRing, CalendarClock, CalendarPlus, Check, Hash, Layers, LayoutDashboard, MessageCircle, Plus, Repeat, School, Send,
  SlidersHorizontal, Trash2, UserRound, Users, type LucideIcon,
} from 'lucide-react'
import { StudentPicker } from '@/components/domain/StudentPicker'
import {
  AvatarStack, Badge, Button, Field, IconButton, IconTile, Input, OptionCards, Segmented, Select, Textarea, Toggle,
} from '@/components/ui'
import { studentsIn } from '@/lib/selectors'
import { dueLabel, fmtDay, fmtTime, timeLeft, toDateInput, urgency, weekday } from '@/lib/time'
import { CATEGORIES, CATEGORY, tone as toneOf } from '@/lib/tones'
import type { AudienceType, ClassId, Delivery } from '@/lib/types'
import { cn, plural, uid } from '@/lib/utils'
import { useStore } from '@/store/store'
import { isoFrom, needsDeadline, type FormErrors, type FormState } from './form'
import { REMINDER_OPTIONS, WEEK, nextOccurrence } from './lib'

type Set = (patch: Partial<FormState>) => void

function Section({ step, title, hint, children }: { step: number; title: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <section className="border-b border-line py-5 first:pt-0 last:border-b-0">
      <div className="mb-3.5 flex items-center gap-2.5">
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-50 text-[11.5px] font-bold text-brand-700 tabular">{step}</span>
        <h3 className="text-[14px] font-bold tracking-tight text-ink">{title}</h3>
        {hint && <span className="ml-auto text-[12px] text-ink-3">{hint}</span>}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

/** Pill that toggles on/off (reminders, multiple classes). */
function ToggleChip({ on, onClick, children, icon: Icon }: { on: boolean; onClick: () => void; children: ReactNode; icon?: LucideIcon }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick}
      className={cn('inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-semibold transition duration-150 active:scale-[0.97]',
        on ? 'border-brand-300 bg-brand-50 text-brand-700 ring-2 ring-brand-100' : 'border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink')}>
      {on ? <Check className="size-3.5 animate-check-in" strokeWidth={3} /> : Icon && <Icon className="size-3.5 text-ink-3" />}
      {children}
    </button>
  )
}

const AUDIENCE: { value: AudienceType; label: string; icon: LucideIcon; description: string }[] = [
  { value: 'class', label: 'Entire Class', icon: School, description: 'One roster' },
  { value: 'classes', label: 'Multiple Classes', icon: Layers, description: 'Several rosters' },
  { value: 'group', label: 'Group', icon: Users, description: 'FGD, project…' },
  { value: 'students', label: 'Individual Students', icon: UserRound, description: 'Pick people' },
  { value: 'custom', label: 'Custom Selection', icon: SlidersHorizontal, description: 'Mix & match' },
]

function ClassChips({ value, onChange }: { value: ClassId[]; onChange: (ids: ClassId[]) => void }) {
  const { data } = useStore()
  return (
    <div className="flex flex-wrap gap-2">
      {data.classes.map((c) => {
        const on = value.includes(c.id)
        return (
          <ToggleChip key={c.id} on={on} onClick={() => onChange(on ? value.filter((x) => x !== c.id) : [...value, c.id])}>
            <span className={cn('size-2 rounded-full', toneOf(c.tone).dot, on && 'hidden')} />
            {c.name} <span className="font-medium opacity-70">· {c.subject}</span>
          </ToggleChip>
        )
      })}
    </div>
  )
}

function AudienceSection({ f, set, reachIds, error }: { f: FormState; set: Set; reachIds: string[]; error?: string }) {
  const { data } = useStore()
  const a = f.audience
  const setA = (patch: Partial<FormState['audience']>) => set({ audience: { ...a, ...patch } })
  const changeType = (type: AudienceType) => setA({
    type,
    classIds: type === 'class' ? [a.classIds[0] ?? 'B'] : type === 'classes' && !a.classIds.length ? ['B'] : a.classIds,
  })
  const cls = data.classes.find((c) => c.id === a.classIds[0])
  const toggleGroup = (id: string) => setA({ groupIds: a.groupIds.includes(id) ? a.groupIds.filter((g) => g !== id) : [...a.groupIds, id] })

  return (
    <Section step={2} title="Audience">
      <OptionCards columns={5} options={AUDIENCE} value={a.type} onChange={changeType} />

      <div key={a.type} className="animate-fade-in">
        {a.type === 'class' && (
          <div className="flex flex-wrap items-center gap-3">
            <Segmented aria-label="Class" value={a.classIds[0] ?? 'B'} onChange={(c) => setA({ classIds: [c] })}
              options={data.classes.map((c) => ({ value: c.id, label: `Class ${c.id}` }))} />
            {cls && <span className="text-[12.5px] text-ink-3">{cls.subject} · {data.people.find((p) => p.id === cls.lecturerId)?.name} · {cls.schedule.day} {cls.schedule.time}</span>}
          </div>
        )}
        {(a.type === 'classes' || a.type === 'custom') && (
          <div className="space-y-2">
            {a.type === 'custom' && <div className="text-[12.5px] font-semibold text-ink-2">Classes <span className="font-normal text-ink-3">(optional)</span></div>}
            <ClassChips value={a.classIds} onChange={(classIds) => setA({ classIds })} />
          </div>
        )}
        {a.type === 'group' && (
          <div className="scrollbar-thin max-h-56 space-y-1.5 overflow-y-auto pr-1" role="group" aria-label="Groups">
            {data.groups.filter((g) => g.status === 'Active').map((g) => {
              const on = a.groupIds.includes(g.id)
              return (
                <button key={g.id} type="button" aria-pressed={on} onClick={() => toggleGroup(g.id)}
                  className={cn('flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition duration-150',
                    on ? 'border-brand-400 bg-brand-50/50 ring-4 ring-brand-100' : 'border-line bg-surface hover:border-line-strong hover:bg-subtle/50')}>
                  <span className={cn('grid size-4 shrink-0 place-items-center rounded-[5px] border transition', on ? 'border-brand-600 bg-brand-600 text-white' : 'border-line-strong')}>
                    {on && <Check className="size-3 animate-check-in" strokeWidth={3} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[13px] font-semibold text-ink">{g.name}</span>
                      <Badge tone="teal" size="xs">{g.type}</Badge>
                    </span>
                    <span className="block truncate text-[11.5px] text-ink-3">{g.scope === 'cross' ? `Cross-class · ${g.classIds.join(', ')}` : `Class ${g.classIds[0]}`} · {g.role}</span>
                  </span>
                  <AvatarStack ids={g.memberIds} max={4} size="xs" />
                  <span className="w-16 text-right text-[11.5px] text-ink-3 tabular">{plural(g.memberIds.length, 'member')}</span>
                </button>
              )
            })}
          </div>
        )}
        {(a.type === 'students' || a.type === 'custom') && (
          <div className={cn(a.type === 'custom' && 'mt-3')}>
            <StudentPicker value={a.studentIds} onChange={(studentIds) => setA({ studentIds })} maxHeight={200} />
          </div>
        )}
      </div>

      <div className={cn('flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition-colors', reachIds.length ? 'bg-brand-50/70' : 'bg-amber-50')} aria-live="polite">
        {reachIds.length > 0
          ? <AvatarStack ids={reachIds} max={5} size="sm" ringClass="ring-brand-50" />
          : <Users className="size-4 text-amber-600" />}
        <span className={cn('text-[13px]', reachIds.length ? 'text-ink-2' : 'font-medium text-amber-800')}>
          {reachIds.length ? <><b className="font-bold text-ink tabular">{plural(reachIds.length, 'student')}</b> will be notified</> : error ?? 'No recipients selected yet'}
        </span>
      </div>
    </Section>
  )
}

function DateTime({ label, date, time, onDate, onTime, error, hint, id }: {
  label: string; date: string; time: string; onDate: (v: string) => void; onTime: (v: string) => void; error?: string; hint?: ReactNode; id: string
}) {
  return (
    <Field label={label} error={error} hint={hint} htmlFor={`${id}-date`}>
      <div className="grid grid-cols-[minmax(0,1fr)_132px] gap-2">
        <Input id={`${id}-date`} type="date" value={date} onChange={(e) => onDate(e.target.value)} aria-invalid={!!error} />
        <Input type="time" aria-label={`${label} time`} value={time} onChange={(e) => onTime(e.target.value)} aria-invalid={!!error} />
      </div>
    </Field>
  )
}

function ScheduleSection({ f, set, errors }: { f: FormState; set: Set; errors: FormErrors }) {
  const sendAt = isoFrom(f.sendDate, f.sendTime)
  const next = nextOccurrence(f.repeatDay, f.repeatTime)
  const addExtra = () => {
    const last = f.extras[f.extras.length - 1]
    const base = last ? isoFrom(last.date, last.time) : undefined
    const iso = base ? new Date(new Date(base).getTime() + 7 * 864e5).toISOString() : (nextOccurrence('Thursday', '13:00') ?? new Date()).toISOString()
    set({ extras: [...f.extras, { id: uid('x'), date: toDateInput(iso), time: fmtTime(iso) }] })
  }
  const setExtra = (id: string, patch: { date?: string; time?: string }) => set({ extras: f.extras.map((x) => (x.id === id ? { ...x, ...patch } : x)) })

  return (
    <Section step={3} title="Schedule">
      <Segmented aria-label="Schedule mode" value={f.mode} onChange={(mode) => set({ mode })} options={[
        { value: 'now', label: 'Send Now', icon: Send },
        { value: 'scheduled', label: 'Schedule', icon: CalendarClock },
        { value: 'recurring', label: 'Recurring', icon: Repeat },
      ]} />

      <div key={f.mode} className="animate-fade-in">
        {f.mode === 'now' && (
          <p className="flex items-center gap-2 rounded-xl bg-subtle px-3.5 py-2.5 text-[13px] text-ink-2"><Send className="size-4 text-ink-3" />Goes out right after you confirm — reminders are still scheduled.</p>
        )}
        {f.mode === 'scheduled' && (
          <DateTime id="send" label="Send on" date={f.sendDate} time={f.sendTime} onDate={(sendDate) => set({ sendDate })} onTime={(sendTime) => set({ sendTime })}
            error={errors.sendAt} hint={sendAt && `Sends ${dueLabel(sendAt)}`} />
        )}
        {f.mode === 'recurring' && (
          <div className="grid grid-cols-[minmax(0,1fr)_132px] gap-2">
            <Field label="Repeat every week" htmlFor="repeat-day" error={errors.repeat}
              hint={next && <>Every {f.repeatDay} · {f.repeatTime} · next on {fmtDay(next.toISOString())}</>}>
              <Select id="repeat-day" value={f.repeatDay} onChange={(e) => set({ repeatDay: e.target.value as FormState['repeatDay'] })}>
                {WEEK.map((d) => <option key={d} value={d}>{d}</option>)}
              </Select>
            </Field>
            <Field label="Time" htmlFor="repeat-time">
              <Input id="repeat-time" type="time" value={f.repeatTime} onChange={(e) => set({ repeatTime: e.target.value })} />
            </Field>
          </div>
        )}
      </div>

      {f.category === 'Lecture' && (
        <div className="rounded-2xl border border-dashed border-pink-200 bg-pink-50/40 p-3.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[13px] font-semibold text-ink">Extra lecture sessions</div>
              <div className="text-[12px] text-ink-3">One-off sessions outside the weekly slot — added to the calendar with reminders.</div>
            </div>
            <Button size="sm" variant="secondary" icon={Plus} onClick={addExtra}>Add extra lecture</Button>
          </div>
          {f.extras.length > 0 && (
            <ul className="mt-3 space-y-2">
              {f.extras.map((x) => {
                const iso = isoFrom(x.date, x.time)
                return (
                  <li key={x.id} className="flex flex-wrap items-center gap-2 rounded-xl bg-surface p-2 pl-3 shadow-card ring-1 ring-line animate-scale-in">
                    <CalendarPlus className="size-4 shrink-0 text-pink-600" />
                    <span className="min-w-36 flex-1 text-[13px] font-semibold text-ink">
                      {iso ? `${weekday(iso)}, ${new Date(iso).getDate()} ${new Date(iso).toLocaleString('en-GB', { month: 'long' })} · ${fmtTime(iso)}` : 'Pick a date'}
                    </span>
                    <Input type="date" aria-label="Extra lecture date" value={x.date} onChange={(e) => setExtra(x.id, { date: e.target.value })} className="h-9 w-40" />
                    <Input type="time" aria-label="Extra lecture time" value={x.time} onChange={(e) => setExtra(x.id, { time: e.target.value })} className="h-9 w-28" />
                    <IconButton icon={Trash2} label="Remove extra lecture" size="sm" onClick={() => set({ extras: f.extras.filter((y) => y.id !== x.id) })} />
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </Section>
  )
}

const CHANNELS: { key: keyof Delivery; label: string; description: ReactNode; icon: LucideIcon; tone: 'violet' | 'brand' | 'sky' }[] = [
  { key: 'announcement', label: 'Discord Announcement', description: <>Posts an embed in <b className="font-semibold text-ink-2">#announcement</b></>, icon: Hash, tone: 'violet' },
  { key: 'dm', label: 'Discord DM', description: 'Personal message and reminders to each student', icon: MessageCircle, tone: 'brand' },
  { key: 'dashboard', label: 'Dashboard Notification', description: 'In-app notification inside Classync', icon: LayoutDashboard, tone: 'sky' },
]

export function NotificationForm({ f, set, errors, reachIds, onCategory }: {
  f: FormState; set: Set; errors: FormErrors; reachIds: string[]; onCategory: (c: FormState['category']) => void
}) {
  const { data } = useStore()
  const deadline = isoFrom(f.deadlineDate, f.deadlineTime)
  const u = deadline ? urgency(deadline) : undefined
  const sessionCount = f.audience.classIds[0] ? studentsIn(data.people, f.audience.classIds[0]).length : 0

  return (
    <div>
      <Section step={1} title="Details">
        <Field label="Notification title" required htmlFor="n-title" error={errors.title}>
          <Input id="n-title" data-autofocus value={f.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Machine Learning Assignment" maxLength={80} aria-invalid={!!errors.title} />
        </Field>
        <Field label="Description" htmlFor="n-desc" hint="Shown in the Discord embed and the dashboard card.">
          <Textarea id="n-desc" rows={3} className="min-h-20" value={f.description} onChange={(e) => set({ description: e.target.value })} placeholder="A new assignment has been posted." />
        </Field>
        <Field label="Category">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Category">
            {CATEGORIES.map((c) => {
              const m = CATEGORY[c]
              const t = toneOf(m.tone)
              const on = f.category === c
              return (
                <button key={c} type="button" role="radio" aria-checked={on} onClick={() => onCategory(c)}
                  className={cn('flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-[13px] font-semibold transition duration-150 active:scale-[0.98]',
                    on ? cn(t.soft, t.border, t.text, 'ring-4', t.ring.replace('200', '100')) : 'border-line bg-surface text-ink-2 hover:border-line-strong hover:bg-subtle/60')}>
                  <IconTile icon={m.icon} tone={m.tone} size="sm" className={on ? 'bg-white' : undefined} />{c}
                </button>
              )
            })}
          </div>
        </Field>
      </Section>

      <AudienceSection f={f} set={set} reachIds={reachIds} error={errors.audience} />
      <ScheduleSection f={f} set={set} errors={errors} />

      {needsDeadline(f.category) && (
        <Section step={4} title="Deadline" hint={deadline && <span className={cn('font-semibold', u === 'urgent' || u === 'overdue' ? 'text-rose-600' : 'text-ink-2')}>{u === 'overdue' ? 'Already passed' : timeLeft(deadline)}</span>}>
          <DateTime id="deadline" label="Due" date={f.deadlineDate} time={f.deadlineTime} onDate={(deadlineDate) => set({ deadlineDate })} onTime={(deadlineTime) => set({ deadlineTime })}
            error={errors.deadline} hint={deadline && `Due ${dueLabel(deadline)} · added to the calendar${sessionCount ? ` and tracked for ${sessionCount} students` : ''}`} />
        </Section>
      )}

      <Section step={needsDeadline(f.category) ? 5 : 4} title="Reminders" hint={`${f.reminders.length} selected`}>
        <div className="flex flex-wrap gap-2">
          {REMINDER_OPTIONS.map((r) => (
            <ToggleChip key={r} icon={Bell} on={f.reminders.includes(r)} onClick={() => set({ reminders: f.reminders.includes(r) ? f.reminders.filter((x) => x !== r) : [...f.reminders, r] })}>{r}</ToggleChip>
          ))}
        </div>
        <p className="flex items-center gap-1.5 text-[12px] text-ink-3"><BellRing className="size-3.5" />Reminders stop for each student once they mark the task as done.</p>
      </Section>

      <Section step={needsDeadline(f.category) ? 6 : 5} title="Delivery channels">
        <div className="divide-y divide-line rounded-2xl border border-line">
          {CHANNELS.map((c) => (
            <div key={c.key} className="flex items-center gap-3 px-3.5 py-3">
              <IconTile icon={c.icon} tone={c.tone} size="sm" />
              <Toggle className="flex-1 items-center" label={c.label} description={c.description} checked={f.delivery[c.key]}
                onChange={(v) => set({ delivery: { ...f.delivery, [c.key]: v } })} />
            </div>
          ))}
        </div>
        {errors.delivery && <p role="alert" className="text-xs font-medium text-rose-600">{errors.delivery}</p>}
      </Section>
    </div>
  )
}
