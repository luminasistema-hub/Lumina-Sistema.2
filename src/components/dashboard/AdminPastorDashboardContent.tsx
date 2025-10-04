import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { useRecentEvents } from '../../hooks/useRecentEvents';
import { useRecentDevotionals } from '../../hooks/useRecentDevotionals';
import { Skeleton } from '../ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const AdminPastorDashboardContent = () => {
  const { data: recentEvents, isLoading: loadingEvents } = useRecentEvents();
  const { data: recentDevotionals, isLoading: loadingDevotionals } = useRecentDevotionals();

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              Atividades Recentes
            </CardTitle>
            <CardDescription>Últimas atualizações do sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
              <div className="flex-1">
                <p className="font-medium text-sm">Eventos e devocionais são mostrados abaixo com dados reais.</p>
                <p className="text-xs text-gray-600">Blocos estáticos foram removidos para refletir o sistema.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-500" />
              Últimos Eventos
            </CardTitle>
            <CardDescription>Três mais recentes cadastrados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingEvents ? (
              <div className="space-y-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : (recentEvents || []).map((event, index) => {
              const dt = event.data_hora ? new Date(event.data_hora) : null;
              const dateStr = dt ? format(dt, "dd MMM", { locale: ptBR }) : '';
              const timeStr = dt ? format(dt, "HH:mm") : '';
              return (
                <div key={event.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-sm font-bold text-green-700">{dateStr}</p>
                      <p className="text-xs text-green-600">{timeStr}</p>
                    </div>
                    <div>
                      <p className="font-medium text-sm">{event.nome}</p>
                      <p className="text-xs text-gray-600">{event.tipo || 'Evento'}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" aria-label={`Ver evento ${index + 1}`}>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Progress */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Progresso Mensal</CardTitle>
            <CardDescription>Metas e objetivos da igreja</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Membros Ativos</span>
                  <span>85%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '85%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Meta Financeira</span>
                  <span>72%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '72%' }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Devocionais Recentes */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>Últimos Devocionais</CardTitle>
          <CardDescription>Três mais recentes publicados</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingDevotionals ? (
            <div className="space-y-3">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : (
            <div className="space-y-3">
              {(recentDevotionals || []).map((devotional) => {
                const dt = devotional.data_publicacao ? new Date(devotional.data_publicacao) : null;
                const dateStr = dt ? format(dt, "dd MMM", { locale: ptBR }) : '';
                const readStr = devotional.tempo_leitura ? `${devotional.tempo_leitura} min` : '—';
                return (
                  <div key={devotional.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{devotional.titulo}</h3>
                      <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                        <span>Por {devotional.membros?.nome_completo || 'Autor'}</span>
                        <span>•</span>
                        <span>{dateStr}</span>
                        <span>•</span>
                        <span>{readStr}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default AdminPastorDashboardContent;