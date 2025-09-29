import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Calendar, BookOpen, Heart, TrendingUp, Clock, CheckCircle, ArrowRight, Play, Eye, Target } from 'lucide-react';

const MemberDashboardContent = () => {
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

  // Próximos eventos
  const upcomingEvents = [
    {
      title: 'Culto de Domingo',
      date: '15 Set',
      time: '19:00',
      type: 'Culto',
    },
    {
      title: 'Estudo Bíblico',
      date: '17 Set',
      time: '20:00',
      type: 'Ensino',
    },
    {
      title: 'Conferência de Avivamento',
      date: '20 Set',
      time: '19:30',
      type: 'Evento Especial',
    },
  ];

  // Devocionais recentes
  const recentDevotionals = [
    {
      title: 'A Força do Perdão',
      author: 'Pastor João',
      date: '11 Set',
      readTime: '3 min',
    },
    {
      title: 'Caminhando pela Fé',
      author: 'Pastora Maria',
      date: '10 Set',
      readTime: '2 min',
    },
    {
      title: 'O Poder da Gratidão',
      author: 'Líder Pedro',
      date: '09 Set',
      readTime: '4 min',
    },
  ];

  // Status da jornada espiritual
  const journeySteps = [
    { title: 'Decisão por Cristo', completed: true },
    { title: 'Batismo', completed: true },
    { title: 'Curso de Discipulado', completed: false, current: true },
    { title: 'Teste Vocacional', completed: false },
    { title: 'Ministério Ativo', completed: false },
    { title: 'Liderança', completed: false },
  ];

  const completedSteps = journeySteps.filter((step) => step.completed).length;
  const journeyProgress = (completedSteps / journeySteps.length) * 100;

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
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {Math.round(journeyProgress)}%
              </div>
              <p className="text-sm text-gray-600">
                {completedSteps} de {journeySteps.length} etapas concluídas
              </p>
            </div>

            <div className="space-y-3">
              {journeySteps.map((step, index) => (
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
                        step.completed ? 'text-green-700' : step.current ? 'text-blue-700' : 'text-gray-500'
                      }`}
                    >
                      {step.title}
                    </p>
                    {step.current && <p className="text-xs text-blue-600">Etapa atual</p>}
                  </div>
                </div>
              ))}
            </div>

            <Button className="w-full bg-green-500 hover:bg-green-600">
              <Target className="w-4 h-4 mr-2" />
              Continuar Jornada
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximos Eventos */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-purple-500" />
              Próximos Eventos
            </CardTitle>
            <CardDescription>Não perca os eventos da igreja</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-sm font-bold text-purple-700">{event.date}</p>
                    <p className="text-xs text-purple-600">{event.time}</p>
                  </div>
                  <div>
                    <p className="font-medium text-sm">{event.title}</p>
                    <p className="text-xs text-gray-600">{event.type}</p>
                  </div>
                </div>
                <Button size="sm" variant="ghost">
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            ))}
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
            <CardDescription>Alimento espiritual diário</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentDevotionals.map((devotional, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{devotional.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
                    <span>Por {devotional.author}</span>
                    <span>•</span>
                    <span>{devotional.date}</span>
                    <span>•</span>
                    <span>{devotional.readTime}</span>
                  </div>
                </div>
                <Button size="sm" variant="ghost">
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            ))}
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