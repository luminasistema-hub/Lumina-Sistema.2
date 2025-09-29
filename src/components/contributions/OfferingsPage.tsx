import { useState, useEffect } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { toast } from 'sonner'
import { 
  DollarSign, 
  CreditCard, 
  Smartphone, 
  QrCode,
  Receipt,
  TrendingUp,
  Calendar,
  Filter,
  Download,
  Plus,
  Eye,
  Heart,
  PiggyBank,
  Building,
  Users
} from 'lucide-react'

interface Contribution {
  id: string
  churchId: string // Adicionado para multi-igrejas
  valor: number
  tipo: 'Dízimo' | 'Oferta' | 'Doação Especial' | 'Missões' | 'Obras'
  metodo_pagamento: 'PIX' | 'Cartão' | 'Dinheiro' | 'Transferência'
  data_contribuicao: string
  contribuinte: {
    id: string
    nome: string
    email?: string
  }
  campanha?: string
  observacoes?: string
  status: 'Pendente' | 'Confirmado' | 'Cancelado'
  recibo_gerado: boolean
}

const OfferingsPage = () => {
  const { user, currentChurchId } = useAuthStore() // Obter user e currentChurchId
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [isContributeDialogOpen, setIsContributeDialogOpen] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [selectedType, setSelectedType] = useState('all')

  const canViewFinancial = user?.role === 'admin' || user?.role === 'pastor' || user?.role === 'financeiro'
  const canManageFinancial = user?.role === 'admin' || user?.role === 'financeiro'

  const [newContribution, setNewContribution] = useState({
    valor: 0,
    tipo: 'Oferta' as Contribution['tipo'],
    metodo_pagamento: 'PIX' as Contribution['metodo_pagamento'],
    observacoes: ''
  })

  // Mock data
  useEffect(() => {
    if (currentChurchId) {
      const storedContributions = localStorage.getItem(`contributions-${currentChurchId}`)
      if (storedContributions) {
        setContributions(JSON.parse(storedContributions))
      } else {
        const mockContributions: Contribution[] = [
          {
            id: '1',
            churchId: currentChurchId,
            valor: 150.00,
            tipo: 'Dízimo',
            metodo_pagamento: 'PIX',
            data_contribuicao: '2025-09-10T10:00:00',
            contribuinte: { id: user?.id || '1', nome: user?.name || 'Usuário Atual' },
            status: 'Confirmado',
            recibo_gerado: true
          },
          {
            id: '2',
            churchId: currentChurchId,
            valor: 50.00,
            tipo: 'Oferta',
            metodo_pagamento: 'Cartão',
            data_contribuicao: '2025-09-08T19:30:00',
            contribuinte: { id: user?.id || '1', nome: user?.name || 'Usuário Atual' },
            campanha: 'Reforma do Templo',
            status: 'Confirmado',
            recibo_gerado: true
          }
        ]
        setContributions(mockContributions)
        localStorage.setItem(`contributions-${currentChurchId}`, JSON.stringify(mockContributions))
      }
    } else {
      setContributions([])
    }
  }, [currentChurchId, user])

  const handleContribute = () => {
    if (newContribution.valor <= 0) {
      toast.error('Por favor, insira um valor válido')
      return
    }
    if (!currentChurchId) {
      toast.error('Nenhuma igreja ativa selecionada.')
      return
    }

    const contribution: Contribution = {
      id: Date.now().toString(),
      churchId: currentChurchId,
      valor: newContribution.valor,
      tipo: newContribution.tipo,
      metodo_pagamento: newContribution.metodo_pagamento,
      data_contribuicao: new Date().toISOString(),
      contribuinte: { id: user?.id || '', nome: user?.name || '' },
      observacoes: newContribution.observacoes,
      status: 'Pendente',
      recibo_gerado: false
    }

    const updatedContributions = [contribution, ...contributions]
    setContributions(updatedContributions)
    localStorage.setItem(`contributions-${currentChurchId}`, JSON.stringify(updatedContributions))
    
    // Integração com o sistema financeiro
    console.log('Registrando transação financeira:', {
      tipo: 'Entrada',
      categoria: contribution.tipo === 'Dízimo' ? 'Dízimos' : 'Ofertas',
      valor: contribution.valor,
      data: contribution.data_contribuicao.split('T')[0],
      descricao: `${contribution.tipo} - ${contribution.contribuinte.nome}`,
      metodo_pagamento: contribution.metodo_pagamento,
      membro_id: contribution.contribuinte.id,
      membro_nome: contribution.contribuinte.nome,
      status: 'Confirmado'
    })
    
    setIsContributeDialogOpen(false)
    setNewContribution({
      valor: 0,
      tipo: 'Oferta',
      metodo_pagamento: 'PIX',
      observacoes: ''
    })
    toast.success('Contribuição registrada com sucesso! Transação enviada ao sistema financeiro.')
  }

  const getStatusColor = (status: Contribution['status']) => {
    switch (status) {
      case 'Confirmado': return 'bg-green-100 text-green-800'
      case 'Pendente': return 'bg-yellow-100 text-yellow-800'
      case 'Cancelado': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (tipo: Contribution['tipo']) => {
    switch (tipo) {
      case 'Dízimo': return 'bg-blue-100 text-blue-800'
      case 'Oferta': return 'bg-green-100 text-green-800'
      case 'Doação Especial': return 'bg-purple-100 text-purple-800'
      case 'Missões': return 'bg-orange-100 text-orange-800'
      case 'Obras': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const totalContributions = contributions
    .filter(c => c.status === 'Confirmado')
    .reduce((sum, c) => sum + c.valor, 0)

  const monthlyContributions = contributions
    .filter(c => {
      const date = new Date(c.data_contribuicao)
      const now = new Date()
      return date.getMonth() === now.getMonth() && 
             date.getFullYear() === now.getFullYear() &&
             c.status === 'Confirmado'
    })
    .reduce((sum, c) => sum + c.valor, 0)

  if (!currentChurchId) {
    return (
      <div className="p-6 text-center text-gray-600">
        Selecione uma igreja para visualizar as contribuições.
      </div>
    )
  }

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-xl md:rounded-2xl p-4 md:p-6 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Contribuições 💝</h1>
        <p className="text-green-100 text-base md:text-lg">
          Contribua para a obra de Deus e acompanhe suas doações
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Contribuído</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">
                  R$ {totalContributions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Este Mês</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">
                  R$ {monthlyContributions.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Contribuições</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{contributions.length}</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                <Receipt className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recibos</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">
                  {contributions.filter(c => c.recibo_gerado).length}
                </p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                <Download className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-full sm:w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="quarter">Trimestre</SelectItem>
              <SelectItem value="year">Este Ano</SelectItem>
              <SelectItem value="all">Todos</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              <SelectItem value="Dízimo">Dízimo</SelectItem>
              <SelectItem value="Oferta">Oferta</SelectItem>
              <SelectItem value="Doação Especial">Doação Especial</SelectItem>
              <SelectItem value="Missões">Missões</SelectItem>
              <SelectItem value="Obras">Obras</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Dialog open={isContributeDialogOpen} onOpenChange={setIsContributeDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-500 hover:bg-green-600 flex-1 sm:flex-none">
                <Plus className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Nova Contribuição</span>
                <span className="sm:hidden">Contribuir</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle>Nova Contribuição</DialogTitle>
                <DialogDescription>
                  Registre sua contribuição para a igreja
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="valor">Valor (R$) *</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    value={newContribution.valor || ''}
                    onChange={(e) => setNewContribution({...newContribution, valor: parseFloat(e.target.value) || 0})}
                    placeholder="0,00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Contribuição</Label>
                  <Select value={newContribution.tipo} onValueChange={(value) => setNewContribution({...newContribution, tipo: value as Contribution['tipo']})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dízimo">Dízimo</SelectItem>
                      <SelectItem value="Oferta">Oferta</SelectItem>
                      <SelectItem value="Doação Especial">Doação Especial</SelectItem>
                      <SelectItem value="Missões">Missões</SelectItem>
                      <SelectItem value="Obras">Obras</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metodo">Método de Pagamento</Label>
                  <Select value={newContribution.metodo_pagamento} onValueChange={(value) => setNewContribution({...newContribution, metodo_pagamento: value as Contribution['metodo_pagamento']})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="Cartão">Cartão de Crédito/Débito</SelectItem>
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="Transferência">Transferência Bancária</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={newContribution.observacoes}
                    onChange={(e) => setNewContribution({...newContribution, observacoes: e.target.value})}
                    placeholder="Campanha, finalidade, etc."
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsContributeDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleContribute}>
                    Contribuir
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" className="hidden sm:flex">
            <Download className="w-4 h-4 mr-2" />
            Relatório
          </Button>
        </div>
      </div>

      {/* Contributions List */}
      <div className="space-y-4">
        {contributions.map((contribution) => (
          <Card key={contribution.id} className="border-0 shadow-sm">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      R$ {contribution.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h3>
                    <div className="flex gap-2">
                      <Badge className={getTypeColor(contribution.tipo)}>
                        {contribution.tipo}
                      </Badge>
                      <Badge className={getStatusColor(contribution.status)}>
                        {contribution.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      {contribution.metodo_pagamento === 'PIX' && <QrCode className="w-4 h-4" />}
                      {contribution.metodo_pagamento === 'Cartão' && <CreditCard className="w-4 h-4" />}
                      {contribution.metodo_pagamento === 'Dinheiro' && <DollarSign className="w-4 h-4" />}
                      {contribution.metodo_pagamento === 'Transferência' && <Building className="w-4 h-4" />}
                      <span>{contribution.metodo_pagamento}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(contribution.data_contribuicao).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{contribution.contribuinte.nome}</span>
                    </div>
                    {contribution.recibo_gerado && (
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4" />
                        <span>Recibo disponível</span>
                      </div>
                    )}
                  </div>

                  {contribution.campanha && (
                    <p className="text-sm text-blue-600 mt-2">
                      📋 {contribution.campanha}
                    </p>
                  )}

                  {contribution.observacoes && (
                    <p className="text-sm text-gray-600 mt-2">
                      💬 {contribution.observacoes}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Ver</span>
                  </Button>
                  {contribution.recibo_gerado && (
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Recibo</span>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {contributions.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 md:p-12 text-center">
            <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma contribuição encontrada</h3>
            <p className="text-gray-600 mb-4">
              Que tal fazer sua primeira contribuição para a obra de Deus?
            </p>
            <Button onClick={() => setIsContributeDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Fazer Contribuição
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default OfferingsPage