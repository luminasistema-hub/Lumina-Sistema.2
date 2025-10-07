import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type Evento = {
  id: string;
  nome: string;
  descricao?: string | null;
  data_hora: string;
  local?: string | null;
  status?: string | null;
  tipo?: string | null;
};

export const useEvents = (churchId: string | undefined) => {
  return useQuery<Evento[]>({
    queryKey: ['events', churchId],
    enabled: Boolean(churchId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('eventos')
        .select('id, nome, descricao, data_hora, local, status, tipo')
        .eq('id_igreja', churchId)
        .order('data_hora', { ascending: true });
      if (error) throw error;
      return (data || []) as Evento[];
    },
  });
};