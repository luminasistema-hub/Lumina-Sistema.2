import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'sonner';

export interface Event {
  id: string;
  id_igreja: string;
  nome: string;
  descricao?: string;
  data_hora: string;
  local: string;
  tipo: string;
  status: string;
  capacidade_maxima?: number;
  inscricoes_abertas: boolean;
  valor_inscricao?: number;
  link_externo?: string;
  compartilhar_com_filhas?: boolean;
  participantes_count?: number;
  is_registered?: boolean;
}

export const useEvents = () => {
  const { user, currentChurchId } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events', currentChurchId, user?.id],
    queryFn: async () => {
      if (!currentChurchId) return [];
      
      try {
        const { data, error } = await supabase.rpc('get_eventos_para_igreja_com_participacao', {
          id_igreja_atual: currentChurchId,
        });
        
        if (error) throw error;
        
        return (data || []).map((e: any) => ({
          id: e.evento_id, // Mapear evento_id para id
          id_igreja: e.id_igreja,
          nome: e.nome,
          descricao: e.descricao,
          data_hora: e.data_hora,
          local: e.local,
          tipo: e.tipo,
          status: e.status,
          capacidade_maxima: e.capacidade_maxima,
          inscricoes_abertas: e.inscricoes_abertas,
          valor_inscricao: e.valor_inscricao,
          link_externo: e.link_externo,
          compartilhar_com_filhas: e.compartilhar_com_filhas,
          participantes_count: e.participantes_count || 0,
          is_registered: e.is_registered || false,
        }));
      } catch (error) {
        console.error('Erro ao buscar eventos via RPC:', error);
        // Fallback para query direta
        const { data, error: directError } = await supabase
          .from('eventos')
          .select('*')
          .eq('id_igreja', currentChurchId)
          .order('data_hora', { ascending: true });
          
        if (directError) throw directError;
        
        return (data || []).map((e: any) => ({
          ...e,
          participantes_count: 0,
          is_registered: false,
        }));
      }
    },
    enabled: !!currentChurchId,
  });

  return { events, isLoading, queryClient };
};