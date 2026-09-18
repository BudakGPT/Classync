import { Attention } from './Attention'
import { ClassOverview } from './ClassOverview'
import { Deadlines } from './Deadlines'
import { Hero } from './Hero'
import { RecentActivity } from './RecentActivity'
import { StatCards } from './StatCards'
import { Timeline } from './Timeline'

export default function OverviewPage() {
  return (
    <div className="space-y-5">
      <Hero />
      <StatCards />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Timeline className="lg:col-span-7" />
        <div className="space-y-5 lg:col-span-5">
          <Deadlines />
          <Attention />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <ClassOverview className="lg:col-span-7" />
        <RecentActivity className="lg:col-span-5" />
      </div>
    </div>
  )
}
