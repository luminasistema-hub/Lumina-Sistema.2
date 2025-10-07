import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'

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
    onSuccess: () => {
      toast.success('Líder adicionado')
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
    onSuccess: () => {
      toast.success('Membro adicionado ao grupo')
      qc.invalidateQueries({ queryKey: ['gc-my-groups'] })
    },
    onError: (e: any) => toast.error(e.message || 'Falha ao adicionar membro')
  })
}

export const useMyGrowthGroups = () => {
  // Busca grupos onde o usuário é membro ou líder
  return useQuery({
    queryKey: ['gc-my-groups'],
    queryFn: async (): Promise<GrowthGroup[]> => {
      // 1) Grupos onde sou membro
      const { data: asMember, error: errMember } = await supabase
        .from('gc_groups')
        .select('id, id_igreja, nome, descricao, meeting_day, meeting_time, meeting_location, contact_phone, created_at, updated_at')
        .in(
          'id',
          (
            await supabase
              .from('gc_group_members')
              .select('group_id')
              .eq('membro_id', (await supabase.auth.getUser()).data.user?.id || '')
          ).data?.map((r: any) => r.group_id) || ['00000000-0000-0000-0000-000000000000']
        )
      if (errMember) throw new Error(errMember.message)

      // 2) Grupos onde sou líder
      const { data: asLeader, error: errLeader } = await supabase
        .from('gc_groups')
        .select('id, id_igreja, nome, descricao, meeting_day, meeting_time, meeting_location, contact_phone, created_at, updated_at')
        .in(
          'id',
          (
            await supabase
              .from('gc_group_leaders')
              .select('group_id')
              .eq('membro_id', (await supabase.auth.getUser()).data.user?.id || '')
          ).data?.map((r: any) => r.group_id) || ['00000000-0000-0000-0000-000000000000']
        )
      if (errLeader) throw new Error(errLeader.message)

      const all = [...(asMember || []), ...(asLeader || [])] as GrowthGroup[]
      const unique = new Map(all.map(g => [g.id, g]))
      return Array.from(unique.values())
    },
    refetchOnWindowFocus: false
  })
}