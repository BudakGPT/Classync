import { useRef, useState, type DragEvent } from 'react'
import {
  ArrowRight, Check, CircleAlert, CircleCheck, CloudUpload, FileSpreadsheet, FileText, FolderOpen, GitMerge, Sheet, Sparkles, Undo2, Users, WandSparkles, X,
  type LucideIcon,
} from 'lucide-react'
import {
  Avatar, AvatarStack, Badge, Button, IconButton, IconTile, ProgressBar, RoleChip, Select, StatusBadge, SuccessBurst,
} from '@/components/ui'
import type { ClassId, Person, Tone } from '@/lib/types'
import { cn } from '@/lib/utils'
import { useStore } from '@/store/store'
import { COLUMNS, FIELDS, fmtSize, SHEET_ROWS, SUGGESTED_CLASS, type FieldKey, type SheetRow } from './importData'

export const STEPS = ['Upload', 'Preview', 'Map columns', 'Validate', 'Done']

export function StepIndicator({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Import progress">
      {STEPS.map((s, i) => {
        const done = i < step, active = i === step
        return (
          <li key={s} className="flex min-w-0 flex-1 items-center gap-2 last:flex-none" aria-current={active ? 'step' : undefined}>
            <span className={cn(
              'grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold transition duration-300',
              done ? 'bg-emerald-500 text-white' : active ? 'bg-brand-600 text-white ring-4 ring-brand-100' : 'bg-subtle text-ink-3',
            )}>
              {done ? <Check className="size-3.5 animate-check-in" strokeWidth={3} /> : i + 1}
            </span>
            <span className={cn('hidden whitespace-nowrap text-[12.5px] font-semibold sm:inline', active ? 'text-ink' : done ? 'text-ink-2' : 'text-ink-3')}>{s}</span>
            {i < STEPS.length - 1 && <span className="h-0.5 min-w-3 flex-1 overflow-hidden rounded-full bg-subtle"><span className={cn('block h-full bg-emerald-500 transition-[width] duration-500', done ? 'w-full' : 'w-0')} /></span>}
          </li>
        )
      })}
    </ol>
  )
}

// ── 1 · Upload ──────────────────────────────────────────────────────────────
const FORMATS: { label: string; hint: string; icon: LucideIcon; tone: Tone }[] = [
  { label: 'XLSX', hint: 'Excel workbook', icon: FileSpreadsheet, tone: 'emerald' },
  { label: 'CSV', hint: 'Comma-separated values', icon: FileText, tone: 'sky' },
  { label: 'Google Sheets', hint: 'File → Download → .xlsx', icon: Sheet, tone: 'teal' },
]

export function UploadStep({ file, progress, onFile, onSample, onReset }: {
  file: { name: string; size: number } | null; progress: number
  onFile: (f: { name: string; size: number }) => void; onSample: () => void; onReset: () => void
}) {
  const [over, setOver] = useState(false)
  const [error, setError] = useState('')
  const input = useRef<HTMLInputElement>(null)
  const accept = (f?: File) => {
    if (!f) return
    if (!/\.(xlsx|xls|csv)$/i.test(f.name)) { setError(`“${f.name}” isn't a spreadsheet — upload an XLSX or CSV file.`); return }
    setError('')
    onFile({ name: f.name, size: f.size })
  }
  const drop = (e: DragEvent) => { e.preventDefault(); setOver(false); accept(e.dataTransfer.files[0]) }
  const parsed = progress >= 100

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setOver(true) }} onDragLeave={() => setOver(false)} onDrop={drop}
        className={cn(
          'relative flex flex-col items-center overflow-hidden rounded-2xl border-2 border-dashed px-6 text-center transition duration-200',
          file ? 'py-6' : 'py-10',
          over ? 'scale-[1.01] border-brand-400 bg-brand-50' : 'border-line-strong bg-canvas/60 hover:border-brand-300',
        )}
      >
        <div className="bg-dots pointer-events-none absolute inset-0 opacity-60" />
        <span className={cn('relative grid size-14 place-items-center rounded-2xl bg-surface text-brand-600 shadow-lift ring-1 ring-line transition', over && '-translate-y-1 scale-110')}>
          <CloudUpload className="size-6" />
        </span>
        <p className="relative mt-4 text-[15px] font-bold text-ink">{over ? 'Drop it — we’ll read it instantly' : 'Drag & drop your class roster'}</p>
        <p className="relative mt-1 text-[13px] text-ink-3">One row per student with name, NPM and class · up to 2,000 rows</p>
        <div className="relative mt-4 flex flex-wrap justify-center gap-2">
          <Button icon={FolderOpen} onClick={() => input.current?.click()}>Browse files</Button>
          <Button variant="soft" icon={Sparkles} onClick={onSample} data-autofocus>Use sample file</Button>
        </div>
        <input ref={input} type="file" accept=".xlsx,.xls,.csv" className="sr-only" aria-label="Upload spreadsheet" onChange={(e) => { accept(e.target.files?.[0]); e.target.value = '' }} />
      </div>
      {error && <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-rose-600"><CircleAlert className="size-3.5" />{error}</p>}

      {file && (
        <div className="flex items-center gap-3 rounded-xl border border-line bg-surface p-3.5 shadow-card animate-rise-in">
          <IconTile icon={FileSpreadsheet} tone="emerald" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-[13.5px] font-semibold text-ink">{file.name}</p>
              <span className="shrink-0 text-xs text-ink-3 tabular">{fmtSize(file.size)}</span>
            </div>
            <ProgressBar value={progress} tone={parsed ? 'emerald' : 'brand'} size="sm" className="mt-2" label="Parsing progress" />
            <p className={cn('mt-1.5 flex items-center gap-1.5 text-xs', parsed ? 'font-semibold text-emerald-700' : 'text-ink-3')}>
              {parsed
                ? <><CircleCheck className="size-3.5" />Parsed · {SHEET_ROWS.length} rows · 3 columns · Sheet1</>
                : <span className="tabular">{progress < 35 ? 'Reading workbook…' : progress < 75 ? 'Detecting header row…' : 'Counting rows…'} {Math.round(progress)}%</span>}
            </p>
          </div>
          <IconButton icon={X} label="Remove file" size="sm" onClick={onReset} />
        </div>
      )}

      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-3">Supported formats</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {FORMATS.map((f) => (
            <div key={f.label} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5">
              <IconTile icon={f.icon} tone={f.tone} size="sm" />
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-ink">{f.label}</p>
                <p className="truncate text-[11.5px] text-ink-3">{f.hint}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── 2 · Preview ─────────────────────────────────────────────────────────────
const CELL = 'border-b border-r border-line px-3 py-1.5 whitespace-nowrap'

export function PreviewStep({ fileName }: { fileName: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line shadow-card">
      <div className="flex flex-wrap items-center gap-2 border-b border-line bg-canvas/70 px-3.5 py-2.5">
        <FileSpreadsheet className="size-4 text-emerald-600" />
        <span className="truncate text-[13px] font-semibold text-ink">{fileName}</span>
        <span className="ml-auto text-xs text-ink-3"><b className="font-semibold text-ink tabular">{SHEET_ROWS.length}</b> rows detected · 3 columns · Sheet1</span>
      </div>
      <div className="scrollbar-thin max-h-[340px] overflow-auto bg-surface">
        <table className="w-full border-separate border-spacing-0 text-[12.5px]">
          <thead className="sticky top-0 z-10">
            <tr className="text-[11px] font-semibold text-ink-3">
              <th className={cn(CELL, 'w-10 bg-subtle px-2 text-center')} />
              {COLUMNS.map((c) => <th key={c.letter} className={cn(CELL, 'bg-subtle text-center font-semibold')}>{c.letter}</th>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={cn(CELL, 'bg-subtle px-2 text-center text-[11px] text-ink-3 tabular')}>1</td>
              {COLUMNS.map((c) => <td key={c.letter} className={cn(CELL, 'bg-emerald-50/60 font-bold text-ink')}>{c.header}</td>)}
            </tr>
            {SHEET_ROWS.map((r, i) => (
              <tr key={r.npm} className="hover:bg-brand-50/40">
                <td className={cn(CELL, 'bg-subtle px-2 text-center text-[11px] text-ink-3 tabular')}>{i + 2}</td>
                <td className={cn(CELL, 'text-ink')}>{r.name}</td>
                <td className={cn(CELL, 'text-ink-2 tabular')}>{r.npm}</td>
                <td className={cn(CELL, r.className ? 'text-ink-2' : 'bg-amber-50/70 italic text-amber-700')}>{r.className || '(empty)'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-1 border-t border-line bg-canvas/70 px-2 py-1.5">
        <span className="rounded-md bg-surface px-3 py-1 text-xs font-semibold text-emerald-700 shadow-card ring-1 ring-line">Sheet1</span>
        <span className="px-2 text-xs text-ink-3">1 sheet · header row detected</span>
      </div>
    </div>
  )
}

// ── 3 · Map columns ─────────────────────────────────────────────────────────
export function MapStep({ mapping, onChange }: { mapping: Record<string, FieldKey>; onChange: (letter: string, f: FieldKey) => void }) {
  const { data } = useStore()
  const used = Object.values(mapping)
  const missing = (['name', 'npm', 'classId'] as FieldKey[]).filter((f) => used.filter((u) => u === f).length !== 1)
  return (
    <div className="space-y-3">
      <div className="hidden grid-cols-[1fr_24px_1fr] gap-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-ink-3 sm:grid">
        <span>Spreadsheet column</span><span /><span>Classync field</span>
      </div>
      {COLUMNS.map((c, i) => {
        const auto = mapping[c.letter] === c.auto
        return (
          <div key={c.letter} style={{ animationDelay: `${i * 60}ms` }} className="grid grid-cols-1 items-center gap-3 rounded-xl border border-line bg-surface p-3 animate-rise-in sm:grid-cols-[1fr_24px_1fr]">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-emerald-50 text-sm font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">{c.letter}</span>
              <div className="min-w-0">
                <p className="text-[13.5px] font-semibold text-ink">{c.header}</p>
                <p className="truncate text-xs text-ink-3">{SHEET_ROWS.slice(0, 3).map((r) => c.pick(r)).join(' · ')}</p>
              </div>
            </div>
            <ArrowRight className="hidden size-4 text-ink-3 sm:block" />
            <div className="flex min-w-0 items-center gap-2">
              <div className="min-w-0 flex-1">
                <Select aria-label={`Classync field for column ${c.header}`} value={mapping[c.letter]} onChange={(e) => onChange(c.letter, e.target.value as FieldKey)}>
                  {FIELDS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </Select>
              </div>
              {auto ? <Badge tone="emerald" icon={Sparkles}>Auto-matched</Badge> : <Badge tone="slate">Manual</Badge>}
            </div>
          </div>
        )
      })}

      {missing.length > 0 ? (
        <p role="alert" className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-3.5 py-2.5 text-[13px] font-medium text-amber-800">
          <CircleAlert className="size-4 shrink-0" />Map exactly one column to {missing.map((m) => FIELDS.find((f) => f.value === m)!.label).join(', ')} to continue.
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-brand-100 bg-brand-50/50 px-3.5 py-3">
          <WandSparkles className="size-4 shrink-0 text-brand-600" />
          <p className="text-[13px] text-ink-2"><b className="font-semibold text-ink">Auto-categorization:</b> each Category value becomes a class and its Discord role</p>
          <div className="flex flex-wrap gap-1.5">{data.classes.map((c) => <RoleChip key={c.id} name={c.discord.role} tone={c.tone} />)}</div>
        </div>
      )}
    </div>
  )
}

// ── 4 · Validate ────────────────────────────────────────────────────────────
function SummaryCard({ value, label, hint, tone, icon: Icon }: { value: number; label: string; hint: string; tone: Tone; icon: LucideIcon }) {
  const cls = { emerald: 'border-emerald-200 bg-emerald-50/60 text-emerald-700', amber: 'border-amber-200 bg-amber-50/60 text-amber-700', rose: 'border-rose-200 bg-rose-50/60 text-rose-700' }[tone as 'emerald'] ?? ''
  return (
    <div className={cn('rounded-xl border p-3.5 transition-colors duration-500', cls)}>
      <div className="flex items-center justify-between">
        <span key={value} className="text-[28px] font-extrabold leading-none tabular animate-pop">{value}</span>
        <Icon key={tone} className="size-5 animate-check-in" />
      </div>
      <p className="mt-2 text-[13px] font-semibold text-ink">{label}</p>
      <p className="text-xs text-ink-3">{hint}</p>
    </div>
  )
}

export function ValidateStep({ validCount, dupRows, missingRows, dups, onDup, fixClass, onFixClass, fixingAll, onFixAll }: {
  validCount: number; dupRows: SheetRow[]; missingRows: SheetRow[]
  dups: Record<string, 'merge' | 'skip' | undefined>; onDup: (npm: string, d: 'merge' | 'skip' | undefined) => void
  fixClass: ClassId | ''; onFixClass: (c: ClassId | '') => void; fixingAll: boolean; onFixAll: () => void
}) {
  const { data } = useStore()
  const openDups = dupRows.filter((r) => !dups[r.npm]).length
  const openMissing = fixClass ? 0 : missingRows.length
  const merged = dupRows.filter((r) => dups[r.npm] === 'merge').length
  const rowNo = (r: SheetRow) => SHEET_ROWS.indexOf(r) + 2

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        <SummaryCard value={validCount} label="valid records" hint="Passed every check" tone="emerald" icon={CircleCheck} />
        <SummaryCard value={openDups} label={openDups === 1 ? 'duplicate user' : 'duplicate users'} tone={openDups ? 'amber' : 'emerald'} icon={openDups ? Users : CircleCheck}
          hint={openDups ? 'Already exist in Classync' : `${merged} merged · ${dupRows.length - merged} skipped`} />
        <SummaryCard value={openMissing} label="missing class" tone={openMissing ? 'rose' : 'emerald'} icon={openMissing ? CircleAlert : CircleCheck}
          hint={openMissing ? 'Category cell is empty' : `Assigned to Class ${fixClass}`} />
      </div>

      <div className="rounded-xl border border-line">
        <div className="flex items-center justify-between gap-3 border-b border-line px-3.5 py-2.5">
          <p className="text-[13px] font-bold text-ink">
            {openDups + openMissing ? <>Review <span className="tabular">{openDups + openMissing}</span> {openDups + openMissing === 1 ? 'issue' : 'issues'}</> : <span className="inline-flex items-center gap-1.5 text-emerald-700"><CircleCheck className="size-4" />All issues resolved — ready to import</span>}
          </p>
          <Button size="sm" variant="soft" icon={WandSparkles} loading={fixingAll} disabled={!(openDups + openMissing)} onClick={onFixAll}>Fix all</Button>
        </div>
        <ul className="divide-y divide-line">
          {dupRows.map((r) => {
            const existing = data.people.find((p) => p.npm === r.npm)
            const d = dups[r.npm]
            return (
              <IssueRow key={r.npm} resolved={!!d} avatar={existing ? <Avatar id={existing.id} size="md" presence /> : <Avatar id={r.npm} name={r.name} size="md" />}
                title={<>{r.name} <span className="font-normal text-ink-3">· row {rowNo(r)}</span></>}
                subtitle={existing ? <>Already in Class {existing.classId} · NPM {r.npm} · <StatusBadge status={existing.verification} size="xs" /></> : `NPM ${r.npm}`}
                badge={<Badge tone="amber" size="xs" icon={Users}>Duplicate</Badge>}
              >
                {d ? (
                  <Resolved label={d === 'merge' ? 'Merged' : 'Skipped'} tone={d === 'merge' ? 'emerald' : 'slate'} onUndo={() => onDup(r.npm, undefined)} />
                ) : (
                  <>
                    <Button size="xs" variant="soft" icon={GitMerge} onClick={() => onDup(r.npm, 'merge')}>Merge</Button>
                    <Button size="xs" variant="ghost" onClick={() => onDup(r.npm, 'skip')}>Skip</Button>
                  </>
                )}
              </IssueRow>
            )
          })}
          {missingRows.map((r) => (
            <IssueRow key={r.npm} resolved={!!fixClass} avatar={<Avatar id="keisha-amanda" name={r.name} size="md" />}
              title={<>{r.name} <span className="font-normal text-ink-3">· row {rowNo(r)}</span></>}
              subtitle={<>NPM {r.npm} · no class in column C · suggested <b className="font-semibold text-ink-2">Class {SUGGESTED_CLASS}</b></>}
              badge={<Badge tone="rose" size="xs" icon={CircleAlert}>Missing class</Badge>}
            >
              {fixClass ? (
                <Resolved label={`Class ${fixClass}`} tone="emerald" onUndo={() => onFixClass('')} />
              ) : (
                <div className="w-40">
                  <Select aria-label={`Select a class for ${r.name}`} value="" onChange={(e) => onFixClass(e.target.value as ClassId)} className="h-8 text-[13px]">
                    <option value="" disabled>Select a class…</option>
                    {data.classes.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.subject}</option>)}
                  </Select>
                </div>
              )}
            </IssueRow>
          ))}
        </ul>
      </div>
    </div>
  )
}

function IssueRow({ avatar, title, subtitle, badge, resolved, children }: {
  avatar: React.ReactNode; title: React.ReactNode; subtitle: React.ReactNode; badge: React.ReactNode; resolved: boolean; children: React.ReactNode
}) {
  return (
    <li className={cn('flex flex-wrap items-center gap-3 px-3.5 py-3 transition-colors duration-500', resolved && 'bg-emerald-50/40')}>
      <span className={cn('transition duration-300', resolved && 'opacity-70')}>{avatar}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className={cn('text-[13px] font-semibold text-ink', resolved && 'text-ink-2')}>{title}</p>
          {!resolved && badge}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-ink-3">{subtitle}</div>
      </div>
      <div className="flex items-center gap-1.5">{children}</div>
    </li>
  )
}

function Resolved({ label, tone, onUndo }: { label: string; tone: Tone; onUndo: () => void }) {
  return (
    <span className="flex items-center gap-1.5 animate-scale-in">
      <Badge tone={tone} icon={CircleCheck}>{label}</Badge>
      <IconButton icon={Undo2} label="Undo" size="xs" onClick={onUndo} />
    </span>
  )
}

// ── 5 · Done ────────────────────────────────────────────────────────────────
export function DoneStep({ added, updated }: { added: Person[]; updated: number }) {
  const { data } = useStore()
  return (
    <div className="flex flex-col items-center py-2 text-center">
      <SuccessBurst size={64} />
      <h3 className="-mt-2 text-xl font-extrabold tracking-tight text-ink">
        {added.length ? `${added.length} students successfully imported.` : 'Roster already up to date.'}
      </h3>
      <p className="mt-1 max-w-md text-[13px] text-ink-3">
        {updated > 0 && <>{updated} existing {updated === 1 ? 'record' : 'records'} updated · </>}Everyone was auto-categorized by class and stays <b className="font-semibold text-amber-700">Pending</b> until they verify on Discord.
      </p>
      {added.length > 0 && <AvatarStack ids={added.map((p) => p.id)} max={12} size="lg" className="mt-5 animate-rise-in" />}
      <div className="mt-6 grid w-full max-w-2xl grid-cols-2 gap-2.5 sm:grid-cols-4">
        {data.classes.map((c, i) => {
          const list = added.filter((p) => p.classId === c.id)
          if (!list.length) return null
          return (
            <div key={c.id} style={{ animationDelay: `${200 + i * 70}ms` }} className="rounded-xl border border-line bg-surface p-3 text-left shadow-card animate-rise-in">
              <div className="flex items-center justify-between">
                <Badge tone={c.tone} dot>{c.name}</Badge>
                <AvatarStack ids={list.map((p) => p.id)} max={2} size="xs" />
              </div>
              <p className="mt-2 text-2xl font-extrabold text-ink tabular">+{list.length}</p>
              <p className="truncate text-xs text-ink-3">{c.subject}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
