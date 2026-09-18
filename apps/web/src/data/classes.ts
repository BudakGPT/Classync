import type { ClassRoom } from '@/lib/types'

const CLASS_CHANNELS = { text: ['announcement', 'discussion', 'material', 'assignment'], voice: ['voice-class'] }

export const CLASSES: ClassRoom[] = [
  {
    id: 'A', name: 'Class A', subject: 'Database Systems', code: 'CSGE602070', lecturerId: 'andi', taIds: ['sarah'],
    schedule: { day: 'Tuesday', time: '08:00', room: 'Room 2.2301' }, tone: 'sky',
    discord: { connected: true, role: '@Class-A', ...CLASS_CHANNELS },
  },
  {
    id: 'B', name: 'Class B', subject: 'Data Science', code: 'CSCM603154', lecturerId: 'maya', taIds: ['farhan', 'sarah'],
    schedule: { day: 'Tuesday', time: '10:00', room: 'Room 3.3114' }, tone: 'brand',
    discord: { connected: true, role: '@Class-B', ...CLASS_CHANNELS },
  },
  {
    id: 'C', name: 'Class C', subject: 'Cloud Computing', code: 'CSCE604129', lecturerId: 'andi', taIds: ['farhan'],
    schedule: { day: 'Wednesday', time: '10:00', room: 'Lab 1.1201' }, tone: 'teal',
    discord: { connected: true, role: '@Class-C', ...CLASS_CHANNELS },
  },
  {
    id: 'D', name: 'Class D', subject: 'Artificial Intelligence', code: 'CSCM602055', lecturerId: 'maya', taIds: ['sarah'],
    schedule: { day: 'Thursday', time: '09:00', room: 'Room 2.2402' }, tone: 'orange',
    // Not yet connected — lets the demo show the "Connect to Discord" flow.
    discord: { connected: false, role: '@Class-D', ...CLASS_CHANNELS },
  },
]
