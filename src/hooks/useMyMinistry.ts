import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';
import { toast } from 'sonner';

export interface MyMinistry {
  id: string;
  nome: string;
  descricao: string;
  lider_id: string | null;
  isLeader: boolean;
}

export interface MyAssignment {
  escala_id: string;
  status_confirmacao: 'Pendente' | 'Confirmado' | 'Recusado';
  data_servico: string;
  evento_nome?: string | null;
}

const fetchMyMinistries = async (userId: string, churchId: string): Promise<MyMinistry[]> => {
  if (!userId || !churchId) return [];

  const { data: volRows } = await supabase
    .from('ministerio_voluntarios')
    .select('ministerio_id')
    .eq('membro_id', userId)
    .eq('id_igreja', churchId);
  const ministryIds = Array.from(new Set((volRows || []).map((r: any) => r.ministerio_id).filter(Boolean)));

  const { data: ministriesByVolunteer } = ministryIds.length > 0
    ? await supabase.from('ministerios').select('id, nome, descricao, lider_id').in('id', ministryIds)
    : { data: [] };
  
  const volunteerList: MyMinistry[] = (ministriesByVolunteer || []).map((m: any) => ({
    ...m,
    isLeader: m.lider_id === userId
  }));

  const { data: leaderRows } = await supabase
    .from('ministerios')
    .select('id, nome, descricao, lider_id')
    .eq('id_igreja', churchId)
    .eq('lider_id', userId);
  const leaderList: MyMinistry[] = (leaderRows || []).map((m: any) => ({ ...m, isLeader: true }));

  const merged = [...volunteerList, ...leaderList];
  const uniqueMap = new Map<string, MyMinistry>();
  for (const item of merged) {
    if (!uniqueMap.has(item.id)) {
      uniqueMap.set(item.id, item);
    } else {
      const existing = uniqueMap.get(item.id)!;
      uniqueMap.set(item.id, { ...existing, isLeader: existing.isLeader || item.isLeader });
    }
  }
  return Array.from(uniqueMap.values());
};

const fetchMyAssignments = async (userId: string, ministryId: string): Promise<MyAssignment[]> => {
  if (!userId || !ministryId) return [];
  const { data, error } = await supabase
    .from('escala_voluntarios')
    .select('escala_id, status_confirmacao, escala:escalas_servico(id, data_servico, evento:eventos(nome), ministerio_id)')
    .eq('membro_id', userId);
  if (error) throw error;

  return (data || [])
    .filter((r: any) => r.escala?.ministerio_id === ministryId)
    .map((r: any) => ({
      escala_id: r.escala_id,
      status_confirmacao: r.status_confirmacao,
      data_servico: r.escala?.data_servico,
      evento_nome: r.escala?.evento?.nome || null
    }));
};

export const useMyMinistry = (selectedMinistryId: string | null) => {
  const { user, currentChurchId } = useAuthStore();
  const queryClient = useQueryClient();

  const myMinistriesQuery = useQuery({
    queryKey: ['myMinistries', user?.id, currentChurchId],
    queryFn: () => fetchMyMinistries(user!.id, currentChurchId!),
    enabled: !!user?.id && !!currentChurchId,
  });

  const myAssignmentsQuery = useQuery({
    queryKey: ['myAssignments', user?.id, selectedMinistryId],
    queryFn: () => fetchMyAssignments(user!.id, selectedMinistryId!),
    enabled: !!user?.id && !!selectedMinistryId,
  });

  useEffect(() => {
    if (!user?.id || !currentChurchId) return;

    const ministryChannel = supabase
      .channel(`my-ministry-updates-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ministerio_voluntarios', filter: `membro_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['myMinistries', user.id, currentChurchId] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'escala_voluntarios', filter: `membro_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['myAssignments', user.id, selectedMinistryId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ministryChannel);
    };
  }, [user?.id, currentChurchId, selectedMinistryId, queryClient]);

  const confirmPresenceMutation = useMutation({
    mutationFn: async ({ escalaId, confirm }: { escalaId: string; confirm: boolean }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");
      const status = confirm ? 'Confirmado' : 'Recusado';
      const { error } = await supabase
        .from('escala_voluntarios')
        .update({ status_confirmacao: status })
        .eq('escala_id', escalaId)
        .eq('membro_id', user.id);
      if (error) throw error;
      return { escalaId, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myAssignments', user?.id, selectedMinistryId] });
      toast.success("Presença atualizada!");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar presença: ${error.message}`);
    },
  });

  return {
    myMinistriesQuery,
    myAssignmentsQuery,
    confirmPresence: confirmPresenceMutation.mutateAsync,
  };
};