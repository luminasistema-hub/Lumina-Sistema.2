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

// A busca de dados foi temporariamente desativada para evitar o erro de relacionamento no banco de dados.
// A função agora retorna uma lista vazia para não quebrar a interface.
const fetchPastorItems = async (churchId: string | null): Promise<PastorAreaItem[]> => {
  if (!churchId) return [];

  console.warn("A busca de itens da Área do Pastor está temporariamente desativada devido a um problema de esquema no banco de dados.");
  
  return Promise.resolve([]);
};

export const usePastorItems = () => {
  const { currentChurchId } = useAuthStore();
  return useQuery({
    queryKey: ['pastorAreaItems', currentChurchId],
    queryFn: () => fetchPastorItems(currentChurchId),
    enabled: !!currentChurchId,
  });
};