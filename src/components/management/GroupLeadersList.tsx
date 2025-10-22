import React from 'react'
import { useGroupLeaders, useRemoveLeaderFromGroup } from '@/hooks/useGrowthGroups'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Loader2, UserX } from 'lucide-react'

interface GroupLeadersListProps {
  groupId: string
}

const GroupLeadersList: React.FC<GroupLeadersListProps> = ({ groupId }) => {
  const { user } = useAuthStore()
  const { data: leaders, isLoading } = useGroupLeaders(groupId)
  const removeLeaderMutation = useRemoveLeaderFromGroup()
  const canManage = user?.role === 'admin' || user?.role === 'pastor'

  const handleRemove = (membroId: string) => {
    removeLeaderMutation.mutate({ groupId, membroId })
  }

  if (isLoading) {
    return <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin" /></div>
  }

  return (
    <div className="space-y-2">
      {leaders && leaders.length === 0 && <p className="text-sm text-muted-foreground">Nenhum líder cadastrado.</p>}
      {leaders?.map(leader => (
        <div key={leader.id} className="flex items-center justify-between rounded-md border p-2">
          <div>
            <span className="text-sm font-medium">{leader.nome_completo || leader.email}</span>
            <span className="text-xs text-muted-foreground ml-2">{leader.funcao}</span>
          </div>
          {canManage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemove(leader.id)}
              disabled={removeLeaderMutation.isPending && removeLeaderMutation.variables?.membroId === leader.id}
            >
              <UserX className="w-4 h-4 mr-1" />
              Remover
            </Button>
          )}
        </div>
      ))}
    </div>
  )
}

export default GroupLeadersList