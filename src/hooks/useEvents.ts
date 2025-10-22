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
      if (!churchId) return [];
      const { data, error } = await supabase.rpc('get_eventos_para_igreja', {
        id_igreja_atual: churchId,
      });
      if (error) throw error;
      const list = (data || []) as any[];
      // Garantir ordenação por data
      return list
        .map((e) => ({
          id: e.id,
          nome: e.nome,
          descricao: e.descricao ?? null,
          data_hora: e.data_hora,
          local: e.local ?? null,
          status: e.status ?? null,
          tipo: e.tipo ?? null,
        }))
        .sort((a, b) => (new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime()));
    },
  });
};