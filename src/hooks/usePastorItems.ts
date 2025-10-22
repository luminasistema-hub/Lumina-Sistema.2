import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuthStore } from '../stores/authStore';
import { useEffect, useMemo } from 'react';

export interface PastorAreaItem {
  id: string;
  id_igreja: string;
  pastor_id: string;
  pastor_nome?: string;
  tipo: 'documento_pdf' | 'anotacao' | 'esboco_sermao';
  titulo: string;
  conteudo?: string;
  file_path?: string;
  created_at: string;
  updated_at: string;
}

const fetchPastorItems = async (churchId: string | null, _userId?: string | null): Promise<PastorAreaItem[]> => {
  if (!churchId) return [];

  try {
    const { data, error } = await supabase
      .from('pastor_area_items')
      .select(`
        id,
        id_igreja,
        pastor_id,
        pastor_nome,
        tipo,
        titulo,
        conteudo,
        file_path,
        created_at,
        updated_at
      `)
      .eq('id_igreja', churchId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar itens da área do pastor:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Erro na busca de itens do pastor:', error);
    return [];
  }
};

export const usePastorItems = () => {
  const { user, currentChurchId } = useAuthStore();
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ['pastorAreaItems', currentChurchId, user?.id], [currentChurchId, user?.id]);

  useEffect(() => {
    if (!currentChurchId) return;

    const channel = supabase
      .channel(`pastor-items-${currentChurchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pastor_area_items',
          filter: `id_igreja=eq.${currentChurchId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentChurchId, queryClient, queryKey]);

  return useQuery({
    queryKey,
    queryFn: () => fetchPastorItems(currentChurchId, user?.id || null),
    enabled: !!currentChurchId && !!user?.id,
  });
};