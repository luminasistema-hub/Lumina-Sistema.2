import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Church, Users, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Church as ChurchType } from '../../stores/churchStore';

interface MasterAdminOverviewCardsProps {
  churches: ChurchType[];
}

const MasterAdminOverviewCards: React.FC<MasterAdminOverviewCardsProps> = ({ churches }) => {
  const totalChurches = churches.length;
  const activeChurches = churches.filter(c => c.status === 'active').length;
  const pendingPayments = churches.filter(c => c.ultimo_pagamento_status === 'Pendente' || c.ultimo_pagamento_status === 'Atrasado').length;
  const totalMonthlyRevenue = churches.filter(c => c.status === 'active' && c.ultimo_pagamento_status === 'Pago')
                                     .reduce((sum, c) => sum + c.valor_mensal_assinatura, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Igrejas</p>
              <p className="text-xl md:text-2xl font-bold text-gray-900">{totalChurches}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <Church className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Igrejas Ativas</p>
              <p className="text-xl md:text-2xl font-bold text-green-600">{activeChurches}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-green-50 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pagamentos Pendentes</p>
              <p className="text-xl md:text-2xl font-bold text-orange-600">{pendingPayments}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-50 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Receita Mensal (Estimada)</p>
              <p className="text-xl md:text-2xl font-bold text-blue-600">
                R$ {totalMonthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MasterAdminOverviewCards;