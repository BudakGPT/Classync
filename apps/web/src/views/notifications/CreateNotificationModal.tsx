import { useMemo, useState } from 'react'
import { BellPlus, CalendarDays, CalendarPlus, Radio, Save, Send, Users } from 'lucide-react'
import { AvatarStack, Button, Modal, StepChecklist, SuccessBurst } from '@/components/ui'
import { navigate } from '@/lib/router'
import { audienceIds, audienceLabel } from '@/lib/selectors'
import { dueLabel } from '@/lib/time'
import type { ModalHostProps, NotificationItem } from '@/lib/types'
import { plural, wait } from '@/lib/utils'
import { useActions } from '@/store/actions'
import { useStore } from '@/store/store'
import { estimateEvents, initialForm, toDraft, validate, type FormState } from './form'
import { channelNames, reminderSummary, scheduleLabel } from './lib'
import { NotificationForm } from './NotificationForm'
import { NotificationPreview, firstMode, type PreviewMode } from './NotificationPreview'
import { Eyebrow } from './parts'

interface Result { n: NotificationItem; events: number; reach: number }

export default function CreateNotificationModal({ open, onClose, spec }: ModalHostProps<'createNotification'>) {
  const { data, toast, update, classesLoaded = true } = { ...useStore(), classesLoaded: true }
  const actions = useActions()
  const editing = spec.prefill?.id ? data.notifications.find((n) => n.id === spec.prefill?.id) : undefined
  const [form, setForm] = useState(() => initialForm(spec.prefill))
  const [mode, setMode] = useState<PreviewMode>(() => firstMode(form))
  const [showErrors, setShowErrors] = useState(false)
  const [busy, setBusy] = useState<'draft' | 'submit' | null>(null)
  const [result, setResult] = useState<Result | null>(null)

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }))
  const draft = useMemo(() => toDraft(form), [form])
  const reachIds = useMemo(() => audienceIds(form.audience, data), [form.audience, data])
  const errors = validate(form, draft, reachIds.length)
  const shownErrors = showErrors ? errors : {}
  const events = estimateEvents(draft)

  const onCategory = (category: FormState['category']) => {
    if (category === 'Lecture' && form.category !== 'Lecture') {
      const cls = data.classes.find((c) => c.id === form.audience.classIds[0])
      set({ category, mode: 'recurring', ...(cls && { repeatDay: cls.schedule.day, repeatTime: cls.schedule.time }) })
    } else set({ category })
  }

  async function submit(asDraft: boolean) {
    setShowErrors(true)
    const blocking = asDraft ? (errors.title ? { title: errors.title } : {}) : errors
    if (Object.keys(blocking).length) {
      document.querySelector<HTMLElement>('[aria-invalid="true"], [role="alert"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      if (blocking.title) document.getElementById('n-title')?.focus()
      return
    }
    setBusy(asDraft ? 'draft' : 'submit')
    await wait(asDraft ? 500 : 1100)
    const res = actions.scheduleNotification(toDraft(form, asDraft ? 'Draft' : undefined))
    // Editing replaces the original (and the calendar entries it generated) with the new version.
    if (editing) {
      update('notifications', (ns) => ns.filter((n) => n.id !== editing.id))
      update('events', (es) => es.filter((e) => !(e.notificationId === editing.id && e.source === 'notification')))
    }
    setBusy(null)
    const label = audienceLabel(form.audience, data)
    if (asDraft) {
      toast({ title: 'Draft saved', description: `“${res.notification.title}” is waiting in Drafts.`, tone: 'success', action: { label: 'View drafts', onClick: () => navigate('/notifications?tab=draft') } })
      onClose()
      return
    }
    toast({
      title: editing ? 'Changes saved' : form.mode === 'now' ? 'Announcement sent' : 'Announcement scheduled',
      description: `${res.notification.title} · ${label} · ${plural(res.reach, 'student')}`,
      tone: 'success',
    })
    setResult({ n: res.notification, events: res.events.length, reach: res.reach })
  }

  const primaryLabel = editing && editing.status !== 'Draft' ? 'Save changes' : form.mode === 'now' ? 'Send now' : form.mode === 'recurring' ? 'Schedule recurring' : 'Schedule notification'
  void classesLoaded

  if (result) {
    const n = result.n
    const channel = n.delivery.announcement ? 'Discord embed queued for #announcement' : n.delivery.dm ? `Direct messages queued for ${plural(result.reach, 'student')}` : 'Dashboard notification published'
    const steps = [
      n.status === 'Sent' ? `Notification sent to ${plural(result.reach, 'student')}` : 'Notification scheduled',
      result.events ? `Added to calendar (${plural(result.events, 'event')})` : 'No calendar events needed',
      n.reminders.length ? `Reminders set: ${reminderSummary(n.reminders)}` : 'No reminders configured',
      n.status === 'Sent' ? channel.replace('queued for', 'posted in') : channel,
    ]
    return (
      <Modal open={open} onClose={onClose} size="2xl" bodyClassName="p-0" title={editing ? 'Notification updated' : 'Notification ready'} icon={BellPlus}
        footer={<>
          <Button variant="secondary" icon={CalendarDays} onClick={() => { onClose(); navigate('/calendar') }}>View in calendar</Button>
          <Button variant="primary" onClick={onClose} data-autofocus>Done</Button>
        </>}>
        <div className="grid lg:grid-cols-[minmax(0,1fr)_460px]">
          <div className="flex flex-col items-center px-8 py-8 text-center">
            <SuccessBurst size={64} />
            <h3 className="mt-1 text-[22px] font-extrabold tracking-tight text-ink">
              {n.status === 'Sent' ? 'Announcement sent' : editing ? 'Changes saved' : 'Announcement scheduled'}
            </h3>
            <p className="mt-1 max-w-md text-[13.5px] text-ink-3">
              <b className="font-semibold text-ink-2">{n.title}</b> {n.status === 'Sent' ? 'was delivered to' : 'will reach'} {audienceLabel(n.audience, data)} · {scheduleLabel(n)}.
            </p>
            <div className="mt-4 flex items-center gap-2.5 rounded-full bg-subtle py-1 pl-1 pr-3.5">
              <AvatarStack ids={audienceIds(n.audience, data)} max={6} size="sm" ringClass="ring-subtle" />
              <span className="text-[12.5px] font-semibold text-ink-2 tabular">{plural(result.reach, 'student')}</span>
            </div>
            <div className="mt-6 w-full max-w-sm rounded-2xl border border-line bg-canvas p-4 text-left">
              <StepChecklist steps={steps} interval={500} />
            </div>
          </div>
          <aside className="border-t border-line bg-canvas/70 p-5 lg:border-l lg:border-t-0">
            <Eyebrow className="mb-3">Final preview</Eyebrow>
            <NotificationPreview n={n} mode={mode} onModeChange={setMode} />
          </aside>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      open={open} onClose={onClose} size="2xl" bodyClassName="p-0" icon={BellPlus}
      title={editing ? 'Edit notification' : 'Create notification'}
      description="Announcements, academic activities and automatic reminders — delivered to Discord and the dashboard."
      footer={<>
        <span className="mr-auto hidden items-center gap-3 text-[12.5px] text-ink-3 sm:flex">
          <span className="inline-flex items-center gap-1.5"><Users className="size-3.5" /><b className="font-semibold text-ink-2 tabular">{reachIds.length}</b> recipients</span>
          <span className="inline-flex items-center gap-1.5"><CalendarPlus className="size-3.5" />{plural(events, 'calendar event')}</span>
          {Object.keys(shownErrors).length > 0 && <span className="font-semibold text-rose-600">{plural(Object.keys(shownErrors).length, 'field needs', 'fields need')} attention</span>}
        </span>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="secondary" icon={Save} loading={busy === 'draft'} disabled={!!busy} onClick={() => submit(true)}>Save draft</Button>
        <Button variant="primary" icon={form.mode === 'now' ? Send : CalendarPlus} loading={busy === 'submit'} disabled={!!busy} onClick={() => submit(false)}>
          {busy === 'submit' ? (form.mode === 'now' ? 'Sending…' : 'Scheduling…') : primaryLabel}
        </Button>
      </>}
    >
      <div className="grid lg:h-[min(660px,calc(100dvh-250px))] lg:grid-cols-[minmax(0,1fr)_460px]">
        <div className="scrollbar-thin px-6 py-5 lg:overflow-y-auto">
          <NotificationForm f={form} set={set} errors={shownErrors} reachIds={reachIds} onCategory={onCategory} />
        </div>
        <aside className="scrollbar-thin border-t border-line bg-canvas/70 p-5 lg:overflow-y-auto lg:border-l lg:border-t-0" aria-label="Live preview">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <Eyebrow>Live preview</Eyebrow>
              <div className="text-[13px] font-semibold text-ink">How students will see it</div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
              <Radio className="size-3" />Live
            </span>
          </div>
          <NotificationPreview n={draft} mode={mode} onModeChange={setMode} />
          <dl className="mt-4 grid grid-cols-2 gap-2 text-[12px]">
            {[
              ['Sends', scheduleLabel(draft)],
              ['Deadline', draft.deadline ? dueLabel(draft.deadline) : '—'],
              ['Channels', channelNames(draft.delivery).join(' · ') || 'None'],
              ['Reminders', reminderSummary(draft.reminders)],
            ].map(([k, v]) => (
              <div key={k} className="rounded-xl bg-surface px-3 py-2 ring-1 ring-line">
                <dt className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-3">{k}</dt>
                <dd className="truncate font-semibold text-ink-2" title={v}>{v}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </Modal>
  )
}
