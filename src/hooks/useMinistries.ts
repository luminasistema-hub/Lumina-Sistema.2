import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../integrations/supabase/client'
import { useAuthStore } from '../stores/authStore'
import { useEffect } from 'react'

export interface Ministry {
  id: string;
  nome: string;
  descricao: string;
  lider_id: string | null;
  lider_nome?: string;
  created_at: string;
  id_igreja: string;
  volunteers_count?: number;
}

export interface MemberOption {
  id: string;
  nome_completo: string;
}

const fetchMinistriesAndMembers = async (churchId: string) => {
  if (!churchId) return { ministries: [], members: [] }

  // Fetch ministries with volunteer count
  const { data: ministriesData, error: ministriesError } = await supabase
    .from('ministerios')
    .select(`
      id,
      nome,
      descricao,
      lider_id,
      created_at,
      id_igreja,
      volunteers:ministerio_voluntarios(count)
    `)
    .eq('id_igreja', churchId)
    .order('nome')

  if (ministriesError) throw new Error(`Failed to fetch ministries: ${ministriesError.message}`)

  // Fetch leaders
  const leaderIds = ministriesData.map(m => m.lider_id).filter(Boolean) as string[]
  const leadersMap = new Map<string, string>()
  if (leaderIds.length > 0) {
    const { data: leadersData, error: leadersError } = await supabase
      .from('membros')
      .select('id, nome_completo')
      .in('id', leaderIds)
    if (leadersError) throw new Error(`Failed to fetch leaders: ${leadersError.message}`)
    leadersData.forEach(l => leadersMap.set(l.id, l.nome_completo))
  }

  const formattedMinistries: Ministry[] = ministriesData.map((m: any) => ({
    ...m,
    lider_nome: leadersMap.get(m.lider_id) || 'Não Atribuído',
    volunteers_count: m.volunteers[0]?.count || 0,
  }))

  // Fetch all church members for options
  const { data: membersData, error: membersError } = await supabase
    .from('membros')
    .select('id, nome_completo')
    .eq('id_igreja', churchId)
    .order('nome_completo')
  if (membersError) throw new Error(`Failed to fetch members: ${membersError.message}`)

  return { ministries: formattedMinistries, members: membersData as MemberOption[] }
}

export const useMinistries = () => {
  const { currentChurchId } = useAuthStore()
  const queryClient = useQueryClient()

  const queryKey = ['ministries', currentChurchId]

  useEffect(() => {
    if (!currentChurchId) return

    const channel = supabase
      .channel(`ministries-management-${currentChurchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ministerios', filter: `id_igreja=eq.${currentChurchId}` },
        () => {
          queryClient.invalidateQueries({ queryKey })
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ministerio_voluntarios', filter: `id_igreja=eq.${currentChurchId}` },
        () => {
          queryClient.invalidateQueries({ queryKey })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentChurchId, queryClient, queryKey])

  return useQuery({
    queryKey,
    queryFn: () => fetchMinistriesAndMembers(currentChurchId!),
    enabled: !!currentChurchId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  })
}