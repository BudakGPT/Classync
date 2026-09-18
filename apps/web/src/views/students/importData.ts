import { IMPORT_BATCH } from '@/data/people'
import type { ClassId } from '@/lib/types'

export interface SheetRow { name: string; npm: string; className: string }

// The rest of the 35-row demo roster (IMPORT_BATCH holds the first 8, incl. the scripted issues).
const EXTRA: [string, string, ClassId][] = [
  ['Alya Kurniawan', '2406440567', 'A'], ['Daniel Sembiring', '2406440675', 'A'], ['Fikri Prasetyo', '2406440783', 'A'],
  ['Grace Tjahjadi', '2406440891', 'A'], ['Rendra Wicaksono', '2406440907', 'A'], ['Intan Pohan', '2406441015', 'A'],
  ['Yosef Hutapea', '2406441123', 'A'],
  ['Nabila Syahputri', '2406441231', 'B'], ['Ardi Pangestu', '2406441349', 'B'], ['Clara Lesmana', '2406441457', 'B'],
  ['Hafidz Daulay', '2406441565', 'B'], ['Winona Handoko', '2406441673', 'B'], ['Rizky Pardede', '2406441781', 'B'],
  ['Dinda Kartika', '2406441899', 'B'],
  ['Farah Maharani', '2406441907', 'C'], ['Jonathan Wirawan', '2406442015', 'C'], ['Laras Pertiwi', '2406442123', 'C'],
  ['Bayu Anggoro', '2406442231', 'C'], ['Michelle Tanuwijaya', '2406442349', 'C'], ['Rafael Situmorang', '2406442457', 'C'],
  ['Zahra Nurhaliza', '2406442565', 'C'],
  ['Fadil Rasyid', '2406442673', 'D'], ['Olivia Sutanto', '2406442781', 'D'], ['Gerald Manurung', '2406442899', 'D'],
  ['Ayu Larasati', '2406442907', 'D'], ['Naufal Ibrahim', '2406443015', 'D'], ['Tasya Amelia', '2406443123', 'D'],
]

export const SHEET_ROWS: SheetRow[] = [...IMPORT_BATCH, ...EXTRA.map(([name, npm, c]) => ({ name, npm, className: `Class ${c}` }))]
export const SAMPLE_FILE = { name: 'Fasilkom_DataScience_Roster_2026.xlsx', size: 24_576 }

// ponytail: the spreadsheet is mocked, so its validation issues are scripted too (Haekal & Malik flagged as duplicates).
export const DUPLICATE_NPMS = ['2406431536', '2406398210']
export const SUGGESTED_CLASS: ClassId = 'B' // Data Science roster → Class B

export const toClassId = (s: string) => /^Class ([A-D])$/.exec(s.trim())?.[1] as ClassId | undefined

export type FieldKey = 'name' | 'npm' | 'classId' | 'email' | 'discord' | 'ignore'
export const FIELDS: { value: FieldKey; label: string }[] = [
  { value: 'name', label: 'Student Name' },
  { value: 'npm', label: 'Student ID (NPM)' },
  { value: 'classId', label: 'Category (class)' },
  { value: 'email', label: 'Email' },
  { value: 'discord', label: 'Discord username' },
  { value: 'ignore', label: "Don't import" },
]
export const COLUMNS: { letter: 'A' | 'B' | 'C'; header: string; auto: FieldKey; pick: (r: SheetRow) => string }[] = [
  { letter: 'A', header: 'Name', auto: 'name', pick: (r) => r.name },
  { letter: 'B', header: 'NPM', auto: 'npm', pick: (r) => r.npm },
  { letter: 'C', header: 'Class', auto: 'classId', pick: (r) => r.className },
]

export const fmtSize = (bytes: number) => (bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`)
