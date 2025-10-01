import React, { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useChurchStore, Church, SubscriptionPlan } from '../stores/churchStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs' // Importar Tabs
import { toast } from 'sonner'
import { Church as ChurchIcon, Plus, Edit, Trash2, Users, DollarSign, CheckCircle, XCircle, Clock, Globe, Loader2, Database, Key, BarChart3 } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'
import MasterAdminOverviewCards from '../components/master-admin/MasterAdminOverviewCards'
import MasterAdminChurchTable from '../components/master-admin/MasterAdminChurchTable'
import ManageChurchSubscriptionDialog from '../components/master-admin/ManageChurchSubscriptionDialog'
import DatabaseInfoTab from '../components/master-admin/DatabaseInfoTab' // Novo
import AdminToolsTab from '../components/master-admin/AdminToolsTab' // Novo
import SaaSReportsTab from '../components/master-admin/SaaSReportsTab' // Novo
import ViewPaymentHistoryDialog from '../components/master-admin/ViewPaymentHistoryDialog' // Já existente, mas garantir import

const MasterAdminPage = () => {
  const { user } = useAuthStore()
  const { churches, loadChurches, addChurch, updateChurch, getSubscriptionPlans, getPlanDetails } = useChurchStore()
  const [isAddChurchDialogOpen, setIsAddChurchDialogOpen] = useState(false)
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(null)
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // Novo estado para a aba ativa

  const [newChurch, setNewChurch] = useState({
    name: '',
    subscriptionPlan: '0-100 membros' as SubscriptionPlan,
    status: 'active' as Church['status'],
    adminUserId: user?.id || null, 
  })

  useEffect(() => {
    const fetchChurches = async () => {
      setIsLoading(true);
      await loadChurches();
      setIsLoading(false);
    };
    fetchChurches();
  }, [loadChurches]);

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

  const handleAddChurch = async () => {
    if (!newChurch.name || !newChurch.subscriptionPlan) {
      toast.error('Nome da igreja e plano de assinatura são obrigatórios.')
      return;
    }

    setIsLoading(true);
    try {
      const added = await addChurch(newChurch);
      if (added) {
        setIsAddChurchDialogOpen(false);
        setNewChurch({
          name: '',
          subscriptionPlan: '0-100 membros',
          status: 'active',
          adminUserId: user?.id || null,
        });
        toast.success(`Igreja ${added.name} adicionada com sucesso!`);
      } else {
        toast.error('Falha ao adicionar a igreja.');
      }
    } catch (error) {
      console.error('Error adding church:', error);
      toast.error('Erro ao adicionar a igreja.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateChurch = useCallback(async (churchId: string, updates: Partial<Church>) => {
    setIsLoading(true);
    try {
      const updated = await updateChurch(churchId, updates);
      if (updated) {
        toast.success(`Igreja ${updated.name} atualizada com sucesso!`);
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

  return (
    <MainLayout>
      <div className="p-3 md:p-6 space-y-4 md:space-y-6">
        <div className="bg-gradient-to-r from-red-600 to-orange-700 rounded-xl md:rounded-2xl p-4 md:p-6 text-white">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Painel Master de Administração 👑</h1>
          <p className="text-red-100 text-base md:text-lg">
            Gerencie todas as igrejas e suas assinaturas
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="churches">Igrejas</TabsTrigger>
            <TabsTrigger value="database">Banco de Dados</TabsTrigger>
            <TabsTrigger value="tools">Ferramentas Admin</TabsTrigger>
            <TabsTrigger value="reports">Relatórios SaaS</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <MasterAdminOverviewCards churches={churches} />
            {/* Adicionar mais gráficos ou resumos aqui se necessário */}
          </TabsContent>

          <TabsContent value="churches" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <ChurchIcon className="w-6 h-6 text-purple-500" />
                  Igrejas Cadastradas
                </CardTitle>
                {/* DialogTrigger button movido para dentro do CardHeader */}
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
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={newChurch.status}
                          onValueChange={(value) => setNewChurch({...newChurch, status: value as Church['status']})}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Ativa</SelectItem>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="inactive">Inativa</SelectItem>
                            <SelectItem value="trial">Teste</SelectItem>
                            <SelectItem value="blocked">Bloqueada</SelectItem>
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

          <TabsContent value="database" className="space-y-6">
            <DatabaseInfoTab />
          </TabsContent>

          <TabsContent value="tools" className="space-y-6">
            <AdminToolsTab churches={churches} />
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