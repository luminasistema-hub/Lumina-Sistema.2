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
  visibilidade?: 'privada' | 'publica';
  participantes_count: number;
  is_registered: boolean;
}

const fetchEvents = async (churchId: string | null, userId: string | null): Promise<Event[]> => {
  if (!churchId || !userId) return [];

  // A função RPC agora faz todo o trabalho pesado de buscar todos os eventos visíveis.
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_eventos_para_igreja_com_participacao', {
    id_igreja_atual: churchId,
  });

  if (rpcError) {
    toast.error(`Falha ao carregar eventos: ${rpcError.message}`);
    return [];
  }

  // Mapeia os resultados do RPC para o formato esperado pela interface
  const events: Event[] = (rpcData || []).map((e: any) => ({
    id: e.evento_id,
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
    participantes_count: Number(e.participantes_count || 0),
    is_registered: Boolean(e.is_registered),
    link_externo: e.link_externo ?? undefined,
    compartilhar_com_filhas: e.compartilhar_com_filhas,
    visibilidade: e.visibilidade ?? 'privada',
  }));

  events.sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());

  return events;
};

export const useEvents = () => {
  const { user, currentChurchId } = useAuthStore();
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ['events', currentChurchId, user?.id], [currentChurchId, user?.id]);

  useEffect(() => {
    if (!currentChurchId) return;

    const channel = supabase
      .channel(`public-events-hook-${currentChurchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'eventos' },
        () => queryClient.invalidateQueries({ queryKey })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'evento_participantes' },
        () => queryClient.invalidateQueries({ queryKey })
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentChurchId, queryClient, queryKey]);

  const { data: events = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchEvents(currentChurchId, user?.id || null),
    enabled: !!currentChurchId && !!user?.id,
    refetchOnWindowFocus: false,
  });

  const registerMutation = useMutation({
    mutationFn: async (event: Event) => {
      if (!user?.id || !event.id_igreja) throw new Error('Você precisa estar logado para se inscrever.');
      if (event.participantes_count >= (event.capacidade_maxima || Infinity)) throw new Error('Capacidade máxima atingida.');
      
      const { error } = await supabase.from('evento_participantes').insert({
          evento_id: event.id, membro_id: user.id, id_igreja: event.id_igreja
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

  return { events, isLoading, registerMutation, unregisterMutation, queryClient };
};