import { shortName, staff, studentsIn } from '@/lib/selectors'
import { fmtDate, fmtTime, now, sameDay, addDays } from '@/lib/time'
import type { AppData, ClassRoom, Group, Tone } from '@/lib/types'
import { hash } from '@/lib/utils'

// Pure view-model for the mock Discord server: categories built from classes + active groups.

export interface Channel { name: string; voice: boolean }
export interface Category {
  id: string // 'class-B' · 'fgd-b2' · 'start'
  label: string // 'CLASS B'
  kind: 'start' | 'class' | 'group'
  tone: Tone
  role?: string
  connected: boolean
  isNew?: boolean
  channels: Channel[]
  memberIds: string[] // who can see the category (staff + students)
  classRoom?: ClassRoom
  group?: Group
}

export function buildCategories(d: AppData): Category[] {
  const admins = staff(d.people).map((p) => p.id)
  const start: Category = {
    id: 'start', label: 'START HERE', kind: 'start', tone: 'brand', connected: true,
    channels: [{ name: 'welcome', voice: false }, { name: 'verify-identity', voice: false }],
    memberIds: admins,
  }
  const classes = d.classes.map<Category>((c) => ({
    id: `class-${c.id}`, label: c.name.toUpperCase(), kind: 'class', tone: c.tone, role: c.discord.role, connected: c.discord.connected, classRoom: c,
    channels: [...c.discord.text.map((name) => ({ name, voice: false })), ...c.discord.voice.map((name) => ({ name, voice: true }))],
    memberIds: [c.lecturerId, ...c.taIds, ...studentsIn(d.people, c.id).filter((p) => p.verification === 'Verified').map((p) => p.id)],
  }))
  const groups = d.groups.filter((g) => g.status === 'Active').map<Category>((g) => ({
    id: g.id, label: g.name.toUpperCase(), kind: 'group', tone: 'teal', role: g.role, connected: true, isNew: g.isNew, group: g,
    channels: [...g.text.map((name) => ({ name, voice: false })), ...g.voice.map((name) => ({ name, voice: true }))],
    memberIds: [...new Set([g.createdBy, ...g.memberIds])],
  }))
  return [start, ...classes, ...groups]
}

/** 1–3 deterministic "connected" people for a voice channel, preferring online members. */
export function voiceParticipants(cat: Category, channel: string, d: AppData): string[] {
  const byId = new Map(d.people.map((p) => [p.id, p]))
  const pool = cat.memberIds.filter((id) => byId.get(id)?.presence !== 'offline')
  if (!pool.length) return []
  const h = hash(cat.id + channel)
  const n = Math.min(pool.length, 1 + (h % 3))
  const start = h % pool.length
  return Array.from({ length: n }, (_, i) => pool[(start + i * 3) % pool.length]).filter((id, i, a) => a.indexOf(id) === i)
}

/** 'Today at 10:39' · 'Yesterday at 16:02' · '12 Sep 2026' */
export function discordTime(iso: string) {
  if (sameDay(iso, now())) return `Today at ${fmtTime(iso)}`
  if (sameDay(iso, addDays(now(), -1))) return `Yesterday at ${fmtTime(iso)}`
  if (sameDay(iso, addDays(now(), 1))) return `Tomorrow at ${fmtTime(iso)}`
  return fmtDate(iso)
}

export const channelKey = (catId: string, name: string) => `${catId}:${name}`

export const nameOf = (d: AppData, id: string) => {
  const p = d.people.find((x) => x.id === id)
  return id === 'classync' ? 'Classync' : p?.discord ?? shortName(p)
}
