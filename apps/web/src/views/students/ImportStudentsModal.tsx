import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, FileSpreadsheet, Users } from 'lucide-react'
import { Button, DiscordGlyph, Modal, StepChecklist } from '@/components/ui'
import { navigate } from '@/lib/router'
import type { ClassId, ModalHostProps, Person } from '@/lib/types'
import { wait } from '@/lib/utils'
import { useActions } from '@/store/actions'
import { useStore } from '@/store/store'
import { DUPLICATE_NPMS, SAMPLE_FILE, SHEET_ROWS, SUGGESTED_CLASS, toClassId, type FieldKey } from './importData'
import { DoneStep, MapStep, PreviewStep, StepIndicator, UploadStep, ValidateStep } from './ImportSteps'

const DUP_ROWS = SHEET_ROWS.filter((r) => DUPLICATE_NPMS.includes(r.npm))
const MISSING_ROWS = SHEET_ROWS.filter((r) => !toClassId(r.className))
const VALID_ROWS = SHEET_ROWS.filter((r) => !DUPLICATE_NPMS.includes(r.npm) && toClassId(r.className))

export default function ImportStudentsModal({ open, onClose }: ModalHostProps<'importStudents'>) {
  const { toast } = useStore()
  const actions = useActions()
  const [step, setStep] = useState(0)
  const [file, setFile] = useState<{ name: string; size: number } | null>(null)
  const [progress, setProgress] = useState(0)
  const [mapping, setMapping] = useState<Record<string, FieldKey>>({ A: 'name', B: 'npm', C: 'classId' })
  const [validated, setValidated] = useState(false)
  const [dups, setDups] = useState<Record<string, 'merge' | 'skip' | undefined>>({})
  const [fixClass, setFixClass] = useState<ClassId | ''>('')
  const [fixingAll, setFixingAll] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ added: Person[]; updated: number } | null>(null)
  const imported = useRef(false)

  // Simulated parsing of the chosen file.
  useEffect(() => {
    if (!file || progress >= 100) return
    const t = setTimeout(() => setProgress((p) => Math.min(100, p + 8 + Math.random() * 9)), 90)
    return () => clearTimeout(t)
  }, [file, progress])

  const chooseFile = (f: { name: string; size: number }) => { setFile(f); setProgress(0) }
  const mapped = Object.values(mapping)
  const mappingOk = (['name', 'npm', 'classId'] as FieldKey[]).every((f) => mapped.filter((m) => m === f).length === 1)
  const unresolved = DUP_ROWS.filter((r) => !dups[r.npm]).length + (fixClass ? 0 : MISSING_ROWS.length)

  const fixAll = async () => {
    setFixingAll(true)
    for (const r of DUP_ROWS) {
      if (dups[r.npm]) continue
      setDups((d) => ({ ...d, [r.npm]: 'merge' }))
      await wait(380)
    }
    if (!fixClass) setFixClass(SUGGESTED_CLASS)
    await wait(200)
    setFixingAll(false)
  }

  const rows = [
    ...VALID_ROWS.map((r) => ({ name: r.name, npm: r.npm, classId: toClassId(r.className)! })),
    ...DUP_ROWS.filter((r) => dups[r.npm] === 'merge').map((r) => ({ name: r.name, npm: r.npm, classId: toClassId(r.className)! })),
    ...(fixClass ? MISSING_ROWS.map((r) => ({ name: r.name, npm: r.npm, classId: fixClass })) : []),
  ]

  const finishImport = () => {
    if (imported.current) return
    imported.current = true
    const res = actions.importStudents(rows, rows.length)
    setResult(res)
    setImporting(false)
    setStep(4)
    toast({ title: `${res.added.length} students imported`, description: `Auto-categorized into classes · ${res.updated} existing records updated`, tone: 'success' })
  }

  const next = () => setStep((s) => s + 1)
  const back = () => setStep((s) => Math.max(0, s - 1))
  const goto = (to: string) => { onClose(); navigate(to) }

  const footer = step === 4 ? (
    <>
      <Button variant="discord" onClick={() => goto('/database')}><DiscordGlyph className="size-4" />Verify on Discord</Button>
      <Button variant="primary" icon={Users} onClick={() => goto('/students?show=new')}>View students</Button>
    </>
  ) : (
    <>
      <Button variant="ghost" className="mr-auto" onClick={onClose} disabled={importing}>Cancel</Button>
      {step > 0 && <Button icon={ArrowLeft} onClick={back} disabled={importing || fixingAll}>Back</Button>}
      {step === 0 && <Button variant="primary" iconRight={ArrowRight} disabled={progress < 100} onClick={next}>Next</Button>}
      {step === 1 && <Button variant="primary" iconRight={ArrowRight} onClick={next}>Map columns</Button>}
      {step === 2 && <Button variant="primary" iconRight={ArrowRight} disabled={!mappingOk} onClick={next}>Validate {SHEET_ROWS.length} rows</Button>}
      {step === 3 && (
        <>
          {unresolved > 0 && validated && <Button disabled={importing || fixingAll} onClick={() => setImporting(true)}>Import valid rows only</Button>}
          <Button variant="primary" disabled={!validated || unresolved > 0 || fixingAll} loading={importing} onClick={() => setImporting(true)}>Import students</Button>
        </>
      )}
    </>
  )

  return (
    <Modal
      open={open} onClose={onClose} size="xl" icon={FileSpreadsheet} footer={footer}
      title="Import students"
      description="Bulk-add a roster from a spreadsheet — Classync sorts everyone into classes and prepares their Discord roles."
    >
      <StepIndicator step={step} />
      <div key={step} className="mt-5 animate-rise-in">
        {step === 0 && <UploadStep file={file} progress={progress} onFile={chooseFile} onSample={() => chooseFile(SAMPLE_FILE)} onReset={() => { setFile(null); setProgress(0) }} />}
        {step === 1 && <PreviewStep fileName={file?.name ?? SAMPLE_FILE.name} />}
        {step === 2 && <MapStep mapping={mapping} onChange={(l, f) => setMapping((m) => ({ ...m, [l]: f }))} />}
        {step === 3 && (
          importing ? (
            <Working title={`Importing ${rows.length} rows`} subtitle="Hang tight — this only takes a moment.">
              <StepChecklist interval={520} onDone={finishImport} steps={[
                `Creating and updating ${rows.length} student records`,
                'Auto-categorizing students into Classes A–D',
                'Preparing Discord verification & class roles',
              ]} />
            </Working>
          ) : !validated ? (
            <Working title={`Validating ${SHEET_ROWS.length} rows`} subtitle="Checking every row against the academic database.">
              <StepChecklist interval={420} onDone={() => setValidated(true)} steps={[
                'Checking NPM format (10 digits)',
                'Matching existing students by NPM',
                'Resolving class categories',
              ]} />
            </Working>
          ) : (
            <ValidateStep
              validCount={VALID_ROWS.length} dupRows={DUP_ROWS} missingRows={MISSING_ROWS}
              dups={dups} onDup={(npm, d) => setDups((x) => ({ ...x, [npm]: d }))}
              fixClass={fixClass} onFixClass={setFixClass} fixingAll={fixingAll} onFixAll={fixAll}
            />
          )
        )}
        {step === 4 && result && <DoneStep added={result.added} updated={result.updated} />}
      </div>
    </Modal>
  )
}

function Working({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center py-8 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-600"><FileSpreadsheet className="size-6" /></span>
      <p className="mt-3 text-[15px] font-bold text-ink">{title}</p>
      <p className="text-[13px] text-ink-3">{subtitle}</p>
      <div className="mt-5 w-full rounded-xl border border-line bg-canvas/60 p-4 text-left">{children}</div>
    </div>
  )
}
