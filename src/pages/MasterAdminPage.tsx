import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { useChurchStore, Church, SubscriptionPlan } from '../stores/churchStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { toast } from 'sonner'
import { Church as ChurchIcon, Plus, Edit, Trash2, Users, DollarSign, CheckCircle, XCircle, Clock, Globe } from 'lucide-react'
import MainLayout from '../components/layout/MainLayout'

const MasterAdminPage = () => {
  const { user } = useAuthStore()
  const { churches, loadChurches, addChurch, updateChurch, getSubscriptionPlans } = useChurchStore()
  const [isAddChurchDialogOpen, setIsAddChurchDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedChurch, setSelectedChurch] = useState<Church | null>(null)

  const [newChurch, setNewChurch] = useState({
    name: '',
    subscriptionPlan: '0-100 membros' as SubscriptionPlan,
    status: 'active' as Church['status'],
    adminUserId: user?.id || null, 
  })

  const [editChurchData, setEditChurchData] = useState<Partial<Church>>({})

  useEffect(() => {
    loadChurches()
  }, [loadChurches])

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
      return
    }

    const selectedPlan = getSubscriptionPlans().find(p => p.value === newChurch.subscriptionPlan)
    if (!selectedPlan) {
      toast.error('Plano de assinatura inválido.')
      return
    }

    const churchToAdd = {
      name: newChurch.name,
      subscriptionPlan: newChurch.subscriptionPlan,
      memberLimit: selectedPlan.memberLimit,
      status: newChurch.status,
      adminUserId: newChurch.adminUserId,
    }

    const added = await addChurch(churchToAdd)

    if (added) {
      setIsAddChurchDialogOpen(false)
      setNewChurch({
        name: '',
        subscriptionPlan: '0-100 membros',
        status: 'active',
        adminUserId: user?.id || null,
      })
      toast.success(`Igreja ${added.name} adicionada com sucesso!`)
    } else {
      toast.error('Falha ao adicionar a igreja.')
    }
  }

  const handleUpdateChurch = async () => {
    if (!selectedChurch || !editChurchData.subscriptionPlan) {
      toast.error('Selecione uma igreja e um plano de assinatura válido.')
      return
    }

    const selectedPlan = getSubscriptionPlans().find(p => p.value === editChurchData.subscriptionPlan)
    if (!selectedPlan) {
      toast.error('Plano de assinatura inválido.')
      return
    }

    const updated = await updateChurch(selectedChurch.id, {
      name: editChurchData.name,
      subscriptionPlan: editChurchData.subscriptionPlan,
      memberLimit: selectedPlan.memberLimit,
      status: editChurchData.status,
      adminUserId: editChurchData.adminUserId,
    })

    if (updated) {
      setIsEditDialogOpen(false)
      setSelectedChurch(null)
      setEditChurchData({})
      toast.success(`Igreja ${updated.name} atualizada com sucesso!`)
    } else {
      toast.error('Falha ao atualizar a igreja.')
    }
  }

  const getStatusBadge = (status: Church['status']) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Ativa</Badge>
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" /> Pendente</Badge>
      case 'inactive': return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> Inativa</Badge>
      case 'trial': return <Badge className="bg-blue-100 text-blue-800"><Globe className="w-3 h-3 mr-1" /> Teste</Badge>
      default: return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <MainLayout>
      <div className="p-3 md:p-6 space-y-4 md:space-y-6">
        <div className="bg-gradient-to-r from-red-600 to-orange-700 rounded-xl md:rounded-2xl p-4 md:p-6 text-white">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Painel Master de Administração 👑</h1>
          <p className="text-red-100 text-base md:text-lg">
            Gerencie todas as igrejas e suas assinaturas
          </p>
        </div>

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
                            {plan.label}
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
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddChurchDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAddChurch}>
                      Adicionar Igreja
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {Array.isArray(churches) && churches.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhuma igreja cadastrada ainda.
              </div>
            ) : (
              <div className="space-y-4">
                {Array.isArray(churches) && churches.map((church) => (
                  <Card key={church.id} className="border-0 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold">{church.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>{church.currentMembers} / {church.memberLimit === Infinity ? 'Ilimitado' : church.memberLimit} Membros</span>
                          <DollarSign className="w-4 h-4 ml-4" />
                          <span>Plano: {church.subscriptionPlan}</span>
                        </div>
                        <div className="mt-2">
                          {getStatusBadge(church.status)}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedChurch(church)
                            setEditChurchData(church)
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Igreja: {selectedChurch?.name}</DialogTitle>
              <DialogDescription>
                Atualize os detalhes e o plano de assinatura da igreja.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editChurchName">Nome da Igreja</Label>
                <Input
                  id="editChurchName"
                  value={editChurchData.name || ''}
                  onChange={(e) => setEditChurchData({...editChurchData, name: e.target.value})}
                  placeholder="Nome da Igreja"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editSubscriptionPlan">Plano de Assinatura</Label>
                <Select
                  value={editChurchData.subscriptionPlan}
                  onValueChange={(value) => setEditChurchData({...editChurchData, subscriptionPlan: value as SubscriptionPlan})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {getSubscriptionPlans().map(plan => (
                      <SelectItem key={plan.value} value={plan.value}>
                        {plan.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editStatus">Status</Label>
                <Select
                  value={editChurchData.status}
                  onValueChange={(value) => setEditChurchData({...editChurchData, status: value as Church['status']})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativa</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="inactive">Inativa</SelectItem>
                    <SelectItem value="trial">Teste</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdateChurch}>
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}

export default MasterAdminPage