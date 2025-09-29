import { useAuthStore } from '../../stores/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { 
  Calendar, 
  BookOpen,
  Heart,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight,
  Play,
  Eye,
  Star,
  Award,
  Target,
  Users,
  DollarSign
} from 'lucide-react'

const DashboardHome = () => {
  const { user } = useAuthStore()

  if (!user) return null

  const isAdminOrPastor = user.role === 'admin' || user.role === 'pastor'
  const isFinancialRole = user.role === 'admin' || user.role === 'pastor' || user.role === 'financeiro'

  // Stats adaptados por tipo de usuário
  const getUserStats = () => {
    if (isAdminOrPastor) {
      return [
        {
          title: 'Membros Ativos',
          value: '127',
          change: '+5 novos membros',
          icon: <Users className="w-5 h-5" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50'
        },
        {
          title: 'Eventos Próximos',
          value: '3',
          change: '+2 esta semana',
          icon: <Calendar className="w-5 h-5" />,
          color: 'text-green-600',
          bgColor: 'bg-green-50'
        },
        {
          title: 'Cursos em Andamento',
          value: '2',
          change: '1 finalizado',
          icon: <BookOpen className="w-5 h-5" />,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50'
        },
        ...(isFinancialRole ? [{
          title: 'Ofertas do Mês',
          value: 'R$ 2.450',
          change: '+15% vs mês anterior',
          icon: <DollarSign className="w-5 h-5" />,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50'
        }] : [{
          title: 'Ministérios Ativos',
          value: '8',
          change: 'Todos funcionando',
          icon: <Heart className="w-5 h-5" />,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50'
        }])
      ]
    } else {
      return [
        {
          title: 'Cursos Disponíveis',
          value: '12',
          change: '3 novos cursos',
          icon: <BookOpen className="w-5 h-5" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50'
        },
        {
          title: 'Próximos Eventos',
          value: '4',
          change: 'Esta semana',
          icon: <Calendar className="w-5 h-5" />,
          color: 'text-green-600',
          bgColor: 'bg-green-50'
        },
        {
          title: 'Devocionais',
          value: '25',
          change: 'Novos este mês',
          icon: <Heart className="w-5 h-5" />,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50'
        },
        {
          title: 'Jornada Espiritual',
          value: '75%',
          change: 'Progresso atual',
          icon: <TrendingUp className="w-5 h-5" />,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50'
        }
      ]
    }
  }

  const stats = getUserStats()

  // Quick actions adaptadas por tipo de usuário
  const getUserQuickActions = () => {
    if (isAdminOrPastor) {
      return [
        {
          title: 'Novo Evento',
          description: 'Criar um novo evento para a igreja',
          icon: <Calendar className="w-5 h-5" />,
          color: 'bg-blue-500 hover:bg-blue-600'
        },
        {
          title: 'Ver Membros',
          description: 'Visualizar lista de membros',
          icon: <Eye className="w-5 h-5" />,
          color: 'bg-green-500 hover:bg-green-600'
        },
        {
          title: 'Relatório Financeiro',
          description: 'Gerar relatório mensal',
          icon: <TrendingUp className="w-5 h-5" />,
          color: 'bg-purple-500 hover:bg-purple-600'
        }
      ]
    } else {
      return [
        {
          title: 'Ver Cursos',
          description: 'Acesse os cursos disponíveis',
          icon: <BookOpen className="w-5 h-5" />,
          color: 'bg-blue-500 hover:bg-blue-600'
        },
        {
          title: 'Próximos Eventos',
          description: 'Veja eventos da igreja',
          icon: <Calendar className="w-5 h-5" />,
          color: 'bg-green-500 hover:bg-green-600'
        },
        {
          title: 'Ler Devocionais',
          description: 'Alimento espiritual diário',
          icon: <Heart className="w-5 h-5" />,
          color: 'bg-purple-500 hover:bg-purple-600'
        }
      ]
    }
  }

  const quickActions = getUserQuickActions()

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  // Cursos disponíveis
  const availableCourses = [
    {
      title: 'Fundamentos da Fé',
      description: 'Curso básico para novos convertidos',
      duration: '4 semanas',
      students: 25,
      progress: 0
    },
    {
      title: 'Liderança Cristã',
      description: 'Desenvolvimento de líderes',
      duration: '8 semanas',
      students: 15,
      progress: 60
    },
    {
      title: 'Evangelismo Pessoal',
      description: 'Como compartilhar sua fé',
      duration: '6 semanas',
      students: 30,
      progress: 0
    }
  ]

  // Próximos eventos
  const upcomingEvents = [
    {
      title: 'Culto de Domingo',
      date: '15 Set',
      time: '19:00',
      type: 'Culto'
    },
    {
      title: 'Estudo Bíblico',
      date: '17 Set',
      time: '20:00',
      type: 'Ensino'
    },
    {
      title: 'Conferência de Avivamento',
      date: '20 Set',
      time: '19:30',
      type: 'Evento Especial'
    }
  ]

  // Devocionais recentes
  const recentDevotionals = [
    {
      title: 'A Força do Perdão',
      author: 'Pastor João',
      date: '11 Set',
      readTime: '3 min'
    },
    {
      title: 'Caminhando pela Fé',
      author: 'Pastora Maria',
      date: '10 Set',
      readTime: '2 min'
    },
    {
      title: 'O Poder da Gratidão',
      author: 'Líder Pedro',
      date: '09 Set',
      readTime: '4 min'
    }
  ]

  // Status da jornada espiritual (apenas para membros)
  const journeySteps = [
    { title: 'Decisão por Cristo', completed: true },
    { title: 'Batismo', completed: true },
    { title: 'Curso de Discipulado', completed: false, current: true },
    { title: 'Teste Vocacional', completed: false },
    { title: 'Ministério Ativo', completed: false },
    { title: 'Liderança', completed: false }
  ]

  const completedSteps = journeySteps.filter(step => step.completed).length
  const journeyProgress = (completedSteps / journeySteps.length) * 100

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl md:rounded-2xl p-4 md:p-6 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          {getGreeting()}, {user.name}! 👋
        </h1>
        <p className="text-blue-100 text-base md:text-lg">
          Bem-vindo ao seu painel de controle do Connect Vida
        </p>
        {user.church && (
          <p className="text-blue-200 mt-2 text-sm md:text-base">
            📍 {user.church}
            {user.ministry && ` • ${user.ministry}`}
          </p>
        )}
        <Badge className="bg-white/20 text-white border-white/30 mt-3">
          <Star className="w-3 h-3 mr-1" />
          Sistema Beta - Modo Demonstração
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-3 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-600 truncate">{stat.title}</p>
                  <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-1 truncate">{stat.change}</p>
                </div>
                <div className={`w-8 h-8 md:w-12 md:h-12 ${stat.bgColor} rounded-lg flex items-center justify-center ml-2`}>
                  <span className={stat.color}>{stat.icon}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Ações Rápidas
          </CardTitle>
          <CardDescription>
            Acesse rapidamente as principais funcionalidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start h-auto p-4 hover:bg-gray-50"
              >
                <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center text-white mr-3`}>
                  {action.icon}
                </div>
                <div className="text-left flex-1">
                  <p className="font-medium">{action.title}</p>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid - Para usuários não admin/pastor */}
      {!isAdminOrPastor && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cursos Disponíveis */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                Cursos Disponíveis
              </CardTitle>
              <CardDescription>
                Continue seu crescimento espiritual
              </CardDescription>
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
                      <><Play className="w-3 h-3 mr-1" />Continuar</>
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
              <CardDescription>
                Acompanhe seu crescimento na fé
              </CardDescription>
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
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      step.completed 
                        ? 'bg-green-500 text-white' 
                        : step.current 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      {step.completed ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <span className="text-xs font-bold">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        step.completed ? 'text-green-700' : step.current ? 'text-blue-700' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </p>
                      {step.current && (
                        <p className="text-xs text-blue-600">Etapa atual</p>
                      )}
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
      )}

      {/* Eventos e Devocionais - Para usuários não admin/pastor */}
      {!isAdminOrPastor && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Próximos Eventos */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-500" />
                Próximos Eventos
              </CardTitle>
              <CardDescription>
                Não perca os eventos da igreja
              </CardDescription>
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
              <CardDescription>
                Alimento espiritual diário
              </CardDescription>
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
      )}

      {/* Conteúdo para Admin e Pastor */}
      {isAdminOrPastor && (
        <>
          {/* Activities e Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activities */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  Atividades Recentes
                </CardTitle>
                <CardDescription>
                  Últimas atualizações do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { title: 'Novo membro cadastrado', description: 'Maria Silva se juntou à igreja', time: '2 horas atrás' },
                  { title: 'Evento atualizado', description: 'Culto de Louvor - Domingo 15/09', time: '4 horas atrás' },
                  { title: 'Doação recebida', description: 'Oferta de R$ 250,00 via PIX', time: '1 dia atrás' }
                ].map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{activity.title}</p>
                      <p className="text-xs text-gray-600">{activity.description}</p>
                      <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Upcoming Events */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-500" />
                  Próximos Eventos
                </CardTitle>
                <CardDescription>
                  Eventos programados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {upcomingEvents.map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <p className="text-sm font-bold text-green-700">{event.date}</p>
                        <p className="text-xs text-green-600">{event.time}</p>
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

          {/* Notifications */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>Alertas e lembretes importantes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium">Reunião de Liderança</p>
                    <p className="text-xs text-gray-600">Amanhã às 19:00</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Aniversário de Membro</p>
                    <p className="text-xs text-gray-600">3 aniversários esta semana</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

export default DashboardHome