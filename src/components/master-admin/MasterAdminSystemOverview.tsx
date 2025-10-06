import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Users, DollarSign, Activity, Loader2 } from 'lucide-react';
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
          .select('id', { count: 'exact' })
          .limit(1);

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

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Activity className="w-6 h-6 text-green-600" />
          Visão Geral do Sistema
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="text-center p-4 bg-white rounded-lg border">
            <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{totalUsersCount}</div>
            <div className="text-sm text-gray-600">Usuários Totais</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border">
            <Users className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{activeMembersCount}</div>
            <div className="text-sm text-gray-600">Membros Ativos</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border">
            <DollarSign className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
            {isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
            ) : (
              <div className="text-2xl font-bold text-emerald-600">{totalTransactions}</div>
            )}
            <div className="text-sm text-gray-600">Transações Registradas</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MasterAdminSystemOverview;