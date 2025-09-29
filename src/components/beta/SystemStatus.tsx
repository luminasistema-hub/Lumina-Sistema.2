import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  Users, 
  BookOpen, 
  Calendar, 
  DollarSign,
  Heart,
  TestTube,
  Baby,
  Church,
  Settings,
  Mic
} from 'lucide-react'

const SystemStatus = () => {
  const modules = [
    {
      name: 'Autenticação e Usuários',
      icon: <Users className="w-4 h-4" />,
      progress: 100,
      status: 'Completo',
      color: 'green',
      features: ['8 tipos de usuário', 'Sistema de permissões', 'Login seguro']
    },
    {
      name: 'Área Pessoal',
      icon: <Heart className="w-4 h-4" />,
      progress: 100,
      status: 'Completo',
      color: 'green',
      features: ['Informações pessoais', 'Jornada do membro', 'Perfil completo']
    },
    {
      name: 'Teste Vocacional',
      icon: <TestTube className="w-4 h-4" />,
      progress: 100,
      status: 'Completo',
      color: 'green',
      features: ['40 perguntas', '8 ministérios', 'Resultado automático']
    },
    {
      name: 'Crescimento Espiritual',
      icon: <BookOpen className="w-4 h-4" />,
      progress: 100,
      status: 'Completo',
      color: 'green',
      features: ['Eventos', 'Cursos EAD', 'Devocionais']
    },
    {
      name: 'Sistema Financeiro',
      icon: <DollarSign className="w-4 h-4" />,
      progress: 100,
      status: 'Completo',
      color: 'green',
      features: ['Transações', 'Orçamentos', 'Relatórios', 'Metas']
    },
    {
      name: 'Gestão de Eventos',
      icon: <Calendar className="w-4 h-4" />,
      progress: 100,
      status: 'Completo',
      color: 'green',
      features: ['Criação de eventos', 'Inscrições', 'Controle de presença']
    },
    {
      name: 'Módulo Kids',
      icon: <Baby className="w-4 h-4" />,
      progress: 100,
      status: 'Completo',
      color: 'green',
      features: ['Cadastro de crianças', 'Check-in seguro', 'Informações médicas']
    },
    {
      name: 'Gestão de Membros',
      icon: <Church className="w-4 h-4" />,
      progress: 100,
      status: 'Completo',
      color: 'green',
      features: ['CRUD completo', 'Relatórios', 'Histórico espiritual']
    },
    {
      name: 'Gestão de Ministérios',
      icon: <Users className="w-4 h-4" />,
      progress: 100,
      status: 'Completo',
      color: 'green',
      features: ['Criação de ministérios', 'Escalas', 'Voluntários']
    },
    {
      name: 'Mídia e Transmissão',
      icon: <Mic className="w-4 h-4" />,
      progress: 85,
      status: 'Em Desenvolvimento',
      color: 'yellow',
      features: ['Estrutura criada', 'Interface preparada', 'Integração pendente']
    },
    {
      name: 'Configurações Avançadas',
      icon: <Settings className="w-4 h-4" />,
      progress: 75,
      status: 'Básico',
      color: 'blue',
      features: ['Configurações básicas', 'Gestão de site em dev', 'Backups automáticos']
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completo': return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'Em Desenvolvimento': return <Clock className="w-4 h-4 text-yellow-600" />
      case 'Básico': return <AlertTriangle className="w-4 h-4 text-blue-600" />
      default: return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'bg-green-500'
    if (progress >= 85) return 'bg-yellow-500'
    if (progress >= 75) return 'bg-blue-500'
    return 'bg-gray-500'
  }

  const overallProgress = Math.round(modules.reduce((sum, module) => sum + module.progress, 0) / modules.length)

  return (
    <div className="p-6 space-y-6">
      <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <CheckCircle className="w-6 h-6 text-green-600" />
            Status do Sistema Connect Vida - Beta
          </CardTitle>
          <CardDescription className="text-lg">
            Sistema de gestão eclesiástica completo em modo demonstração
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-3xl font-bold text-green-600 mb-1">{overallProgress}%</div>
              <div className="text-sm text-gray-600">Progresso Geral</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {modules.filter(m => m.status === 'Completo').length}
              </div>
              <div className="text-sm text-gray-600">Módulos Completos</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-3xl font-bold text-purple-600 mb-1">8</div>
              <div className="text-sm text-gray-600">Tipos de Usuário</div>
            </div>
          </div>
          
          <Progress value={overallProgress} className="h-3 mb-4" />
          <p className="text-center text-sm text-gray-600">
            Sistema pronto para demonstração e testes beta
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map((module, index) => (
          <Card key={index} className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {module.icon}
                  <h3 className="font-medium text-sm">{module.name}</h3>
                </div>
                {getStatusIcon(module.status)}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span>Progresso</span>
                    <span>{module.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${getProgressColor(module.progress)}`}
                      style={{ width: `${module.progress}%` }}
                    />
                  </div>
                </div>
                
                <Badge 
                  className={`text-xs ${
                    module.status === 'Completo' ? 'bg-green-100 text-green-800' :
                    module.status === 'Em Desenvolvimento' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}
                >
                  {module.status}
                </Badge>

                <div>
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Recursos:</h4>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {module.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-1">
                        <div className="w-1 h-1 bg-gray-400 rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default SystemStatus