import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuthStore } from '../stores/authStore';

export interface PastorAreaItem {
  id: string;
  id_igreja: string;
  pastor_id: string;
  tipo: 'documento_pdf' | 'anotacao' | 'esboco_sermao';
  titulo: string;
  conteudo?: string;
  file_path?: string;
  created_at: string;
  updated_at: string;
  pastor_name?: string;
}

const fetchPastorItems = async (churchId: string | null): Promise<PastorAreaItem[]> => {
  if (!churchId) return [];

  const { data, error } = await supabase
    .from('pastor_area_items')
    .select(`
      *,
      membros!pastor_id ( nome_completo )
    `)
    .eq('id_igreja', churchId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching pastor items:", error);
    throw new Error(error.message);
  }

  return (data || []).map((item: any) => ({
    ...item,
    pastor_name: item.membros?.nome_completo || 'Desconhecido'
  }));
};

export const usePastorItems = () => {
  const { currentChurchId } = useAuthStore();
  return useQuery({
    queryKey: ['pastorAreaItems', currentChurchId],
    queryFn: () => fetchPastorItems(currentChurchId),
    enabled: !!currentChurchId,
  });
};