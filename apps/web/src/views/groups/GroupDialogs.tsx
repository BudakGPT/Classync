import { useRef, useState } from 'react'
import { ArrowRight, PencilLine, Tag } from 'lucide-react'
import { StudentPicker } from '@/components/domain/StudentPicker'
import { AvatarStack, Badge, Button, ChannelChip, ConfirmDialog, Field, Input, Modal, RoleChip } from '@/components/ui'
import { plural, wait } from '@/lib/utils'
import { useActions } from '@/store/actions'
import { useStore } from '@/store/store'
import { roleFor } from './meta'

/** open/close state for a per-group dialog; a fresh key per opening resets the form while keeping the close animation. */
export function useGroupDialog() {
  const [state, setState] = useState<{ id: string; key: number; open: boolean } | null>(null)
  return {
    state,
    show: (id: string) => setState({ id, key: Date.now(), open: true }),
    hide: () => setState((s) => s && { ...s, open: false }),
  }
}

export function EditGroupModal({ groupId, open, onClose }: { groupId: string; open: boolean; onClose: () => void }) {
  const { data, toast, log, me } = useStore()
  const actions = useActions()
  const initial = useRef(data.groups.find((g) => g.id === groupId)).current
  const [name, setName] = useState(initial?.name ?? '')
  const [members, setMembers] = useState(initial?.memberIds ?? [])
  const [saving, setSaving] = useState(false)
  if (!initial) return null

  const trimmed = name.trim()
  const taken = data.groups.some((g) => g.id !== initial.id && g.name.toLowerCase() === trimmed.toLowerCase())
  const nameError = !trimmed ? 'Give the group a name' : taken ? 'Another group already uses this name' : null
  const added = members.filter((id) => !initial.memberIds.includes(id))
  const removed = initial.memberIds.filter((id) => !members.includes(id))
  const renamed = trimmed !== initial.name
  const changed = renamed || added.length > 0 || removed.length > 0
  const problem = nameError ?? (members.length < 2 ? 'Select at least 2 students' : null)

  async function save() {
    setSaving(true)
    await wait(600)
    actions.updateGroup(initial!.id, { name: trimmed, role: roleFor(trimmed), memberIds: members })
    const detail = [renamed && `Role renamed to ${roleFor(trimmed)}`, added.length && `${added.length} added`, removed.length && `${removed.length} removed`].filter(Boolean).join(' · ')
    log({ actorId: me.id, action: 'updated group', target: trimmed, detail, type: 'groups' })
    toast({ title: 'Group updated', description: `${trimmed} · ${plural(members.length, 'member')} · Discord role synced`, tone: 'success' })
    onClose()
  }

  return (
    <Modal
      open={open} onClose={onClose} size="lg" icon={PencilLine} title={`Edit ${initial.name}`}
      description="Rename the group or change who's in it. Discord updates automatically."
      footer={
        <>
          <span className="mr-auto text-xs text-ink-3">{problem ?? (changed ? 'Unsaved changes' : 'No changes yet')}</span>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} loading={saving} disabled={!!problem || !changed}>Save changes</Button>
        </>
      }
    >
      <div className="space-y-5">
        <Field label="Group name" htmlFor="edit-group-name" required error={nameError}
          hint={renamed ? <span className="inline-flex flex-wrap items-center gap-1.5">Discord role <RoleChip name={initial.role} tone="slate" /><ArrowRight className="size-3" /><RoleChip name={roleFor(trimmed)} tone="teal" /></span> : <>Discord role <span className="font-semibold text-ink-2">{initial.role}</span> is renamed with the group.</>}>
          <Input id="edit-group-name" icon={Tag} value={name} onChange={(e) => setName(e.target.value)} maxLength={40} data-autofocus />
        </Field>
        <Field label="Members" action={
          <span className="flex items-center gap-1.5">
            {added.length > 0 && <Badge tone="emerald" size="xs">+{added.length} added</Badge>}
            {removed.length > 0 && <Badge tone="rose" size="xs">{removed.length} removed</Badge>}
          </span>
        }>
          <StudentPicker value={members} onChange={setMembers} classIds={initial.classIds} maxHeight={260} className="[&_[role=listbox]]:grid-cols-3" />
        </Field>
      </div>
    </Modal>
  )
}

export function DeleteGroupDialog({ groupId, open, onClose, onDeleted }: { groupId: string; open: boolean; onClose: () => void; onDeleted?: () => void }) {
  const { data, toast } = useStore()
  const actions = useActions()
  const g = useRef(data.groups.find((x) => x.id === groupId)).current
  const [loading, setLoading] = useState(false)
  if (!g) return null
  const channels = g.text.length + g.voice.length

  async function confirm() {
    setLoading(true)
    await wait(650)
    onDeleted?.()
    actions.deleteGroup(g!.id)
    toast({ title: `${g!.name} deleted`, description: `${g!.role} role and ${plural(channels, 'channel')} removed from Discord`, tone: 'success' })
    onClose()
  }

  return (
    <ConfirmDialog
      open={open} onClose={onClose} onConfirm={confirm} loading={loading} tone="danger" confirmLabel="Delete group"
      title={`Delete ${g.name}?`}
      description="Deleting this group will also remove its associated role and channels."
    >
      <div className="mt-3 rounded-xl border border-rose-100 bg-rose-50/60 p-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-700/80">Removed from {data.discord.server}</div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <RoleChip name={g.role} tone="rose" count={g.memberIds.length} />
          {g.text.map((c) => <ChannelChip key={c} name={c} className="line-through decoration-rose-400" />)}
          {g.voice.map((c) => <ChannelChip key={c} name={c} voice className="line-through decoration-rose-400" />)}
        </div>
        <div className="mt-2.5 flex items-center gap-2 text-xs text-ink-3">
          <AvatarStack ids={g.memberIds} size="xs" max={5} />
          <span>{plural(g.memberIds.length, 'member')} lose access · class roles stay intact</span>
        </div>
      </div>
    </ConfirmDialog>
  )
}
