import { useState } from 'react'
import { BellOff, CheckCircle2, Clock } from 'lucide-react'
import { fmtLong } from '@/lib/time'
import { useActions } from '@/store/actions'
import { useStore } from '@/store/store'
import { DiscordEmbed, DiscordMessage, DiscordWindow } from './Discord'

/**
 * Student-facing personal reminder (Discord DM). "Mark as Done" really completes the task in the store,
 * disables reminders and updates every screen (assignment progress, activity feed).
 */
export function ReminderDM({ studentId = 'haekal', assignmentId = 'ml-assignment', dueIn = '6 hours', className }: {
  studentId?: string; assignmentId?: string; dueIn?: string; className?: string
}) {
  const { data, person, toast } = useStore()
  const { setTaskState } = useActions()
  const [snoozed, setSnoozed] = useState(false)
  const p = person(studentId)
  const a = data.assignments.find((x) => x.id === assignmentId)
  if (!p || !a) return null
  const first = p.name.split(' ')[0]
  const done = a.progress[studentId] === 'completed'

  return (
    <DiscordWindow dm={`${p.discord ?? first.toLowerCase()} · Direct Message`} className={className}>
      <DiscordMessage time={`Reminder · ${dueIn} before deadline`}>
        <p>Hi {first} 👋</p>
        <p><span className="font-semibold text-white">{a.title}</span> is due in {dueIn}.</p>
        <p className="text-[#b5bac1]">You can stop reminders after completing the task.</p>
        <DiscordEmbed
          color={done ? '#23a55a' : '#5b57d6'}
          title={done ? '✅ Completed' : `📚 ${a.title}`}
          description={done ? 'Reminders disabled for this task.' : undefined}
          fields={done ? [] : [
            { name: 'Class', value: `Class ${a.classId}`, inline: true },
            { name: 'Deadline', value: fmtLong(a.due), inline: true },
          ]}
          footer={snoozed && !done ? 'Snoozed · next reminder in 1 hour' : undefined}
          buttons={done ? [] : [
            {
              label: <><CheckCircle2 className="size-4" />Mark as Done</>, style: 'success',
              onClick: () => {
                setTaskState(assignmentId, studentId, 'completed')
                toast({ title: 'Reminder disabled', description: `${first} marked ${a.title} as done.`, tone: 'success' })
              },
            },
            {
              label: <>{snoozed ? <BellOff className="size-4" /> : <Clock className="size-4" />}{snoozed ? 'Snoozed' : 'Remind Me Later'}</>, style: 'secondary', disabled: snoozed,
              onClick: () => { setSnoozed(true); toast({ title: 'Reminder snoozed', description: `Classync will remind ${first} again in 1 hour.`, tone: 'info' }) },
            },
          ]}
        />
      </DiscordMessage>
    </DiscordWindow>
  )
}
