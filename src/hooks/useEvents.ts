import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'sonner';
import { useEffect, useMemo } from 'react';

export interface Event {
  id: string;
  id_igreja: string;
  nome: string;
  descricao?: string;
  data_hora: string;
  local: string;
  tipo: 'Culto' | 'Conferência' | 'Retiro' | 'Evangelismo' | 'Casamento' | 'Funeral' | 'Outro';
  status: 'Planejado' | 'Confirmado' | 'Em Andamento' | 'Finalizado' | 'Cancelado';
  capacidade_maxima?: number;
  inscricoes_abertas: boolean;
  valor_inscricao?: number;
  link_externo?: string;
  compartilhar_com_filhas?: boolean;
  participantes_count: number;
  is_registered: boolean;
}

const fetchEvents = async (churchId: string | null, userId: string, params?: { search?: string | null; type?: string | null }): Promise<Event[]> => {
  if (!churchId) return [];
  
  try {
    // Buscar eventos da própria igreja
    let query = supabase
      .from('eventos')
      .select('*')
      .eq('id_igreja', churchId);

    // Aplicar filtros
    if (params?.search) {
      query = query.ilike('nome', `%${params.search}%`);
    }
    if (params?.type && params.type !== 'all') {
      query = query.eq('tipo', params.type);
    }

    const { data: ownEvents, error: ownError } = await query.order('data_hora', { ascending: true });
    if (ownError) throw ownError;

    let allEvents = ownEvents || [];

    // Buscar eventos compartilhados da igreja-mãe (se aplicável)
    try {
      const { data: churchData } = await supabase
        .from('igrejas')
        .select('parent_church_id, compartilha_eventos_da_mae')
        .eq('id', churchId)
        .single();

      if (churchData?.parent_church_id && churchData?.compartilha_eventos_da_mae) {
        let sharedQuery = supabase
          .from('eventos')
          .select('*')
          .eq('id_igreja', churchData.parent_church_id)
          .eq('compartilhar_com_filhas', true);

        if (params?.search) {
          sharedQuery = sharedQuery.ilike('nome', `%${params.search}%`);
        }
        if (params?.type && params.type !== 'all') {
          sharedQuery = sharedQuery.eq('tipo', params.type);
        }

        const { data: sharedEvents, error: sharedError } = await sharedQuery.order('data_hora', { ascending: true });

        if (!sharedError && sharedEvents) {
          allEvents = [...allEvents, ...sharedEvents];
        }
      }
    } catch (err) {
      console.warn('Erro ao buscar eventos compartilhados:', err);
    }

    // Buscar participantes para todos os eventos
    const eventIds = allEvents.map(e => e.id);
    let participantsMap = new Map<string, number>();
    let registrationMap = new Map<string, boolean>();

    if (eventIds.length > 0) {
      const { data: participantsData } = await supabase
        .from('evento_participantes')
        .select('evento_id, membro_id')
        .in('evento_id', eventIds);

      if (participantsData) {
        participantsData.forEach(p => {
          const count = participantsMap.get(p.evento_id) || 0;
          participantsMap.set(p.evento_id, count + 1);
          
          if (p.membro_id === userId) {
            registrationMap.set(p.evento_id, true);
          }
        });
      }
    }

    // Mapear eventos com dados de participação
    const events: Event[] = allEvents.map(e => ({
      id: e.id,
      id_igreja: e.id_igreja,
      nome: e.nome,
      data_hora: e.data_hora,
      local: e.local ?? '',
      descricao: e.descricao ?? '',
      tipo: (e.tipo || 'Outro') as Event['tipo'],
      capacidade_maxima: e.capacidade_maxima ?? undefined,
      inscricoes_abertas: Boolean(e.inscricoes_abertas),
      valor_inscricao: e.valor_inscricao != null ? Number(e.valor_inscricao) : undefined,
      status: (e.status || 'Planejado') as Event['status'],
      participantes_count: participantsMap.get(e.id) || 0,
      is_registered: registrationMap.get(e.id) || false,
      link_externo: e.link_externo ?? undefined,
      compartilhar_com_filhas: e.compartilhar_com_filhas,
    }));

    // Ordenar por data
    events.sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());

    return events;
  } catch (error: any) {
    console.error('Erro ao buscar eventos:', error);
    toast.error(`Erro ao carregar eventos: ${error.message}`);
    return [];
  }
};

export const useEvents = (params?: { search?: string | null; type?: string | null }) => {
  const { user, currentChurchId } = useAuthStore();
  const queryClient = useQueryClient();
  const queryKey = useMemo(
    () => ['events', currentChurchId, user?.id, params?.search ?? '', params?.type ?? ''],
    [currentChurchId, user?.id, params?.search, params?.type]
  );

  const { data: events = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!currentChurchId || !user?.id) return [];
      return fetchEvents(currentChurchId, user.id, params);
    },
    enabled: !!currentChurchId && !!user?.id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });

  useEffect(() => {
    if (!currentChurchId) return;

    const channel = supabase
      .channel(`events-${currentChurchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'eventos' },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'evento_participantes' },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentChurchId, queryClient, queryKey]);

  const registerMutation = useMutation({
    mutationFn: async (event: Event) => {
      if (!user?.id || !currentChurchId) throw new Error('Você precisa estar logado para se inscrever.');
      if (event.participantes_count >= (event.capacidade_maxima || Infinity)) throw new Error('Capacidade máxima atingida.');
      
      const { error } = await supabase.from('evento_participantes').insert({
          evento_id: event.id, membro_id: user.id, id_igreja: currentChurchId
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Inscrição realizada com sucesso!');
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: any) => {
      toast.error(`Erro na inscrição: ${err.message}`);
    },
  });

  const unregisterMutation = useMutation({
    mutationFn: async (eventId: string) => {
      if (!user?.id) throw new Error('Usuário não encontrado.');
      const { error } = await supabase.from('evento_participantes').delete()
          .eq('evento_id', eventId).eq('membro_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Inscrição cancelada!');
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: any) => {
      toast.error(`Erro ao cancelar: ${err.message}`);
    },
  });

  return { events, isLoading, registerMutation, unregisterMutation, queryKey };
};