import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { useJourneyData } from '@/hooks/useJourneyData';
import { useAuthStore } from '@/stores/authStore';
import { Target, Users, Shield, CalendarDays, Loader2 } from 'lucide-react';
import { usePersonalStats } from '@/hooks/usePersonalStats';

const PersonalStatusCards: React.FC = () => {
  const { user } = useAuthStore();
  const { overallProgress, completedSteps, totalSteps, currentLevel, trilhaInfo } = useJourneyData();
  const { data: stats, isLoading: isLoadingStats } = usePersonalStats();

  const isGlobalLeader = useMemo(() => {
    const role = user?.role;
    return role === 'lider_ministerio' || role === 'pastor' || role === 'admin' || role === 'super_admin';
  }, [user?.role]);

  const leaderActive = isGlobalLeader || (stats?.isLeaderSomeMinistry ?? false);

  const renderLoadingCard = (title: string, icon: React.ReactNode) => (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        <div className="text-sm text-muted-foreground mt-1">
          Carregando...
        </div>
      </CardContent>
    </Card>
  );

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
      {isLoadingStats ? (
        renderLoadingCard('Ministérios', <Users className="h-5 w-5 text-blue-500" />)
      ) : (
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-blue-500" />
              Ministérios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.ministryCount ?? '—'}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {(stats?.ministryCount ?? 0) === 0 ? 'Nenhuma participação' : 'Participações ativas'}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liderança */}
      {isLoadingStats ? (
        renderLoadingCard('Liderança', <Shield className="h-5 w-5 text-emerald-500" />)
      ) : (
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
      )}

      {/* Eventos */}
      {isLoadingStats ? (
        renderLoadingCard('Eventos', <CalendarDays className="h-5 w-5 text-orange-500" />)
      ) : (
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-5 w-5 text-orange-500" />
              Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.eventsTotal ?? '—'}</div>
            <div className="text-sm text-muted-foreground mt-1">
              {(stats?.eventsUpcoming ?? 0) > 0 ? `${stats?.eventsUpcoming} próximos` : 'Sem próximos eventos'}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PersonalStatusCards;