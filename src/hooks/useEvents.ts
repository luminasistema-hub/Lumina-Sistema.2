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

const fetchEvents = async (churchId: string | null): Promise<Event[]> => {
  if (!churchId) return [];
  try {
    const { data, error } = await supabase.rpc('get_eventos_para_igreja_com_participacao', {
      id_igreja_atual: churchId,
    });
    if (error) throw error;
    const items: Event[] = (data || []).map((e: any) => ({
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
    }));
    items.sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());
    return items;
  } catch (rpcErr: any) {
    toast.error(`Falha ao carregar eventos compartilhados: ${rpcErr?.message || 'erro RPC'}. Exibindo apenas eventos da sua igreja.`);
    const { data: ownEvents, error: ownErr } = await supabase
      .from('eventos')
      .select('*')
      .eq('id_igreja', churchId)
      .order('data_hora', { ascending: true });
    if (ownErr) throw ownErr;
    const items: Event[] = (ownEvents || []).map((e: any) => ({
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
      participantes_count: 0,
      is_registered: false,
      link_externo: e.link_externo ?? undefined,
      compartilhar_com_filhas: e.compartilhar_com_filhas,
    }));
    return items;
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
      if (!currentChurchId) return [];
      const { data, error } = await supabase.functions.invoke('get-events', {
        body: { church_id: currentChurchId, search: params?.search ?? null, type: params?.type ?? null },
      });
      if (error) throw new Error(error.message);
      const list = (data as any)?.events || [];
      return list as Event[];
    },
    enabled: !!currentChurchId,
    placeholderData: (prev) => prev, // mantém dados anteriores para evitar flicker
    staleTime: 1000 * 60 * 15, // 15 minutos de cache
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

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