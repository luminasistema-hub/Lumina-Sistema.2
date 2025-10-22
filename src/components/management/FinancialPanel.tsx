import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../stores/authStore'
import { useChurchStore } from '../../stores/churchStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { toast } from 'sonner'
import { supabase } from '../../integrations/supabase/client'
import { UnifiedReceiptDialog } from '../financial/UnifiedReceiptDialog'
import BudgetManagement from '../financial/BudgetManagement'
import ReportViewerDialog from '../financial/ReportViewerDialog'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { 
  PieChart,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  Receipt,
  Target,
  FileText,
  Loader2,
  Calculator,
  CheckCircle,
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  User,
  CreditCard,
  AlertCircle,
  Settings,
  Download
} from 'lucide-react'
import TransactionDetailsDialog from '../financial/TransactionDetailsDialog'

interface FinancialTransaction {
  id: string
  tipo: 'Entrada' | 'Saída'
  categoria: string
  subcategoria?: string
  valor: number
  data_transacao: string
  descricao: string
  metodo_pagamento: string
  responsavel: string
  status: 'Pendente' | 'Confirmado' | 'Cancelado'
  comprovante?: string
  observacoes?: string
  membro_id?: string
  membro_nome?: string
  recibo_emitido?: boolean
  numero_documento?: string
  centro_custo?: string
  aprovado_por?: string
  data_aprovacao?: string
  id_igreja: string
}

interface FinancialGoal {
  id: string
  id_igreja: string
  nome: string
  valor_meta: number
  valor_atual: number
  data_inicio: string
  data_limite?: string
  categoria?: string
  descricao?: string
  status: 'Ativo' | 'Concluído' | 'Cancelado'
}

const PAGE_SIZE = 10

const FinancialPanel = () => {
  const { user, currentChurchId } = useAuthStore()
  const churchStore = useChurchStore()
  const queryClient = useQueryClient()

  const [viewMode, setViewMode] = useState<'dashboard' | 'transactions' | 'budget' | 'goals' | 'reports'>('dashboard')
  const [page, setPage] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 500)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedMemberFilter, setSelectedMemberFilter] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
  const [isEditTransactionOpen, setIsEditTransactionOpen] = useState(false)
  const [isChurchSettingsOpen, setIsChurchSettingsOpen] = useState(false)
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false)
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false)
  const [goalToEdit, setGoalToEdit] = useState<FinancialGoal | null>(null)
  const [transactionToEdit, setTransactionToEdit] = useState<FinancialTransaction | null>(null)
  const [receiptTransaction, setReceiptTransaction] = useState<FinancialTransaction | null>(null)
  const [detailsTransaction, setDetailsTransaction] = useState<FinancialTransaction | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [reportPeriod, setReportPeriod] = useState({
    inicio: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    fim: new Date().toISOString().split('T')[0]
  })

  const canManageFinancial = user?.role === 'admin' || user?.role === 'pastor' || user?.role === 'financeiro'

  const [newTransaction, setNewTransaction] = useState({
    tipo: 'Entrada' as 'Entrada' | 'Saída',
    categoria: '',
    subcategoria: '',
    valor: 0,
    data_transacao: new Date().toISOString().split('T')[0],
    descricao: '',
    metodo_pagamento: 'PIX',
    responsavel: user?.name || '',
    observacoes: '',
    centro_custo: '',
    numero_documento: '',
    membro_id: '' as string,
    status: 'Confirmado' as 'Pendente' | 'Confirmado' | 'Cancelado'
  })

  const [newGoal, setNewGoal] = useState({
    nome: '',
    valor_meta: 0,
    data_inicio: new Date().toISOString().split('T')[0],
    data_limite: '',
    categoria: '',
    descricao: ''
  })

  const categoriesEntrada = ['Dízimos', 'Ofertas', 'Doações Especiais', 'Eventos', 'Vendas', 'Outros']
  const categoriesSaida = ['Pessoal', 'Manutenção', 'Utilidades', 'Ministérios', 'Eventos', 'Equipamentos', 'Outros']
  const allCategories = useMemo(() => Array.from(new Set([...categoriesEntrada, ...categoriesSaida])), [])
  const metodosPagamento = ['PIX', 'Dinheiro', 'Cartão Débito', 'Cartão Crédito', 'Transferência', 'Cheque', 'Boleto']

  const currentChurch = churchStore.getChurchById(currentChurchId!)

  // Garante que os dados da igreja estejam carregados quando necessário
  useEffect(() => {
    if (currentChurchId && !currentChurch) {
      churchStore.loadChurches()
    }
  }, [currentChurchId, currentChurch, churchStore])

  // Query para membros
  const { data: members = [] } = useQuery({
    queryKey: ['members', currentChurchId],
    queryFn: async () => {
      if (!currentChurchId) return []
      const { data, error } = await supabase
        .from('membros')
        .select('id, nome_completo')
        .eq('id_igreja', currentChurchId)
        .order('nome_completo')
      if (error) throw error
      return data || []
    },
    enabled: !!currentChurchId,
    staleTime: 5 * 60 * 1000,
  })

  // Query para transações paginadas
  const { data: transactionsResponse, isLoading: isLoadingTransactions, isFetching: isFetchingTransactions } = useQuery({
    queryKey: ['transactions', currentChurchId, page, debouncedSearchTerm, selectedCategory, selectedMemberFilter, selectedStatus, selectedType],
    queryFn: async () => {
      if (!currentChurchId) return { data: [], count: 0 }
      
      let query = supabase
        .from('transacoes_financeiras')
        .select('*', { count: 'exact' })
        .eq('id_igreja', currentChurchId)
        .order('data_transacao', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (debouncedSearchTerm) {
        query = query.or(`descricao.ilike.%${debouncedSearchTerm}%,numero_documento.ilike.%${debouncedSearchTerm}%,responsavel.ilike.%${debouncedSearchTerm}%`)
      }
      if (selectedCategory !== 'all') query = query.eq('categoria', selectedCategory)
      if (selectedMemberFilter !== 'all') query = query.eq('membro_id', selectedMemberFilter)
      if (selectedStatus !== 'all') query = query.eq('status', selectedStatus)
      if (selectedType !== 'all') query = query.eq('tipo', selectedType)

      const { data, error, count } = await query
      if (error) throw error
      return { data: (data || []) as FinancialTransaction[], count: count || 0 }
    },
    enabled: !!currentChurchId && viewMode === 'transactions',
    staleTime: 30 * 1000,
  })

  const transactions = transactionsResponse?.data || []
  const transactionCount = transactionsResponse?.count || 0

  // Query para resumo financeiro
  const { data: financialSummary, isFetching: isFetchingSummary } = useQuery({
    queryKey: ['financial-summary', currentChurchId],
    queryFn: async () => {
      if (!currentChurchId) return { 
        saldoAtual: 0, 
        entradasMes: 0, 
        saidasMes: 0, 
        pendingTransactionsCount: 0,
        entradasTotal: 0,
        saidasTotal: 0,
        transacoesHoje: 0
      }
      
      const currentMonth = new Date().toISOString().slice(0, 7)
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('transacoes_financeiras')
        .select('valor, tipo, status, data_transacao')
        .eq('id_igreja', currentChurchId)
      
      if (error) throw error
      const allTrans = data || []
      const confirmed = allTrans.filter(t => t.status === 'Confirmado')
      
      const totalEntradas = confirmed.filter(t => t.tipo === 'Entrada').reduce((sum, t) => sum + t.valor, 0)
      const totalSaidas = confirmed.filter(t => t.tipo === 'Saída').reduce((sum, t) => sum + t.valor, 0)
      const saldoAtual = totalEntradas - totalSaidas
      const entradasMes = confirmed.filter(t => t.tipo === 'Entrada' && t.data_transacao.startsWith(currentMonth)).reduce((sum, t) => sum + t.valor, 0)
      const saidasMes = confirmed.filter(t => t.tipo === 'Saída' && t.data_transacao.startsWith(currentMonth)).reduce((sum, t) => sum + t.valor, 0)
      const pendingCount = allTrans.filter(t => t.status === 'Pendente').length
      const transacoesHoje = allTrans.filter(t => t.data_transacao.startsWith(today)).length

      return { 
        saldoAtual, 
        entradasMes, 
        saidasMes, 
        pendingTransactionsCount: pendingCount,
        entradasTotal: totalEntradas,
        saidasTotal: totalSaidas,
        transacoesHoje
      }
    },
    enabled: !!currentChurchId && viewMode === 'dashboard',
    staleTime: 60 * 1000,
  })

  // Query para metas financeiras
  const { data: goals = [], isFetching: isFetchingGoals } = useQuery({
    queryKey: ['financial-goals', currentChurchId],
    queryFn: async () => {
      if (!currentChurchId) return []
      const { data, error } = await supabase
        .from('metas_financeiras')
        .select('*')
        .eq('id_igreja', currentChurchId)
        .order('data_inicio', { ascending: false })
      if (error) throw error
      return data as FinancialGoal[]
    },
    enabled: !!currentChurchId && viewMode === 'goals',
    staleTime: 60 * 1000,
  })

  const summary = financialSummary || { 
    saldoAtual: 0, 
    entradasMes: 0, 
    saidasMes: 0, 
    pendingTransactionsCount: 0,
    entradasTotal: 0,
    saidasTotal: 0,
    transacoesHoje: 0
  }
  
  const pendingTransactions = useMemo(() => transactions.filter(t => t.status === 'Pendente'), [transactions])

  // Realtime subscription
  useEffect(() => {
    if (!currentChurchId) return
    const channel = supabase
      .channel(`financial-${currentChurchId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'transacoes_financeiras', 
        filter: `id_igreja=eq.${currentChurchId}` 
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['transactions', currentChurchId] })
        queryClient.invalidateQueries({ queryKey: ['financial-summary', currentChurchId] })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [currentChurchId, queryClient])

  // Mutations
  const addTransactionMutation = useMutation({
    mutationFn: async (transaction: any) => {
      const { error } = await supabase.from('transacoes_financeiras').insert({
        ...transaction,
        id_igreja: currentChurchId,
        responsavel: user?.name || transaction.responsavel
      })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Transação adicionada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] })
      setIsAddTransactionOpen(false)
      resetNewTransactionForm()
    },
    onError: (error: any) => toast.error(`Erro: ${error.message}`)
  })

  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const { error } = await supabase.from('transacoes_financeiras').update(data).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Transação atualizada!')
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] })
      setIsEditTransactionOpen(false)
      setTransactionToEdit(null)
    },
    onError: (error: any) => toast.error(`Erro: ${error.message}`)
  })

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transacoes_financeiras').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Transação removida!')
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] })
    },
    onError: (error: any) => toast.error(`Erro: ${error.message}`)
  })

  const approveTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transacoes_financeiras').update({
        status: 'Confirmado',
        aprovado_por: user?.name,
        data_aprovacao: new Date().toISOString()
      }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Transação aprovada!')
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] })
    },
    onError: (error: any) => toast.error(`Erro: ${error.message}`)
  })

  const rejectTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transacoes_financeiras').update({
        status: 'Cancelado',
        aprovado_por: user?.name,
        data_aprovacao: new Date().toISOString()
      }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Transação cancelada!')
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] })
    },
    onError: (error: any) => toast.error(`Erro: ${error.message}`)
  })

  const markReceiptIssuedMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('transacoes_financeiras').update({
        recibo_emitido: true
      }).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Recibo marcado como emitido!')
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
    onError: (error: any) => toast.error(`Erro: ${error.message}`)
  })

  const updateChurchInfoMutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!currentChurchId) throw new Error('Igreja não selecionada')
      await churchStore.updateChurch(currentChurchId, updates)
    },
    onSuccess: () => {
      toast.success('Informações da igreja atualizadas!')
      setIsChurchSettingsOpen(false)
    },
    onError: (error: any) => toast.error(`Erro: ${error.message}`)
  })

  const addGoalMutation = useMutation({
    mutationFn: async (goal: any) => {
      const { error } = await supabase.from('metas_financeiras').insert({
        ...goal,
        id_igreja: currentChurchId,
        valor_atual: 0,
        status: 'Ativo'
      })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Meta criada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['financial-goals'] })
      setIsAddGoalOpen(false)
      resetGoalForm()
    },
    onError: (error: any) => toast.error(`Erro: ${error.message}`)
  })

  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const { error } = await supabase.from('metas_financeiras').update(data).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Meta atualizada!')
      queryClient.invalidateQueries({ queryKey: ['financial-goals'] })
      setIsEditGoalOpen(false)
      setGoalToEdit(null)
    },
    onError: (error: any) => toast.error(`Erro: ${error.message}`)
  })

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('metas_financeiras').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Meta removida!')
      queryClient.invalidateQueries({ queryKey: ['financial-goals'] })
    },
    onError: (error: any) => toast.error(`Erro: ${error.message}`)
  })

  const resetNewTransactionForm = () => {
    setNewTransaction({
      tipo: 'Entrada',
      categoria: '',
      subcategoria: '',
      valor: 0,
      data_transacao: new Date().toISOString().split('T')[0],
      descricao: '',
      metodo_pagamento: 'PIX',
      responsavel: user?.name || '',
      observacoes: '',
      centro_custo: '',
      numero_documento: '',
      membro_id: '',
      status: 'Confirmado'
    })
  }

  const resetGoalForm = () => {
    setNewGoal({
      nome: '',
      valor_meta: 0,
      data_inicio: new Date().toISOString().split('T')[0],
      data_limite: '',
      categoria: '',
      descricao: ''
    })
  }

  const handleAddTransaction = () => {
    if (!newTransaction.categoria || !newTransaction.descricao || newTransaction.valor <= 0) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }
    addTransactionMutation.mutate(newTransaction)
  }

  const handleEditTransaction = () => {
    if (!transactionToEdit) return
    updateTransactionMutation.mutate({ id: transactionToEdit.id, data: transactionToEdit })
  }

  const handleAddGoal = () => {
    if (!newGoal.nome || newGoal.valor_meta <= 0) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }
    addGoalMutation.mutate(newGoal)
  }

  const handleEditGoal = () => {
    if (!goalToEdit) return
    updateGoalMutation.mutate({ id: goalToEdit.id, data: goalToEdit })
  }

  const openDetails = (transaction: FinancialTransaction) => {
    setDetailsTransaction(transaction)
    setDetailsOpen(true)
  }

  const generateReceipt = (transaction: FinancialTransaction) => {
    if (transaction.tipo === 'Saída') {
      toast.error('Recibos só podem ser gerados para entradas')
      return
    }
    setReceiptTransaction(transaction)
  }

  const generateReport = async () => {
    if (!currentChurchId) return
    
    const { data: transactionsData, error } = await supabase
      .from('transacoes_financeiras')
      .select('*')
      .eq('id_igreja', currentChurchId)
      .eq('status', 'Confirmado')
      .gte('data_transacao', reportPeriod.inicio)
      .lte('data_transacao', reportPeriod.fim)
    
    if (error) {
      toast.error('Erro ao gerar relatório')
      return
    }

    const entradas = transactionsData.filter(t => t.tipo === 'Entrada')
    const saidas = transactionsData.filter(t => t.tipo === 'Saída')
    
    const totalEntradas = entradas.reduce((sum, t) => sum + t.valor, 0)
    const totalSaidas = saidas.reduce((sum, t) => sum + t.valor, 0)
    
    const categoriasEntrada = entradas.reduce((acc, t) => {
      const existing = acc.find(c => c.categoria === t.categoria)
      if (existing) {
        existing.valor += t.valor
      } else {
        acc.push({ categoria: t.categoria, valor: t.valor })
      }
      return acc
    }, [] as Array<{categoria: string, valor: number}>)
    
    const categoriasSaida = saidas.reduce((acc, t) => {
      const existing = acc.find(c => c.categoria === t.categoria)
      if (existing) {
        existing.valor += t.valor
      } else {
        acc.push({ categoria: t.categoria, valor: t.valor })
      }
      return acc
    }, [] as Array<{categoria: string, valor: number}>)

    const report = {
      id: Date.now().toString(),
      tipo: 'Personalizado',
      periodo_inicio: reportPeriod.inicio,
      periodo_fim: reportPeriod.fim,
      gerado_por: user?.name || 'Sistema',
      data_geracao: new Date().toISOString(),
      dados: {
        total_entradas: totalEntradas,
        total_saidas: totalSaidas,
        saldo_periodo: totalEntradas - totalSaidas,
        categorias_entrada: categoriasEntrada,
        categorias_saida: categoriasSaida,
        maior_entrada: entradas.sort((a, b) => b.valor - a.valor)[0] || null,
        maior_saida: saidas.sort((a, b) => b.valor - a.valor)[0] || null
      }
    }

    setSelectedReport(report)
  }

  if (!currentChurchId) {
    return <div className="p-6 text-center text-gray-600">Selecione uma igreja para gerenciar o painel financeiro.</div>
  }

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Painel Financeiro</h1>
        <div className="flex gap-2">
          {canManageFinancial && (
            <Button variant="outline" onClick={() => setIsChurchSettingsOpen(true)}>
              <Settings className="w-4 h-4 mr-2" /> Configurações
            </Button>
          )}
          {canManageFinancial && viewMode === 'transactions' && (
            <Button onClick={() => setIsAddTransactionOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Nova Transação
            </Button>
          )}
          {canManageFinancial && viewMode === 'goals' && (
            <Button onClick={() => setIsAddGoalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Nova Meta
            </Button>
          )}
        </div>
      </div>

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="dashboard"><PieChart className="w-4 h-4 mr-2" />Dashboard</TabsTrigger>
          <TabsTrigger value="transactions"><BarChart3 className="w-4 h-4 mr-2" />Transações</TabsTrigger>
          <TabsTrigger value="budget"><Calculator className="w-4 h-4 mr-2" />Orçamento</TabsTrigger>
          <TabsTrigger value="goals"><Target className="w-4 h-4 mr-2" />Metas</TabsTrigger>
          <TabsTrigger value="reports"><FileText className="w-4 h-4 mr-2" />Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6 relative">
          {isFetchingSummary && (
            <div className="absolute right-2 -top-6 text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Saldo Atual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${summary.saldoAtual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {summary.saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Total: R$ {summary.entradasTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} - R$ {summary.saidasTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Entradas (Mês)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  R$ {summary.entradasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  Saídas (Mês)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  R$ {summary.saidasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Pendências
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{summary.pendingTransactionsCount}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {summary.transacoesHoje} transações hoje
                </p>
              </CardContent>
            </Card>
          </div>

          {pendingTransactions.length > 0 && canManageFinancial && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  Transações Pendentes de Aprovação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pendingTransactions.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 border rounded-md bg-orange-50">
                    <div className="flex-1">
                      <p className="font-medium">{t.descricao}</p>
                      <p className="text-sm text-gray-600">
                        {t.categoria} • R$ {t.valor.toFixed(2)} • {new Date(t.data_transacao).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-green-600" onClick={() => approveTransactionMutation.mutate(t.id)}>
                        <CheckCircle className="w-4 h-4 mr-1" /> Aprovar
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-600" onClick={() => rejectTransactionMutation.mutate(t.id)}>
                        <X className="w-4 h-4 mr-1" /> Rejeitar
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4 relative">
          {isFetchingTransactions && transactions.length > 0 && (
            <div className="absolute right-2 -top-6 text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          )}
          {!transactions || (transactions.length === 0 && isLoadingTransactions) ? (
            <div className="text-center p-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p className="text-gray-500">Carregando transações...</p>
            </div>
          ) : (
            <>
              <Card>
                <CardContent className="p-4 grid gap-3 md:grid-cols-5">
                  <Input 
                    placeholder="Buscar..." 
                    value={searchTerm} 
                    onChange={e => { 
                      setSearchTerm(e.target.value)
                      setPage(0) 
                    }} 
                  />
                  <Select value={selectedType} onValueChange={(v) => { 
                    setSelectedType(v)
                    setPage(0) 
                  }}>
                    <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Tipos</SelectItem>
                      <SelectItem value="Entrada">Entrada</SelectItem>
                      <SelectItem value="Saída">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedCategory} onValueChange={(v) => { 
                    setSelectedCategory(v)
                    setPage(0) 
                  }}>
                    <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {allCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={selectedStatus} onValueChange={(v) => { 
                    setSelectedStatus(v)
                    setPage(0) 
                  }}>
                    <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="Confirmado">Confirmado</SelectItem>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedMemberFilter} onValueChange={(v) => { 
                    setSelectedMemberFilter(v)
                    setPage(0) 
                  }}>
                    <SelectTrigger><SelectValue placeholder="Membro" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {members.map(m => <SelectItem key={m.id} value={m.id}>{m.nome_completo}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <div className="space-y-3">
                {transactions.length === 0 && (
                  <Card className="p-8 text-center text-gray-500">
                    Nenhuma transação encontrada
                  </Card>
                )}
                
                {transactions.map((transaction) => (
                  <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={transaction.tipo === 'Entrada' ? 'default' : 'destructive'}>
                              {transaction.tipo}
                            </Badge>
                            <Badge variant="outline">{transaction.categoria}</Badge>
                            <Badge variant={
                              transaction.status === 'Confirmado' ? 'default' : 
                              transaction.status === 'Pendente' ? 'secondary' : 
                              'destructive'
                            }>
                              {transaction.status}
                            </Badge>
                            {transaction.recibo_emitido && (
                              <Badge variant="outline" className="text-green-600">
                                <Receipt className="w-3 h-3 mr-1" />
                                Recibo Emitido
                              </Badge>
                            )}
                          </div>
                          <p className="font-semibold text-lg mb-1">{transaction.descricao}</p>
                          <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(transaction.data_transacao).toLocaleDateString('pt-BR')}
                            </span>
                            <span className="flex items-center gap-1">
                              <CreditCard className="w-3 h-3" />
                              {transaction.metodo_pagamento}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {transaction.responsavel}
                            </span>
                            {transaction.numero_documento && (
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                {transaction.numero_documento}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`text-2xl font-bold ${transaction.tipo === 'Entrada' ? 'text-green-600' : 'text-red-600'}`}>
                            {transaction.tipo === 'Entrada' ? '+' : '-'} R$ {transaction.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => openDetails(transaction)}>
                              Ver Detalhes
                            </Button>
                            {transaction.tipo === 'Entrada' && canManageFinancial && (
                              <Button variant="ghost" size="sm" onClick={() => generateReceipt(transaction)}>
                                <Receipt className="w-4 h-4" />
                              </Button>
                            )}
                            {canManageFinancial && (
                              <>
                                <Button variant="ghost" size="sm" onClick={() => { 
                                  setTransactionToEdit(transaction)
                                  setIsEditTransactionOpen(true) 
                                }}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => {
                                  if (confirm('Tem certeza que deseja excluir esta transação?')) {
                                    deleteTransactionMutation.mutate(transaction.id)
                                  }
                                }}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {transactionCount > PAGE_SIZE && (
                <div className="flex items-center justify-between pt-4">
                  <span className="text-sm text-gray-600">
                    Mostrando {page * PAGE_SIZE + 1} - {Math.min((page + 1) * PAGE_SIZE, transactionCount)} de {transactionCount} transações
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setPage(p => Math.max(0, p - 1))} 
                      disabled={page === 0}
                    >
                      Anterior
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setPage(p => p + 1)} 
                      disabled={(page + 1) * PAGE_SIZE >= transactionCount}
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="budget">
          <BudgetManagement />
        </TabsContent>
        
        <TabsContent value="goals" className="space-y-4 relative">
          {isFetchingGoals && (
            <div className="absolute right-2 -top-6 text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.map((goal) => {
              const percentage = goal.valor_meta > 0 ? (goal.valor_atual / goal.valor_meta) * 100 : 0
              const isCompleted = percentage >= 100
              const isExpired = goal.data_limite && new Date(goal.data_limite) < new Date()
              
              return (
                <Card key={goal.id} className={isCompleted ? 'border-green-500' : isExpired ? 'border-red-500' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{goal.nome}</CardTitle>
                        {goal.categoria && <p className="text-sm text-gray-500">{goal.categoria}</p>}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => {
                          setGoalToEdit(goal)
                          setIsEditGoalOpen(true)
                        }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => {
                          if (confirm('Tem certeza que deseja excluir esta meta?')) {
                            deleteGoalMutation.mutate(goal.id)
                          }
                        }}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {goal.descricao && (
                      <p className="text-sm text-gray-600">{goal.descricao}</p>
                    )}
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Arrecadado:</span>
                        <span className="font-semibold text-green-600">
                          R$ {goal.valor_atual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Meta:</span>
                        <span className="font-semibold">
                          R$ {goal.valor_meta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Faltam:</span>
                        <span className="font-semibold text-orange-600">
                          R$ {Math.max(0, goal.valor_meta - goal.valor_atual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{percentage.toFixed(1)}%</span>
                        {goal.data_limite && (
                          <span>Prazo: {new Date(goal.data_limite).toLocaleDateString('pt-BR')}</span>
                        )}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all ${
                            isCompleted ? 'bg-green-500' : 
                            isExpired ? 'bg-red-500' : 
                            percentage > 70 ? 'bg-yellow-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    {isCompleted && (
                      <Badge className="w-full justify-center bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Meta Atingida!
                      </Badge>
                    )}
                    {isExpired && !isCompleted && (
                      <Badge variant="destructive" className="w-full justify-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Prazo Expirado
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {goals.length === 0 && (
            <Card className="p-8 text-center">
              <Target className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-2">Nenhuma meta financeira cadastrada</p>
              <p className="text-sm text-gray-500 mb-4">Crie metas para acompanhar arrecadações específicas</p>
              <Button onClick={() => setIsAddGoalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> Criar Primeira Meta
              </Button>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gerar Relatório Financeiro</CardTitle>
              <CardDescription>
                Selecione o período para gerar um relatório detalhado das movimentações financeiras
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data Início</Label>
                  <Input 
                    type="date" 
                    value={reportPeriod.inicio}
                    onChange={(e) => setReportPeriod({...reportPeriod, inicio: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Fim</Label>
                  <Input 
                    type="date" 
                    value={reportPeriod.fim}
                    onChange={(e) => setReportPeriod({...reportPeriod, fim: e.target.value})}
                  />
                </div>
              </div>
              <Button onClick={generateReport} className="w-full">
                <Download className="w-4 h-4 mr-2" />
                Gerar Relatório
              </Button>
            </CardContent>
          </Card>

          {selectedReport && (
            <ReportViewerDialog
              isOpen={!!selectedReport}
              onOpenChange={() => setSelectedReport(null)}
              report={selectedReport}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de Configurações da Igreja */}
      <Dialog open={isChurchSettingsOpen} onOpenChange={setIsChurchSettingsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Configurações da Igreja</DialogTitle>
            <DialogDescription>
              Configure as informações que aparecerão nos recibos e documentos financeiros
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome da Igreja</Label>
              <Input 
                value={currentChurch?.name || ''} 
                onChange={(e) => {
                  if (currentChurch) {
                    churchStore.updateChurch(currentChurch.id, { name: e.target.value })
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input 
                value={currentChurch?.cnpj || ''} 
                onChange={(e) => {
                  if (currentChurch) {
                    churchStore.updateChurch(currentChurch.id, { cnpj: e.target.value })
                  }
                }}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div className="space-y-2">
              <Label>Endereço Completo</Label>
              <Input 
                value={currentChurch?.address || ''} 
                onChange={(e) => {
                  if (currentChurch) {
                    churchStore.updateChurch(currentChurch.id, { address: e.target.value })
                  }
                }}
                placeholder="Rua, número, bairro, cidade - UF"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input 
                  value={currentChurch?.contactPhone || ''} 
                  onChange={(e) => {
                    if (currentChurch) {
                      churchStore.updateChurch(currentChurch.id, { contactPhone: e.target.value })
                    }
                  }}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input 
                  type="email"
                  value={currentChurch?.contactEmail || ''} 
                  onChange={(e) => {
                    if (currentChurch) {
                      churchStore.updateChurch(currentChurch.id, { contactEmail: e.target.value })
                    }
                  }}
                  placeholder="contato@igreja.com"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsChurchSettingsOpen(false)}>
                Fechar
              </Button>
              <Button onClick={() => {
                toast.success('Configurações salvas!')
                setIsChurchSettingsOpen(false)
              }}>
                Salvar Configurações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para adicionar transação */}
      <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nova Transação</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select value={newTransaction.tipo} onValueChange={(v: any) => setNewTransaction({...newTransaction, tipo: v, categoria: ''})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Entrada">Entrada</SelectItem>
                    <SelectItem value="Saída">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Select value={newTransaction.categoria} onValueChange={(v) => setNewTransaction({...newTransaction, categoria: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {(newTransaction.tipo === 'Entrada' ? categoriesEntrada : categoriesSaida).map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Input 
                value={newTransaction.descricao} 
                onChange={(e) => setNewTransaction({...newTransaction, descricao: e.target.value})} 
                placeholder="Ex: Dízimo de João Silva"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor *</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  value={newTransaction.valor} 
                  onChange={(e) => setNewTransaction({...newTransaction, valor: parseFloat(e.target.value) || 0})} 
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <Label>Data *</Label>
                <Input 
                  type="date" 
                  value={newTransaction.data_transacao} 
                  onChange={(e) => setNewTransaction({...newTransaction, data_transacao: e.target.value})} 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Método de Pagamento</Label>
                <Select value={newTransaction.metodo_pagamento} onValueChange={(v) => setNewTransaction({...newTransaction, metodo_pagamento: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {metodosPagamento.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={newTransaction.status} onValueChange={(v: any) => setNewTransaction({...newTransaction, status: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Confirmado">Confirmado</SelectItem>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Membro (opcional)</Label>
              <Select value={newTransaction.membro_id} onValueChange={(v) => setNewTransaction({...newTransaction, membro_id: v})}>
                <SelectTrigger><SelectValue placeholder="Selecione um membro" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {members.map(m => <SelectItem key={m.id} value={m.id}>{m.nome_completo}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Número do Documento</Label>
                <Input 
                  value={newTransaction.numero_documento} 
                  onChange={(e) => setNewTransaction({...newTransaction, numero_documento: e.target.value})} 
                  placeholder="Ex: 001/2024"
                />
              </div>
              <div className="space-y-2">
                <Label>Centro de Custo</Label>
                <Input 
                  value={newTransaction.centro_custo} 
                  onChange={(e) => setNewTransaction({...newTransaction, centro_custo: e.target.value})} 
                  placeholder="Ex: Ministério Infantil"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea 
                value={newTransaction.observacoes} 
                onChange={(e) => setNewTransaction({...newTransaction, observacoes: e.target.value})} 
                rows={3} 
                placeholder="Informações adicionais sobre a transação"
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => {
                setIsAddTransactionOpen(false)
                resetNewTransactionForm()
              }}>
                Cancelar
              </Button>
              <Button onClick={handleAddTransaction} disabled={addTransactionMutation.isPending}>
                {addTransactionMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Transação'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar transação */}
      <Dialog open={isEditTransactionOpen} onOpenChange={setIsEditTransactionOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Transação</DialogTitle></DialogHeader>
          {transactionToEdit && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input 
                  value={transactionToEdit.descricao} 
                  onChange={(e) => setTransactionToEdit({...transactionToEdit, descricao: e.target.value})} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={transactionToEdit.valor} 
                    onChange={(e) => setTransactionToEdit({...transactionToEdit, valor: parseFloat(e.target.value) || 0})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input 
                    type="date" 
                    value={transactionToEdit.data_transacao} 
                    onChange={(e) => setTransactionToEdit({...transactionToEdit, data_transacao: e.target.value})} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={transactionToEdit.status} 
                  onValueChange={(v: any) => setTransactionToEdit({...transactionToEdit, status: v})}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Confirmado">Confirmado</SelectItem>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea 
                  value={transactionToEdit.observacoes || ''} 
                  onChange={(e) => setTransactionToEdit({...transactionToEdit, observacoes: e.target.value})} 
                  rows={3} 
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setIsEditTransactionOpen(false)
                  setTransactionToEdit(null)
                }}>
                  Cancelar
                </Button>
                <Button onClick={handleEditTransaction} disabled={updateTransactionMutation.isPending}>
                  {updateTransactionMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Alterações'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog para adicionar meta */}
      <Dialog open={isAddGoalOpen} onOpenChange={setIsAddGoalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nova Meta Financeira</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome da Meta *</Label>
              <Input 
                value={newGoal.nome} 
                onChange={(e) => setNewGoal({...newGoal, nome: e.target.value})} 
                placeholder="Ex: Reforma do Templo"
              />
            </div>
            <div className="space-y-2">
              <Label>Valor da Meta *</Label>
              <Input 
                type="number" 
                step="0.01" 
                value={newGoal.valor_meta} 
                onChange={(e) => setNewGoal({...newGoal, valor_meta: parseFloat(e.target.value) || 0})} 
                placeholder="0,00"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input 
                  type="date" 
                  value={newGoal.data_inicio} 
                  onChange={(e) => setNewGoal({...newGoal, data_inicio: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Data Limite (opcional)</Label>
                <Input 
                  type="date" 
                  value={newGoal.data_limite} 
                  onChange={(e) => setNewGoal({...newGoal, data_limite: e.target.value})} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Categoria (opcional)</Label>
              <Input 
                value={newGoal.categoria} 
                onChange={(e) => setNewGoal({...newGoal, categoria: e.target.value})} 
                placeholder="Ex: Infraestrutura"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea 
                value={newGoal.descricao} 
                onChange={(e) => setNewGoal({...newGoal, descricao: e.target.value})} 
                rows={3} 
                placeholder="Descreva o objetivo desta meta"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => {
                setIsAddGoalOpen(false)
                resetGoalForm()
              }}>
                Cancelar
              </Button>
              <Button onClick={handleAddGoal} disabled={addGoalMutation.isPending}>
                {addGoalMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Criar Meta'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar meta */}
      <Dialog open={isEditGoalOpen} onOpenChange={setIsEditGoalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Meta Financeira</DialogTitle></DialogHeader>
          {goalToEdit && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome da Meta</Label>
                <Input 
                  value={goalToEdit.nome} 
                  onChange={(e) => setGoalToEdit({...goalToEdit, nome: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Valor da Meta</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  value={goalToEdit.valor_meta} 
                  onChange={(e) => setGoalToEdit({...goalToEdit, valor_meta: parseFloat(e.target.value) || 0})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Atual</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  value={goalToEdit.valor_atual} 
                  onChange={(e) => setGoalToEdit({...goalToEdit, valor_atual: parseFloat(e.target.value) || 0})} 
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={goalToEdit.status} 
                  onValueChange={(v: any) => setGoalToEdit({...goalToEdit, status: v})}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Concluído">Concluído</SelectItem>
                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setIsEditGoalOpen(false)
                  setGoalToEdit(null)
                }}>
                  Cancelar
                </Button>
                <Button onClick={handleEditGoal} disabled={updateGoalMutation.isPending}>
                  {updateGoalMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Alterações'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {receiptTransaction && (
        <UnifiedReceiptDialog
          transaction={receiptTransaction}
          church={currentChurch}
          isOpen={!!receiptTransaction}
          onOpenChange={() => setReceiptTransaction(null)}
          onMarkAsIssued={(id) => markReceiptIssuedMutation.mutate(id)}
          canManage={canManageFinancial}
          churchId={currentChurchId!}
        />
      )}

      {detailsTransaction && (
        <TransactionDetailsDialog
          transaction={detailsTransaction}
          isOpen={detailsOpen}
          onOpenChange={setDetailsOpen}
          onReceipt={canManageFinancial ? generateReceipt : undefined}
        />
      )}
    </div>
  )
}

export default FinancialPanel