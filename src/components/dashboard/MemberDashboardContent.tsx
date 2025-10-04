import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Calendar, BookOpen, Heart, Clock, CheckCircle, ArrowRight, Play, Eye, Target } from 'lucide-react';
import { useJourneyData } from '../../hooks/useJourneyData';
import { Skeleton } from '../ui/skeleton';
import { Link } from 'react-router-dom';
import { useRecentEvents } from '../../hooks/useRecentEvents';
import { useRecentDevotionals } from '../../hooks/useRecentDevotionals';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MemberDashboardContent = () => {
  const { loading, overallProgress, completedSteps, totalSteps, etapas } = useJourneyData();
  const { data: recentEvents, isLoading: loadingEvents } = useRecentEvents();
  const { data: recentDevotionals, isLoading: loadingDevotionals } = useRecentDevotionals();

  // Cursos disponíveis
  const availableCourses = [
    {
      title: 'Fundamentos da Fé',
      description: 'Curso básico para novos convertidos',
      duration: '4 semanas',
      students: 25,
      progress: 0,
    },
    {
      title: 'Liderança Cristã',
      description: 'Desenvolvimento de líderes',
      duration: '8 semanas',
      students: 15,
      progress: 60,
    },
    {
      title: 'Evangelismo Pessoal',
      description: 'Como compartilhar sua fé',
      duration: '6 semanas',
      students: 30,
      progress: 0,
    },
  ];

  // Status da jornada espiritual - REMOVIDO O MOCK
  const journeySteps = etapas.flatMap(etapa => etapa.passos).map((passo, index) => ({
    title: passo.titulo,
    completed: passo.completed,
    current: !passo.completed && (etapas.flatMap(e => e.passos).findIndex(p => !p.completed) === index),
  }));

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cursos Disponíveis */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              Cursos Disponíveis
            </CardTitle>
            <CardDescription>Continue seu crescimento espiritual</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {availableCourses.map((course, index) => (
              <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{course.title}</h3>
                  <p className="text-sm text-gray-600 truncate">{course.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                    <span>{course.duration}</span>
                    <span>{course.students} alunos</span>
                  </div>
                  {course.progress > 0 && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Progresso</span>
                        <span>{course.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1">
                        <div
                          className="bg-blue-500 h-1 rounded-full"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <Button size="sm" className="shrink-0">
                  {course.progress > 0 ? (
                    <>
                      <Play className="w-3 h-3 mr-1" />
                      Continuar
                    </>
                  ) : (
                    'Iniciar'
                  )}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Status da Jornada */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-500" />
              Sua Jornada Espiritual
            </CardTitle>
            <CardDescription>Acompanhe seu crescimento na fé</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                <div className="flex justify-center items-center flex-col">
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-4 w-full" />
                <div className="space-y-3">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-2/3" />
                </div>
                <Skeleton className="h-10 w-full" />
              </div>
            ) : totalSteps > 0 ? (
              <>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    {Math.round(overallProgress)}%
                  </div>
                  <p className="text-sm text-gray-600">
                    {completedSteps} de {totalSteps} passos concluídos
                  </p>
                </div>

                <div className="space-y-3">
                  {journeySteps.slice(0, 5).map((step, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          step.completed
                            ? 'bg-green-500 text-white'
                            : step.current
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-400'
                        }`}
                      >
                        {step.completed ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <span className="text-xs font-bold">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`text-sm font-medium ${
                            step.completed ? 'text-gray-500 line-through' : step.current ? 'text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          {step.title}
                        </p>
                        {step.current && <p className="text-xs text-blue-600">Próximo passo</p>}
                      </div>
                    </div>
                  ))}
                </div>

                <Button asChild className="w-full bg-green-500 hover:bg-green-600">
                  <Link to="/dashboard?tab=jornada">
                    <Target className="w-4 h-4 mr-2" />
                    Continuar Jornada
                  </Link>
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">Sua jornada espiritual ainda não foi iniciada. Fale com a liderança da sua igreja.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximos Eventos */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" />
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
            ) : (
              (recentEvents || []).map((event) => {
                const dt = event.data_hora ? new Date(event.data_hora) : null;
                const dateStr = dt ? format(dt, "dd MMM", { locale: ptBR }) : '';
                const timeStr = dt ? format(dt, "HH:mm") : '';
                return (
                  <div key={event.id} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <p className="text-sm font-bold text-purple-700">{dateStr}</p>
                        <p className="text-xs text-purple-600">{timeStr}</p>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{event.nome}</p>
                        <p className="text-xs text-gray-600">{event.tipo || 'Evento'}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost">
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })
            )}
            <Button variant="outline" className="w-full">
              Ver Todos os Eventos
            </Button>
          </CardContent>
        </Card>

        {/* Devocionais Recentes */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-500" />
              Devocionais Recentes
            </CardTitle>
            <CardDescription>Três mais recentes publicados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingDevotionals ? (
              <div className="space-y-3">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : (
              (recentDevotionals || []).map((devotional) => {
                const dt = devotional.data_publicacao ? new Date(devotional.data_publicacao) : null;
                const dateStr = dt ? format(dt, "dd MMM", { locale: ptBR }) : '';
                const readStr = devotional.tempo_leitura ? `${devotional.tempo_leitura} min` : '—';
                return (
                  <div key={devotional.id} className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
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
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })
            )}
            <Button variant="outline" className="w-full">
              Ver Todos os Devocionais
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default MemberDashboardContent;