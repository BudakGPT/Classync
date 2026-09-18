import { useMemo, useState } from 'react'
import { BadgeCheck, Check, Clock3, Settings2, Unplug, type LucideIcon } from 'lucide-react'
import { Avatar, Badge, Button, Card, CardHeader, DiscordGlyph, Donut, EmptyState, RoleChip, Toggle } from '@/components/ui'
import { href, navigate } from '@/lib/router'
import { shortName, students } from '@/lib/selectors'
import { tone as toneOf } from '@/lib/tones'
import { now, relTime } from '@/lib/time'
import type { ClassId, Person, Tone, Verification } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useActions } from '@/store/actions'
import { useStore } from '@/store/store'

const LINK = 'rounded text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline'

function useClassTone() {
  const { data } = useStore()
  return (id?: ClassId): Tone => data.classes.find((c) => c.id === id)?.tone ?? 'slate'
}

const STATUS_ROWS: { key: Verification; icon: LucideIcon; tone: Tone }[] = [
  { key: 'Verified', icon: BadgeCheck, tone: 'emerald' },
  { key: 'Pending', icon: Clock3, tone: 'amber' },
  { key: 'Not Connected', icon: Unplug, tone: 'slate' },
]

export function VerificationOverview() {
  const { data } = useStore()
  const roster = students(data.people)
  const counts: Record<Verification, number> = { Verified: 0, Pending: 0, 'Not Connected': 0 }
  for (const p of roster) counts[p.verification]++
  const pct = roster.length ? Math.round((counts.Verified / roster.length) * 100) : 0

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center gap-5">
        <Donut value={pct} size={100} stroke={10} tone="emerald" label={`${pct}% of students verified`}>
          <div className="text-center">
            <div className="text-[21px] font-extrabold leading-none text-ink tabular">{pct}%</div>
            <div className="mt-0.5 text-[10.5px] font-semibold text-ink-3">verified</div>
          </div>
        </Donut>
        <div className="min-w-[240px] flex-1">
          <h3 className="text-[15px] font-bold tracking-tight text-ink">Verification status</h3>
          <p className="text-xs text-ink-3"><span className="tabular">{roster.length}</span> students across {data.classes.length} classes</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {STATUS_ROWS.map((r) => (
              <div key={r.key} className="rounded-xl bg-subtle/70 px-3 py-2.5">
                <div className="flex items-center gap-1.5 whitespace-nowrap text-[11.5px] font-semibold text-ink-3">
                  <r.icon className={cn('size-3.5 shrink-0', toneOf(r.tone).text)} />{r.key}
                </div>
                <div key={counts[r.key]} className="mt-1 text-[21px] font-extrabold leading-none text-ink tabular animate-pop">{counts[r.key]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

const PAGE = 5

export function VerificationQueue() {
  const { data, toast } = useStore()
  const actions = useActions()
  const classTone = useClassTone()
  const [rejected, setRejected] = useState<string[]>([])
  const [showAll, setShowAll] = useState(false)

  const pending = useMemo(() => students(data.people)
    .filter((p) => p.verification === 'Pending' && !rejected.includes(p.id))
    .sort((a, b) => Number(!!b.isNew) - Number(!!a.isNew) || Number(!!b.featured) - Number(!!a.featured) || b.joinedAt.localeCompare(a.joinedAt)),
  [data.people, rejected])
  const shown = showAll ? pending : pending.slice(0, PAGE)

  const verify = (p: Person) => {
    actions.verifyStudent(p.id)
    toast({
      title: `${shortName(p)} verified · @Class-${p.classId} assigned`, description: 'Class channels unlocked on Discord', tone: 'success',
      action: { label: 'View profile', onClick: () => navigate(`/students/${p.id}`) },
    })
  }
  const reject = (p: Person) => {
    setRejected((r) => [...r, p.id])
    toast({
      title: `${shortName(p)}'s request rejected`, description: 'They will be asked to re-check their details or contact their lecturer.', tone: 'warning',
      action: { label: 'Undo', onClick: () => setRejected((r) => r.filter((x) => x !== p.id)) },
    })
  }

  return (
    <Card>
      <CardHeader title="Verification queue" subtitle={pending.length ? `${pending.length} students waiting for review` : 'Nobody is waiting'} icon={Clock3} tone="amber"
        action={pending.length > 0 && <Badge tone="amber" size="sm"><span className="tabular">{pending.length}</span> pending</Badge>} />
      {pending.length === 0 ? (
        <EmptyState compact title="Queue is clear" description="Every student who joined the server has a verified academic identity." icon={BadgeCheck} tone="emerald" characters={['haekal', 'nadia', 'kevin']} />
      ) : (
        <>
          <ul className="mt-3 divide-y divide-line border-t border-line">
            {shown.map((p, i) => (
              <li key={p.id} className={cn('flex items-center gap-3 px-5 py-3 transition-colors hover:bg-subtle/50 animate-rise-in', p.isNew && 'animate-highlight')} style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
                <Avatar id={p.id} size="md" presence />
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <a href={href(`/students/${p.id}`)} className="truncate rounded text-[13.5px] font-semibold text-ink hover:text-brand-700">{p.name}</a>
                    {p.isNew && <Badge tone="brand" size="xs">New</Badge>}
                  </div>
                  <div className="mt-0.5 flex min-w-0 items-center gap-2 text-xs text-ink-3">
                    <span className="tabular">NPM {p.npm}</span>
                    {p.discord && <span className="hidden min-w-0 items-center gap-1 truncate sm:inline-flex"><DiscordGlyph className="size-3 shrink-0 text-discord" />{p.discord}</span>}
                  </div>
                </div>
                <RoleChip name={`Class ${p.classId}`} tone={classTone(p.classId)} className="hidden md:inline-flex" />
                <div className="flex shrink-0 items-center gap-1">
                  <Button size="xs" variant="ghost" onClick={() => reject(p)} aria-label={`Reject ${p.name}`}>Reject</Button>
                  <Button size="xs" variant="soft" icon={Check} onClick={() => verify(p)} aria-label={`Verify ${p.name}`}>Verify</Button>
                </div>
              </li>
            ))}
          </ul>
          {pending.length > PAGE && (
            <div className="border-t border-line px-5 py-2.5 text-center">
              <button type="button" onClick={() => setShowAll((s) => !s)} className={LINK}>
                {showAll ? 'Show less' : `Show all ${pending.length} pending`}
              </button>
            </div>
          )}
        </>
      )}
    </Card>
  )
}

export function RecentlyVerified() {
  const { data, person } = useStore()
  const classTone = useClassTone()

  // Verification events from the feed first (includes live demo verifications), then recently joined verified students.
  const items = useMemo(() => {
    const out: { id: string; at: string }[] = []
    const seen = new Set<string>()
    for (const a of data.activities) {
      const isVerify = a.action === 'verified their academic identity' || a.detail?.startsWith('Verified via')
      if (isVerify && !seen.has(a.actorId) && person(a.actorId)?.verification === 'Verified') { seen.add(a.actorId); out.push({ id: a.actorId, at: a.at }) }
    }
    students(data.people)
      .filter((p) => p.featured && p.verification === 'Verified' && !seen.has(p.id))
      .sort((a, b) => b.joinedAt.localeCompare(a.joinedAt))
      .forEach((p) => out.push({ id: p.id, at: p.joinedAt }))
    return out.slice(0, 5)
  }, [data.activities, data.people, person])

  return (
    <Card>
      <CardHeader title="Recently verified" subtitle="Roles assigned automatically by Classync" icon={BadgeCheck} tone="emerald"
        action={<a href={href('/students')} className={LINK}>All students</a>} />
      <ul className="mt-2 px-2 pb-3">
        {items.map(({ id, at }, i) => {
          const p = person(id)
          if (!p) return null
          const fresh = now().getTime() - new Date(at).getTime() < 120_000
          return (
            <li key={id} className="animate-rise-in" style={{ animationDelay: `${i * 40}ms` }}>
              <a href={href(`/students/${id}`)} className={cn('flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-subtle', fresh && 'animate-highlight bg-emerald-50/60')}>
                <Avatar id={id} size="md" presence />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[13.5px] font-semibold text-ink">{p.name}</span>
                    {fresh && <Badge tone="emerald" size="xs">Just now</Badge>}
                  </div>
                  <div className="truncate text-xs text-ink-3">NPM <span className="tabular">{p.npm}</span></div>
                </div>
                <RoleChip name={`@Class-${p.classId}`} tone={classTone(p.classId)} className="hidden sm:inline-flex" />
                <span className="w-24 shrink-0 text-right text-[11.5px] text-ink-3 tabular">{relTime(at)}</span>
              </a>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}

export function OnboardingRules() {
  const { data, update, toast } = useStore()
  const s = data.settings
  return (
    <Card>
      <CardHeader title="Onboarding rules" subtitle={`Applies to everyone joining ${data.discord.server}`} icon={Settings2} tone="slate"
        action={<a href={href('/settings')} className={LINK}>All settings</a>} />
      <div className="space-y-4 p-5">
        <Toggle
          checked={s.requireVerification}
          onChange={(v) => {
            update('settings', (x) => ({ ...x, requireVerification: v }))
            toast(v
              ? { title: 'Verification required', description: 'New members only see #verify until they match an academic record.', tone: 'success' }
              : { title: 'Verification turned off', description: 'New members can join class channels without matching a record.', tone: 'warning' })
          }}
          label="Require verification for new members"
          description="New members only see #verify until their identity matches an academic record."
        />
        <div className="h-px bg-line" />
        <Toggle
          checked={s.autoAssignRoles}
          onChange={(v) => {
            update('settings', (x) => ({ ...x, autoAssignRoles: v }))
            toast({ title: v ? 'Class roles auto-assigned' : 'Auto-assign turned off', description: v ? 'Verified students get their @Class role instantly.' : 'An admin will assign class roles manually.', tone: 'info' })
          }}
          label="Auto-assign class roles"
          description="Verified students get their @Class role and class channels instantly."
        />
      </div>
    </Card>
  )
}
