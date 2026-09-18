import { useMemo, useState } from 'react'
import { BellPlus, CalendarClock, CheckCheck, PencilLine, Repeat, Send, SignalHigh } from 'lucide-react'
import { Button, Card, ConfirmDialog, EmptyState, PageHeader, SearchInput, StatCard, Tabs } from '@/components/ui'
import { navigate, useRoute } from '@/lib/router'
import { dueLabel, now } from '@/lib/time'
import { CATEGORIES, CATEGORY, tone as toneOf } from '@/lib/tones'
import type { Category, NotificationItem } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'
import { TAB_STATUS, TABS, nextSend, useNotificationOps, type Tab } from './lib'
import { FeaturedNotification, NotificationCard } from './NotificationCard'
import { PreviewDrawer } from './NotificationPreview'
import type { CardHandlers } from './parts'
import { ReminderSection } from './ReminderSection'
import { UpNext } from './UpNext'

const WEEK_MS = 7 * 24 * 3600_000
const STATUS_ORDER = { Scheduled: 0, Recurring: 1, Draft: 2, Sent: 3 }

const EMPTY: Record<Tab, { title: string; description: string; cta: string; characters: string[]; prefill?: Partial<NotificationItem> }> = {
  all: { title: 'No notifications yet', description: 'Announcements, quizzes and deadlines you create show up here — with reminders handled for you.', cta: 'Create notification', characters: ['maya', 'haekal', 'nadia'] },
  scheduled: { title: 'No scheduled announcements', description: 'Plan quizzes, deadlines and announcements ahead. Classync sends them on time and reminds students automatically.', cta: 'Schedule announcement', characters: ['farhan', 'jessica', 'kevin'], prefill: { mode: 'scheduled' } },
  sent: { title: 'Nothing sent yet', description: 'Sent notifications appear here with delivery and read stats from Discord and the dashboard.', cta: 'Send an announcement', characters: ['sarah', 'malik', 'putri'], prefill: { mode: 'now', category: 'Announcement' } },
  recurring: { title: 'No recurring series', description: 'Weekly lectures and digests repeat automatically — set them up once for the whole semester.', cta: 'Create weekly lecture', characters: ['maya', 'dylan', 'citra'], prefill: { mode: 'recurring', category: 'Lecture' } },
  draft: { title: 'No drafts', description: 'Save a notification as a draft to finish it later or get a second opinion from your lecturer.', cta: 'Start a draft', characters: ['andi', 'erik', 'rania'] },
}

export default function NotificationsPage() {
  const { data, openModal } = useStore()
  const { params } = useRoute()
  const raw = params.get('tab') as Tab | null
  const tab: Tab = raw && TABS.includes(raw) ? raw : 'all'
  const setTab = (t: Tab) => navigate(t === 'all' ? '/notifications' : `/notifications?tab=${t}`)
  const [category, setCategory] = useState<Category | null>(null)
  const [q, setQ] = useState('')
  const ops = useNotificationOps()
  const [preview, setPreview] = useState<{ id: string; open: boolean } | null>(null)
  const [deleting, setDeleting] = useState<NotificationItem | null>(null)

  const h: CardHandlers = { ops, preview: (n) => setPreview({ id: n.id, open: true }), askDelete: setDeleting }
  const create = (prefill?: Partial<NotificationItem>) => openModal({ type: 'createNotification', prefill })
  const ns = data.notifications

  const stats = useMemo(() => {
    const t = now().getTime()
    const sentWeek = ns.filter((n) => n.status === 'Sent' && n.sendAt && t - new Date(n.sendAt).getTime() < WEEK_MS)
    const withStats = ns.filter((n) => n.stats)
    const delivered = withStats.reduce((s, n) => s + n.stats!.delivered, 0)
    const read = withStats.reduce((s, n) => s + n.stats!.read, 0)
    const next = ns.filter((n) => n.status === 'Scheduled').map(nextSend).filter(Boolean).sort((a, b) => a!.getTime() - b!.getTime())[0]
    return {
      scheduled: ns.filter((n) => n.status === 'Scheduled').length,
      recurring: ns.filter((n) => n.status === 'Recurring').length,
      sentWeek: sentWeek.length,
      reached: sentWeek.reduce((s, n) => s + (n.stats?.delivered ?? 0), 0),
      readPct: delivered ? Math.round((read / delivered) * 100) : 0,
      next,
    }
  }, [ns])

  const counts = { all: ns.length, ...Object.fromEntries(Object.entries(TAB_STATUS).map(([k, s]) => [k, ns.filter((n) => n.status === s).length])) } as Record<Tab, number>

  const term = q.trim().toLowerCase()
  const inTab = ns.filter((n) => (tab === 'all' || n.status === TAB_STATUS[tab]) && (!term || `${n.title} ${n.description}`.toLowerCase().includes(term)))
  const filtered = category ? inTab.filter((n) => n.category === category) : inTab
  const featured = tab === 'all' || tab === 'scheduled'
    ? filtered.map((n) => ({ n, at: n.status === 'Scheduled' ? nextSend(n) : undefined })).filter((x) => x.at).sort((a, b) => a.at!.getTime() - b.at!.getTime())[0]
    : undefined
  const rest = filtered
    .filter((n) => n !== featured?.n)
    .sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew) || STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
      || (a.status === 'Sent' ? (b.sendAt ?? '').localeCompare(a.sendAt ?? '') : (nextSend(a)?.getTime() ?? Infinity) - (nextSend(b)?.getTime() ?? Infinity)))
  const previewItem = ns.find((n) => n.id === preview?.id)
  const empty = EMPTY[tab]

  return (
    <>
      <PageHeader
        title="Notification Center"
        subtitle="Schedule announcements, academic activities, and automatic reminders."
        actions={<Button variant="primary" icon={BellPlus} onClick={() => create()}>Create Notification</Button>}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="grid grid-cols-2 gap-4 lg:col-span-5">
          <StatCard label="Scheduled" value={stats.scheduled} icon={CalendarClock} tone="sky" onClick={() => setTab('scheduled')}
            footer={stats.next ? <>Next: <b className="font-semibold text-ink-2">{dueLabel(stats.next.toISOString())}</b></> : 'Nothing queued'} />
          <StatCard label="Sent this week" value={stats.sentWeek} icon={Send} tone="emerald" onClick={() => setTab('sent')}
            footer={<><b className="font-semibold text-ink-2 tabular">{stats.reached}</b> deliveries · {stats.readPct}% read</>} />
          <StatCard label="Recurring" value={stats.recurring} icon={Repeat} tone="violet" onClick={() => setTab('recurring')}
            footer="Weekly series running" />
          <StatCard label="Delivery rate" value="94%" icon={SignalHigh} tone="brand" trend={{ value: '1.8%', up: true }}
            footer="Discord + dashboard · 30 days" />
        </div>
        <UpNext className="lg:col-span-7" onSelect={h.preview} />
      </div>

      <section className="mt-8" aria-label="Notifications">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-line">
          <Tabs className="-mb-px border-b-0" value={tab} onChange={setTab} items={[
            { value: 'all', label: 'All', count: counts.all },
            { value: 'scheduled', label: 'Scheduled', count: counts.scheduled, icon: CalendarClock },
            { value: 'sent', label: 'Sent', count: counts.sent, icon: CheckCheck },
            { value: 'recurring', label: 'Recurring', count: counts.recurring, icon: Repeat },
            { value: 'draft', label: 'Draft', count: counts.draft, icon: PencilLine },
          ]} />
          <SearchInput value={q} onChange={setQ} placeholder="Search notifications…" aria-label="Search notifications" className="mb-2 w-full sm:w-64" />
        </div>

        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          <button type="button" aria-pressed={!category} onClick={() => setCategory(null)}
            className={cn('inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-semibold transition active:scale-[0.97]',
              !category ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink')}>
            All categories <span className={cn('tabular', !category ? 'text-white/70' : 'text-ink-3')}>{inTab.length}</span>
          </button>
          {CATEGORIES.map((cat) => {
            const c = CATEGORY[cat]
            const t = toneOf(c.tone)
            const active = category === cat
            const count = inTab.filter((n) => n.category === cat).length
            return (
              <button key={cat} type="button" aria-pressed={active} onClick={() => setCategory(active ? null : cat)}
                className={cn('inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[12.5px] font-semibold transition active:scale-[0.97]',
                  active ? cn(t.soft, t.text, t.border, 'ring-2', t.ring) : 'border-line bg-surface text-ink-2 hover:border-line-strong hover:text-ink',
                  !active && count === 0 && 'opacity-60')}>
                <c.icon className={cn('size-3.5', t.text)} />{cat}
                <span className={cn('tabular', active ? 'opacity-80' : 'text-ink-3')}>{count}</span>
              </button>
            )
          })}
        </div>

        <div className="mt-5 space-y-4">
          {featured && <FeaturedNotification key={featured.n.id} n={featured.n} h={h} next={featured.at!} />}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {rest.map((n, i) => <NotificationCard key={n.id} n={n} h={h} index={i} />)}
            </div>
          )}
          {!featured && rest.length === 0 && (
            <Card>
              {category || term
                ? <EmptyState icon={CATEGORY[category ?? 'Announcement'].icon} tone={CATEGORY[category ?? 'Announcement'].tone} characters={empty.characters}
                    title={`No ${category ?? ''} notifications${tab === 'all' ? '' : ` in ${TAB_STATUS[tab]}`}${term ? ` matching “${q.trim()}”` : ''}`.replace('  ', ' ')}
                    description="Try another category or clear the filters — or create one right away."
                    action={{ label: category ? `Create ${category.toLowerCase()} notification` : 'Clear search', icon: category ? BellPlus : undefined, onClick: () => (category ? create({ ...empty.prefill, category }) : setQ('')) }} />
                : <EmptyState icon={BellPlus} characters={empty.characters} title={empty.title} description={empty.description}
                    action={{ label: empty.cta, icon: BellPlus, onClick: () => create(empty.prefill) }} />}
              {(category || term) && (
                <div className="-mt-8 pb-8 text-center">
                  <button type="button" onClick={() => { setCategory(null); setQ('') }} className="text-[12.5px] font-semibold text-brand-700 hover:underline">Clear filters</button>
                </div>
              )}
            </Card>
          )}
        </div>
      </section>

      <ReminderSection />

      <PreviewDrawer n={previewItem} open={!!preview?.open && !!previewItem} onClose={() => setPreview((p) => p && { ...p, open: false })} h={h} />
      <ConfirmDialog
        open={!!deleting} onClose={() => setDeleting(null)}
        onConfirm={() => { if (deleting) ops.remove(deleting); setDeleting(null) }}
        title={`Delete “${deleting?.title ?? ''}”?`}
        description="Students won’t receive it or any of its reminders, and calendar events created from it are removed. This can’t be undone."
        confirmLabel="Delete notification"
      />
    </>
  )
}
