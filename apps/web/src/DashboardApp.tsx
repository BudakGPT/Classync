"use client";

import { lazy, Suspense, useEffect, useState, type ComponentType } from 'react'
import { SearchX } from 'lucide-react'
import { ALL_NAV } from '@/app/nav'
import { CommandPalette } from '@/components/shell/CommandPalette'
import { ErrorBoundary } from '@/components/shell/ErrorBoundary'
import { ModalHost } from '@/components/shell/ModalHost'
import { Sidebar } from '@/components/shell/Sidebar'
import { Toaster } from '@/components/shell/Toaster'
import { TopNav } from '@/components/shell/TopNav'
import { Card, EmptyState, Skeleton } from '@/components/ui'
import { navigate, useRoute } from '@/lib/router'
import { StoreProvider } from '@/store/store'

// Route key = first hash segment. Pages read deeper segments (ids, tabs) with useRoute().
const PAGES: Record<string, ComponentType> = {
  '': lazy(() => import('@/views/overview')),
  classes: lazy(() => import('@/views/classes')),
  students: lazy(() => import('@/views/students')),
  groups: lazy(() => import('@/views/groups')),
  notifications: lazy(() => import('@/views/notifications')),
  calendar: lazy(() => import('@/views/calendar')),
  assignments: lazy(() => import('@/views/assignments')),
  help: lazy(() => import('@/views/help')),
  discord: lazy(() => import('@/views/discord')),
  database: lazy(() => import('@/views/database')),
  analytics: lazy(() => import('@/views/analytics')),
  activity: lazy(() => import('@/views/activity')),
  settings: lazy(() => import('@/views/settings')),
}

const COLLAPSE_QUERY = '(max-width: 1199px)'

function Shell() {
  const { segments } = useRoute()
  const key = segments[0] ?? ''
  const Page = PAGES[key] ?? NotFound
  const [collapsed, setCollapsed] = useState(() => window.matchMedia(COLLAPSE_QUERY).matches)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(COLLAPSE_QUERY)
    const onChange = () => setCollapsed(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    window.scrollTo({ top: 0 })
    setMobileOpen(false)
    document.title = `${ALL_NAV.find((n) => n.key === key)?.label ?? 'Classync'} · Classync`
  }, [key, segments[1]])

  return (
    <div className="flex min-h-dvh">
      <button type="button" onClick={() => document.getElementById('main')?.focus()} className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[90] focus:rounded-lg focus:bg-ink focus:px-3 focus:py-2 focus:text-white">
        Skip to content
      </button>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNav onOpenMobile={() => setMobileOpen(true)} />
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[1440px] flex-1 px-4 pb-16 pt-6 outline-none md:px-6 lg:px-8">
          <ErrorBoundary key={key}>
            <Suspense fallback={<PageSkeleton />}>
              <div key={key} className="animate-rise-in"><Page /></div>
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
      <CommandPalette />
      <ModalHost />
      <Toaster />
    </div>
  )
}

function PageSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-2 h-4 w-96" />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </div>
      <Skeleton className="mt-4 h-72 rounded-2xl" />
    </div>
  )
}

function NotFound() {
  return (
    <Card>
      <EmptyState icon={SearchX} title="Page not found" description="This page doesn't exist in the Classync workspace." action={{ label: 'Back to overview', onClick: () => navigate('/') }} />
    </Card>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
