import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { getDbSyncState } from '@/actions/sync'
import { SEED } from '@/data/seed'
import { nowIso } from '@/lib/time'
import type { Activity, AppData, ModalSpec, Person, ToastInput } from '@/lib/types'
import { uid } from '@/lib/utils'

export type Toast = ToastInput & { id: string }

export interface Store {
  data: AppData
  /** The signed-in admin (Farhan Akbar, TA). */
  me: Person
  person: (id?: string) => Person | undefined
  /** Immutable update of one collection: update('groups', gs => [newGroup, ...gs]) */
  update: <K extends keyof AppData>(key: K, fn: (prev: AppData[K]) => AppData[K]) => void
  /** Prepend an activity (shows on Overview + Activity Log). */
  log: (a: Omit<Activity, 'id' | 'at'>) => void
  toast: (t: ToastInput) => void
  dismissToast: (id: string) => void
  toasts: Toast[]
  modal: ModalSpec | null
  openModal: (m: ModalSpec) => void
  closeModal: () => void
  paletteOpen: boolean
  setPaletteOpen: (open: boolean) => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(SEED)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [modal, setModal] = useState<ModalSpec | null>(null)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const timers = useRef(new Map<string, number>())

  // Sync real state from Neon DB periodically while keeping SEED dummy baseline
  useEffect(() => {
    let active = true

    async function sync() {
      try {
        const res = await getDbSyncState()
        if (!active || !res.connected) return

        setData((prev) => {
          // Merge assignments: keep non-db seed assignments, prepend/update db assignments
          const seedAssignments = prev.assignments.filter((a) => !a.id.startsWith('db-item-'))
          const mergedAssignments = [...res.assignments, ...seedAssignments]

          // Merge helpClusters: keep non-db seed clusters, prepend/update db clusters
          const seedClusters = prev.helpClusters.filter((h) => !h.id.startsWith('db-concept-'))
          const mergedClusters = [...res.helpClusters, ...seedClusters]

          // Merge answers: keep non-db seed answers, prepend/update db answers
          const seedAnswers = prev.answers.filter((a) => !a.id.startsWith('db-ans-'))
          const mergedAnswers = [...res.answers, ...seedAnswers]

          // Merge students: add any new students from DB
          const existingIds = new Set(prev.people.map((p) => p.id))
          const newStudents = res.students.filter((s) => !existingIds.has(s.id))
          const mergedPeople = [...prev.people, ...newStudents]

          // Sync class/server name if guild is present in DB
          let mergedClasses = prev.classes
          if (res.guild) {
            mergedClasses = prev.classes.map((c) =>
              c.id === 'A' ? { ...c, name: `${res.guild?.name} (Class A)` } : c
            )
          }

          return {
            ...prev,
            classes: mergedClasses,
            assignments: mergedAssignments,
            helpClusters: mergedClusters,
            answers: mergedAnswers,
            people: mergedPeople,
          }
        })
      } catch (err) {
        console.warn('[store] DB Sync error:', err)
      }
    }

    sync()
    const interval = setInterval(sync, 6000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  const update = useCallback(<K extends keyof AppData>(key: K, fn: (prev: AppData[K]) => AppData[K]) => {
    setData((d) => ({ ...d, [key]: fn(d[key]) }))
  }, [])

  const log = useCallback((a: Omit<Activity, 'id' | 'at'>) => {
    setData((d) => ({ ...d, activities: [{ ...a, id: uid('act'), at: nowIso() }, ...d.activities] }))
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((ts) => ts.filter((t) => t.id !== id))
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
  }, [])

  const toast = useCallback((t: ToastInput) => {
    const id = uid('toast')
    setToasts((ts) => [...ts.slice(-3), { ...t, id }])
    timers.current.set(id, window.setTimeout(() => dismissToast(id), 4500))
  }, [dismissToast])

  const byId = useMemo(() => new Map(data.people.map((p) => [p.id, p])), [data.people])

  const value = useMemo<Store>(() => ({
    data,
    me: byId.get('farhan')!,
    person: (id) => (id ? byId.get(id) : undefined),
    update, log, toast, dismissToast, toasts,
    modal, openModal: setModal, closeModal: () => setModal(null),
    paletteOpen, setPaletteOpen,
  }), [data, byId, update, log, toast, dismissToast, toasts, modal, paletteOpen])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('useStore must be used inside <StoreProvider>')
  return s
}
