import type { ComponentType } from 'react'
import {
  BellRing, CalendarDays, ChartColumn, Database, GraduationCap, History, LayoutDashboard, LifeBuoy, ListChecks, School, Settings, Users,
} from 'lucide-react'
import { DiscordGlyph } from '@/components/ui/Brand'

export interface NavItem { key: string; label: string; path: string; icon: ComponentType<{ className?: string }> }

export const NAV_MAIN: NavItem[] = [
  { key: '', label: 'Overview', path: '/', icon: LayoutDashboard },
  { key: 'classes', label: 'Classes', path: '/classes', icon: School },
  { key: 'students', label: 'Students', path: '/students', icon: GraduationCap },
  { key: 'groups', label: 'Groups', path: '/groups', icon: Users },
  { key: 'notifications', label: 'Notifications', path: '/notifications', icon: BellRing },
  { key: 'calendar', label: 'Calendar', path: '/calendar', icon: CalendarDays },
  { key: 'assignments', label: 'Assignments', path: '/assignments', icon: ListChecks },
  { key: 'help', label: 'Help Center', path: '/help', icon: LifeBuoy },
  { key: 'discord', label: 'Discord', path: '/discord', icon: DiscordGlyph },
  { key: 'database', label: 'Database', path: '/database', icon: Database },
  { key: 'analytics', label: 'Analytics', path: '/analytics', icon: ChartColumn },
]

export const NAV_LOWER: NavItem[] = [
  { key: 'activity', label: 'Activity Log', path: '/activity', icon: History },
  { key: 'settings', label: 'Settings', path: '/settings', icon: Settings },
]

export const ALL_NAV = [...NAV_MAIN, ...NAV_LOWER]
