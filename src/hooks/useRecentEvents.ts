import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuthStore } from '../stores/authStore';

export interface RecentEvent {
  id: string;
  nome: string;
  data_hora: string;
  local: string | null;
  tipo: string | null;
  status: string | null;
}

const fetchRecentEvents = async (churchId: string | null, _userId: string | null) => {
  if (!churchId) return [];
  const { data, error } = await supabase
    .from('eventos')
    .select('id, nome, data_hora, local, tipo, status')
    .eq('id_igreja', churchId)
    .order('data_hora', { ascending: false })
    .limit(3);

  if (error) throw new Error(error.message);
  return (data || []) as RecentEvent[];
};

export const useRecentEvents = () => {
  const { user, currentChurchId } = useAuthStore();
  return useQuery({
    queryKey: ['recentEvents', currentChurchId, user?.id],
    queryFn: () => fetchRecentEvents(currentChurchId, user?.id || null),
    enabled: !!currentChurchId && !!user?.id,
    staleTime: 1000 * 60 * 5,
  });
};