import React, { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useChurchStore, Church, SubscriptionPlan } from '../stores/churchStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { toast } from 'sonner'
import { Church as ChurchIcon, Plus, Loader2 } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import MasterAdminOverviewCards from '../components/master-admin/MasterAdminOverviewCards'
import MasterAdminChurchTable from '../components/master-admin/MasterAdminChurchTable'
import DatabaseInfoTab from '../components/master-admin/DatabaseInfoTab'
import AdminToolsTab from '../components/master-admin/AdminToolsTab'
import SaaSReportsTab from '../components/master-admin/SaaSReportsTab'
import MasterAdminSystemOverview from '../components/master-admin/MasterAdminSystemOverview';
import SubscriptionPlanManagement from '../components/master-admin/SubscriptionPlanManagement'
import MasterAdminUpgradeRequestsAlert from '../components/master-admin/MasterAdminUpgradeRequestsAlert'
import { supabase } from '../integrations/supabase/client'
import { useSearchParams } from 'react-router-dom'

const MasterAdminPage = () => {
  const { user } = useAuthStore()
  const { churches, loadChurches, updateChurch, getSubscriptionPlans } = useChurchStore()
  const [isAddChurchDialogOpen, setIsAddChurchDialogOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Métricas
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [activeMembersCount, setActiveMembersCount] = useState(0);

  useEffect(() => {
    const fetchChurchesAndMetrics = async () => {
      setIsLoading(true);
      await loadChurches();

      // Total de usuários: soma membros + super_admins
      try {
        const [{ count: memberCount, error: mErr }, { count: saCount, error: saErr }] = await Promise.all([
          supabase.from('membros').select('id', { count: 'exact' }).limit(1),
          supabase.from('super_admins').select('id', { count: 'exact' }).limit(1),
        ])

        if (mErr) throw mErr
        if (saErr) throw saErr

        setTotalUsersCount((memberCount || 0) + (saCount || 0))
      } catch (error: any) {
        console.error('Erro ao calcular total de usuários:', error.message)
        setTotalUsersCount(0)
      }

      // Membros ativos
      try {
        const { count, error: membersError } = await supabase
          .from('membros')
          .select('id', { count: 'exact' })
          .eq('status', 'ativo')
          .limit(1);
        if (membersError) throw membersError;
        setActiveMembersCount(count || 0);
      } catch (error: any) {
        console.error('Erro ao carregar membros ativos:', error.message);
        toast.error('Erro ao carregar membros ativos: ' + error.message);
      }

      setIsLoading(false);
    };
    fetchChurchesAndMetrics();
  }, [loadChurches]);

  // Lê a aba da URL (?tab=) ao entrar na página
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const tab = searchParams.get('tab') || 'overview';
    if (tab !== activeTab) setActiveTab(tab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Atualiza a URL quando a aba muda
  const handleChangeTab = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value }, { replace: true });
  };

  if (user?.role !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <ChurchIcon className="w-12 h-12 mx-auto text-red-500 mb-4" />
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>Você não tem permissão para acessar esta página.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const handleUpdateChurch = useCallback(async (churchId: string, updates: Partial<Church>) => {
    setIsLoading(true);
    try {
      const updated = await updateChurch(churchId, updates);
      if (updated) {
        toast.success(`Igreja ${updated.name} atualizada com sucesso!`);
        const { count } = await supabase.from('membros').select('id', { count: 'exact' }).eq('status', 'ativo');
        setActiveMembersCount(count || 0);
      } else {
        toast.error('Falha ao atualizar a igreja.');
      }
    } catch (error) {
      console.error('Error updating church:', error);
      toast.error('Erro ao atualizar a igreja.');
    } finally {
      setIsLoading(false);
    }
  }, [updateChurch]);

  const [newChurch, setNewChurch] = useState({
    name: '',
    subscriptionPlan: getSubscriptionPlans()[0]?.value || '0-100 membros',
    status: 'active' as Church['status'],
    adminUserId: user?.id || null,
  });

  const handleAddChurch = async () => {
    toast.info('Funcionalidade de adicionar igreja em desenvolvimento.');
    setIsAddChurchDialogOpen(false);
  };

  return (
    <MainLayout>
      <div className="p-3 md:p-6 space-y-4 md:space-y-6">
        <div className="bg-gradient-to-r from-red-600 to-orange-700 rounded-xl md:rounded-2xl p-4 md:p-6 text-white">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Painel Master de Administração 👑</h1>
          <p className="text-red-100 text-base md:text-lg">
            Gerencie todas as igrejas e suas assinaturas
          </p>
        </div>

        <MasterAdminUpgradeRequestsAlert onViewRequests={() => setActiveTab('plans')} />

        <Tabs value={activeTab} onValueChange={handleChangeTab}>
          <TabsList className="w-full flex overflow-x-auto gap-2 p-1 md:p-0">
            <TabsTrigger value="overview" className="whitespace-nowrap">Visão Geral</TabsTrigger>
            <TabsTrigger value="churches" className="whitespace-nowrap">Igrejas</TabsTrigger>
            <TabsTrigger value="plans" className="whitespace-nowrap">Planos</TabsTrigger>
            <TabsTrigger value="database" className="whitespace-nowrap">Banco de Dados</TabsTrigger>
            <TabsTrigger value="tools" className="whitespace-nowrap">Ferramentas Admin</TabsTrigger>
            <TabsTrigger value="reports" className="whitespace-nowrap">Relatórios SaaS</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <MasterAdminOverviewCards churches={churches} />
            <MasterAdminSystemOverview totalUsersCount={totalUsersCount} activeMembersCount={activeMembersCount} />
          </TabsContent>

          <TabsContent value="churches" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <ChurchIcon className="w-6 h-6 text-purple-500" />
                  Igrejas Cadastradas
                </CardTitle>
                <Dialog open={isAddChurchDialogOpen} onOpenChange={setIsAddChurchDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-purple-500 hover:bg-purple-600">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Igreja
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Adicionar Nova Igreja</DialogTitle>
                      <DialogDescription>
                        Preencha os detalhes para cadastrar uma nova igreja.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="churchName">Nome da Igreja</Label>
                        <Input
                          id="churchName"
                          value={newChurch.name}
                          onChange={(e) => setNewChurch({...newChurch, name: e.target.value})}
                          placeholder="Nome da Igreja"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subscriptionPlan">Plano de Assinatura</Label>
                        <Select
                          value={newChurch.subscriptionPlan}
                          onValueChange={(value) => setNewChurch({...newChurch, subscriptionPlan: value as SubscriptionPlan})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um plano" />
                          </SelectTrigger>
                          <SelectContent>
                            {getSubscriptionPlans().map(plan => (
                              <SelectItem key={plan.value} value={plan.value}>
                                {plan.label} (R$ {plan.monthlyValue.toFixed(2)}/mês)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setIsAddChurchDialogOpen(false)} disabled={isLoading}>
                          Cancelar
                        </Button>
                        <Button onClick={handleAddChurch} disabled={isLoading}>
                          {isLoading ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Adicionando...
                            </div>
                          ) : (
                            'Adicionar Igreja'
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <MasterAdminChurchTable 
                churches={churches} 
                onUpdateChurch={handleUpdateChurch} 
                isLoading={isLoading}
              />
            </Card>
          </TabsContent>

          <TabsContent value="plans" className="space-y-6">
            <SubscriptionPlanManagement />
          </TabsContent>

          <TabsContent value="database" className="space-y-6">
            <DatabaseInfoTab />
          </TabsContent>

          <TabsContent value="tools" className="space-y-6">
            <AdminToolsTab churches={churches} onUpdateChurch={handleUpdateChurch} />
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <SaaSReportsTab />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  )
}

export default MasterAdminPage