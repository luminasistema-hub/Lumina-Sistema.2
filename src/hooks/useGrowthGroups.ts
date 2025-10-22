import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'
import { MemberProfile } from './useMembers'

export type GrowthGroup = {
  id: string
  id_igreja: string
  nome: string
  descricao?: string | null
  meeting_day?: string | null
  meeting_time?: string | null
  meeting_location?: string | null
  contact_phone?: string | null
  created_at: string
  updated_at: string
}

export const useChurchGrowthGroups = () => {
  const { currentChurchId } = useAuthStore()
  return useQuery({
    queryKey: ['gc-groups', currentChurchId],
    enabled: !!currentChurchId,
    queryFn: async (): Promise<GrowthGroup[]> => {
      const { data, error } = await supabase
        .from('gc_groups')
        .select('*')
        .eq('id_igreja', currentChurchId)
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)
      return (data || []) as GrowthGroup[]
    }
  })
}

export const useCreateGrowthGroup = () => {
  const qc = useQueryClient()
  const { currentChurchId } = useAuthStore()
  return useMutation({
    mutationFn: async (payload: Omit<GrowthGroup, 'id' | 'created_at' | 'updated_at' | 'id_igreja'>) => {
      const { data, error } = await supabase
        .from('gc_groups')
        .insert([{ ...payload, id_igreja: currentChurchId }])
        .select('*')
        .single()
      if (error) throw new Error(error.message)
      return data as GrowthGroup
    },
    onSuccess: () => {
      toast.success('Grupo criado')
      qc.invalidateQueries({ queryKey: ['gc-groups', currentChurchId] })
    },
    onError: (e: any) => toast.error(e.message || 'Falha ao criar grupo')
  })
}

export const useUpdateGrowthGroup = () => {
  const qc = useQueryClient()
  const { currentChurchId } = useAuthStore()
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<GrowthGroup> }) => {
      const { error } = await supabase.from('gc_groups').update(updates).eq('id', id)
      if (error) throw new Error(error.message)
      return true
    },
    onSuccess: () => {
      toast.success('Grupo atualizado')
      qc.invalidateQueries({ queryKey: ['gc-groups', currentChurchId] })
    },
    onError: (e: any) => toast.error(e.message || 'Falha ao atualizar grupo')
  })
}

export const useAddLeaderToGroup = () => {
  const qc = useQueryClient()
  const { currentChurchId } = useAuthStore()
  return useMutation({
    mutationFn: async ({ groupId, membroId }: { groupId: string; membroId: string }) => {
      const { error } = await supabase
        .from('gc_group_leaders')
        .insert([{ id_igreja: currentChurchId, group_id: groupId, membro_id: membroId }])
      if (error) throw new Error(error.message)
      return true
    },
    onSuccess: (_, { groupId }) => {
      toast.success('Líder adicionado')
      qc.invalidateQueries({ queryKey: ['gc-group-leaders', groupId] })
      qc.invalidateQueries({ queryKey: ['gc-groups', currentChurchId] })
    },
    onError: (e: any) => toast.error(e.message || 'Falha ao adicionar líder')
  })
}

export const useAddMemberToGroup = () => {
  const qc = useQueryClient()
  const { currentChurchId } = useAuthStore()
  return useMutation({
    mutationFn: async ({ groupId, membroId }: { groupId: string; membroId: string }) => {
      const { error } = await supabase
        .from('gc_group_members')
        .insert([{ id_igreja: currentChurchId, group_id: groupId, membro_id: membroId }])
      if (error) throw new Error(error.message)
      return true
    },
    onSuccess: (_, { groupId }) => {
      toast.success('Membro adicionado ao grupo')
      qc.invalidateQueries({ queryKey: ['gc-my-groups'] })
      qc.invalidateQueries({ queryKey: ['gc-group-members', groupId] })
    },
    onError: (e: any) => toast.error(e.message || 'Falha ao adicionar membro')
  })
}

export const useRemoveLeaderFromGroup = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ groupId, membroId }: { groupId: string; membroId: string }) => {
      const { error } = await supabase
        .from('gc_group_leaders')
        .delete()
        .eq('group_id', groupId)
        .eq('membro_id', membroId)
      if (error) throw new Error(error.message)
      return true
    },
    onSuccess: (_, { groupId }) => {
      toast.success('Líder removido')
      qc.invalidateQueries({ queryKey: ['gc-group-leaders', groupId] })
    },
    onError: (e: any) => toast.error(e.message || 'Falha ao remover líder')
  })
}

export const useRemoveMemberFromGroup = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ groupId, membroId }: { groupId: string; membroId: string }) => {
      const { error } = await supabase
        .from('gc_group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('membro_id', membroId)
      if (error) throw new Error(error.message)
      return true
    },
    onSuccess: (_, { groupId }) => {
      toast.success('Membro removido do grupo')
      qc.invalidateQueries({ queryKey: ['gc-group-members', groupId] })
    },
    onError: (e: any) => toast.error(e.message || 'Falha ao remover membro')
  })
}

export const useGroupLeaders = (groupId: string | null) => {
  return useQuery({
    queryKey: ['gc-group-leaders', groupId],
    enabled: !!groupId,
    queryFn: async (): Promise<MemberProfile[]> => {
      const { data, error } = await supabase
        .from('gc_group_leaders')
        .select('membro:membros(*)')
        .eq('group_id', groupId!)
      if (error) throw new Error(error.message)
      return (data?.map(item => item.membro).filter(Boolean) as MemberProfile[]) || []
    }
  })
}

export const useGroupMembers = (groupId: string | null) => {
  return useQuery({
    queryKey: ['gc-group-members', groupId],
    enabled: !!groupId,
    queryFn: async (): Promise<MemberProfile[]> => {
      const { data, error } = await supabase
        .from('gc_group_members')
        .select('membro:membros(*)')
        .eq('group_id', groupId!)
      if (error) throw new Error(error.message)
      return (data?.map(item => item.membro).filter(Boolean) as MemberProfile[]) || []
    }
  })
}

export const useMyGrowthGroups = () => {
  const { user } = useAuthStore()
  const userId = user?.id || null
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`my-growth-groups-changes-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gc_group_members', filter: `membro_id=eq.${userId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['gc-my-groups', userId] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gc_group_leaders', filter: `membro_id=eq.${userId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ['gc-my-groups', userId] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return useQuery({
    queryKey: ['gc-my-groups', userId],
    enabled: !!userId,
    queryFn: async (): Promise<GrowthGroup[]> => {
      const uid = userId!

      const { data: memberRows, error: errMemberRows } = await supabase
        .from('gc_group_members')
        .select('group_id')
        .eq('membro_id', uid)
      if (errMemberRows) throw new Error(errMemberRows.message)

      const { data: leaderRows, error: errLeaderRows } = await supabase
        .from('gc_group_leaders')
        .select('group_id')
        .eq('membro_id', uid)
      if (errLeaderRows) throw new Error(errLeaderRows.message)

      const groupIds = Array.from(new Set([...(memberRows || []).map(r => r.group_id), ...(leaderRows || []).map(r => r.group_id)]))
      if (groupIds.length === 0) return []

      const { data: groups, error } = await supabase
        .from('gc_groups')
        .select('id, id_igreja, nome, descricao, meeting_day, meeting_time, meeting_location, contact_phone, created_at, updated_at')
        .in('id', groupIds)
      if (error) throw new Error(error.message)

      return (groups || []) as GrowthGroup[]
    },
    refetchOnWindowFocus: false
  })
}