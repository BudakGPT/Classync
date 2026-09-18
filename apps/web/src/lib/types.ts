// Classync domain model. All data is mock/local — see src/data and src/store.

export type ClassId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
export type Role = 'Student' | 'Teaching Assistant' | 'Lecturer'
export type Verification = 'Verified' | 'Pending' | 'Not Connected'
export type Presence = 'online' | 'idle' | 'offline'
export type MemberStatus = 'Active' | 'Inactive' | 'On Leave'
export type Weekday = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'

/** Accent palette keys. Map to classes with `tone(t)` from src/lib/tones.ts. */
export type Tone = 'brand' | 'sky' | 'teal' | 'emerald' | 'amber' | 'orange' | 'rose' | 'pink' | 'violet' | 'slate'

export interface Person {
  id: string // stable slug, e.g. 'haekal' — also the avatar seed
  name: string
  role: Role
  isAdmin: boolean
  classId?: ClassId // students only
  npm: string // student / staff ID number
  email: string
  discord?: string // undefined when verification === 'Not Connected'
  verification: Verification
  presence: Presence
  status: MemberStatus
  joinedAt: string // ISO
  featured?: boolean // one of the recurring named characters
  isNew?: boolean // freshly created in this session (use for highlight)
}

export interface ClassRoom {
  id: ClassId
  name: string // 'Class B'
  subject: string // 'Data Science'
  code: string
  lecturerId: string
  taIds: string[]
  schedule: { day: Weekday; time: string; room: string }
  tone: Tone
  discord: { connected: boolean; role: string; text: string[]; voice: string[] }
}

export type GroupType = 'FGD' | 'Project' | 'Presentation' | 'Research' | 'Temporary' | 'Custom'

export interface Group {
  id: string
  name: string // 'FGD-B2'
  type: GroupType
  scope: 'single' | 'cross'
  classIds: ClassId[]
  memberIds: string[]
  status: 'Active' | 'Archived'
  duration: 'Permanent' | 'Temporary'
  startDate?: string
  endDate?: string
  role: string // '@FGD-B2'
  text: string[] // text channel names without '#'
  voice: string[] // voice channel names
  createdBy: string
  createdAt: string
  description?: string
  isNew?: boolean
}

export type Category = 'Assignment' | 'Quiz' | 'Lecture' | 'FGD' | 'Presentation' | 'Deadline' | 'Announcement' | 'Material' | 'Project' | 'Reading'
export type EventCategory = Category | 'Extra Class'

export type AudienceType = 'class' | 'classes' | 'group' | 'students' | 'custom'
export interface Audience {
  type: AudienceType
  classIds: ClassId[]
  groupIds: string[]
  studentIds: string[]
}

export interface Delivery {
  announcement: boolean // Discord #announcement channel
  dm: boolean // Discord direct message
  dashboard: boolean // in-app notification
}

export type ScheduleMode = 'now' | 'scheduled' | 'recurring'
export type NotificationStatus = 'Scheduled' | 'Sent' | 'Recurring' | 'Draft'

export interface NotificationItem {
  id: string
  title: string
  description: string
  category: Category
  audience: Audience
  mode: ScheduleMode
  sendAt?: string // ISO, for 'now' (sent time) and 'scheduled'
  repeat?: { day: Weekday; time: string } // for 'recurring'
  extras: string[] // ISO datetimes of extra sessions (e.g. extra lecture)
  deadline?: string // ISO
  reminders: string[] // e.g. '1 day before', '6 hours before'
  delivery: Delivery
  status: NotificationStatus
  createdBy: string
  createdAt: string
  stats?: { delivered: number; read: number }
  isNew?: boolean
}

export interface CalEvent {
  id: string
  title: string
  category: EventCategory
  classId?: ClassId
  groupId?: string
  start: string // ISO
  end?: string // ISO
  location?: string
  hostId?: string // lecturer / TA running it
  participantIds: string[] // explicit participants; empty → derive from class/group (see selectors)
  reminders: string[]
  delivery: Delivery
  description: string
  source: 'manual' | 'notification' | 'recurring'
  notificationId?: string
  isNew?: boolean
}

export type TaskState = 'completed' | 'in_progress' | 'stuck' | 'not_started'

export interface Assignment {
  id: string
  title: string
  classId: ClassId
  category: 'Assignment' | 'Quiz' | 'Presentation' | 'FGD' | 'Project' | 'Reading'
  due: string // ISO
  createdAt: string
  createdBy: string
  description: string
  progress: Record<string, TaskState> // studentId → state
  helpClusterIds: string[]
  notificationIds: string[]
  isNew?: boolean
  dbItemId?: string
}

export interface HelpCluster {
  id: string
  concept: string // 'PCA Eigenvectors'
  classId: ClassId
  assignmentId?: string
  reports: number // total students reporting the difficulty (mostly anonymous)
  requesterIds: string[] // students who explicitly asked for help → identity visible to staff
  firstReportAt: string
  priority: 'High' | 'Medium' | 'Low'
  status: 'open' | 'answered'
  answeredAt?: string
  answerId?: string
  sampleQuestion: string // anonymised representative question
  dbConceptId?: string
  dbGuildId?: string
}

export interface ReusableAnswer {
  id: string
  title: string
  concept: string
  body: string
  usedCount: number
  helpfulPct: number
  authorId: string
  updatedAt: string
  isNew?: boolean
  dbAnswerId?: string
  deliveredAt?: string | null
  deliveredCount?: number
}

export type ActivityType = 'students' | 'classes' | 'groups' | 'notifications' | 'discord' | 'system' | 'assignments' | 'help'

export interface Activity {
  id: string
  actorId: string // person id, or 'classync' for the system bot
  action: string // 'created group'
  target?: string // 'FGD-B4'
  detail?: string // optional secondary line
  type: ActivityType
  at: string // ISO
}

export interface ChannelTemplate {
  id: string
  name: string // 'Class'
  description: string
  text: string[]
  voice: string[]
}

export interface DiscordState {
  server: string
  members: number
  connected: boolean
  botOnline: boolean
  lastSync: string // ISO
  latencyMs: number
  templates: ChannelTemplate[]
}

export interface Settings {
  institution: string
  term: string
  timezone: string
  requireVerification: boolean
  autoAssignRoles: boolean
  privacyThreshold: number // min reports before a difficulty is shown (5)
  hideIdentities: boolean
  dmReminders: boolean
  defaultReminders: string[]
  quietHours: boolean
}

export interface HelpStats {
  resolvedToday: number
  reusableAnswers: number // total library size (only some are in `answers`)
  avgResponseMin: number
}

export interface AppData {
  people: Person[]
  classes: ClassRoom[]
  groups: Group[]
  notifications: NotificationItem[]
  events: CalEvent[]
  assignments: Assignment[]
  helpClusters: HelpCluster[]
  answers: ReusableAnswer[]
  activities: Activity[]
  discord: DiscordState
  settings: Settings
  helpStats: HelpStats
}

/** Global modals, openable from anywhere (Quick Create, Command Palette, pages). */
export type ModalSpec =
  | { type: 'createNotification'; prefill?: Partial<NotificationItem> }
  | { type: 'createGroup'; prefill?: { classId?: ClassId; memberIds?: string[]; name?: string } }
  | { type: 'importStudents' }
  | { type: 'addStudent'; classId?: ClassId }
  | { type: 'createEvent'; date?: string }
  | { type: 'createAssignment'; classId?: ClassId }
  | { type: 'createClass' }

/** Props every global modal component receives from <ModalHost>. */
export interface ModalHostProps<T extends ModalSpec['type']> {
  open: boolean
  onClose: () => void
  spec: Extract<ModalSpec, { type: T }>
}

export interface ToastInput {
  title: string
  description?: string
  tone?: 'success' | 'info' | 'warning' | 'error' | 'discord'
  action?: { label: string; onClick: () => void }
}
