import { Avatar } from '@/components/ui'
import { useStore } from '@/store/store'
import type { Category } from './server'

const DOT = { online: 'bg-[#23a55a]', idle: 'bg-[#f0b232]', offline: 'bg-[#80848e]' }
const CAP = 14

/** Discord-style member column for the selected category. */
export function MemberList({ cat }: { cat: Category }) {
  const { data, person } = useStore()
  const people = cat.memberIds.map((id) => person(id)).filter((p) => !!p)
  const staff = people.filter((p) => p.role !== 'Student')
  const online = people.filter((p) => p.role === 'Student' && p.presence !== 'offline')
  const offline = people.filter((p) => p.role === 'Student' && p.presence === 'offline')
  let budget = CAP
  const take = <T,>(list: T[]) => { const out = list.slice(0, Math.max(0, budget)); budget -= out.length; return out }
  const sections = [
    { label: 'Staff', list: take(staff), total: staff.length },
    { label: 'Online', list: take(online), total: online.length },
    { label: 'Offline', list: take(offline), total: offline.length },
  ]
  const hidden = people.length - (CAP - Math.max(0, budget))

  return (
    <aside aria-label={`Members of ${cat.label}`} className="scrollbar-thin hidden w-[212px] shrink-0 overflow-y-auto bg-[#2b2d31] px-2 py-4 [scrollbar-color:#1a1b1e_transparent] min-[1400px]:block">
      <h5 className="px-2 text-[11.5px] font-semibold uppercase tracking-wide text-[#949ba4]">Bot — 1</h5>
      <div className="mt-1 flex items-center gap-2.5 rounded-[4px] px-2 py-1.5">
        <Avatar id="classync" size="md" />
        <span className="truncate text-[14px] font-medium text-[#a3a6ff]">Classync</span>
        <span className="rounded-[4px] bg-[#5865f2] px-1 py-px text-[10px] font-bold leading-none text-white">APP</span>
      </div>
      {sections.map((s) => s.list.length > 0 && (
        <div key={s.label} className="mt-4">
          <h5 className="px-2 text-[11.5px] font-semibold uppercase tracking-wide text-[#949ba4]">{s.label} — {s.total}</h5>
          <ul className="mt-1">
            {s.list.map((p) => (
              <li key={p.id} className={`flex items-center gap-2.5 rounded-[4px] px-2 py-1 hover:bg-[#35373c] ${p.presence === 'offline' ? 'opacity-45' : ''}`}>
                <span className="relative shrink-0">
                  <Avatar id={p.id} size="md" />
                  <span className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full ring-[3px] ring-[#2b2d31] ${DOT[p.presence]}`} aria-label={p.presence} />
                </span>
                <span className={`truncate text-[14px] font-medium ${p.role === 'Lecturer' ? 'text-[#c4b5fd]' : p.role === 'Teaching Assistant' ? 'text-[#7dd3fc]' : 'text-[#dbdee1]'}`}>{p.name}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      {hidden > 0 && <p className="mt-3 px-2 text-[12px] text-[#949ba4]">+{hidden} more in {cat.role ?? data.discord.server}</p>}
    </aside>
  )
}
