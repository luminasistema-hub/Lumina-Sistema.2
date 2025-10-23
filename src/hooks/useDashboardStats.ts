import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuthStore } from '../stores/authStore';
import { startOfMonth, endOfMonth, format } from 'date-fns';

const fetchDashboardStats = async (churchId: string | null, _userId: string | null) => {
  if (!churchId || !_userId) return null;

  // 1. Membros Ativos
  const { count: activeMembers, error: membersError } = await supabase
    .from('membros')
    .select('*', { count: 'exact', head: true })
    .eq('id_igreja', churchId)
    .eq('status', 'ativo');
  if (membersError) throw new Error(`Membros: ${membersError.message}`);

  // 2. Eventos Próximos
  const { count: upcomingEvents, error: eventsError } = await supabase
    .from('eventos')
    .select('*', { count: 'exact', head: true })
    .eq('id_igreja', churchId)
    .gt('data_hora', new Date().toISOString());
  if (eventsError) throw new Error(`Eventos: ${eventsError.message}`);

  // 3. Cursos em Andamento — removido (tabelas não existem no schema atual)
  const activeCourses = 0;

  // 4. Ofertas do Mês (apenas do membro logado)
  const now = new Date();
  const start = format(startOfMonth(now), 'yyyy-MM-dd');
  const end = format(endOfMonth(now), 'yyyy-MM-dd');

  const { data: monthlyOfferings, error: offeringsError } = await supabase
    .from('transacoes_financeiras')
    .select('valor')
    .eq('tipo', 'Entrada')
    .eq('status', 'Confirmado')
    .eq('membro_id', _userId)
    .eq('id_igreja', churchId)
    .gte('data_transacao', start)
    .lte('data_transacao', end);
  if (offeringsError) throw new Error(`Ofertas: ${offeringsError.message}`);
  
  const totalMonthlyOfferings = (monthlyOfferings || []).reduce((sum: number, item: any) => sum + Number(item.valor ?? 0), 0);

  return {
    activeMembers,
    upcomingEvents,
    activeCourses,
    totalMonthlyOfferings,
  };
};

export const useDashboardStats = () => {
  const { user, currentChurchId } = useAuthStore();

  return useQuery({
    queryKey: ['dashboardStats', currentChurchId, user?.id],
    queryFn: () => fetchDashboardStats(currentChurchId, user!.id),
    enabled: !!currentChurchId && !!user?.id,
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
};