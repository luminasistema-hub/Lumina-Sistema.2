import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Users, DollarSign, Activity, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'sonner';

interface MasterAdminSystemOverviewProps {
  totalUsersCount: number;
  activeMembersCount: number;
}

const MasterAdminSystemOverview: React.FC<MasterAdminSystemOverviewProps> = ({ totalUsersCount, activeMembersCount }) => {
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSystemMetrics = async () => {
      setIsLoading(true);
      try {
        const { count, error } = await supabase
          .from('transacoes_financeiras')
          .select('*', { count: 'exact', head: true });

        if (error) throw error;
        setTotalTransactions(count || 0);
      } catch (error: any) {
        console.error('Error fetching system metrics:', error);
        toast.error('Erro ao carregar métricas do sistema.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSystemMetrics();
  }, []);

  const modules = [
    { name: 'Autenticação e Usuários', progress: 100, status: 'complete' },
    { name: 'Área Pessoal', progress: 100, status: 'complete' },
    { name: 'Teste Vocacional', progress: 100, status: 'complete' },
    { name: 'Crescimento Espiritual', progress: 100, status: 'complete' },
    { name: 'Sistema Financeiro', progress: 100, status: 'complete' },
    { name: 'Gestão de Eventos', progress: 100, status: 'complete' },
    { name: 'Módulo Kids', progress: 100, status: 'complete' },
    { name: 'Gestão de Membros', progress: 100, status: 'complete' },
    { name: 'Gestão de Ministérios', progress: 100, status: 'complete' },
    { name: 'Mídia e Transmissão', progress: 85, status: 'development' },
    { name: 'Gestão de Site', progress: 75, status: 'development' },
    { name: 'Configurações Avançadas', progress: 80, status: 'basic' },
  ];

  const overallProgress = Math.round(modules.reduce((sum, module) => sum + module.progress, 0) / modules.length);
  const completedModules = modules.filter(m => m.status === 'complete').length;

  return (
    <>
      <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Activity className="w-6 h-6 text-green-600" />
            Visão Geral do Sistema
          </CardTitle>
          <CardDescription className="text-lg">
            Status atual do Sistema Lumina - Versão SaaS
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
                {completedModules}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <div className="text-xl font-bold">{activeMembersCount}</div>
            <div className="text-sm text-gray-600">Membros Ativos no Sistema</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" />
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
            ) : (
              <div className="text-xl font-bold">{totalTransactions}</div>
            )}
            <div className="text-sm text-gray-600">Transações Registradas</div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default MasterAdminSystemOverview;