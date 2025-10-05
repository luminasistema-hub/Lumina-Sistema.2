import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { useJourneyData } from '@/hooks/useJourneyData';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Target, Users, Shield, CalendarDays } from 'lucide-react';

type MinistryRow = {
  id: string;
  ministerio_id: string | null;
  funcao_no_ministerio: string | null;
};

type ParticipacaoEvento = {
  id: string;
  evento_id: string | null;
};

const PersonalStatusCards: React.FC = () => {
  const { user, currentChurchId } = useAuthStore();
  const { overallProgress, completedSteps, totalSteps, currentLevel, trilhaInfo, loading: journeyLoading } = useJourneyData();

  const [ministries, setMinistries] = useState<MinistryRow[]>([]);
  const [eventsTotal, setEventsTotal] = useState<number>(0);
  const [eventsUpcoming, setEventsUpcoming] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const isFetchingRef = useRef(false);
  const debounceTimerRef = useRef<number | null>(null);
  const channelRef = useRef<any>(null);

  const isGlobalLeader = useMemo(() => {
    const role = user?.role;
    return role === 'lider_ministerio' || role === 'pastor' || role === 'admin' || role === 'super_admin';
  }, [user?.role]);

  const isLeaderSomeMinistry = useMemo(() => {
    const leaderValues = ['lider', 'lider_ministerio', 'coordenador', 'responsavel'];
    return ministries.some(m => leaderValues.includes((m.funcao_no_ministerio || '').toLowerCase()));
  }, [ministries]);

  useEffect(() => {
    const load = async () => {
      if (!user?.id || !currentChurchId) {
        setMinistries([]);
        setEventsTotal(0);
        setEventsUpcoming(0);
        setLoading(false);
        // Ao limpar, remove a associação do perfil
        useAuthStore.setState((s) => s.user ? ({ user: { ...s.user, ministry: undefined } }) : s);
        return;
      }
      setLoading(true);
      try {
        // Ministérios do membro (como voluntário)
        const { data: mins, error: minsErr } = await supabase
          .from('ministerio_voluntarios')
          .select('id, ministerio_id, funcao_no_ministerio')
          .eq('membro_id', user.id)
          .eq('id_igreja', currentChurchId);
        if (minsErr) throw minsErr;
        const volunteerRows: MinistryRow[] = (mins || []) as any;

        // Ministérios onde o usuário é líder
        const { data: leaderMins, error: leaderErr } = await supabase
          .from('ministerios')
          .select('id, nome')
          .eq('id_igreja', currentChurchId)
          .eq('lider_id', user.id);
        if (leaderErr) throw leaderErr;
        const leaderRowsToMerge: MinistryRow[] = (leaderMins || []).map((m: any) => ({
          id: m.id,
          ministerio_id: m.id,
          funcao_no_ministerio: 'lider',
        }));

        // Mescla e remove duplicados
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
        const unique = Array.from(uniqueMap.values());
        setMinistries(unique);

        // Anexar ao perfil
        const ids = unique.map((u) => u.ministerio_id || u.id).filter(Boolean) as string[];
        if (ids.length > 0) {
          const leaderPreferredId = unique.find((u) => (u.funcao_no_ministerio || '').toLowerCase().includes('lider'))?.ministerio_id || unique[0].ministerio_id || unique[0].id;
          const { data: minsInfo } = await supabase
            .from('ministerios')
            .select('id, nome')
            .in('id', ids);
          const primary = (minsInfo || []).find((m: any) => m.id === leaderPreferredId) || (minsInfo || [])[0];
          useAuthStore.setState((s) => s.user ? ({ user: { ...s.user, ministry: primary?.nome || s.user.ministry } }) : s);
        } else {
          useAuthStore.setState((s) => s.user ? ({ user: { ...s.user, ministry: undefined } }) : s);
        }

        // Participações em eventos
        const { data: parts, error: partsErr } = await supabase
          .from('evento_participantes')
          .select('id, evento_id')
          .eq('membro_id', user.id)
          .eq('id_igreja', currentChurchId);
        if (partsErr) throw partsErr;
        const participacoes: ParticipacaoEvento[] = parts || [];
        setEventsTotal(participacoes.length);

        // Próximos eventos
        const eventoIds = participacoes.map(p => p.evento_id).filter(Boolean) as string[];
        if (eventoIds.length > 0) {
          const nowIso = new Date().toISOString();
          const { data: eventos, error: evErr } = await supabase
            .from('eventos')
            .select('id, data_hora')
            .in('id', eventoIds)
            .gt('data_hora', nowIso);
          if (evErr) throw evErr;
          setEventsUpcoming((eventos || []).length);
        } else {
          setEventsUpcoming(0);
        }
      } catch (err: any) {
        console.error('Erro ao carregar status pessoais:', err);
        toast.error('Não foi possível carregar seus status agora.');
        setMinistries([]);
        setEventsTotal(0);
        setEventsUpcoming(0);
      } finally {
        setLoading(false);
      }
    };

    // Debounce e bloqueio de reentradas
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(async () => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      try {
        await load();
      } finally {
        isFetchingRef.current = false;
      }
    }, 150);

    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [user?.id, currentChurchId]);

  // Realtime: atualizar quando o usuário inscrever/cancelar
  useEffect(() => {
    if (!user?.id || !currentChurchId) return;
    
    // Fecha canal anterior antes de abrir outro
    if (channelRef.current) {
      try { supabase.removeChannel(channelRef.current); } catch {}
      channelRef.current = null;
    }
    
    const channel = supabase
      .channel(`my-event-registrations-${user.id}-${currentChurchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'evento_participantes', filter: `membro_id=eq.${user.id}` },
        () => {
          // Recarregar apenas a parte de eventos
          (async () => {
            try {
              const { data: parts } = await supabase
                .from('evento_participantes')
                .select('id, evento_id')
                .eq('membro_id', user.id)
                .eq('id_igreja', currentChurchId);
              const participacoes: ParticipacaoEvento[] = parts || [];
              setEventsTotal(participacoes.length);
              const eventoIds = participacoes.map(p => p.evento_id).filter(Boolean) as string[];
              if (eventoIds.length > 0) {
                const nowIso = new Date().toISOString();
                const { data: eventos } = await supabase
                  .from('eventos')
                  .select('id, data_hora')
                  .in('id', eventoIds)
                  .gt('data_hora', nowIso);
                setEventsUpcoming((eventos || []).length);
              } else {
                setEventsUpcoming(0);
              }
            } catch {
              // silencioso; manter UX suave
            }
          })();
        }
      )
      .subscribe();
    channelRef.current = channel;

    return () => {
      try {
        if (channelRef.current) supabase.removeChannel(channelRef.current);
      } finally {
        channelRef.current = null;
      }
    };
  }, [user?.id, currentChurchId]);

  const ministryCount = ministries.length;
  const leaderActive = isGlobalLeader || isLeaderSomeMinistry;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Jornada */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-5 w-5 text-purple-500" />
            Jornada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground mb-2">
            {trilhaInfo ? trilhaInfo.titulo : 'Nenhuma trilha ativa'}
          </div>
          <div className="flex items-center justify-between mb-2 text-sm">
            <span>Progresso</span>
            <span className="font-semibold">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} />
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>Nível atual: <span className="font-medium text-foreground">{currentLevel}</span></span>
            <span>Passos: <span className="font-medium text-foreground">{completedSteps}/{totalSteps}</span></span>
          </div>
        </CardContent>
      </Card>

      {/* Ministérios */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-5 w-5 text-blue-500" />
            Ministérios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{loading ? '—' : ministryCount}</div>
          <div className="text-sm text-muted-foreground mt-1">
            {ministryCount === 0 ? 'Nenhuma participação' : 'Participações ativas'}
          </div>
        </CardContent>
      </Card>

      {/* Liderança */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-5 w-5 text-emerald-500" />
            Liderança
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-3xl font-bold ${leaderActive ? 'text-emerald-600' : ''}`}>
            {leaderActive ? 'Sim' : 'Não'}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {leaderActive ? 'Exerce função de liderança' : 'Sem papel de liderança'}
          </div>
        </CardContent>
      </Card>

      {/* Eventos */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-5 w-5 text-orange-500" />
            Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{loading ? '—' : eventsTotal}</div>
          <div className="text-sm text-muted-foreground mt-1">
            {eventsUpcoming > 0 ? `${eventsUpcoming} próximos` : 'Sem próximos eventos'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PersonalStatusCards;