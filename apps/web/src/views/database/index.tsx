import { useState } from 'react'
import { FileSpreadsheet, RefreshCw } from 'lucide-react'
import { Badge, Button, PageHeader } from '@/components/ui'
import { students } from '@/lib/selectors'
import { nowIso } from '@/lib/time'
import { wait } from '@/lib/utils'
import { useStore } from '@/store/store'
import { DataSources, ImportHistory, SEED_SOURCES, type Source } from './DataSources'
import { EcosystemFlow } from './EcosystemFlow'
import { OnboardingRules, RecentlyVerified, VerificationOverview, VerificationQueue } from './VerificationAdmin'
import { VerifyPreview } from './VerifyPreview'

export default function DatabasePage() {
  const { data, me, toast, log, openModal } = useStore()
  const [sources, setSources] = useState<Source[]>(SEED_SOURCES)
  const [syncingAll, setSyncingAll] = useState(false)

  async function resync(ids: string[]) {
    setSources((ss) => ss.map((s) => (ids.includes(s.id) ? { ...s, syncing: true } : s)))
    await wait(1500)
    setSources((ss) => ss.map((s) => (ids.includes(s.id) ? { ...s, syncing: false, at: nowIso(), by: me.id, verb: 'Re-synced' } : s)))
  }

  async function resyncOne(s: Source) {
    await resync([s.id])
    const detail = `${s.rows} rows checked · no conflicts`
    toast({ title: `${s.name} re-synced`, description: detail, tone: 'success' })
    log({ actorId: me.id, action: 're-synced', target: s.name, detail, type: 'students' })
  }

  async function syncAll() {
    setSyncingAll(true)
    await resync(sources.map((s) => s.id))
    setSyncingAll(false)
    const detail = `${students(data.people).length} students matched by NPM · ${data.classes.length} classes up to date`
    toast({ title: 'Academic records synced', description: detail, tone: 'success' })
    log({ actorId: me.id, action: 'synced academic records from', target: `${sources.length} data sources`, detail, type: 'students' })
  }

  return (
    <>
      <PageHeader
        title="Academic Database"
        subtitle="Your academic records are the source of truth for Classync — every class, role and group starts from verified student data."
        actions={<>
          <Button variant="secondary" icon={FileSpreadsheet} onClick={() => openModal({ type: 'importStudents' })}>Import spreadsheet</Button>
          <Button variant="primary" icon={RefreshCw} loading={syncingAll} onClick={syncAll}>{syncingAll ? 'Syncing records…' : 'Sync records'}</Button>
        </>}
      />

      <div className="space-y-6">
        <EcosystemFlow />

        <div id="data-sources" className="grid scroll-mt-24 gap-5 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
          <DataSources sources={sources} onResync={resyncOne} />
          <ImportHistory />
        </div>

        <section id="verification" aria-labelledby="verification-title" className="scroll-mt-24 pt-2">
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <h2 id="verification-title" className="text-lg font-extrabold tracking-tight text-ink">Student Verification</h2>
              <Badge tone="emerald" dot size="xs">Live</Badge>
            </div>
            <p className="mt-0.5 text-[13.5px] text-ink-3">When a student joins the server, Classync verifies their identity before assigning class roles.</p>
          </div>
          <div className="grid items-start gap-5 xl:grid-cols-2">
            <div className="space-y-5">
              <VerifyPreview />
              <OnboardingRules />
            </div>
            <div className="space-y-5">
              <VerificationOverview />
              <VerificationQueue />
              <RecentlyVerified />
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
