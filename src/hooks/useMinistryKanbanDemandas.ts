import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface KanbanDemand {
  id: string;
  titulo: string;
  descricao: string | null;
  status: 'pendente' | 'em_andamento' | 'concluido';
  culto_id: string | null;
}

export const useMinistryKanbanDemandas = (ministerioId: string | undefined) => {
  return useQuery<KanbanDemand[]>({
    queryKey: ['ministry-kanban-demandas', ministerioId],
    enabled: Boolean(ministerioId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('demandas_ministerios')
        .select('id, titulo, descricao, status, culto_id')
        .eq('ministerio_id', ministerioId);
      if (error) throw error;
      return (data || []) as KanbanDemand[];
    },
  });
};