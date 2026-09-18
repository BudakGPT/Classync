import { Users, Plus } from 'lucide-react'
import { Button, Card, EmptyState } from '@/components/ui'
import { navigate } from '@/lib/router'
import { GroupCard } from '../groups/GroupCard'
import type { TabProps } from './lib'

export function GroupsTab({ cls, s }: TabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold text-ink">
          Study & Project Groups ({s.groups.length})
        </h3>
        <Button
          size="sm"
          icon={Plus}
          onClick={() => navigate('/groups?action=create')}
        >
          New group
        </Button>
      </div>

      {s.groups.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="No groups for this class"
            description="Create study circles, FGDs, or team projects for Classync."
            action={{
              label: 'Create group',
              icon: Plus,
              onClick: () => navigate('/groups?action=create'),
            }}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {s.groups.map((g, i) => (
            <GroupCard
              key={g.id}
              group={g}
              index={i}
              onEdit={() => navigate(`/groups/${g.id}`)}
              onDelete={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  )
}
