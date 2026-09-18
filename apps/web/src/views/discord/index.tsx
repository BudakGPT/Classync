import { useRef, useState } from 'react'
import { DiscordGlyph, PageHeader } from '@/components/ui'
import type { ChannelTemplate } from '@/lib/types'
import { useStore } from '@/store/store'
import { Automations, BotActivity } from './Automations'
import { RolesCard } from './RolesCard'
import { ServerStructure } from './ServerStructure'
import { StatusPanel } from './StatusPanel'
import { TemplatesSection } from './TemplatesSection'

export default function DiscordPage() {
  const { data } = useStore()
  const templatesRef = useRef<HTMLElement>(null)
  const [draft, setDraft] = useState<ChannelTemplate[] | null>(null)
  const [flash, setFlash] = useState(0)

  const manageTemplates = () => {
    setDraft((d) => d ?? structuredClone(data.discord.templates))
    setFlash((f) => f + 1)
    templatesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <PageHeader
        title={<span className="inline-flex items-center gap-3"><DiscordGlyph className="size-8 text-discord" />Discord Integration</span>}
        subtitle="Classync keeps roles, channels and reminders in your Discord server in sync with classes and groups — no bot commands needed."
      />
      <StatusPanel onManageTemplates={manageTemplates} />
      <section className="mt-6" aria-label="Server structure"><ServerStructure /></section>
      <div className="mt-6 grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        <RolesCard />
        <section ref={templatesRef} aria-label="Channel templates" className="scroll-mt-24 xl:col-span-2">
          <TemplatesSection draft={draft} setDraft={setDraft} flash={flash} />
        </section>
      </div>
      <div className="mt-6 grid grid-cols-1 items-start gap-6 xl:grid-cols-3">
        <Automations className="xl:col-span-2" />
        <BotActivity />
      </div>
    </>
  )
}
