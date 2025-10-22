import { useQuery } from '@tanstack/react-query'
import { supabase } from '../integrations/supabase/client'

export interface Volunteer {
  id: string;
  nome_completo: string;
  volunteer_id: string; // This is the ID from the ministerio_voluntarios table
}

const fetchVolunteers = async (ministryId: string | null) => {
  if (!ministryId) return []

  const { data, error } = await supabase
    .from('ministerio_voluntarios')
    .select('id, membro:membros(id, nome_completo)')
    .eq('ministerio_id', ministryId)

  if (error) throw new Error(`Failed to fetch volunteers: ${error.message}`)

  return (data || []).map((v: any) => ({
    volunteer_id: v.id,
    ...v.membro
  })) as Volunteer[]
}

export const useMinistryVolunteers = (ministryId: string | null) => {
  return useQuery({
    queryKey: ['ministryVolunteers', ministryId],
    queryFn: () => fetchVolunteers(ministryId),
    enabled: !!ministryId,
    staleTime: 1000 * 60, // 1 minute
  })
}