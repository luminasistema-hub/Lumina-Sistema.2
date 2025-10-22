import React from 'react'
import { useGroupMembers, useRemoveMemberFromGroup } from '@/hooks/useGrowthGroups'
import { useAuthStore } from '@/stores/authStore'
import { Button } from '@/components/ui/button'
import { Loader2, UserX } from 'lucide-react'

interface GroupMembersListProps {
  groupId: string
}

const GroupMembersList: React.FC<GroupMembersListProps> = ({ groupId }) => {
  const { user } = useAuthStore()
  const { data: members, isLoading } = useGroupMembers(groupId)
  const removeMemberMutation = useRemoveMemberFromGroup()
  const canManage = user?.role === 'admin' || user?.role === 'pastor'

  const handleRemove = (membroId: string) => {
    removeMemberMutation.mutate({ groupId, membroId })
  }

  if (isLoading) {
    return <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin" /></div>
  }

  return (
    <div className="space-y-2">
      {members && members.length === 0 && <p className="text-sm text-muted-foreground">Nenhum membro cadastrado.</p>}
      {members?.map(member => (
        <div key={member.id} className="flex items-center justify-between rounded-md border p-2">
          <div>
            <span className="text-sm font-medium">{member.nome_completo || member.email}</span>
            <span className="text-xs text-muted-foreground ml-2">{member.funcao}</span>
          </div>
          {canManage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemove(member.id)}
              disabled={removeMemberMutation.isPending && removeMemberMutation.variables?.membroId === member.id}
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

export default GroupMembersList