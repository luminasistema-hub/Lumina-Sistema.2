import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Button } from '../ui/button'
import { useAuthStore } from '../../stores/authStore' // Importar useAuthStore
import { useChurchStore } from '../../stores/churchStore' // Importar useChurchStore
import { useEffect, useState } from 'react' // Importar useEffect e useState
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
  Mic,
  Database,
  Server,
  Shield,
  Activity,
  Zap,
  Globe,
  Download,
  Upload,
  RefreshCw,
  HardDrive,
  Cpu,
  Wifi,
  Lock
} from 'lucide-react'

const SystemStatus = () => {
  const { currentChurchId, user } = useAuthStore() // Obter currentChurchId e user
  const { getChurchById, loadChurches } = useChurchStore() // Obter getChurchById e loadChurches
  const [churchName, setChurchName] = useState('Sistema Connect Vida Beta')

  useEffect(() => {
    loadChurches()
  }, [loadChurches])

  useEffect(() => {
    if (currentChurchId) {
      const church = getChurchById(currentChurchId)
      setChurchName(church?.name || 'Sistema Connect Vida Beta')
    } else if (user?.role === 'super_admin') {
      setChurchName('Painel Master - Status Geral')
    } else {
      setChurchName('Sistema Connect Vida Beta')
    }
  }, [currentChurchId, getChurchById, user?.role])

  const modules = [
    {
      name: 'Autenticação e Usuários',
      icon: <Users className="w-4 h-4" />,
      progress: 100,
      status: 'Completo',
      color: 'green',
      uptime: '99.9%',
      lastUpdate: '2025-09-24',
      features: ['8 tipos de usuário', 'Sistema de permissões', 'Login seguro', 'Gestão de sessões']
    },
    {
      name: 'Área Pessoal',
      icon: <Heart className="w-4 h-4" />,
      progress: 100,
      status: 'Completo',
      color: 'green',
      uptime: '99.8%',
      lastUpdate: '2025-09-24',
      features: ['Informações pessoais', 'Jornada do membro', 'Perfil completo', 'Formulário eclesiástico']
    },
    {
      name: 'Teste Vocacional',
      icon: <TestTube className="w-4 h-4" />,
      progress: 100,
      status: 'Completo',
      color: 'green',
      uptime: '100%',
      lastUpdate: '2025-09-24',
      features: ['40 perguntas', '8 ministérios', 'Resultado automático', 'Histórico completo']
    },
    {
      name: 'Crescimento Espiritual',
      icon: <BookOpen className="w-4 h-4" />,
      progress: 100,
      status: 'Completo',
      color: 'green',
      uptime: '99.7%',
      lastUpdate: '2025-09-24',
      features: ['Eventos completos', 'Cursos EAD', 'Devocionais blog', 'Sistema de inscrições']
    },
    {
      name: 'Sistema Financeiro',
      icon: <DollarSign className="w-4 h-4" />,
      progress: 100,
      status: 'Completo',
      color: 'green',
      uptime: '99.9%',
      lastUpdate: '2025-09-24',
      features: ['Transações completas', 'Orçamentos', 'Relatórios', 'Metas financeiras', 'Recibos automáticos']
    },
    {
      name: 'Gestão de Eventos',
      icon: <Calendar className="w-4 h-4" />,
      progress: 100,
      status: 'Completo',
      color: 'green',
      uptime: '99.6%',
      lastUpdate: '2025-09-24',
      features: ['Criação de eventos', 'Inscrições online', 'Controle de presença', 'Gestão de capacidade']
    },
    {
      name: 'Módulo Kids',
      icon: <Baby className="w-4 h-4" />,
      progress: 100,
      status: 'Completo',
      color: 'green',
      uptime: '99.8%',
      lastUpdate: '2025-09-24',
      features: ['Cadastro completo', 'Check-in seguro', 'Informações médicas', 'Contatos de emergência']
    },
    {
      name: 'Gestão de Membros',
      icon: <Church className="w-4 h-4" />,
      progress: 100,
      status: 'Completo',
      color: 'green',
      uptime: '99.9%',
      lastUpdate: '2025-09-24',
      features: ['CRUD completo', 'Relatórios avançados', 'Histórico espiritual', 'Estatísticas detalhadas']
    },
    {
      name: 'Gestão de Ministérios',
      icon: <Users className="w-4 h-4" />,
      progress: 100,
      status: 'Completo',
      color: 'green',
      uptime: '99.7%',
      lastUpdate: '2025-09-24',
      features: ['Criação de ministérios', 'Escalas automáticas', 'Gestão de voluntários', 'Metas ministeriais']
    },
    {
      name: 'Mídia e Transmissão',
      icon: <Mic className="w-4 h-4" />,
      progress: 85,
      status: 'Em Desenvolvimento',
      color: 'yellow',
      uptime: '95.0%',
      lastUpdate: '2025-09-20',
      features: ['Estrutura base criada', 'Interface preparada', 'Integração com YouTube', 'Sistema de streaming']
    },
    {
      name: 'Gestão de Site',
      icon: <Globe className="w-4 h-4" />,
      progress: 75,
      status: 'Em Desenvolvimento',
      color: 'blue',
      uptime: '90.0%',
      lastUpdate: '2025-09-18',
      features: ['CMS básico', 'Editor de conteúdo', 'Gestão de páginas', 'SEO otimizado']
    },
    {
      name: 'Configurações Avançadas',
      icon: <Settings className="w-4 h-4" />,
      progress: 80,
      status: 'Básico',
      color: 'blue',
      uptime: '98.5%',
      lastUpdate: '2025-09-24',
      features: ['Configurações básicas', 'Backup automático', 'Logs do sistema', 'Monitoramento']
    }
  ]

  const systemMetrics = {
    totalUsers: 127,
    activeUsers: 98,
    totalTransactions: 1543,
    systemUptime: '99.7%',
    lastBackup: '2025-09-24 03:00:00',
    databaseSize: '245 MB',
    storageUsed: '1.2 GB',
    apiCalls: '45,231',
    errorRate: '0.03%'
  }

  const serverStatus = [
    { name: 'API Server', status: 'online', response: '45ms', uptime: '99.9%' },
    { name: 'Database', status: 'online', response: '12ms', uptime: '99.8%' },
    { name: 'File Storage', status: 'online', response: '89ms', uptime: '99.7%' },
    { name: 'Email Service', status: 'online', response: '156ms', uptime: '99.9%' },
    { name: 'Backup Service', status: 'online', response: '234ms', uptime: '99.5%' }
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

  if (!currentChurchId && user?.role !== 'super_admin') {
    return (
      <div className="p-6 text-center text-gray-600">
        Selecione uma igreja para visualizar o status do sistema.
      </div>
    )
  }

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-blue-600 rounded-xl md:rounded-2xl p-4 md:p-6 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Status do Sistema 📊</h1>
        <p className="text-indigo-100 text-base md:text-lg">
          Monitoramento completo do {churchName}
        </p>
      </div>

      {/* System Overview */}
      <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Activity className="w-6 h-6 text-green-600" />
            Visão Geral do Sistema
          </CardTitle>
          <CardDescription className="text-lg">
            Status atual do Sistema Connect Vida - Versão SaaS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6">
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl md:text-3xl font-bold text-green-600 mb-1">{overallProgress}%</div>
              <div className="text-sm text-gray-600">Progresso Geral</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">
                {modules.filter(m => m.status === 'Completo').length}
              </div>
              <div className="text-sm text-gray-600">Módulos Completos</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-1">8</div>
              <div className="text-sm text-gray-600">Tipos de Usuário</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl md:text-3xl font-bold text-orange-600 mb-1">{systemMetrics.totalUsers}</div>
              <div className="text-sm text-gray-600">Usuários Totais</div>
            </div>
          </div>
          
          <Progress value={overallProgress} className="h-4 mb-4" />
          <p className="text-center text-sm text-gray-600">
            Sistema pronto para demonstração completa e testes beta avançados
          </p>
        </CardContent>
      </Card>

      {/* System Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <div className="text-xl font-bold">{systemMetrics.activeUsers}</div>
            <div className="text-sm text-gray-600">Usuários Ativos</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-xl font-bold">{systemMetrics.totalTransactions}</div>
            <div className="text-sm text-gray-600">Transações</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-xl font-bold">{systemMetrics.systemUptime}</div>
            <div className="text-sm text-gray-600">Uptime Geral</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Database className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <div className="text-xl font-bold">{systemMetrics.databaseSize}</div>
            <div className="text-sm text-gray-600">Banco de Dados</div>
          </CardContent>
        </Card>
      </div>

      {/* Server Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-500" />
            Status dos Serviços
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {serverStatus.map((service, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${service.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                  <div>
                    <div className="font-medium text-sm">{service.name}</div>
                    <div className="text-xs text-gray-500">{service.response} • {service.uptime}</div>
                  </div>
                </div>
                <Badge className={service.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {service.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modules Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Church className="w-5 h-5 text-purple-500" />
            Status dos Módulos
          </CardTitle>
          <CardDescription>
            Situação detalhada de todos os módulos do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                    
                    <div className="flex items-center justify-between text-xs">
                      <Badge 
                        className={`text-xs ${
                          module.status === 'Completo' ? 'bg-green-100 text-green-800' :
                          module.status === 'Em Desenvolvimento' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {module.status}
                      </Badge>
                      <span className="text-gray-500">Uptime: {module.uptime}</span>
                    </div>

                    <div>
                      <h4 className="text-xs font-medium text-gray-700 mb-2">Recursos:</h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {module.features.slice(0, 3).map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-1">
                            <div className="w-1 h-1 bg-gray-400 rounded-full" />
                            {feature}
                          </li>
                        ))}
                        {module.features.length > 3 && (
                          <li className="text-xs text-blue-600">
                            +{module.features.length - 3} recursos adicionais
                          </li>
                        )}
                      </ul>
                    </div>

                    <div className="text-xs text-gray-500 pt-2 border-t">
                      Última atualização: {module.lastUpdate}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-gray-500" />
            Ações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Atualizar Status
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Backup Manual
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Restaurar Sistema
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Logs de Segurança
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Detalhadas do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold">Estatísticas Gerais</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Versão do Sistema:</span>
                  <span className="font-medium">Connect Vida 2.0 SaaS</span>
                </div>
                <div className="flex justify-between">
                  <span>Último Backup:</span>
                  <span className="font-medium">{systemMetrics.lastBackup}</span>
                </div>
                <div className="flex justify-between">
                  <span>Chamadas API (24h):</span>
                  <span className="font-medium">{systemMetrics.apiCalls}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxa de Erro:</span>
                  <span className="font-medium text-green-600">{systemMetrics.errorRate}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Recursos do Sistema</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Armazenamento Usado:</span>
                  <span className="font-medium">{systemMetrics.storageUsed}</span>
                </div>
                <div className="flex justify-between">
                  <span>Usuários Online:</span>
                  <span className="font-medium text-green-600">{systemMetrics.activeUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span>Módulos Ativos:</span>
                  <span className="font-medium">{modules.filter(m => m.status === 'Completo').length}/{modules.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status Geral:</span>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Operacional
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default SystemStatus