import { useId, useRef, useState, type FormEvent } from 'react'
import { ArrowRight, BadgeCheck, Check, ChevronDown, Eye, Info, Lightbulb, Lock, RotateCcw, SearchX, ShieldCheck } from 'lucide-react'
import { DiscordMessage, DiscordWindow } from '@/components/domain/Discord'
import { Avatar, Card, ChannelChip, DiscordGlyph, RoleChip, Spinner, StepChecklist } from '@/components/ui'
import { shortName, students } from '@/lib/selectors'
import type { ClassId, Person } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useActions } from '@/store/actions'
import { useStore } from '@/store/store'

const CLASS_IDS: ClassId[] = ['A', 'B', 'C', 'D']
const STEPS = ['Matching name & NPM', 'Checking class roster', 'Assigning role']
const CHANNELS = ['announcement', 'discussion', 'material', 'assignment']
const DEFAULT_NAME = 'Haekal Handrian'

type Phase = 'form' | 'checking' | 'success' | 'failure'
interface Match { person: Person; classId: ClassId; previousClass?: ClassId; wasVerified: boolean }

const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase()

// Discord-dark styling for the onboarding form.
const PANEL = 'mt-2 max-w-[460px] rounded-[6px] border-l-4 bg-[#2b2d31] p-4 animate-fade-in'
const LABEL = 'mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-[#b5bac1]'
const CONTROL = 'h-10 w-full rounded-[4px] bg-[#1e1f22] px-3 text-[14px] text-[#dbdee1] outline-none ring-1 ring-transparent transition placeholder:text-[#6d6f78] hover:ring-black/40 focus:ring-2 focus:ring-[#5865f2]'
// StepChecklist is light-themed; recolor its text and idle circles for the dark window.
const CHECKLIST_DARK = 'mt-3.5 [&_li>span:last-child]:text-[#dbdee1] [&_li>span:first-child:not(.bg-emerald-500)]:bg-white/10 [&_svg.animate-spin]:text-[#949cf7]'

export function VerifyPreview() {
  const { data, toast } = useStore()
  const actions = useActions()
  const [name, setName] = useState(DEFAULT_NAME)
  const [classId, setClassId] = useState<ClassId>('B')
  const [phase, setPhase] = useState<Phase>('form')
  const [match, setMatch] = useState<Match | null>(null)
  const finished = useRef(false)
  const failTimer = useRef<number | undefined>(undefined)
  const nameId = useId()
  const classFieldId = useId()

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    const person = students(data.people).find((p) => norm(p.name) === norm(name))
    finished.current = false
    setMatch(person ? { person, classId, previousClass: person.classId !== classId ? person.classId : undefined, wasVerified: person.verification === 'Verified' } : null)
    setPhase('checking')
    // ponytail: no-match path just waits on the first step, then fails
    if (!person) failTimer.current = window.setTimeout(() => setPhase('failure'), 1400)
  }

  function finish() {
    if (finished.current || !match) return
    finished.current = true
    actions.verifyStudent(match.person.id, match.classId)
    toast({ title: `${shortName(match.person)} verified · @Class-${match.classId} assigned`, description: '#announcement, #discussion, #material, #assignment and voice-class unlocked', tone: 'discord' })
    setPhase('success')
  }

  function reset() {
    window.clearTimeout(failTimer.current)
    setName(DEFAULT_NAME)
    setClassId('B')
    setMatch(null)
    setPhase('form')
  }

  const cls = data.classes.find((c) => c.id === match?.classId)

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-discord text-white"><DiscordGlyph className="size-3.5" /></span>
          <div className="min-w-0">
            <div className="text-[13.5px] font-bold text-ink">Student view</div>
            <div className="truncate text-xs text-ink-3">What a new member sees in #verify</div>
          </div>
        </div>
        <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[12.5px] font-semibold text-brand-600 transition hover:bg-brand-50 hover:text-brand-700">
          <RotateCcw className="size-3.5" />Reset demo
        </button>
      </div>

      <div className="bg-dots bg-subtle/60 p-4">
        <DiscordWindow channel="verify" className="min-h-[400px]">
          <div className="mb-4 flex items-center gap-3 text-[13px] text-[#949ba4]">
            <span className="grid w-10 shrink-0 place-items-center"><ArrowRight className="size-4 text-[#23a55a]" /></span>
            <span className="min-w-0"><span className="font-semibold text-white">haekal.h</span> just joined <span className="font-medium text-[#dbdee1]">Fasilkom Academic Hub</span>. Say hi!</span>
            <span className="ml-auto hidden shrink-0 text-[11px] sm:inline">Today at 10:41</span>
          </div>

          <DiscordMessage>
            <p className="font-semibold text-white">Welcome to Classync 👋</p>
            <p>Please verify your academic identity.</p>

            {phase === 'form' && (
              <form onSubmit={submit} className={cn(PANEL, 'border-[#5865f2]')}>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_140px]">
                  <div>
                    <label htmlFor={nameId} className={LABEL}>Full Name</label>
                    <input id={nameId} value={name} onChange={(e) => setName(e.target.value)} placeholder="As written in SIAK" autoComplete="off" className={CONTROL} />
                  </div>
                  <div>
                    <label htmlFor={classFieldId} className={LABEL}>Class</label>
                    <div className="relative">
                      <select id={classFieldId} value={classId} onChange={(e) => setClassId(e.target.value as ClassId)} className={cn(CONTROL, 'appearance-none pr-8')}>
                        {CLASS_IDS.map((c) => <option key={c} value={c}>Class {c}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-[#b5bac1]" />
                    </div>
                  </div>
                </div>
                <p className="mt-2.5 flex items-center gap-1.5 text-[12px] text-[#949ba4]">
                  <Lock className="size-3 shrink-0" />Matched privately against the Fasilkom academic database.
                </p>
                <button type="submit" disabled={!name.trim()}
                  className="mt-3.5 inline-flex h-10 items-center gap-2 rounded-[4px] bg-[#5865f2] px-4 text-[14px] font-medium text-white transition hover:bg-[#4752c4] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50">
                  <ShieldCheck className="size-4" />Verify Identity
                </button>
              </form>
            )}

            {phase === 'checking' && (
              <div className={cn(PANEL, 'border-[#5865f2]')} aria-live="polite">
                <div className="flex items-center gap-2.5 text-[14px] font-semibold text-white"><Spinner className="text-[#949cf7]" />Checking academic database...</div>
                <p className="mt-1 text-[12.5px] text-[#949ba4]">Looking up “{name.trim()}” in the Class {classId} roster</p>
                <StepChecklist steps={STEPS} interval={match ? 650 : 5000} onDone={match ? finish : undefined} className={CHECKLIST_DARK} />
              </div>
            )}

            {phase === 'success' && match && (
              <div className={cn(PANEL, 'border-[#23a55a]')} aria-live="polite">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#23a55a] text-white animate-pop"><Check className="size-5" strokeWidth={3} /></span>
                  <div className="min-w-0">
                    <div className="text-[15px] font-semibold text-white">Identity verified.</div>
                    <div className="text-[12.5px] text-[#949ba4]">{match.wasVerified ? 'Already verified · roles refreshed' : `Matched NPM ${match.person.npm} in the academic database`}</div>
                  </div>
                </div>

                <div className="mt-3.5 flex items-center gap-3 rounded-[6px] bg-[#1e1f22] p-3 animate-rise-in [animation-delay:80ms]">
                  <Avatar id={match.person.id} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-semibold text-white">{match.person.name} · Class {match.classId}</div>
                    <div className="truncate text-[12px] text-[#949ba4]">NPM {match.person.npm}{cls && ` · ${cls.subject}`}</div>
                  </div>
                  <BadgeCheck className="size-5 shrink-0 text-[#23a55a]" aria-label="Verified" />
                </div>

                {match.previousClass && (
                  <div className="mt-2.5 flex items-center gap-2 rounded-[4px] bg-[#f0b232]/10 px-2.5 py-1.5 text-[12.5px] font-medium text-[#f0b232]">
                    <Info className="size-3.5 shrink-0" />Class updated from roster · Class {match.previousClass} → Class {match.classId}
                  </div>
                )}

                <div className="mt-3.5 grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-5">
                  <div>
                    <div className={LABEL}>Role assigned</div>
                    <span className="inline-flex animate-pop [animation-delay:150ms]"><RoleChip name={`@Class-${match.classId}`} tone={cls?.tone ?? 'brand'} /></span>
                  </div>
                  <div>
                    <div className={LABEL}>Channels unlocked</div>
                    <div className="flex flex-wrap gap-1.5">
                      {CHANNELS.map((c, i) => (
                        <span key={c} className="inline-flex animate-pop" style={{ animationDelay: `${260 + i * 90}ms` }}><ChannelChip name={c} tone="new" /></span>
                      ))}
                      <span className="inline-flex animate-pop" style={{ animationDelay: `${260 + CHANNELS.length * 90}ms` }}><ChannelChip name="voice-class" voice tone="new" /></span>
                    </div>
                  </div>
                </div>
                <div className="mt-3.5 flex items-center gap-1.5 text-[11.5px] text-[#949ba4]"><Eye className="size-3.5" />Only you can see this</div>
              </div>
            )}

            {phase === 'failure' && (
              <div className={cn(PANEL, 'border-[#f0b232]')} role="alert">
                <div className="flex gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#f0b232]/15 text-[#f0b232] animate-pop"><SearchX className="size-[18px]" /></span>
                  <div className="min-w-0">
                    <div className="text-[14.5px] font-semibold leading-snug text-white">No matching record found — check spelling or contact your lecturer</div>
                    <p className="mt-1 text-[12.5px] text-[#949ba4]">We couldn't find “{name.trim()}” in the academic database. Your name must match your SIAK record.</p>
                  </div>
                </div>
                <button type="button" onClick={() => setPhase('form')} data-autofocus
                  className="mt-3.5 inline-flex h-9 items-center gap-2 rounded-[4px] bg-[#4e5058] px-4 text-[13.5px] font-medium text-white transition hover:bg-[#6d6f78] active:scale-[0.98]">
                  <RotateCcw className="size-3.5" />Try again
                </button>
              </div>
            )}
          </DiscordMessage>
        </DiscordWindow>
      </div>

      <div className="flex items-center gap-2 border-t border-line px-5 py-3 text-xs text-ink-3">
        <Lightbulb className="size-3.5 shrink-0 text-amber-500" />
        Tip: pick a different class to see a roster update, or misspell the name to see the failure state.
      </div>
    </Card>
  )
}
