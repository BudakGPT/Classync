import type {
  Activity, AppData, Assignment, Audience, CalEvent, ClassId, Delivery, Group, HelpCluster, NotificationItem, ReusableAnswer, TaskState,
} from '@/lib/types'
import { ago, at } from '@/lib/time'
import { hash, rng } from '@/lib/utils'
import { CLASSES } from './classes'
import { PEOPLE } from './people'

// ── helpers ────────────────────────────────────────────────────────────────
const studentIds = (cls: ClassId) => PEOPLE.filter((p) => p.role === 'Student' && p.classId === cls).map((p) => p.id)
const generatedIds = (cls: ClassId) => PEOPLE.filter((p) => p.role === 'Student' && p.classId === cls && !p.featured).map((p) => p.id)
const gA = generatedIds('A'), gB = generatedIds('B'), gC = generatedIds('C'), gD = generatedIds('D')

const ALL: Delivery = { announcement: true, dm: true, dashboard: true }
const ANN: Delivery = { announcement: true, dm: false, dashboard: true }
const DM: Delivery = { announcement: false, dm: true, dashboard: true }
const aud = (type: Audience['type'], classIds: ClassId[] = [], groupIds: string[] = [], studentIds: string[] = []): Audience => ({ type, classIds, groupIds, studentIds })
const plusMin = (iso: string, min: number) => new Date(new Date(iso).getTime() + min * 60_000).toISOString()

/** Deterministically spread task states over a class roster, honouring per-student overrides. */
function progress(cls: ClassId, counts: Partial<Record<TaskState, number>>, overrides: Record<string, TaskState> = {}) {
  const out: Record<string, TaskState> = { ...overrides }
  const r = rng(hash(cls + JSON.stringify(counts)))
  const pool = studentIds(cls).filter((id) => !(id in overrides)).sort(() => r() - 0.5)
  const already = (s: TaskState) => Object.values(overrides).filter((v) => v === s).length
  let i = 0
  for (const s of ['completed', 'in_progress', 'stuck'] as TaskState[]) {
    for (let k = 0; k < (counts[s] ?? 0) - already(s); k++) out[pool[i++]] = s
  }
  for (; i < pool.length; i++) out[pool[i]] = 'not_started'
  return out
}
const withState = (p: Record<string, TaskState>, s: TaskState) => Object.keys(p).filter((k) => p[k] === s)

// ── groups ────────────────────────────────────────────────────────────────
// FGD-B1 intentionally does not exist yet: the demo creates it live.
const GROUPS: Group[] = [
  { id: 'fgd-b2', name: 'FGD-B2', type: 'FGD', scope: 'single', classIds: ['B'], memberIds: ['helven', 'dylan', 'jessica', gB[0]], status: 'Active', duration: 'Temporary', startDate: at(-8, '08:00'), endDate: at(15, '23:59'), role: '@FGD-B2', text: ['discussion', 'submission'], voice: ['voice-fgd'], createdBy: 'sarah', createdAt: ago(60 * 24 * 8), description: 'Weekly focus group on dimensionality-reduction case studies.' },
  { id: 'fgd-b3', name: 'FGD-B3', type: 'FGD', scope: 'single', classIds: ['B'], memberIds: gB.slice(1, 5), status: 'Active', duration: 'Temporary', startDate: at(-6, '08:00'), endDate: at(15, '23:59'), role: '@FGD-B3', text: ['discussion', 'submission'], voice: ['voice-fgd'], createdBy: 'farhan', createdAt: ago(60 * 24 * 6), description: 'Discussion group for the PCA & clustering lab.' },
  { id: 'fgd-b4', name: 'FGD-B4', type: 'FGD', scope: 'single', classIds: ['B'], memberIds: gB.slice(5, 10), status: 'Active', duration: 'Temporary', startDate: at(0, '08:00'), endDate: at(14, '23:59'), role: '@FGD-B4', text: ['discussion', 'submission'], voice: ['voice-fgd'], createdBy: 'sarah', createdAt: ago(17), description: 'Peer-review circle for the Machine Learning Assignment.' },
  { id: 'research-alpha', name: 'Research Team Alpha', type: 'Research', scope: 'cross', classIds: ['B', 'D'], memberIds: ['malik', 'citra', 'yusuf', gB[10], gD[0]], status: 'Active', duration: 'Permanent', role: '@Research-Alpha', text: ['research', 'papers'], voice: ['voice-research'], createdBy: 'maya', createdAt: ago(60 * 24 * 30), description: 'Undergraduate research on explainable models for student-performance prediction.' },
  { id: 'pres-a3', name: 'Presentation Group A3', type: 'Presentation', scope: 'single', classIds: ['A'], memberIds: ['erik', 'nadia', 'rania', 'gilang'], status: 'Active', duration: 'Temporary', startDate: at(-5, '08:00'), endDate: at(3, '23:59'), role: '@Presentation-A3', text: ['discussion', 'slides'], voice: ['voice-presentation'], createdBy: 'andi', createdAt: ago(60 * 24 * 5), description: 'Final presentation on indexing strategies for large relational databases.' },
  { id: 'ai-team', name: 'Cross-Class AI Team', type: 'Project', scope: 'cross', classIds: ['A', 'B', 'C', 'D'], memberIds: ['haekal', 'kevin', 'nadia', 'bagus', 'putri', 'jessica'], status: 'Active', duration: 'Permanent', role: '@AI-Team', text: ['general', 'project-board'], voice: ['voice-team'], createdBy: 'farhan', createdAt: ago(60 * 24 * 2 + 200), description: 'Inter-class hackathon team building a study-buddy recommender.' },
  { id: 'cloud-c1', name: 'Cloud Project C1', type: 'Project', scope: 'single', classIds: ['C'], memberIds: ['kevin', 'arif', 'putri', gC[0], gC[1]], status: 'Active', duration: 'Temporary', startDate: at(-10, '08:00'), endDate: at(8, '23:59'), role: '@Cloud-C1', text: ['discussion', 'deployment'], voice: ['voice-project'], createdBy: 'andi', createdAt: ago(60 * 24 * 10), description: 'Deploying a containerised web app to AWS with CI/CD.' },
  { id: 'fgd-a1', name: 'FGD-A1', type: 'FGD', scope: 'single', classIds: ['A'], memberIds: gA.slice(0, 4), status: 'Archived', duration: 'Temporary', startDate: at(-30, '08:00'), endDate: at(-9, '23:59'), role: '@FGD-A1', text: ['discussion', 'submission'], voice: ['voice-fgd'], createdBy: 'sarah', createdAt: ago(60 * 24 * 30), description: 'ER-diagram critique session (ended).' },
]

// ── notifications ─────────────────────────────────────────────────────────
// "Machine Learning Assignment" is intentionally absent: the demo schedules it live.
const NOTIFICATIONS: NotificationItem[] = [
  { id: 'n-db-quiz', title: 'Database Quiz 2', description: 'Quiz 2 covers SQL joins, subqueries and normalization up to 3NF. Closed book, 45 minutes, held in class.', category: 'Quiz', audience: aud('class', ['A']), mode: 'scheduled', sendAt: at(0, '12:00'), extras: [], deadline: at(2, '13:00'), reminders: ['1 day before', '1 hour before'], delivery: ALL, status: 'Scheduled', createdBy: 'farhan', createdAt: ago(9) },
  { id: 'n-ds-lecture', title: 'Weekly Data Science Lecture', description: 'Regular Data Science lecture. Bring your laptop — we run notebooks in class.', category: 'Lecture', audience: aud('class', ['B']), mode: 'recurring', repeat: { day: 'Tuesday', time: '10:00' }, extras: [at(2, '13:00')], reminders: ['1 hour before'], delivery: ANN, status: 'Recurring', createdBy: 'maya', createdAt: ago(60 * 24 * 21), stats: { delivered: 32, read: 30 } },
  { id: 'n-weekly', title: 'Weekly Announcement Digest', description: "Summary of this week's deadlines, materials and group sessions for every class.", category: 'Announcement', audience: aud('classes', ['A', 'B', 'C', 'D']), mode: 'recurring', repeat: { day: 'Tuesday', time: '18:00' }, extras: [], reminders: [], delivery: ANN, status: 'Recurring', createdBy: 'farhan', createdAt: ago(60 * 24 * 14), stats: { delivered: 124, read: 97 } },
  { id: 'n-cloud-pres', title: 'FGD Presentation: Cloud Architecture', description: 'Each FGD presents a 10-minute architecture walkthrough. Upload slides to #submission before the session.', category: 'Presentation', audience: aud('class', ['C']), mode: 'scheduled', sendAt: at(0, '16:00'), extras: [], deadline: at(3, '13:00'), reminders: ['1 day before', '3 hours before'], delivery: ALL, status: 'Scheduled', createdBy: 'andi', createdAt: ago(180) },
  { id: 'n-reg', title: 'Regression Report Deadline', description: 'Submit your linear regression report (PDF + notebook) in #assignment.', category: 'Deadline', audience: aud('class', ['D']), mode: 'scheduled', sendAt: at(1, '09:00'), extras: [], deadline: at(6, '23:59'), reminders: ['1 day before', '6 hours before'], delivery: DM, status: 'Scheduled', createdBy: 'sarah', createdAt: ago(60 * 20) },
  { id: 'n-extra-ai', title: 'Extra Lecture: Neural Networks', description: 'Extra session on backpropagation before the Search Algorithms Lab. Attendance recommended.', category: 'Lecture', audience: aud('class', ['D']), mode: 'scheduled', sendAt: at(1, '08:00'), extras: [at(3, '15:00')], reminders: ['1 day before', '1 hour before'], delivery: ALL, status: 'Scheduled', createdBy: 'maya', createdAt: ago(60 * 19) },
  { id: 'n-pca-material', title: 'Week 4 Material: PCA & Dimensionality Reduction', description: 'Slides, the eigen-decomposition notebook and two short readings are now in #material.', category: 'Material', audience: aud('class', ['B']), mode: 'now', sendAt: ago(60 * 18 + 41), extras: [], reminders: [], delivery: ANN, status: 'Sent', createdBy: 'maya', createdAt: ago(60 * 18 + 41), stats: { delivered: 32, read: 27 } },
  { id: 'n-fgd-b2', title: 'FGD-B2 Discussion Prompt', description: 'Prepare one real dataset where PCA helps and one where it fails. Discussion Wednesday 16:00 in voice-fgd.', category: 'FGD', audience: aud('group', ['B'], ['fgd-b2']), mode: 'now', sendAt: ago(131), extras: [], reminders: ['1 hour before'], delivery: DM, status: 'Sent', createdBy: 'sarah', createdAt: ago(131), stats: { delivered: 4, read: 4 } },
  { id: 'n-midterm', title: 'Midterm Exam Room Allocation', description: 'Room allocations for midterm week are posted. Check your class channel for your seat number.', category: 'Announcement', audience: aud('classes', ['A', 'B', 'C', 'D']), mode: 'now', sendAt: ago(60 * 24 * 2 + 100), extras: [], reminders: [], delivery: ALL, status: 'Sent', createdBy: 'andi', createdAt: ago(60 * 24 * 2 + 100), stats: { delivered: 124, read: 118 } },
  { id: 'n-sql-ws', title: 'SQL Normalization Worksheet', description: 'Normalize the provided hospital schema to 3NF and justify each decomposition step.', category: 'Assignment', audience: aud('class', ['A']), mode: 'scheduled', extras: [], deadline: at(7, '23:59'), reminders: ['1 day before'], delivery: ALL, status: 'Draft', createdBy: 'sarah', createdAt: ago(300) },
  { id: 'n-cloud-check', title: 'Cloud Deployment Checklist', description: 'Step-by-step checklist for deploying to EC2 behind a load balancer with health checks.', category: 'Material', audience: aud('class', ['C']), mode: 'now', extras: [], reminders: [], delivery: ANN, status: 'Draft', createdBy: 'farhan', createdAt: ago(60 * 26) },
]

// ── calendar ──────────────────────────────────────────────────────────────
const DAY_INDEX = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 }
function lectureSeries(): CalEvent[] {
  const out: CalEvent[] = []
  for (let w = -3; w <= 6; w++) {
    for (const c of CLASSES) {
      const offset = w * 7 + DAY_INDEX[c.schedule.day] - 2 // demo day is a Tuesday
      const start = at(offset, c.schedule.time)
      out.push({
        id: `lec-${c.id}-${w + 3}`, title: `${c.subject} Lecture`, category: 'Lecture', classId: c.id, start, end: plusMin(start, 100),
        location: c.schedule.room, hostId: c.lecturerId, participantIds: [], reminders: ['1 hour before'], delivery: ANN,
        description: `Weekly ${c.subject} lecture for ${c.name}.`, source: 'recurring', notificationId: c.id === 'B' ? 'n-ds-lecture' : undefined,
      })
    }
  }
  return out
}

const ev = (e: Omit<CalEvent, 'participantIds' | 'reminders' | 'delivery' | 'source'> & Partial<CalEvent>): CalEvent =>
  ({ participantIds: [], reminders: ['1 hour before'], delivery: ANN, source: 'manual', ...e })

const EVENTS: CalEvent[] = [
  ...lectureSeries(),
  ev({ id: 'e-fgd-b3', title: 'FGD-B3 Discussion', category: 'FGD', classId: 'B', groupId: 'fgd-b3', start: at(0, '13:00'), end: at(0, '14:00'), location: 'voice-fgd', hostId: 'farhan', reminders: ['30 minutes before'], delivery: DM, description: 'Walk through clustering results and agree on the lab write-up structure.' }),
  ev({ id: 'e-ml-reminder', title: 'Assignment Deadline Reminder', category: 'Deadline', classId: 'B', start: at(0, '15:30'), location: 'Machine Learning Assignment · #announcement + DM', hostId: 'farhan', reminders: [], delivery: ALL, description: 'Automatic reminder to the 14 students who have not marked the Machine Learning Assignment as done.', source: 'notification' }),
  ev({ id: 'e-weekly', title: 'Weekly Announcement Digest', category: 'Announcement', start: at(0, '18:00'), location: '#announcement · all classes', hostId: 'farhan', participantIds: ['maya', 'andi', 'farhan', 'sarah'], reminders: [], description: "Scheduled digest of this week's deadlines and sessions.", source: 'notification', notificationId: 'n-weekly' }),
  ev({ id: 'e-research-sync', title: 'Research Team Alpha Sync', category: 'FGD', groupId: 'research-alpha', start: at(-1, '15:00'), end: at(-1, '16:00'), location: 'voice-research', hostId: 'maya', description: 'Weekly research sync: feature attribution results.' }),
  ev({ id: 'e-fgd-b2', title: 'FGD-B2 Discussion', category: 'FGD', classId: 'B', groupId: 'fgd-b2', start: at(1, '16:00'), end: at(1, '17:00'), location: 'voice-fgd', hostId: 'sarah', delivery: DM, description: 'Where PCA helps and where it fails — bring one dataset each.', source: 'notification', notificationId: 'n-fgd-b2' }),
  ev({ id: 'e-db-quiz', title: 'Database Quiz 2', category: 'Quiz', classId: 'A', start: at(2, '13:00'), end: at(2, '13:45'), location: 'Room 2.2301', hostId: 'andi', reminders: ['1 day before', '1 hour before'], delivery: ALL, description: 'SQL joins, subqueries and normalization up to 3NF. Closed book.', source: 'notification', notificationId: 'n-db-quiz' }),
  ev({ id: 'e-extra-ds', title: 'Extra Lecture: Data Science', category: 'Extra Class', classId: 'B', start: at(2, '13:00'), end: at(2, '14:40'), location: 'Room 3.3114', hostId: 'maya', reminders: ['1 day before', '1 hour before'], delivery: ALL, description: 'Make-up session on PCA applications before the ML assignment is due.', source: 'notification', notificationId: 'n-ds-lecture' }),
  ev({ id: 'e-a3-rehearsal', title: 'Presentation A3 Rehearsal', category: 'Presentation', classId: 'A', groupId: 'pres-a3', start: at(3, '10:00'), end: at(3, '11:00'), location: 'voice-presentation', hostId: 'sarah', description: 'Dry run with timing and Q&A practice.' }),
  ev({ id: 'e-cloud-pres', title: 'FGD Presentation: Cloud Architecture', category: 'Presentation', classId: 'C', start: at(3, '13:00'), end: at(3, '15:00'), location: 'Lab 1.1201', hostId: 'andi', reminders: ['1 day before', '3 hours before'], delivery: ALL, description: '10-minute architecture walkthrough per FGD.', source: 'notification', notificationId: 'n-cloud-pres' }),
  ev({ id: 'e-extra-ai', title: 'Extra Lecture: Neural Networks', category: 'Extra Class', classId: 'D', start: at(3, '15:00'), end: at(3, '16:40'), location: 'Room 2.2402', hostId: 'maya', reminders: ['1 day before', '1 hour before'], delivery: ALL, description: 'Backpropagation deep-dive.', source: 'notification', notificationId: 'n-extra-ai' }),
  ev({ id: 'e-ai-team', title: 'AI Team Hack Night', category: 'FGD', groupId: 'ai-team', start: at(4, '19:00'), end: at(4, '21:00'), location: 'voice-team', hostId: 'farhan', description: 'Build sprint for the study-buddy recommender.' }),
  ev({ id: 'e-reg-deadline', title: 'Regression Report Deadline', category: 'Deadline', classId: 'D', start: at(6, '23:59'), hostId: 'sarah', reminders: ['1 day before', '6 hours before'], delivery: DM, description: 'Report (PDF + notebook) due in #assignment.', source: 'notification', notificationId: 'n-reg' }),
  ev({ id: 'e-sql-ws', title: 'SQL Normalization Worksheet due', category: 'Assignment', classId: 'A', start: at(7, '23:59'), hostId: 'sarah', reminders: ['1 day before'], description: 'Normalize the hospital schema to 3NF.' }),
  ev({ id: 'e-cloud-lab', title: 'Cloud Deployment Lab due', category: 'Assignment', classId: 'C', start: at(8, '23:59'), hostId: 'farhan', reminders: ['1 day before'], description: 'Deploy to EC2 behind a load balancer.' }),
  ev({ id: 'e-search-lab', title: 'Search Algorithms Lab due', category: 'Assignment', classId: 'D', start: at(10, '23:59'), hostId: 'sarah', reminders: ['1 day before'], description: 'Implement BFS, DFS and A* on the campus map.' }),
  ev({ id: 'e-pca-quiz', title: 'PCA Mini Quiz', category: 'Quiz', classId: 'B', start: at(-4, '10:00'), end: at(-4, '10:30'), location: 'Room 3.3114', hostId: 'maya', description: '10-question quiz on eigen-decomposition.' }),
  ev({ id: 'e-db-quiz1', title: 'Database Quiz 1', category: 'Quiz', classId: 'A', start: at(-12, '13:00'), end: at(-12, '13:45'), location: 'Room 2.2301', hostId: 'andi', description: 'Relational algebra and ER modelling.' }),
  ev({ id: 'e-midterm-ds', title: 'Midterm Exam: Data Science', category: 'Quiz', classId: 'B', start: at(21, '10:00'), end: at(21, '12:00'), location: 'Hall B', hostId: 'maya', reminders: ['1 day before'], delivery: ALL, description: 'Covers weeks 1–6.' }),
]

// ── assignments ───────────────────────────────────────────────────────────
const mlProgress = progress('B', { completed: 18, in_progress: 9, stuck: 5 }, { haekal: 'in_progress', malik: 'in_progress', helven: 'completed', jessica: 'completed', dylan: 'stuck' })
const dbQuizProgress = progress('A', { completed: 12, in_progress: 14, stuck: 2 }, { erik: 'stuck', nadia: 'completed' })
const cloudPresProgress = progress('C', { completed: 10, in_progress: 15, stuck: 3 }, { putri: 'completed' })
const regProgress = progress('D', { completed: 4, in_progress: 16, stuck: 4 }, { citra: 'completed', yusuf: 'stuck' })
const sqlProgress = progress('A', { completed: 2, in_progress: 8, stuck: 3 }, { rania: 'in_progress' })
const pcaQuizProgress = progress('B', { completed: 30 }, {})
const cloudLabProgress = progress('C', { completed: 6, in_progress: 12, stuck: 6 }, { kevin: 'stuck', arif: 'stuck' })
const searchLabProgress = progress('D', { in_progress: 5 }, {})

const ASSIGNMENTS: Assignment[] = [
  { id: 'ml-assignment', title: 'Machine Learning Assignment', classId: 'B', category: 'Assignment', due: at(1, '23:59'), createdAt: ago(60 * 24 * 6), createdBy: 'maya', description: 'Apply PCA to the student-performance dataset, train two classifiers and compare them in a short report.', progress: mlProgress, helpClusterIds: ['pca', 'gradient'], notificationIds: [] },
  { id: 'db-quiz-2', title: 'Database Quiz 2', classId: 'A', category: 'Quiz', due: at(2, '13:00'), createdAt: ago(60 * 24 * 4), createdBy: 'andi', description: 'Preparation checklist for Quiz 2: joins, subqueries and normalization.', progress: dbQuizProgress, helpClusterIds: ['sql-join'], notificationIds: ['n-db-quiz'] },
  { id: 'cloud-pres', title: 'FGD Presentation: Cloud Architecture', classId: 'C', category: 'Presentation', due: at(3, '13:00'), createdAt: ago(60 * 24 * 7), createdBy: 'andi', description: 'Prepare a 10-minute architecture walkthrough with a live deployment demo.', progress: cloudPresProgress, helpClusterIds: [], notificationIds: ['n-cloud-pres'] },
  { id: 'regression-report', title: 'Regression Report', classId: 'D', category: 'Assignment', due: at(6, '23:59'), createdAt: ago(60 * 24 * 9), createdBy: 'maya', description: 'Fit and diagnose a linear regression model; discuss assumptions and residuals.', progress: regProgress, helpClusterIds: ['regression'], notificationIds: ['n-reg'] },
  { id: 'sql-worksheet', title: 'SQL Normalization Worksheet', classId: 'A', category: 'Assignment', due: at(7, '23:59'), createdAt: ago(60 * 24 * 1), createdBy: 'sarah', description: 'Normalize the hospital schema to 3NF and justify each decomposition.', progress: sqlProgress, helpClusterIds: ['normalization'], notificationIds: ['n-sql-ws'] },
  { id: 'cloud-lab', title: 'Cloud Deployment Lab', classId: 'C', category: 'Project', due: at(8, '23:59'), createdAt: ago(60 * 24 * 8), createdBy: 'andi', description: 'Deploy the containerised app to EC2 behind a load balancer with health checks.', progress: cloudLabProgress, helpClusterIds: ['aws'], notificationIds: [] },
  { id: 'search-lab', title: 'Search Algorithms Lab', classId: 'D', category: 'Assignment', due: at(10, '23:59'), createdAt: ago(60 * 24), createdBy: 'sarah', description: 'Implement BFS, DFS and A* search on the campus map graph.', progress: searchLabProgress, helpClusterIds: [], notificationIds: [] },
  { id: 'pca-quiz', title: 'PCA Mini Quiz', classId: 'B', category: 'Quiz', due: at(-4, '10:30'), createdAt: ago(60 * 24 * 10), createdBy: 'maya', description: 'Short quiz on eigen-decomposition and explained variance.', progress: pcaQuizProgress, helpClusterIds: [], notificationIds: [] },
]

// ── help center ───────────────────────────────────────────────────────────
const mlInProgress = withState(mlProgress, 'in_progress').filter((id) => id !== 'haekal' && id !== 'malik')
const HELP: HelpCluster[] = [
  { id: 'pca', concept: 'PCA Eigenvectors', classId: 'B', assignmentId: 'ml-assignment', reports: 8, requesterIds: [...withState(mlProgress, 'stuck'), 'malik', ...mlInProgress.slice(0, 2)], firstReportAt: ago(12), priority: 'High', status: 'open', sampleQuestion: 'Why do we keep the eigenvectors with the largest eigenvalues when reducing dimensions?' },
  { id: 'aws', concept: 'AWS Deployment Error', classId: 'C', assignmentId: 'cloud-lab', reports: 6, requesterIds: withState(cloudLabProgress, 'stuck').slice(0, 4), firstReportAt: ago(38), priority: 'High', status: 'open', sampleQuestion: 'My EC2 instance deploys fine but the load balancer returns 502 Bad Gateway.' },
  { id: 'sql-join', concept: 'SQL JOIN', classId: 'A', assignmentId: 'db-quiz-2', reports: 5, requesterIds: [...withState(dbQuizProgress, 'stuck'), ...withState(sqlProgress, 'stuck')].slice(0, 5), firstReportAt: ago(80), priority: 'Medium', status: 'open', sampleQuestion: 'When should I use LEFT JOIN instead of INNER JOIN if some rows have no match?' },
  { id: 'normalization', concept: 'Normalization (3NF)', classId: 'A', assignmentId: 'sql-worksheet', reports: 4, requesterIds: [], firstReportAt: ago(150), priority: 'Low', status: 'open', sampleQuestion: 'How do I spot a transitive dependency in a table?' },
  { id: 'regression', concept: 'Regression Assumptions', classId: 'D', assignmentId: 'regression-report', reports: 3, requesterIds: [], firstReportAt: ago(210), priority: 'Low', status: 'open', sampleQuestion: 'How can I check homoscedasticity from the residual plot?' },
  { id: 'gradient', concept: 'Gradient Descent Learning Rate', classId: 'B', assignmentId: 'ml-assignment', reports: 6, requesterIds: mlInProgress.slice(2, 7), firstReportAt: ago(300), priority: 'Medium', status: 'answered', answeredAt: ago(95), answerId: 'ans-lr', sampleQuestion: 'My loss explodes after a few epochs — is my learning rate too high?' },
]

const ANSWERS: ReusableAnswer[] = [
  { id: 'ans-pca', title: 'Understanding PCA Eigenvectors', concept: 'PCA Eigenvectors', authorId: 'maya', usedCount: 12, helpfulPct: 92, updatedAt: ago(60 * 24 * 7), body: 'Each eigenvector of the covariance matrix is a direction in feature space; its eigenvalue is how much variance the data has along it. Sorting by eigenvalue and keeping the top k directions keeps the most information with the fewest dimensions. Check the explained-variance ratio to pick k (e.g. the smallest k that reaches 90%).' },
  { id: 'ans-aws', title: 'Fixing 502 errors on EC2 behind a load balancer', concept: 'AWS Deployment Error', authorId: 'farhan', usedCount: 9, helpfulPct: 88, updatedAt: ago(60 * 24 * 3), body: 'A 502 usually means the target group health check fails. Make sure the app listens on 0.0.0.0 (not localhost), the security group allows the health-check port from the load balancer, and the health-check path returns HTTP 200.' },
  { id: 'ans-join', title: 'INNER vs LEFT JOIN — a visual guide', concept: 'SQL JOIN', authorId: 'sarah', usedCount: 15, helpfulPct: 95, updatedAt: ago(60 * 24 * 12), body: 'INNER JOIN keeps only rows that match on both sides. LEFT JOIN keeps every row from the left table and fills missing matches with NULL. If you need "all students, even those without submissions", use LEFT JOIN from students to submissions.' },
  { id: 'ans-3nf', title: 'Spotting transitive dependencies for 3NF', concept: 'Normalization (3NF)', authorId: 'andi', usedCount: 7, helpfulPct: 90, updatedAt: ago(60 * 24 * 20), body: 'A transitive dependency exists when a non-key column depends on another non-key column (A → B → C). Move B and C into their own table keyed by B, and keep B as a foreign key in the original table.' },
  { id: 'ans-lr', title: 'Choosing a learning rate for gradient descent', concept: 'Gradient Descent Learning Rate', authorId: 'maya', usedCount: 11, helpfulPct: 89, updatedAt: ago(95), body: 'If the loss explodes or oscillates, the learning rate is too high; if it barely moves, it is too low. Start around 0.01, plot the loss per epoch, and divide by 10 whenever it diverges. Feature scaling makes the choice far less sensitive.' },
  { id: 'ans-reg', title: 'Checking linear regression assumptions', concept: 'Regression Assumptions', authorId: 'sarah', usedCount: 5, helpfulPct: 84, updatedAt: ago(60 * 24 * 15), body: 'Plot residuals against fitted values: a random cloud means linearity and constant variance hold; a funnel shape means heteroscedasticity. Use a Q-Q plot for normality of residuals and VIF for multicollinearity.' },
]

// ── activity ──────────────────────────────────────────────────────────────
const ACTIVITIES = ([
  { id: 'act-1', actorId: 'classync', action: 'sent a reminder to', target: '14 students', detail: 'Machine Learning Assignment · due tomorrow, 23:59', type: 'notifications', at: ago(2) },
  { id: 'act-2', actorId: 'helven', action: 'completed', target: 'Machine Learning Assignment', type: 'assignments', at: ago(6) },
  { id: 'act-3', actorId: 'farhan', action: 'created notification', target: 'Database Quiz 2', detail: 'Class A · reminders 1 day & 1 hour before', type: 'notifications', at: ago(9) },
  { id: 'act-4', actorId: 'classync', action: 'grouped 5 new help requests on', target: 'PCA Eigenvectors', detail: 'Identities protected · Class B', type: 'help', at: ago(12) },
  { id: 'act-5', actorId: 'sarah', action: 'created group', target: 'FGD-B4', detail: '5 members · @FGD-B4 role and 3 channels created', type: 'groups', at: ago(17) },
  { id: 'act-6', actorId: 'maya', action: 'scheduled an announcement for', target: 'Class A', detail: 'Database Quiz 2 room change', type: 'notifications', at: ago(31) },
  { id: 'act-7', actorId: 'malik', action: 'joined', target: 'Class B', detail: 'Verified via Discord onboarding', type: 'classes', at: ago(47) },
  { id: 'act-8', actorId: 'classync', action: 'assigned the @Class-B role to', target: 'Malik Alifan', detail: '4 channels unlocked', type: 'discord', at: ago(46) },
  { id: 'act-9', actorId: 'classync', action: 'synchronized Discord roles for', target: 'Fasilkom Academic Hub', detail: '128 members · 14 roles', type: 'discord', at: ago(71) },
  { id: 'act-10', actorId: 'kevin', action: 'requested help with', target: 'AWS Deployment Error', type: 'help', at: ago(89) },
  { id: 'act-11', actorId: 'maya', action: 'answered', target: 'Gradient Descent Learning Rate', detail: 'Sent privately to 5 students · saved as reusable answer', type: 'help', at: ago(95) },
  { id: 'act-12', actorId: 'andi', action: 'started lecture', target: 'Database Systems — Class A', type: 'classes', at: ago(161) },
  { id: 'act-13', actorId: 'maya', action: 'created an extra lecture', target: 'Data Science — Thu, 17 Sep 13:00', type: 'notifications', at: ago(60 * 18 + 36) },
  { id: 'act-14', actorId: 'maya', action: 'published material', target: 'Week 4: PCA & Dimensionality Reduction', type: 'notifications', at: ago(60 * 18 + 41) },
  { id: 'act-15', actorId: 'sarah', action: 'imported', target: '28 students', detail: 'Class D roster · spreadsheet', type: 'students', at: ago(60 * 20 + 21) },
  { id: 'act-16', actorId: 'farhan', action: 'created group', target: 'Cross-Class AI Team', detail: '6 members across 4 classes', type: 'groups', at: ago(60 * 24 * 2 + 200) },
  { id: 'act-17', actorId: 'andi', action: 'sent announcement', target: 'Midterm Exam Room Allocation', detail: 'Delivered to 124 students', type: 'notifications', at: ago(60 * 24 * 2 + 100) },
  { id: 'act-18', actorId: 'classync', action: 'created channel template', target: 'FGD', detail: '#discussion · #submission · voice-fgd', type: 'system', at: ago(60 * 24 * 3) },
] as Activity[]).sort((a, b) => b.at.localeCompare(a.at))

export const SEED: AppData = {
  people: PEOPLE,
  classes: CLASSES,
  groups: GROUPS,
  notifications: NOTIFICATIONS,
  events: EVENTS,
  assignments: ASSIGNMENTS,
  helpClusters: HELP,
  answers: ANSWERS,
  activities: ACTIVITIES,
  discord: {
    server: 'Fasilkom Academic Hub', members: 128, connected: true, botOnline: true, lastSync: ago(2), latencyMs: 42,
    templates: [
      { id: 'class', name: 'Class', description: 'Created for every connected class', text: ['announcement', 'discussion', 'material', 'assignment'], voice: ['voice-class'] },
      { id: 'fgd', name: 'FGD', description: 'Focus-group discussions', text: ['discussion', 'submission'], voice: ['voice-fgd'] },
      { id: 'project', name: 'Project', description: 'Long-running project teams', text: ['general', 'project-board'], voice: ['voice-team'] },
      { id: 'presentation', name: 'Presentation', description: 'Presentation groups', text: ['discussion', 'slides'], voice: ['voice-presentation'] },
    ],
  },
  settings: {
    institution: 'Faculty of Computer Science', term: 'Odd Semester 2026/2027', timezone: 'Asia/Jakarta (WIB, UTC+7)',
    requireVerification: true, autoAssignRoles: true, privacyThreshold: 5, hideIdentities: true, dmReminders: true,
    defaultReminders: ['1 day before', '1 hour before'], quietHours: true,
  },
  helpStats: { resolvedToday: 8, reusableAnswers: 24, avgResponseMin: 18 },
}
