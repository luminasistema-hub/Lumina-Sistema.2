import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EscalaSchedule {
  id: string;
  id_igreja: string;
  ministerio_id: string;
  evento_id: string | null;
  data_servico: string;
  observacoes: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
  evento?: { nome?: string | null; data_hora?: string | null } | null;
  voluntarios?: Array<{ id: string; membro?: { nome_completo?: string | null; email?: string | null } }>;
}

export const useMinistrySchedules = (ministerioId: string | undefined, churchId: string | undefined) => {
  return useQuery<EscalaSchedule[]>({
    queryKey: ['ministry-schedules', churchId, ministerioId],
    enabled: Boolean(ministerioId && churchId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('escalas_servico')
        .select(`
          *,
          evento:eventos(nome, data_hora),
          voluntarios:escala_voluntarios!inner(*, membro:membros(nome_completo, email))
        `)
        .eq('ministerio_id', ministerioId)
        .eq('id_igreja', churchId)
        .order('data_servico', { ascending: true });
      if (error) throw error;
      return (data || []) as EscalaSchedule[];
    },
  });
};