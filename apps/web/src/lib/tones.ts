import {
  BookOpen, CalendarClock, ClipboardCheck, FileText, Megaphone, MessagesSquare, Presentation, Timer, GraduationCap, FolderKanban,
  type LucideIcon,
} from 'lucide-react'
import type { EventCategory, Tone } from './types'

/** Literal class strings per tone (Tailwind needs them spelled out). */
const TONES: Record<Tone, { soft: string; text: string; ring: string; solid: string; dot: string; border: string; hex: string }> = {
  brand: { soft: 'bg-brand-50', text: 'text-brand-700', ring: 'ring-brand-200', solid: 'bg-brand-600', dot: 'bg-brand-500', border: 'border-brand-200', hex: '#5b57d6' },
  sky: { soft: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-200', solid: 'bg-sky-500', dot: 'bg-sky-500', border: 'border-sky-200', hex: '#0ea5e9' },
  teal: { soft: 'bg-teal-50', text: 'text-teal-700', ring: 'ring-teal-200', solid: 'bg-teal-500', dot: 'bg-teal-500', border: 'border-teal-200', hex: '#14b8a6' },
  emerald: { soft: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', solid: 'bg-emerald-500', dot: 'bg-emerald-500', border: 'border-emerald-200', hex: '#10b981' },
  amber: { soft: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200', solid: 'bg-amber-500', dot: 'bg-amber-500', border: 'border-amber-200', hex: '#f59e0b' },
  orange: { soft: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200', solid: 'bg-orange-500', dot: 'bg-orange-500', border: 'border-orange-200', hex: '#f97316' },
  rose: { soft: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200', solid: 'bg-rose-500', dot: 'bg-rose-500', border: 'border-rose-200', hex: '#f43f5e' },
  pink: { soft: 'bg-pink-50', text: 'text-pink-700', ring: 'ring-pink-200', solid: 'bg-pink-500', dot: 'bg-pink-500', border: 'border-pink-200', hex: '#ec4899' },
  violet: { soft: 'bg-violet-50', text: 'text-violet-700', ring: 'ring-violet-200', solid: 'bg-violet-500', dot: 'bg-violet-500', border: 'border-violet-200', hex: '#8b5cf6' },
  slate: { soft: 'bg-slate-100', text: 'text-slate-700', ring: 'ring-slate-200', solid: 'bg-slate-500', dot: 'bg-slate-400', border: 'border-slate-200', hex: '#64748b' },
}
export const tone = (t: Tone) => TONES[t]

/** Category → icon, tone, Discord emoji. Use everywhere a category is shown (badges, calendar, embeds). */
export const CATEGORY: Record<EventCategory, { icon: LucideIcon; tone: Tone; emoji: string }> = {
  Assignment: { icon: ClipboardCheck, tone: 'brand', emoji: '📚' },
  Quiz: { icon: Timer, tone: 'orange', emoji: '📝' },
  Lecture: { icon: GraduationCap, tone: 'sky', emoji: '🎓' },
  FGD: { icon: MessagesSquare, tone: 'teal', emoji: '💬' },
  Presentation: { icon: Presentation, tone: 'violet', emoji: '🎤' },
  Deadline: { icon: CalendarClock, tone: 'rose', emoji: '⏰' },
  Announcement: { icon: Megaphone, tone: 'amber', emoji: '📣' },
  Material: { icon: BookOpen, tone: 'emerald', emoji: '📖' },
  'Extra Class': { icon: FileText, tone: 'pink', emoji: '➕' },
  Project: { icon: FolderKanban, tone: 'amber', emoji: '📁' },
  Reading: { icon: BookOpen, tone: 'teal', emoji: '📖' },
}
export const CATEGORIES = ['Assignment', 'Quiz', 'Lecture', 'FGD', 'Presentation', 'Deadline', 'Announcement', 'Material', 'Project', 'Reading'] as const
