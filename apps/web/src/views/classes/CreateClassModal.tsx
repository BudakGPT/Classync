import { Modal } from '@/components/ui'
import type { ModalHostProps } from '@/lib/types'

export default function CreateClassModal({ open, onClose }: ModalHostProps<'createClass'>) {
  return (
    <Modal open={open} onClose={onClose} title="New class">
      <p className="text-sm text-ink-3">Coming soon.</p>
    </Modal>
  )
}
