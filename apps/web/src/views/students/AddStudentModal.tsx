import { useState, type FormEvent } from 'react'
import { AtSign, Hash, Mail, Sparkles, UserPlus, UserRound } from 'lucide-react'
import {
  AnonStack, Avatar, Button, DiscordGlyph, Field, Input, Modal, OptionCards, RoleChip, StatusBadge,
} from '@/components/ui'
import { navigate } from '@/lib/router'
import type { ClassId, ModalHostProps } from '@/lib/types'
import { wait } from '@/lib/utils'
import { useActions } from '@/store/actions'
import { useStore } from '@/store/store'
import { classTone, emailFor, slugify } from './lib'
import { ClassChip } from './parts'

export default function AddStudentModal({ open, onClose, spec }: ModalHostProps<'addStudent'>) {
  const { data, toast } = useStore()
  const actions = useActions()
  const [name, setName] = useState('')
  const [npm, setNpm] = useState('')
  const [email, setEmail] = useState<string | null>(null) // null → follow the suggestion from the name
  const [classId, setClassId] = useState<ClassId>(spec.classId ?? 'B')
  const [discord, setDiscord] = useState('')
  const [tried, setTried] = useState(false)
  const [saving, setSaving] = useState(false)

  const suggestion = name.trim() ? emailFor(name) : ''
  const mail = email ?? suggestion
  const owner = npm.length === 10 ? data.people.find((p) => p.npm === npm) : undefined
  const errors = {
    name: name.trim().split(/\s+/).join('').length < 3 ? 'Enter the student’s full name.' : '',
    npm: owner ? `This NPM already belongs to ${owner.name}.` : !/^\d{10}$/.test(npm) ? 'NPM must be exactly 10 digits.' : '',
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail) ? 'Enter a valid email address.' : '',
  }
  const invalid = Object.values(errors).some(Boolean)

  // Mirrors actions.addStudent's id so the preview avatar is the one the student will actually get.
  const base = slugify(name) || 'new-student'
  const taken = new Set(data.people.map((p) => p.id))
  let previewId = base
  for (let i = 2; taken.has(previewId); i++) previewId = `${base}-${i}`

  const cls = data.classes.find((c) => c.id === classId)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setTried(true)
    if (invalid) return
    setSaving(true)
    await wait(650)
    const p = actions.addStudent({ name: name.trim().replace(/\s+/g, ' '), npm, email: mail.trim(), classId, discord: discord.trim() || undefined })
    toast({
      title: 'Student added',
      description: `${p.name} joined Class ${classId} · invite sent to ${p.email}`,
      action: { label: 'View profile', onClick: () => navigate(`/students/${p.id}`) },
    })
    onClose()
  }

  return (
    <Modal
      open={open} onClose={onClose} size="xl" icon={UserPlus}
      title="Add student" description="Create a student record — Classync assigns their class role once they verify on Discord."
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" type="submit" form="add-student-form" icon={UserPlus} loading={saving}>Add student</Button>
      </>}
    >
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_280px]">
        <form id="add-student-form" onSubmit={submit} noValidate className="space-y-4">
          <Field label="Full name" required htmlFor="as-name" error={tried && errors.name}>
            <Input id="as-name" icon={UserRound} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Aurel Kirana" autoComplete="off" data-autofocus />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Student ID (NPM)" required htmlFor="as-npm" error={(tried || owner) && errors.npm} hint={<span className="tabular">{npm.length}/10 digits</span>}>
              <Input id="as-npm" icon={Hash} inputMode="numeric" maxLength={10} value={npm} onChange={(e) => setNpm(e.target.value.replace(/\D/g, ''))} placeholder="2406440017" className="tabular" />
            </Field>
            <Field
              label="Email" required htmlFor="as-email" error={tried && errors.email}
              hint={email === null && suggestion ? <span className="inline-flex items-center gap-1"><Sparkles className="size-3 text-brand-500" />Suggested from name</span> : undefined}
              action={email !== null && suggestion && email !== suggestion
                ? <button type="button" onClick={() => setEmail(null)} className="max-w-40 truncate text-xs font-semibold text-brand-600 hover:text-brand-700">Use {suggestion}</button>
                : undefined}
            >
              <Input id="as-email" icon={Mail} type="email" value={mail} onChange={(e) => setEmail(e.target.value)} placeholder="name@campus.ac.id" />
            </Field>
          </div>

          <Field label="Class" required>
            <OptionCards columns={4} value={classId} onChange={setClassId} options={data.classes.map((c) => ({ value: c.id, label: c.name, description: c.subject }))} />
          </Field>

          <Field label="Discord username" htmlFor="as-discord" hint="Optional — if they’re already on the server, they’ll show as Pending until verified.">
            <Input id="as-discord" icon={AtSign} value={discord} onChange={(e) => setDiscord(e.target.value.replace(/\s/g, '').toLowerCase())} placeholder="aurel.kirana" />
          </Field>
        </form>

        <aside className="hero-gradient flex flex-col rounded-2xl border border-line p-5" aria-label="Live preview">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">Live preview</p>
          <div className="mt-4 flex flex-col items-center text-center">
            <span className="rounded-full bg-surface p-1 shadow-lift">
              {name.trim() ? <Avatar id={previewId} name={name} size="2xl" /> : <AnonStack count={1} max={1} size="2xl" />}
            </span>
            <p className="mt-3 max-w-full truncate text-base font-extrabold tracking-tight text-ink">{name.trim() || 'New student'}</p>
            <p className="text-xs text-ink-3 tabular">{npm ? `NPM ${npm}` : 'NPM ··········'}</p>
            <p className="max-w-full truncate text-xs text-ink-3">{mail || 'name@campus.ac.id'}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              <ClassChip classId={classId} />
              <StatusBadge status={discord.trim() ? 'Pending' : 'Not Connected'} />
            </div>
          </div>
          <div className="mt-5 rounded-xl bg-surface/85 p-3 ring-1 ring-line">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3">Resulting Discord role</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <RoleChip name={`@Class-${classId}`} tone={classTone(data, classId)} />
              {discord.trim() && <span className="inline-flex min-w-0 items-center gap-1 text-xs font-medium text-ink-2"><DiscordGlyph className="size-3.5 text-discord" /><span className="truncate">{discord}</span></span>}
            </div>
            <p className="mt-2 text-[11.5px] leading-snug text-ink-3">Unlocks {cls?.discord.text.map((t) => `#${t}`).join(' · ')} and {cls?.discord.voice[0]} after verification.</p>
          </div>
        </aside>
      </div>
    </Modal>
  )
}
