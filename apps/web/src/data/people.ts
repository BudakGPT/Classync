import type { Person, Presence, Verification } from '@/lib/types'
import { ago } from '@/lib/time'
import { rng } from '@/lib/utils'

// Deterministic PRNG so the generated roster is identical on every load.
const rand = rng(20260915)
const pick = <T,>(a: readonly T[]) => a[Math.floor(rand() * a.length)]

const slug = (name: string) => name.toLowerCase().replace(/[^a-z]+/g, '.')
const email = (name: string, staff = false) => `${slug(name)}@${staff ? 'cs.' : ''}campus.ac.id`

type Seed = Pick<Person, 'id' | 'name'> & Partial<Person>

const STAFF: Seed[] = [
  { id: 'maya', name: 'Dr. Maya Putri', role: 'Lecturer', isAdmin: true, npm: '198503112010', discord: 'dr.maya', presence: 'online', email: 'maya.putri@cs.campus.ac.id' },
  { id: 'andi', name: 'Dr. Andi Wibowo', role: 'Lecturer', isAdmin: false, npm: '197909242008', discord: 'andiwibowo', presence: 'idle', email: 'andi.wibowo@cs.campus.ac.id' },
  { id: 'farhan', name: 'Farhan Akbar', role: 'Teaching Assistant', isAdmin: true, npm: '2206081234', discord: 'farhan.akbar', presence: 'online' },
  { id: 'sarah', name: 'Sarah Wijaya', role: 'Teaching Assistant', isAdmin: true, npm: '2206012876', discord: 'sarahwjy', presence: 'online' },
]

const FEATURED: Seed[] = [
  { id: 'haekal', name: 'Haekal Handrian', classId: 'B', npm: '2406431536', discord: 'haekal.h', verification: 'Pending', presence: 'online' },
  { id: 'malik', name: 'Malik Alifan', classId: 'B', npm: '2406398210', discord: 'malik.alf', presence: 'online' },
  { id: 'helven', name: 'Helven Marcia', classId: 'B', npm: '2406417782', discord: 'helvenm', presence: 'online' },
  { id: 'dylan', name: 'Dylan Pirade', classId: 'B', npm: '2406355019', discord: 'dylan.prd', presence: 'idle' },
  { id: 'jessica', name: 'Jessica Tanoto', classId: 'B', npm: '2406402264', discord: 'jesstanoto', presence: 'online' },
  { id: 'erik', name: 'Erik Wilbert', classId: 'A', npm: '2406376645', discord: 'erikwilbert', presence: 'online' },
  { id: 'nadia', name: 'Nadia Putri', classId: 'A', npm: '2406421190', discord: 'nadiaptr', presence: 'online' },
  { id: 'rania', name: 'Rania Aulia', classId: 'A', npm: '2406388357', discord: 'rania.aulia', presence: 'offline' },
  { id: 'gilang', name: 'Gilang Ramadhan', classId: 'A', npm: '2406349921', discord: 'gilangrmd', presence: 'idle' },
  { id: 'kevin', name: 'Kevin Tan', classId: 'C', npm: '2406410038', discord: 'kevtan', presence: 'online' },
  { id: 'arif', name: 'Arif Nugraha', classId: 'C', npm: '2406367724', discord: 'arifnug', presence: 'offline' },
  { id: 'putri', name: 'Putri Anjani', classId: 'C', npm: '2406393341', discord: 'putrianjani', presence: 'online' },
  { id: 'bagus', name: 'Bagus Saputra', classId: 'D', npm: '2406358806', verification: 'Not Connected', presence: 'offline' },
  { id: 'citra', name: 'Citra Lestari', classId: 'D', npm: '2406414457', discord: 'citralestari', presence: 'online' },
  { id: 'yusuf', name: 'Yusuf Hakim', classId: 'D', npm: '2406380092', discord: 'yusufhkm', presence: 'idle' },
]

const FIRST = ['Adit', 'Aisyah', 'Alya', 'Anisa', 'Bayu', 'Bella', 'Budi', 'Cahya', 'Daffa', 'Dewi', 'Dimas', 'Eka', 'Fajar', 'Fitri', 'Galih', 'Hana', 'Hendra', 'Indah', 'Irfan', 'Jihan', 'Kamila', 'Kenzo', 'Laras', 'Lutfi', 'Mega', 'Naufal', 'Olivia', 'Pandu', 'Qonita', 'Rafi', 'Rizka', 'Salsa', 'Satria', 'Tasya', 'Teguh', 'Vania', 'Wahyu', 'Winona', 'Yoga', 'Zahra', 'Zaki', 'Ivan', 'Grace', 'Felix', 'Clara', 'Michelle', 'Timothy', 'Nathania', 'Raka', 'Ayu', 'Bima', 'Dinda', 'Evan', 'Farah', 'Gabriel', 'Hafiz', 'Intan', 'Joshua', 'Nabila', 'Reza']
const LAST = ['Pratama', 'Saputra', 'Wijaya', 'Santoso', 'Hidayat', 'Nugroho', 'Kusuma', 'Siregar', 'Simanjuntak', 'Halim', 'Gunawan', 'Lubis', 'Nasution', 'Rahman', 'Setiawan', 'Utomo', 'Wibisono', 'Susanto', 'Harahap', 'Firmansyah', 'Permana', 'Lim', 'Suryadi', 'Maulana', 'Ramadhani', 'Anggraini', 'Putra', 'Sari', 'Tanjung', 'Hartono']

// Class sizes: A 31 · B 32 · C 31 · D 30 = 124 students
const SIZES = { A: 31, B: 32, C: 31, D: 30 }

function build(): Person[] {
  const used = new Set([...STAFF, ...FEATURED].map((p) => p.name))
  const out: Person[] = STAFF.map((s, i) => ({
    role: 'Student', isAdmin: false, verification: 'Verified', presence: 'offline', status: 'Active',
    email: email(s.name, true), joinedAt: ago(60 * 24 * (120 - i)), featured: true, ...s,
  }) as Person)

  for (const f of FEATURED) {
    out.push({
      role: 'Student', isAdmin: false, verification: 'Verified', presence: 'offline', status: 'Active',
      email: email(f.name), joinedAt: ago(60 * 24 * 20 + Math.floor(rand() * 4000)), featured: true, ...f,
    } as Person)
  }

  for (const cls of ['A', 'B', 'C', 'D'] as const) {
    const have = FEATURED.filter((f) => f.classId === cls).length
    for (let i = have; i < SIZES[cls]; i++) {
      let name = ''
      do name = `${pick(FIRST)} ${pick(LAST)}`; while (used.has(name))
      used.add(name)
      const r = rand()
      const verification: Verification = r < 0.84 ? 'Verified' : r < 0.93 ? 'Pending' : 'Not Connected'
      const p = rand()
      const presence: Presence = p < 0.36 ? 'online' : p < 0.48 ? 'idle' : 'offline'
      const s = rand()
      out.push({
        id: slug(name).replace(/\./g, '-'),
        name,
        role: 'Student',
        isAdmin: false,
        classId: cls,
        npm: `2406${String(300000 + Math.floor(rand() * 199999))}`,
        email: email(name),
        discord: verification === 'Not Connected' ? undefined : `${name.split(' ')[0].toLowerCase()}${pick(['', '.', '_'])}${name.split(' ')[1].slice(0, 3).toLowerCase()}`,
        verification,
        presence: verification === 'Not Connected' ? 'offline' : presence,
        status: s < 0.94 ? 'Active' : s < 0.98 ? 'Inactive' : 'On Leave',
        joinedAt: ago(60 * 24 * 14 + Math.floor(rand() * 60 * 24 * 10)),
      })
    }
  }
  return out
}

export const PEOPLE: Person[] = build()

/** Students imported by the spreadsheet import flow (not in the roster until imported). */
export const IMPORT_BATCH = [
  { name: 'Haekal Handrian', npm: '2406431536', className: 'Class B' },
  { name: 'Malik Alifan', npm: '2406398210', className: 'Class B' },
  { name: 'Erik Wilbert', npm: '2406376645', className: 'Class A' },
  { name: 'Aurel Kirana', npm: '2406440017', className: 'Class B' },
  { name: 'Bryan Hartanto', npm: '2406440125', className: 'Class A' },
  { name: 'Salma Nurfadila', npm: '2406440233', className: 'Class C' },
  { name: 'Theo Gunadi', npm: '2406440341', className: 'Class D' },
  { name: 'Keisha Amanda', npm: '2406440459', className: '' },
]
