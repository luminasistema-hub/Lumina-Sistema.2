import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuthStore } from '../stores/authStore';
import { useEffect } from 'react';

export interface RecentDevotional {
  id: string;
  titulo: string;
  data_publicacao: string;
  tempo_leitura: number | null;
  categoria: string | null;
  membros: { nome_completo: string | null } | null;
}

const fetchRecentDevotionals = async (churchId: string | null, _userId: string | null) => {
  if (!churchId) return [];
  const { data, error } = await supabase
    .from('devocionais')
    .select('id, titulo, data_publicacao, tempo_leitura, categoria, membros ( nome_completo )')
    .eq('id_igreja', churchId)
    .eq('status', 'Publicado')
    .order('data_publicacao', { ascending: false })
    .limit(3);

  if (error) throw new Error(error.message);
  return (data || []) as RecentDevotional[];
};

export const useRecentDevotionals = () => {
  const { user, currentChurchId } = useAuthStore();
  return useQuery({
    queryKey: ['recentDevotionals', currentChurchId, user?.id],
    queryFn: () => fetchRecentDevotionals(currentChurchId, user?.id || null),
    enabled: !!currentChurchId && !!user?.id,
    staleTime: 1000 * 60 * 5,
  });
};