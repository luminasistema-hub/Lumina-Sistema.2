import { useState, useEffect } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { useChurchStore } from '../../stores/churchStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { toast } from 'sonner'
import { supabase } from '../../integrations/supabase/client'
import { ReceiptDialog } from './ReceiptDialog'
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

// Interface atualizada para corresponder à tabela transacoes_financeiras
interface Contribution {
  id: string
  tipo: 'Entrada' | 'Saída' // Sempre 'Entrada' para contribuições de membros
  categoria: 'Dízimos' | 'Ofertas' | 'Doações Especiais' | 'Missões' | 'Obras'
  subcategoria?: string // Pode ser usado para campanhas específicas
  valor: number
  data_transacao: string // Renomeado de data_contribuicao
  descricao: string
  metodo_pagamento: 'PIX' | 'Cartão' | 'Dinheiro' | 'Transferência'
  responsavel?: string // Quem registrou (pode ser o próprio membro ou um financeiro)
  status: 'Pendente' | 'Confirmado' | 'Cancelado'
  comprovante?: string
  observacoes?: string
  membro_id: string // ID do membro que contribuiu
  membro_nome?: string // Nome do membro
  recibo_emitido: boolean
  numero_documento?: string
  centro_custo?: string
  aprovado_por?: string
  data_aprovacao?: string
  id_igreja: string // ID da igreja
}

const OfferingsPage = () => {
  const { user, currentChurchId } = useAuthStore()
  const { getChurchById } = useChurchStore()
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [isContributeDialogOpen, setIsContributeDialogOpen] = useState(false)
  const [receiptData, setReceiptData] = useState<{ contribution: Contribution } | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [selectedType, setSelectedType] = useState('all')
  const [loading, setLoading] = useState(true)

  const canViewFinancial = user?.role === 'admin' || user?.role === 'pastor' || user?.role === 'financeiro'
  const canManageFinancial = user?.role === 'admin' || user?.role === 'financeiro'

  const [newContribution, setNewContribution] = useState({
    valor: 0,
    tipo: 'Oferta' as Contribution['categoria'], // Usar categoria aqui
    metodo_pagamento: 'PIX' as Contribution['metodo_pagamento'],
    observacoes: '',
    campanha: '' // Adicionado campo de campanha
  })

  const currentChurch = currentChurchId ? getChurchById(currentChurchId) : null

  const loadContributions = async () => {
    if (!currentChurchId || !user?.id) {
      setContributions([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      let query = supabase
        .from('transacoes_financeiras')
        .select('*')
        .eq('id_igreja', currentChurchId)
        .eq('tipo', 'Entrada') // Apenas entradas são contribuições

      // Membros só podem ver suas próprias contribuições
      if (!canViewFinancial) {
        query = query.eq('membro_id', user.id)
      }

      const { data, error } = await query.order('data_transacao', { ascending: false })

      if (error) {
        console.error('Error loading contributions:', error)
        toast.error('Erro ao carregar contribuições: ' + error.message)
        setContributions([])
        return
      }

      setContributions(data as Contribution[])
    } catch (error) {
      console.error('Unexpected error loading contributions:', error)
      toast.error('Erro inesperado ao carregar contribuições.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadContributions()
  }, [currentChurchId, user?.id, canViewFinancial])

  const handleContribute = async () => {
    if (newContribution.valor <= 0) {
      toast.error('Por favor, insira um valor válido')
      return
    }
    if (!currentChurchId || !user?.id) {
      toast.error('Nenhuma igreja ativa ou usuário selecionado.')
      return
    }

    setLoading(true)
    try {
      // Criar transação financeira pendente
      const { data: transactionData, error: transactionError } = await supabase
        .from('transacoes_financeiras')
        .insert({
          id_igreja: currentChurchId,
          tipo: 'Entrada',
          categoria: newContribution.tipo,
          subcategoria: newContribution.campanha || null,
          valor: newContribution.valor,
          data_transacao: new Date().toISOString().split('T')[0],
          descricao: `${newContribution.tipo} de ${user.name}`,
          metodo_pagamento: newContribution.metodo_pagamento,
          responsavel: user.name,
          status: 'Pendente',
          observacoes: newContribution.observacoes,
          membro_id: user.id,
          membro_nome: user.name,
          recibo_emitido: false,
        })
        .select()
        .single()

      if (transactionError) {
        console.error('Error inserting contribution:', transactionError)
        toast.error('Erro ao registrar contribuição: ' + transactionError.message)
        return
      }

      // Enviar notificação para administradores
      const { data: admins, error: adminsError } = await supabase
        .from('membros')
        .select('id, email, nome_completo')
        .eq('id_igreja', currentChurchId)
        .in('funcao', ['admin', 'pastor', 'financeiro'])

      if (!adminsError && admins && admins.length > 0) {
        // Criar notificação para aprovação
        const notificationPromises = admins.map(admin => 
          supabase.from('eventos_aplicacao').insert({
            user_id: admin.id,
            church_id: currentChurchId,
            event_name: 'nova_contribuicao_pendente',
            event_details: {
              tipo: 'financeiro',
              titulo: 'Nova Contribuição Pendente',
              mensagem: `${user.name} realizou uma contribuição de R$ ${newContribution.valor.toFixed(2)} que aguarda aprovação.`,
              transaction_id: transactionData.id,
              valor: newContribution.valor,
              categoria: newContribution.tipo,
              data: new Date().toISOString()
            }
          })
        )
        await Promise.all(notificationPromises)
      }

      toast.success('Contribuição registrada com sucesso! Aguardando aprovação da gestão financeira.')
      setIsContributeDialogOpen(false)
      setNewContribution({
        valor: 0,
        tipo: 'Oferta',
        metodo_pagamento: 'PIX',
        observacoes: '',
        campanha: ''
      })
      loadContributions() // Recarrega a lista
    } catch (error) {
      console.error('Unexpected error during contribution:', error)
      toast.error('Erro inesperado ao registrar contribuição.')
    } finally {
      setLoading(false)
    }
  }

  const markReceiptAsIssued = async (contributionId: string) => {
    if (!canManageFinancial) {
      toast.error('Você não tem permissão para emitir recibos.')
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase
        .from('transacoes_financeiras')
        .update({ recibo_emitido: true })
        .eq('id', contributionId)

      if (error) {
        console.error('Error marking receipt as issued:', error)
        toast.error('Erro ao marcar recibo como emitido: ' + error.message)
        return
      }
      toast.success('Recibo marcado como emitido!')
      loadContributions()
    } catch (error) {
      console.error('Unexpected error marking receipt:', error)
      toast.error('Erro inesperado ao marcar recibo.')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenReceipt = (contribution: Contribution) => {
    setReceiptData({ contribution })
  }

  const getStatusColor = (status: Contribution['status']) => {
    switch (status) {
      case 'Confirmado': return 'bg-green-100 text-green-800'
      case 'Pendente': return 'bg-yellow-100 text-yellow-800'
      case 'Cancelado': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (categoria: Contribution['categoria']) => {
    switch (categoria) {
      case 'Dízimos': return 'bg-blue-100 text-blue-800'
      case 'Ofertas': return 'bg-green-100 text-green-800'
      case 'Doações Especiais': return 'bg-purple-100 text-purple-800'
      case 'Missões': return 'bg-orange-100 text-orange-800'
      case 'Obras': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredContributions = contributions.filter(c => {
    const matchesPeriod = true // Lógica de filtro de período mais complexa, deixada para depois
    const matchesType = selectedType === 'all' || c.categoria === selectedType
    return matchesPeriod && matchesType
  })

  const totalContributionsValue = filteredContributions
    .filter(c => c.status === 'Confirmado')
    .reduce((sum, c) => sum + c.valor, 0)

  const monthlyContributionsValue = filteredContributions
    .filter(c => {
      const date = new Date(c.data_transacao)
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

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-4 text-lg text-gray-600">Carregando contribuições...</p>
      </div>
    );
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
                  R$ {totalContributionsValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                  R$ {monthlyContributionsValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                <p className="text-xl md:text-2xl font-bold text-gray-900">{filteredContributions.length}</p>
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
                  {filteredContributions.filter(c => c.recibo_emitido).length}
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
              <SelectItem value="Dízimos">Dízimo</SelectItem>
              <SelectItem value="Ofertas">Oferta</SelectItem>
              <SelectItem value="Doações Especiais">Doação Especial</SelectItem>
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
                  <Select value={newContribution.tipo} onValueChange={(value) => setNewContribution({...newContribution, tipo: value as Contribution['categoria']})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dízimos">Dízimo</SelectItem>
                      <SelectItem value="Ofertas">Oferta</SelectItem>
                      <SelectItem value="Doações Especiais">Doação Especial</SelectItem>
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
                  <Label htmlFor="campanha">Campanha (Opcional)</Label>
                  <Input
                    id="campanha"
                    value={newContribution.campanha}
                    onChange={(e) => setNewContribution({...newContribution, campanha: e.target.value})}
                    placeholder="Ex: Reforma do Templo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={newContribution.observacoes}
                    onChange={(e) => setNewContribution({...newContribution, observacoes: e.target.value})}
                    placeholder="Finalidade, etc."
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
        {filteredContributions.map((contribution) => (
          <Card key={contribution.id} className="border-0 shadow-sm">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      R$ {contribution.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </h3>
                    <div className="flex gap-2">
                      <Badge className={getTypeColor(contribution.categoria)}>
                        {contribution.categoria}
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
                      <span>{new Date(contribution.data_transacao).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{contribution.membro_nome || contribution.responsavel}</span>
                    </div>
                    {contribution.recibo_emitido && (
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4" />
                        <span>Recibo disponível</span>
                      </div>
                    )}
                  </div>

                  {contribution.subcategoria && (
                    <p className="text-sm text-blue-600 mt-2">
                      📋 {contribution.subcategoria}
                    </p>
                  )}

                  {contribution.observacoes && (
                    <p className="text-sm text-gray-600 mt-2">
                      💬 {contribution.observacoes}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleOpenReceipt(contribution)}
                  >
                    <Receipt className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Detalhes/Recibo</span>
                    <span className="sm:hidden">Recibo</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredContributions.length === 0 && (
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

      <ReceiptDialog
        isOpen={!!receiptData}
        onOpenChange={(isOpen) => !isOpen && setReceiptData(null)}
        contribution={receiptData?.contribution ?? null}
        church={currentChurch}
        onMarkAsIssued={markReceiptAsIssued}
      />
    </div>
  )
}

export default OfferingsPage