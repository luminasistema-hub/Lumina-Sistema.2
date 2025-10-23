import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type MemberRow = {
  id: string;
  nome_completo: string | null;
  email: string | null;
  funcao: string;
  status: string;
  created_at: string;
};

interface DashboardData {
  counts: {
    members: number;
    leaders: number;
    kids: number;
    ministries: number;
  };
  members: MemberRow[];
}

const fetchChildChurchDashboardData = async (churchId: string): Promise<DashboardData> => {
  try {
    // Contagem de membros
    const { count: membersCount, error: mErr } = await supabase
      .from('membros')
      .select('id', { count: 'exact', head: true })
      .eq('id_igreja', churchId);
    if (mErr) throw mErr;

    // Contagem de líderes
    const { count: leadersCount, error: lErr } = await supabase
      .from('membros')
      .select('id', { count: 'exact', head: true })
      .eq('id_igreja', churchId)
      .in('funcao', ['admin', 'pastor', 'lider']);
    if (lErr) throw lErr;

    // Contagem de crianças
    const { count: kidsCount, error: kErr } = await supabase
      .from('criancas')
      .select('id', { count: 'exact', head: true })
      .eq('id_igreja', churchId);
    if (kErr) throw kErr;

    // Contagem de ministérios
    const { count: ministriesCount, error: minErr } = await supabase
      .from('ministerios')
      .select('id', { count: 'exact', head: true })
      .eq('id_igreja', churchId);
    if (minErr) throw minErr;

    // Lista de membros
    const { data: membersRows, error: listErr } = await supabase
      .from('membros')
      .select('id, nome_completo, email, funcao, status, created_at')
      .eq('id_igreja', churchId)
      .order('nome_completo', { ascending: true });
    if (listErr) throw listErr;

    return {
      counts: {
        members: membersCount || 0,
        leaders: leadersCount || 0,
        kids: kidsCount || 0,
        ministries: ministriesCount || 0,
      },
      members: (membersRows || []) as MemberRow[],
    };
  } catch (e: any) {
    console.error('useChildChurchDashboardData fetch error:', e?.message || e);
    toast.error('Falha ao carregar dados da igreja filha.');
    throw new Error('Falha ao carregar dados da igreja filha.');
  }
};

export const useChildChurchDashboardData = (churchId: string, open: boolean) => {
  return useQuery<DashboardData>({
    queryKey: ['childChurchDashboard', churchId],
    queryFn: () => fetchChildChurchDashboardData(churchId),
    enabled: !!churchId && open,
    staleTime: 1000 * 60 * 5, // 5 minutos
    refetchOnWindowFocus: false,
  });
};