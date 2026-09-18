import { useRoute } from '@/lib/router'
import { ClassDetail } from './ClassDetail'
import { ClassList } from './ClassList'

// /classes → list · /classes/:id?tab=… → detail
export default function ClassesPage() {
  const { segments } = useRoute()
  return segments[1] ? <ClassDetail key={segments[1]} id={segments[1]} /> : <ClassList />
}
