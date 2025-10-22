import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuthStore } from '../stores/authStore';
import { useEffect } from 'react';

interface MinistryRow {
  id: string;
  ministerio_id: string | null;
  funcao_no_ministerio: string | null;
}

interface ParticipacaoEvento {
  id: string;
  evento_id: string | null;
}

const fetchPersonalStats = async (userId: string | null, churchId: string | null) => {
  if (!userId || !churchId) {
    return {
      ministryCount: 0,
      isLeaderSomeMinistry: false,
      eventsTotal: 0,
      eventsUpcoming: 0,
    };
  }

  // --- Ministries ---
  const { data: mins, error: minsErr } = await supabase
    .from('ministerio_voluntarios')
    .select('id, ministerio_id, funcao_no_ministerio')
    .eq('membro_id', userId)
    .eq('id_igreja', churchId);
  if (minsErr) throw minsErr;
  const volunteerRows: MinistryRow[] = (mins || []) as any;

  const { data: leaderMins, error: leaderErr } = await supabase
    .from('ministerios')
    .select('id')
    .eq('id_igreja', churchId)
    .eq('lider_id', userId);
  if (leaderErr) throw leaderErr;
  const leaderRowsToMerge: MinistryRow[] = (leaderMins || []).map((m: any) => ({
    id: m.id,
    ministerio_id: m.id,
    funcao_no_ministerio: 'lider',
  }));

  const merged = [...volunteerRows, ...leaderRowsToMerge];
  const uniqueMap = new Map<string, MinistryRow>();
  for (const item of merged) {
    const key = item.ministerio_id || item.id;
    if (!key) continue;
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, item);
    } else {
      const existing = uniqueMap.get(key)!;
      const isLeaderExisting = (existing.funcao_no_ministerio || '').toLowerCase().includes('lider');
      const isLeaderNew = (item.funcao_no_ministerio || '').toLowerCase().includes('lider');
      uniqueMap.set(key, { ...existing, funcao_no_ministerio: (isLeaderExisting || isLeaderNew) ? 'lider' : existing.funcao_no_ministerio });
    }
  }
  const uniqueMinistries = Array.from(uniqueMap.values());
  const ministryCount = uniqueMinistries.length;
  const leaderValues = ['lider', 'lider_ministerio', 'coordenador', 'responsavel'];
  const isLeaderSomeMinistry = uniqueMinistries.some(m => leaderValues.includes((m.funcao_no_ministerio || '').toLowerCase()));

  // --- Events ---
  const { data: parts, error: partsErr } = await supabase
    .from('evento_participantes')
    .select('id, evento_id')
    .eq('membro_id', userId)
    .eq('id_igreja', churchId);
  if (partsErr) throw partsErr;
  const participacoes: ParticipacaoEvento[] = parts || [];
  const eventsTotal = participacoes.length;

  let eventsUpcoming = 0;
  const eventoIds = participacoes.map(p => p.evento_id).filter(Boolean) as string[];
  if (eventoIds.length > 0) {
    const nowIso = new Date().toISOString();
    const { data: eventos, error: evErr } = await supabase
      .from('eventos')
      .select('id')
      .in('id', eventoIds)
      .gt('data_hora', nowIso);
    if (evErr) throw evErr;
    eventsUpcoming = (eventos || []).length;
  }

  return { ministryCount, isLeaderSomeMinistry, eventsTotal, eventsUpcoming };
};

export const usePersonalStats = () => {
  const { user, currentChurchId } = useAuthStore();
  const queryClient = useQueryClient();
  const queryKey = ['personalStats', user?.id, currentChurchId];

  useEffect(() => {
    if (!user?.id || !currentChurchId) return;

    const channel = supabase
      .channel(`personal-stats-realtime-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'evento_participantes', filter: `membro_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ministerio_voluntarios', filter: `membro_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey })
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'ministerios', filter: `lider_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, currentChurchId, queryClient, queryKey]);

  return useQuery({
    queryKey,
    queryFn: () => fetchPersonalStats(user?.id || null, currentChurchId),
    enabled: !!user?.id && !!currentChurchId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};