import { useQuery } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuthStore } from '../stores/authStore';
import { startOfMonth, endOfMonth, format } from 'date-fns';

const fetchDashboardStats = async (churchId: string | null) => {
  if (!churchId) return null;

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

  // 3. Cursos em Andamento (Inscrições ativas)
  const { count: activeCourses, error: coursesError } = await supabase
    .from('cursos_inscricoes')
    .select('id_curso', { count: 'exact', head: true })
    .eq('status', 'ativo')
    .in('id_curso', (await supabase.from('cursos').select('id').eq('id_igreja', churchId)).data?.map(c => c.id) || []);
  if (coursesError) throw new Error(`Cursos: ${coursesError.message}`);

  // 4. Ofertas do Mês
  const now = new Date();
  const start = format(startOfMonth(now), 'yyyy-MM-dd');
  const end = format(endOfMonth(now), 'yyyy-MM-dd');

  const { data: monthlyOfferings, error: offeringsError } = await supabase
    .from('transacoes_financeiras')
    .select('valor')
    .eq('id_igreja', churchId)
    .eq('tipo', 'Entrada')
    .eq('status', 'Confirmado')
    .gte('data_transacao', start)
    .lte('data_transacao', end);
  if (offeringsError) throw new Error(`Ofertas: ${offeringsError.message}`);
  
  const totalMonthlyOfferings = monthlyOfferings?.reduce((sum, item) => sum + item.valor, 0) || 0;

  return {
    activeMembers,
    upcomingEvents,
    activeCourses,
    totalMonthlyOfferings,
  };
};

export const useDashboardStats = () => {
  const { currentChurchId } = useAuthStore();

  return useQuery({
    queryKey: ['dashboardStats', currentChurchId],
    queryFn: () => fetchDashboardStats(currentChurchId),
    enabled: !!currentChurchId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};