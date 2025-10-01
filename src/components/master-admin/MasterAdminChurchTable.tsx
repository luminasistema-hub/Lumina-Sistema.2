import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { Church, useChurchStore, PaymentRecord } from '../../stores/churchStore';
import { Search, Filter, Edit, History, DollarSign, CheckCircle, XCircle, Clock, Shield, Users, Loader2, Calendar, AlertTriangle } from 'lucide-react';
import ManageChurchSubscriptionDialog from './ManageChurchSubscriptionDialog';
import ViewPaymentHistoryDialog from './ViewPaymentHistoryDialog';
import { useAuthStore } from '../../stores/authStore';
import { v4 as uuidv4 } from 'uuid'; // Para gerar IDs únicos

interface MasterAdminChurchTableProps {
  churches: Church[];
  onUpdateChurch: (churchId: string, updates: Partial<Church>) => Promise<void>;
  isLoading: boolean;
}

const MasterAdminChurchTable: React.FC<MasterAdminChurchTableProps> = ({ churches, onUpdateChurch, isLoading }) => {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');
  const [isManageSubscriptionDialogOpen, setIsManageSubscriptionDialogOpen] = useState(false);
  const [isViewPaymentHistoryDialogOpen, setIsViewPaymentHistoryDialogOpen] = useState(false);
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(null);

  const filteredChurches = churches.filter(church => {
    const matchesSearch = church.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          church.adminUserId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          church.subscriptionPlan.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || church.status === filterStatus;
    const matchesPlan = filterPlan === 'all' || church.subscriptionPlan === filterPlan;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const getStatusBadge = (status: Church['status']) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Ativa</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
      case 'inactive': return <Badge className="bg-gray-100 text-gray-800"><XCircle className="w-3 h-3 mr-1" /> Inativa</Badge>;
      case 'trial': return <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" /> Teste</Badge>;
      case 'blocked': return <Badge className="bg-red-100 text-red-800"><Shield className="w-3 h-3 mr-1" /> Bloqueada</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentStatusBadge = (status: Church['ultimo_pagamento_status']) => {
    switch (status) {
      case 'Pago': return <Badge className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" /> Pago</Badge>;
      case 'Pendente': return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>;
      case 'Atrasado': return <Badge className="bg-red-50 text-red-700 border-red-200"><AlertTriangle className="w-3 h-3 mr-1" /> Atrasado</Badge>;
      case 'N/A': return <Badge variant="outline">N/A</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleBlockAccess = async (churchId: string) => {
    if (!confirm('Tem certeza que deseja BLOQUEAR o acesso desta igreja por falta de pagamento?')) return;
    await onUpdateChurch(churchId, { status: 'blocked', ultimo_pagamento_status: 'Atrasado' });
    toast.success('Acesso da igreja bloqueado com sucesso!');
  };

  const handleUnblockAccess = async (churchId: string) => {
    if (!confirm('Tem certeza que deseja DESBLOQUEAR o acesso desta igreja?')) return;
    await onUpdateChurch(churchId, { status: 'active', ultimo_pagamento_status: 'Pago' }); // Assumimos que foi pago para desbloquear
    toast.success('Acesso da igreja desbloqueado com sucesso!');
  };

  const handleMarkAsPaid = async (church: Church) => {
    if (!confirm('Tem certeza que deseja marcar o pagamento desta igreja como PAGO?')) return;
    
    const newPaymentRecord: PaymentRecord = {
      id: uuidv4(),
      data: new Date().toISOString().split('T')[0],
      valor: church.valor_mensal_assinatura,
      status: 'Pago',
      metodo: 'Manual (Admin)',
      registrado_por: user?.email || 'Super Admin',
    };

    const updatedHistory = [...(church.historico_pagamentos || []), newPaymentRecord].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextPaymentDate = nextMonth.toISOString().split('T')[0];

    await onUpdateChurch(church.id, { 
      ultimo_pagamento_status: 'Pago',
      data_proximo_pagamento: nextPaymentDate,
      historico_pagamentos: updatedHistory,
      status: 'active' // Garante que a igreja esteja ativa se o pagamento for marcado como pago
    });
    toast.success('Pagamento marcado como PAGO e acesso restaurado!');
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4 md:p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:flex-1">
            <div className="relative flex-1 lg:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar igreja..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="inactive">Inativa</SelectItem>
                <SelectItem value="trial">Teste</SelectItem>
                <SelectItem value="blocked">Bloqueada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPlan} onValueChange={setFilterPlan}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Plano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Planos</SelectItem>
                <SelectItem value="0-100 membros">0-100 Membros</SelectItem>
                <SelectItem value="101-300 membros">101-300 Membros</SelectItem>
                <SelectItem value="301-500 membros">301-500 Membros</SelectItem>
                <SelectItem value="ilimitado">Ilimitado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            <span className="ml-3 text-gray-600">Carregando igrejas...</span>
          </div>
        ) : filteredChurches.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhuma igreja encontrada com os filtros aplicados.
          </div>
        ) : (
          <div className="space-y-4">
            {filteredChurches.map((church) => (
              <Card key={church.id} className="border-0 shadow-sm">
                <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    <div className="col-span-full lg:col-span-1">
                      <h3 className="text-lg font-semibold text-gray-900">{church.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(church.status)}
                        {getPaymentStatusBadge(church.ultimo_pagamento_status)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{church.currentMembers} / {church.memberLimit === Infinity ? 'Ilimitado' : church.memberLimit} Membros</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="w-4 h-4" />
                      <span>Plano: {church.subscriptionPlan}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="w-4 h-4" />
                      <span>Mensalidade: R$ {church.valor_mensal_assinatura.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>Próx. Pagamento: {church.data_proximo_pagamento ? new Date(church.data_proximo_pagamento).toLocaleDateString('pt-BR') : 'N/A'}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedChurch(church);
                        setIsManageSubscriptionDialogOpen(true);
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Gerenciar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedChurch(church);
                        setIsViewPaymentHistoryDialogOpen(true);
                      }}
                    >
                      <History className="w-4 h-4 mr-2" />
                      Pagamentos
                    </Button>
                    {church.status !== 'blocked' && (church.ultimo_pagamento_status === 'Pendente' || church.ultimo_pagamento_status === 'Atrasado') && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleBlockAccess(church.id)}
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        Bloquear Acesso
                      </Button>
                    )}
                    {church.status === 'blocked' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleUnblockAccess(church.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Desbloquear Acesso
                      </Button>
                    )}
                    {(church.ultimo_pagamento_status === 'Pendente' || church.ultimo_pagamento_status === 'Atrasado') && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleMarkAsPaid(church)}
                      >
                        <DollarSign className="w-4 h-4 mr-2" />
                        Marcar como Pago
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>

      <ManageChurchSubscriptionDialog
        isOpen={isManageSubscriptionDialogOpen}
        onClose={() => setIsManageSubscriptionDialogOpen(false)}
        church={selectedChurch}
        onSave={onUpdateChurch}
      />

      <ViewPaymentHistoryDialog
        isOpen={isViewPaymentHistoryDialogOpen}
        onClose={() => setIsViewPaymentHistoryDialogOpen(false)}
        church={selectedChurch}
        onUpdateChurch={onUpdateChurch}
        currentUserEmail={user?.email || 'Super Admin'}
      />
    </Card>
  );
};

export default MasterAdminChurchTable;