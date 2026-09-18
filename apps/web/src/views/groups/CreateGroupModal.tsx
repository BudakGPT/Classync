import { useMemo, useState, type ReactNode } from 'react'
import { ArrowRight, Check, CircleAlert, CircleCheck, Hourglass, Infinity as InfinityIcon, Network, Plus, School, Tag, UsersRound } from 'lucide-react'
import { StudentPicker } from '@/components/domain/StudentPicker'
import { AvatarStack, Button, Field, Input, Modal, OptionCards, RoleChip, Segmented, StepChecklist, SuccessBurst } from '@/components/ui'
import { navigate } from '@/lib/router'
import { studentsIn } from '@/lib/selectors'
import { addDays, fromInputs, now, nowIso, toDateInput } from '@/lib/time'
import { tone } from '@/lib/tones'
import type { ClassId, Group, GroupType, ModalHostProps } from '@/lib/types'
import { cn, plural, wait } from '@/lib/utils'
import { useActions } from '@/store/actions'
import { useStore } from '@/store/store'
import { DiscordSidebar } from './DiscordSidebar'
import { GROUP_TYPES, roleFor, shortDate, suggestName, TYPE_LIST } from './meta'

function PreviewRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="text-ink-3">{label}</span>
      <span className="min-w-0 truncate text-right font-semibold text-ink-2">{children}</span>
    </div>
  )
}

export default function CreateGroupModal({ open, onClose, spec }: ModalHostProps<'createGroup'>) {
  const { data, person, toast } = useStore()
  const actions = useActions()
  const pre = spec.prefill
  const preClasses = [...new Set((pre?.memberIds ?? []).map((id) => person(id)?.classId).filter(Boolean))] as ClassId[]

  const [type, setType] = useState<GroupType>('FGD')
  const [scope, setScope] = useState<Group['scope']>(preClasses.length > 1 ? 'cross' : 'single')
  const [classId, setClassId] = useState<ClassId>(pre?.classId ?? preClasses[0] ?? 'B')
  const [crossIds, setCrossIds] = useState<ClassId[]>(preClasses.length > 1 ? preClasses.sort() : data.classes.map((c) => c.id))
  const [nameInput, setNameInput] = useState<string | null>(pre?.name ?? null) // null = follow the suggestion
  const [memberIds, setMemberIds] = useState<string[]>(pre?.memberIds ?? [])
  const [duration, setDuration] = useState<Group['duration']>('Temporary')
  const [start, setStart] = useState(() => toDateInput(nowIso()))
  const [end, setEnd] = useState(() => toDateInput(addDays(now(), 14).toISOString()))
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState<Group | null>(null)

  const allowed = useMemo(() => (scope === 'single' ? [classId] : crossIds), [scope, classId, crossIds])
  const suggestion = suggestName(type, scope, classId, data.groups.map((g) => g.name))
  const name = nameInput ?? suggestion
  const trimmed = name.trim()
  const role = roleFor(trimmed || suggestion)
  const meta = GROUP_TYPES[type]
  const channelCount = meta.text.length + meta.voice.length
  const taken = data.groups.some((g) => g.name.toLowerCase() === trimmed.toLowerCase())
  const nameError = !trimmed ? 'Give the group a name' : taken ? `${trimmed} already exists — pick another name` : null
  const problem = nameError
    ?? (scope === 'cross' && crossIds.length < 2 ? 'Pick at least 2 classes for a cross-class group' : null)
    ?? (memberIds.length < 2 ? `Select at least 2 students (${memberIds.length}/2)` : null)
    ?? (duration === 'Temporary' && (!start || !end || end < start) ? 'End date must be on or after the start date' : null)

  const prune = (ids: ClassId[]) => setMemberIds((m) => m.filter((id) => ids.includes(person(id)?.classId as ClassId)))
  const changeClass = (c: ClassId) => { setClassId(c); prune([c]) }
  const changeScope = (s: Group['scope']) => { setScope(s); prune(s === 'single' ? [classId] : crossIds) }
  const toggleCross = (c: ClassId) => {
    const next = (crossIds.includes(c) ? crossIds.filter((x) => x !== c) : [...crossIds, c]).sort()
    setCrossIds(next)
    prune(next)
  }

  async function create() {
    if (problem) return
    setCreating(true)
    await wait(600)
    const classIds = scope === 'single' ? [classId] : crossIds
    const group = actions.createGroup({
      name: trimmed, type, scope, classIds, memberIds, duration, role,
      startDate: duration === 'Temporary' ? fromInputs(start, '08:00') : undefined,
      endDate: duration === 'Temporary' ? fromInputs(end, '23:59') : undefined,
      text: meta.text, voice: meta.voice,
      description: `${meta.description} for ${scope === 'single' ? `Class ${classId}` : `Classes ${classIds.join(', ')}`}.`,
    })
    setCreating(false)
    setCreated(group)
    toast({ title: 'Group successfully created', description: `${group.role} role and ${plural(channelCount, 'channel')} are live on Discord`, tone: 'success' })
  }

  if (created) {
    const n = created.text.length + created.voice.length
    return (
      <Modal open={open} onClose={onClose} size="xl" bodyClassName="px-6 pb-8 pt-10">
        <div className="mx-auto max-w-md text-center">
          <SuccessBurst size={64} />
          <h2 className="-mt-2 text-xl font-extrabold tracking-tight text-ink">{created.name} is ready</h2>
          <p className="mt-1 text-[13.5px] text-ink-3">Members can start chatting in #{created.text[0]} right away.</p>
          <div className="mt-4 flex justify-center"><AvatarStack ids={created.memberIds} size="lg" max={6} /></div>
          <div className="mx-auto mt-5 w-fit min-w-64 rounded-2xl border border-line bg-canvas/60 px-5 py-4 text-left">
            <StepChecklist steps={['Group created', `${plural(created.memberIds.length, 'student')} assigned`, `Discord role ${created.role} created`, `${plural(n, 'channel')} created`]} />
          </div>
          <div className="mt-6 flex justify-center gap-2">
            <Button variant="secondary" onClick={onClose}>Done</Button>
            <Button variant="primary" iconRight={ArrowRight} onClick={() => { onClose(); navigate(`/groups/${created.id}`) }} data-autofocus>View group</Button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      open={open} onClose={onClose} size="xl" icon={UsersRound} title="Create group" bodyClassName="p-0"
      description="Set up a collaboration space. Classync provisions the Discord role and channels for you."
      footer={
        <>
          <p className={cn('mr-auto flex items-center gap-1.5 text-xs', problem ? 'text-ink-3' : 'font-medium text-emerald-700')} aria-live="polite">
            {problem ? <CircleAlert className="size-3.5 shrink-0" /> : <CircleCheck className="size-3.5 shrink-0" />}
            {problem ?? `Ready: ${role} + ${plural(channelCount, 'channel')} for ${plural(memberIds.length, 'student')}`}
          </p>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon={Plus} onClick={create} loading={creating} disabled={!!problem}>Create Group</Button>
        </>
      }
    >
      <div className="grid md:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5 px-6 py-5">
          <Field label="Group name" htmlFor="group-name" required error={nameInput !== null ? nameError : null}
            hint={nameInput === null ? `Suggested: next free name for ${scope === 'single' ? `Class ${classId}` : 'cross-class groups'}` : `Discord role will be ${role}`}
            action={nameInput !== null && nameInput !== suggestion && <button type="button" onClick={() => setNameInput(null)} className="text-xs font-semibold text-brand-700 hover:underline">Use {suggestion}</button>}>
            <Input id="group-name" icon={Tag} value={name} maxLength={40} onChange={(e) => setNameInput(e.target.value)} />
          </Field>

          <Field label="Group type">
            <OptionCards columns={3} value={type} onChange={setType}
              options={TYPE_LIST.map((t) => ({ value: t, label: t, icon: GROUP_TYPES[t].icon, description: GROUP_TYPES[t].description }))} />
          </Field>

          <Field label="Scope">
            <OptionCards columns={2} value={scope} onChange={changeScope} options={[
              { value: 'single', label: 'Single class', icon: School, description: 'Members from one class roster' },
              { value: 'cross', label: 'Cross class', icon: Network, description: 'Mix students from several classes' },
            ]} />
            <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
              {scope === 'single' ? (
                <>
                  <Segmented aria-label="Class" value={classId} onChange={changeClass} options={data.classes.map((c) => ({ value: c.id, label: `Class ${c.id}` }))} />
                  <span className="text-xs text-ink-3">{data.classes.find((c) => c.id === classId)?.subject} · {plural(studentsIn(data.people, classId).length, 'student')}</span>
                </>
              ) : (
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Classes">
                  {data.classes.map((c) => {
                    const on = crossIds.includes(c.id)
                    return (
                      <button key={c.id} type="button" aria-pressed={on} onClick={() => toggleCross(c.id)}
                        className={cn('inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[12.5px] font-semibold transition active:scale-[0.97]',
                          on ? cn(tone(c.tone).soft, tone(c.tone).text, tone(c.tone).border) : 'border-line bg-surface text-ink-3 hover:border-line-strong hover:text-ink')}>
                        {on ? <Check className="size-3.5" strokeWidth={3} /> : <span className={cn('size-2 rounded-full', tone(c.tone).dot)} />}
                        Class {c.id}<span className="font-medium opacity-70">· {c.subject}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </Field>

          <Field label="Select students" required action={<span className={cn('text-xs font-semibold tabular', memberIds.length >= 2 ? 'text-emerald-700' : 'text-ink-3')}>{memberIds.length} selected · min 2</span>}>
            <StudentPicker value={memberIds} onChange={setMemberIds} classIds={allowed} maxHeight={236} className="[&_[role=listbox]]:grid-cols-3" />
          </Field>

          <Field label="Duration">
            <Segmented aria-label="Duration" value={duration} onChange={setDuration} options={[
              { value: 'Permanent', label: 'Permanent', icon: InfinityIcon },
              { value: 'Temporary', label: 'Temporary', icon: Hourglass },
            ]} />
            {duration === 'Temporary' && (
              <div className="mt-2.5 grid grid-cols-2 gap-3 animate-rise-in">
                <Field label="Start date" htmlFor="group-start">
                  <Input id="group-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
                </Field>
                <Field label="End date" htmlFor="group-end">
                  <Input id="group-end" type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} />
                </Field>
              </div>
            )}
          </Field>
        </div>

        <aside className="border-t border-line bg-canvas/70 px-5 py-5 md:rounded-tr-2xl md:border-l md:border-t-0">
          <div className="sticky top-6 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">Discord resources preview</span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                <span className="relative size-2"><span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping-soft" /><span className="absolute inset-0 rounded-full bg-emerald-500" /></span>Live
              </span>
            </div>
            <DiscordSidebar key={type} category={(trimmed || suggestion).toUpperCase()} text={meta.text} voice={meta.voice} roleName={role} memberIds={memberIds} isNew />
            <div className="space-y-2 rounded-xl border border-line bg-surface p-3">
              <PreviewRow label="Role"><RoleChip name={role} tone="teal" count={memberIds.length} /></PreviewRow>
              <PreviewRow label="Channels">{meta.text.length} text · {meta.voice.length} voice</PreviewRow>
              <PreviewRow label="Access">{scope === 'single' ? `Class ${classId}` : `Classes ${crossIds.join(' · ') || '—'}`}</PreviewRow>
              <PreviewRow label="Duration">{duration === 'Temporary' && start && end ? `${shortDate(fromInputs(start))} – ${shortDate(fromInputs(end))}` : 'Permanent'}</PreviewRow>
            </div>
          </div>
        </aside>
      </div>
    </Modal>
  )
}
