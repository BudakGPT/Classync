import { lazy, Suspense, useEffect, useRef, useState, type ComponentType } from 'react'
import type { ModalHostProps, ModalSpec } from '@/lib/types'
import { useStore } from '@/store/store'
import { ErrorBoundary } from './ErrorBoundary'

// Each global modal lives next to the page that owns it and is loaded on demand.
const MODALS: Record<ModalSpec['type'], ComponentType<ModalHostProps<never>>> = {
  createNotification: lazy(() => import('@/views/notifications/CreateNotificationModal')),
  createGroup: lazy(() => import('@/views/groups/CreateGroupModal')),
  importStudents: lazy(() => import('@/views/students/ImportStudentsModal')),
  addStudent: lazy(() => import('@/views/students/AddStudentModal')),
  createEvent: lazy(() => import('@/views/calendar/CreateEventModal')),
  createAssignment: lazy(() => import('@/views/assignments/CreateAssignmentModal')),
  createClass: lazy(() => import('@/views/classes/CreateClassModal')),
} as never

export function ModalHost() {
  const { modal, closeModal } = useStore()
  const [last, setLast] = useState<ModalSpec | null>(modal)
  const instance = useRef(0)
  const wasOpen = useRef(false)

  if (modal && !wasOpen.current) instance.current++
  wasOpen.current = !!modal

  useEffect(() => {
    if (modal) { setLast(modal); return }
    const t = setTimeout(() => setLast(null), 220) // let the close animation finish
    return () => clearTimeout(t)
  }, [modal])

  const spec = modal ?? last
  if (!spec) return null
  const Component = MODALS[spec.type] as ComponentType<{ open: boolean; onClose: () => void; spec: ModalSpec }>
  return (
    <ErrorBoundary key={`${spec.type}-${instance.current}`}>
      <Suspense fallback={null}>
        <Component open={!!modal} onClose={closeModal} spec={spec} />
      </Suspense>
    </ErrorBoundary>
  )
}
