import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
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
  Activity,
} from 'lucide-react';

interface MasterAdminSystemOverviewProps {
  totalUsersCount: number;
  activeMembersCount: number;
  totalTransactionsCount: number;
}

const MasterAdminSystemOverview: React.FC<MasterAdminSystemOverviewProps> = ({ totalUsersCount, activeMembersCount, totalTransactionsCount }) => {
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
  ];

  const overallProgress = Math.round(modules.reduce((sum, module) => sum + module.progress, 0) / modules.length);

  return (
    <>
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
              <div className="text-2xl md:text-3xl font-bold text-blue-600">
                {modules.filter(m => m.status === 'Completo').length}
              </div>
              <div className="text-sm text-gray-600">Módulos Completos</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl md:text-3xl font-bold text-purple-600">8</div>
              <div className="text-sm text-gray-600">Tipos de Usuário</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border">
              <div className="text-2xl md:text-3xl font-bold text-orange-600">{totalUsersCount}</div>
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <div className="text-xl font-bold">{activeMembersCount}</div>
            <div className="text-sm text-gray-600">Usuários Ativos (Membros)</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-xl font-bold">{totalTransactionsCount}</div>
            <div className="text-sm text-gray-600">Transações Totais</div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default MasterAdminSystemOverview;