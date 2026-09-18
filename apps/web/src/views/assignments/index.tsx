import { useRoute } from '@/lib/router'
import { AssignmentDetail } from './AssignmentDetail'
import { AssignmentList } from './AssignmentList'

export default function AssignmentsPage() {
  const { segments } = useRoute()
  return segments[1] ? <AssignmentDetail key={segments[1]} id={segments[1]} /> : <AssignmentList />
}
