import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuthStore } from '../stores/authStore';

const fetchDashboardStats = async (churchId: string | null, _userId: string | null) => {
  if (!churchId || !_userId) return null;

  // Busca simplificada - apenas contagens essenciais
  const [membersResult, eventsResult] = await Promise.all([
    supabase
      .from('membros')
      .select('*', { count: 'exact', head: true })
      .eq('id_igreja', churchId)
      .eq('status', 'ativo'),
    supabase
      .from('eventos')
      .select('*', { count: 'exact', head: true })
      .eq('id_igreja', churchId)
      .gt('data_hora', new Date().toISOString())
  ]);

  if (membersResult.error) throw new Error(`Membros: ${membersResult.error.message}`);
  if (eventsResult.error) throw new Error(`Eventos: ${eventsResult.error.message}`);

  return {
    activeMembers: membersResult.count || 0,
    upcomingEvents: eventsResult.count || 0,
    activeCourses: 0,
    totalMonthlyOfferings: 0, // Removido para economizar queries
  };
};

export const useDashboardStats = () => {
  const { user, currentChurchId } = useAuthStore();

  return useQuery({
    queryKey: ['dashboardStats', currentChurchId, user?.id],
    queryFn: () => fetchDashboardStats(currentChurchId, user!.id),
    enabled: !!currentChurchId && !!user?.id,
    staleTime: 1000 * 60 * 30, // 30 minutos de cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};