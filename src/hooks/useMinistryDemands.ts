import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DemandaMinisterio {
  id: string;
  ministerio_id: string;
  culto_id: string | null;
  responsavel_id: string | null;
  titulo: string;
  descricao: string | null;
  prazo: string | null;
  status: string;
  prioridade: string | null;
  created_at: string;
  culto?: {
    id: string;
    titulo: string;
    data: string;
  };
}

export const useMinistryDemands = (ministryId: string | undefined) => {
  return useQuery<DemandaMinisterio[]>({
    queryKey: ['ministry-demands', ministryId],
    enabled: Boolean(ministryId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('demandas_ministerios')
        .select(`
          *,
          culto:cultos ( id, titulo, data )
        `)
        .eq('ministerio_id', ministryId);
      if (error) throw error;
      return (data || []) as DemandaMinisterio[];
    },
  });
};