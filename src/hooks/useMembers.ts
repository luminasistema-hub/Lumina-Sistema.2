import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuthStore, UserRole } from '@/stores/authStore'

const fetchMembersByRole = async (churchId: string, roles: UserRole[]) => {
  const { data, error } = await supabase
    .from('membros')
    .select('id, nome_completo, email, funcao')
    .eq('id_igreja', churchId)
    .in('funcao', roles)

  if (error) {
    throw new Error(error.message)
  }
  return data
}

export const useMembers = (roles: UserRole[]) => {
  const { currentChurchId } = useAuthStore()

  const { data: members = [], isLoading, error } = useQuery({
    queryKey: ['members', currentChurchId, roles],
    queryFn: () => fetchMembersByRole(currentChurchId!, roles),
    enabled: !!currentChurchId && roles.length > 0,
  })

  return { members, isLoading, error }
}