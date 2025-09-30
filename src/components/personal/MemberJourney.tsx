import { useState, useEffect } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { toast } from 'sonner' 
import { 
  Heart, 
  Droplets, 
  BookOpen, 
  Users, 
  Crown,
  CheckCircle,
  Circle,
  ArrowRight,
  Calendar,
  Award,
  Target
} from 'lucide-react'

interface JourneyStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  completed: boolean
  completedDate?: string
  requirements?: string[]
  nextSteps?: string[]
  color: string
  bgColor: string
}

const MemberJourney = () => {
  const { user, currentChurchId } = useAuthStore() 
  const [journeySteps, setJourneySteps] = useState<JourneyStep[]>([
    {
      id: 'decisao',
      title: 'Decisão por Cristo',
      description: 'O primeiro passo da sua jornada espiritual - aceitar Jesus como Salvador',
      icon: <Heart className="w-6 h-6" />,
      completed: false, 
      completedDate: undefined,
      color: 'text-red-600',
      bgColor: 'bg-red-50 border-red-200',
      requirements: [
        'Reconhecer a necessidade de salvação',
        'Aceitar Jesus como Salvador pessoal',
        'Começar uma vida de fé'
      ]
    },
    {
      id: 'frequencia',
      title: 'Frequência Regular',
      description: 'Participar regularmente dos cultos e atividades da igreja',
      icon: <Calendar className="w-6 h-6" />,
      completed: false,
      completedDate: undefined,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 border-blue-200',
      requirements: [
        'Frequentar cultos regularmente',
        'Participar de pelo menos 1 atividade semanal',
        'Demonstrar compromisso com a comunidade'
      ]
    },
    {
      id: 'batismo',
      title: 'Batismo nas Águas',
      description: 'Demonstração pública da sua fé através do batismo',
      icon: <Droplets className="w-6 h-6" />,
      completed: false,
      completedDate: undefined,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50 border-cyan-200',
      requirements: [
        'Completar o curso de batismo',
        'Ter uma declaração de fé clara',
        'Passar pela entrevista pastoral'
      ]
    },
    {
      id: 'discipulado',
      title: 'Curso de Discipulado',
      description: 'Crescimento espiritual através do estudo sistemático da Palavra',
      icon: <BookOpen className="w-6 h-6" />,
      completed: false,
      color: 'text-green-600',
      bgColor: 'bg-green-50 border-green-200',
      requirements: [
        'Participar do curso básico de discipulado',
        'Demonstrar crescimento espiritual',
        'Desenvolver disciplinas cristãs'
      ],
      nextSteps: [
        'Inscrever-se no próximo curso de discipulado',
        'Começar leitura bíblica diária',
        'Participar de grupo de estudo'
      ]
    },
    {
      id: 'servico',
      title: 'Início no Ministério',
      description: 'Descobrir e usar seus dons servindo no ministério adequado',
      icon: <Users className="w-6 h-6" />,
      completed: false,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 border-purple-200',
      requirements: [
        'Realizar teste vocacional',
        'Completar curso de discipulado',
        'Demonstrar maturidade espiritual'
      ],
      nextSteps: [
        'Fazer o teste vocacional',
        'Conversar com líder do ministério de interesse',
        'Participar como voluntário'
      ]
    },
    {
      id: 'lideranca',
      title: 'Desenvolvimento da Liderança',
      description: 'Crescer como líder e influenciar positivamente outros membros',
      icon: <Crown className="w-6 h-6" />,
      completed: false,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 border-amber-200',
      requirements: [
        'Experiência comprovada no ministério',
        'Curso de liderança cristã',
        'Aprovação da liderança pastoral',
        'Demonstrar frutos ministeriais'
      ],
      nextSteps: [
        'Participar do curso de liderança',
        'Buscar mentoria com líder experiente',
        'Desenvolver projeto ministerial'
      ]
    }
  ])

  const [currentLevel, setCurrentLevel] = useState(0)
  const [overallProgress, setOverallProgress] = useState(0)

  useEffect(() => {
    if (user && currentChurchId) {
      const storedJourney = localStorage.getItem(`memberJourney-${user.id}-${currentChurchId}`)
      if (storedJourney) {
        setJourneySteps(JSON.parse(storedJourney))
      }
    }
  }, [user, currentChurchId])

  useEffect(() => {
    const completedSteps = journeySteps.filter(step => step.completed).length
    const totalSteps = journeySteps.length
    const progress = (completedSteps / totalSteps) * 100
    
    setOverallProgress(progress)
    setCurrentLevel(completedSteps)

    if (user && currentChurchId) {
      localStorage.setItem(`memberJourney-${user.id}-${currentChurchId}`, JSON.stringify(journeySteps))
    }
  }, [journeySteps, user, currentChurchId])

  const markStepCompleted = (stepId: string) => {
    setJourneySteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, completed: true, completedDate: new Date().toISOString().split('T')[0] }
        : step
    ))
    toast.success('Etapa concluída com sucesso!')
  }

  const getProgressColor = () => {
    if (overallProgress < 33) return 'bg-red-500'
    if (overallProgress < 66) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getLevelTitle = () => {
    if (currentLevel <= 1) return 'Novo na Fé'
    if (currentLevel <= 3) return 'Membro Comprometido'
    if (currentLevel <= 4) return 'Servo Ativo'
    return 'Líder em Desenvolvimento'
  }

  const getLevelDescription = () => {
    if (currentLevel <= 1) return 'Você está começando sua jornada cristã. Continue firme!'
    if (currentLevel <= 3) return 'Você demonstra compromisso com sua fé e igreja.'
    if (currentLevel <= 4) return 'Você está servindo ativamente no Reino de Deus.'
    return 'Você está se desenvolvendo como líder cristão.'
  }

  if (!currentChurchId) {
    return (
      <div className="p-6 text-center text-gray-600">
        Selecione uma igreja para visualizar sua jornada espiritual.
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Jornada do Membro 🎯</h1>
        <p className="text-blue-100 text-lg">
          Acompanhe seu crescimento espiritual e ministerial
        </p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Seu Nível Atual</CardTitle>
              <CardDescription className="text-lg mt-1">{getLevelDescription()}</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{currentLevel}/6</div>
              <Badge className={`${getProgressColor()} text-white text-sm px-3 py-1`}>
                {getLevelTitle()}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Progresso Geral</span>
              <span className="font-medium">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
            <p className="text-sm text-gray-600">
              {journeySteps.filter(s => s.completed).length} de {journeySteps.length} etapas concluídas
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Etapas da Jornada</h2>
        
        {journeySteps.map((step, index) => (
          <Card 
            key={step.id} 
            className={`relative ${step.bgColor} ${step.completed ? 'ring-2 ring-green-200' : ''}`}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full ${step.completed ? 'bg-green-100' : 'bg-white'} border-2 ${step.completed ? 'border-green-500' : 'border-gray-300'} flex items-center justify-center ${step.color}`}>
                    {step.completed ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  {index < journeySteps.length - 1 && (
                    <div className={`w-0.5 h-16 mt-2 ${step.completed ? 'bg-green-300' : 'bg-gray-300'}`}></div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{step.title}</h3>
                    <div className="flex items-center gap-2">
                      {step.completed && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Concluído
                        </Badge>
                      )}
                      {step.completedDate && (
                        <Badge variant="outline" className="text-xs">
                          {new Date(step.completedDate).toLocaleDateString('pt-BR')}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4">{step.description}</p>

                  {step.requirements && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Requisitos:</h4>
                      <ul className="space-y-1">
                        {step.requirements.map((req, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {step.nextSteps && !step.completed && (
                    <div className="bg-white/70 rounded-lg p-4 border border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Próximos Passos:
                      </h4>
                      <ul className="space-y-1">
                        {step.nextSteps.map((nextStep, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                            <ArrowRight className="w-3 h-3 text-blue-500" />
                            {nextStep}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                          Começar Agora
                        </Button>
                        {!step.completed && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => markStepCompleted(step.id)}
                          >
                            Marcar como Concluído
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {step.completed && (
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <div className="flex items-center gap-2 text-green-800">
                        <Award className="w-4 h-4" />
                        <span className="text-sm font-medium">Parabéns! Você concluiu esta etapa da sua jornada cristã.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Continue Crescendo! 🌱</h3>
            <p className="text-gray-700 mb-4">
              Cada passo na sua jornada espiritual é importante. Deus tem um plano maravilhoso para sua vida e ministério.
            </p>
            <div className="flex justify-center gap-3">
              <Button className="bg-green-500 hover:bg-green-600">
                Ver Cursos Disponíveis
              </Button>
              <Button variant="outline">
                Conversar com um Líder
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default MemberJourney