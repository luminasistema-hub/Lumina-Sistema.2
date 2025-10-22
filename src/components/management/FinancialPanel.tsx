import { useState, useEffect, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
import { Progress } from '../ui/progress'
import { Checkbox } from '../ui/checkbox'
import { toast } from 'sonner'
import { supabase } from '../../integrations/supabase/client'
import { UnifiedReceiptDialog } from '../financial/UnifiedReceiptDialog'
import { useChurchStore } from '../../stores/churchStore'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  PieChart,
  BarChart3,
  Download,
  Plus,
  Edit,
  Trash2,
  Receipt,
  CreditCard,
  Banknote,
  Building,
  Target,
  AlertTriangle,
  CheckCircle,
  Filter,
  Search,
  FileText,
  Printer,
  Tag,
  Upload,
  Settings,
  Calculator,
  Clock,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Bell,
  Wallet,
  PlusCircle,
  MinusCircle,
  Loader2,
  X
} from 'lucide-react'
import { ScrollArea } from '../ui/scroll-area'
import TransactionDetailsDialog from '../financial/TransactionDetailsDialog'
import ReportViewerDialog from '../financial/ReportViewerDialog'

// Interfaces... (as they were)
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

interface Budget {
  id: string
  categoria: string
  subcategoria?: string
  valor_orcado: number
  valor_gasto: number
  valor_disponivel: number
  mes_ano: string
  descricao?: string
  responsavel: string
  status: 'Ativo' | 'Excedido' | 'Finalizado'
  alertas_configurados: boolean
  id_igreja: string
}

interface FinancialGoal {
  id: string
  nome: string
  valor_meta: number
  valor_atual: number
  data_inicio: string
  data_limite: string
  categoria: string
  descricao: string
  status: 'Ativo' | 'Concluído' | 'Pausado' | 'Cancelado'
  contribuidores: number
  campanha_ativa: boolean
  id_igreja: string
}

interface FinancialReport {
  id: string
  tipo: 'Mensal' | 'Trimestral' | 'Anual' | 'Personalizado'
  periodo_inicio: string
  periodo_fim: string
  gerado_por: string
  data_geracao: string
  dados: {
    total_entradas: number
    total_saidas: number
    saldo_periodo: number
    categorias_entrada: Array<{categoria: string, valor: number}>
    categorias_saida: Array<{categoria: string, valor: number}>
    maior_entrada: FinancialTransaction | null
    maior_saida: FinancialTransaction | null
  }
}

const PAGE_SIZE = 10;

const FinancialPanel = () => {
  const { user, currentChurchId } = useAuthStore()
  const { getChurchById } = useChurchStore()
  const queryClient = useQueryClient()

  const [reports, setReports] = useState<FinancialReport[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
  const [isEditTransactionOpen, setIsEditTransactionOpen] = useState(false)
  const [transactionToEdit, setTransactionToEdit] = useState<FinancialTransaction | null>(null)
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false)
  const [isEditBudgetOpen, setIsEditBudgetOpen] = useState(false)
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null)
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false)
  const [isEditGoalOpen, setIsEditGoalOpen] = useState(false)
  const [goalToEdit, setGoalToEdit] = useState<FinancialGoal | null>(null)
  const [isGenerateReportOpen, setIsGenerateReportOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 500);
  const [viewMode, setViewMode] = useState<'dashboard' | 'transactions' | 'budget' | 'goals' | 'reports'>('dashboard')
  const [receiptTransaction, setReceiptTransaction] = useState<FinancialTransaction | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsTransaction, setDetailsTransaction] = useState<FinancialTransaction | null>(null)
  const [reportViewerOpen, setReportViewerOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<FinancialReport | null>(null)
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('all')
  const [page, setPage] = useState(0);

  const canManageFinancial = user?.role === 'admin' || user?.role === 'pastor' || user?.role === 'financeiro'

  const [newTransaction, setNewTransaction] = useState({
    tipo: 'Entrada' as 'Entrada' | 'Saída',
    categoria: '',
    subcategoria: '',
    valor: 0,
    data_transacao: new Date().toISOString().split('T')[0],
    descricao: '',
    metodo_pagamento: 'PIX',
    observacoes: '',
    centro_custo: '',
    numero_documento: '',
    membro_id: '' as string
  })

  const [newBudget, setNewBudget] = useState({
    categoria: '',
    subcategoria: '',
    valor_orcado: 0,
    mes_ano: new Date().toISOString().slice(0, 7),
    descricao: '',
    alertas_configurados: true
  })

  const [newGoal, setNewGoal] = useState({
    nome: '',
    valor_meta: 0,
    data_limite: '',
    categoria: '',
    descricao: '',
    campanha_ativa: false,
    status: 'Ativo' as FinancialGoal['status']
  })

  const [reportParams, setReportParams] = useState({
    tipo: 'Mensal' as const,
    periodo_inicio: new Date().toISOString().split('T')[0],
    periodo_fim: new Date().toISOString().split('T')[0],
    incluir_graficos: true,
    incluir_detalhes: true
  })

  const categoriesEntrada = ['Dízimos', 'Ofertas', 'Doações Especiais', 'Eventos', 'Vendas', 'Aluguel de Espaço', 'Investimentos', 'Rendimentos', 'Transferências', 'Outros']
  const categoriesSaida = ['Pessoal', 'Manutenção', 'Utilidades', 'Ministérios', 'Eventos', 'Equipamentos', 'Reforma/Construção', 'Ação Social', 'Missões', 'Impostos', 'Seguros', 'Transporte', 'Marketing', 'Jurídico', 'Outros']
  const allCategories = useMemo(() => Array.from(new Set([...categoriesEntrada, ...categoriesSaida])), [])
  const subcategorias: Record<string, string[]> = { 'Pessoal': ['Salários', 'Benefícios', 'Encargos', 'Ajuda de Custo', 'Treinamentos'], 'Utilidades': ['Energia Elétrica', 'Água', 'Internet', 'Telefone', 'Gás'], 'Manutenção': ['Limpeza', 'Jardinagem', 'Reparos', 'Materiais'], 'Ministérios': ['Louvor', 'Kids', 'Jovens', 'Diaconato', 'Ensino'], 'Eventos': ['Materiais', 'Alimentação', 'Decoração', 'Equipamentos'], 'Equipamentos': ['Som', 'Vídeo', 'Instrumentos', 'Móveis', 'Informática'] }
  const metodosPagamento = ['PIX', 'Dinheiro', 'Cartão Débito', 'Cartão Crédito', 'Transferência', 'Cheque', 'Boleto']

  const { data: membersData, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['members', currentChurchId],
    queryFn: async () => {
      const { data, error } = await supabase.from('membros').select('id, nome_completo').eq('id_igreja', currentChurchId!).order('nome_completo');
      if (error) throw error;
      return data;
    },
    enabled: !!currentChurchId,
  });
  const members = membersData || [];

  const { data: budgetsData, isLoading: isLoadingBudgets } = useQuery({
    queryKey: ['budgets', currentChurchId],
    queryFn: async () => {
      const { data, error } = await supabase.from('orcamentos').select('*').eq('id_igreja', currentChurchId!).order('mes_ano', { ascending: false });
      if (error) throw error;
      return data.map(b => ({ ...b, valor_disponivel: b.valor_orcado - b.valor_gasto })) as Budget[];
    },
    enabled: !!currentChurchId,
  });
  const budgets = budgetsData || [];

  const { data: goalsData, isLoading: isLoadingGoals } = useQuery({
    queryKey: ['financialGoals', currentChurchId],
    queryFn: async () => {
        const { data, error } = await supabase.from('metas_financeiras').select('*').eq('id_igreja', currentChurchId!).order('data_limite');
        if (error) throw error;
        return data as FinancialGoal[];
    },
    enabled: !!currentChurchId,
  });
  const goals = goalsData || [];

  const { data: transactionsResponse, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['transactions', currentChurchId, page, debouncedSearchTerm, selectedCategory, selectedMemberFilter],
    queryFn: async () => {
      let query = supabase
        .from('transacoes_financeiras')
        .select('*', { count: 'exact' })
        .eq('id_igreja', currentChurchId!)
        .order('data_transacao', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (debouncedSearchTerm) {
        query = query.or(`descricao.ilike.%${debouncedSearchTerm}%,numero_documento.ilike.%${debouncedSearchTerm}%,responsavel.ilike.%${debouncedSearchTerm}%`);
      }
      if (selectedCategory !== 'all') {
        query = query.eq('categoria', selectedCategory);
      }
      if (selectedMemberFilter !== 'all') {
        query = query.eq('membro_id', selectedMemberFilter);
      }

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data as FinancialTransaction[], count };
    },
    enabled: !!currentChurchId,
  });
  const transactions = transactionsResponse?.data || [];
  const transactionCount = transactionsResponse?.count || 0;

  const { data: pendingNotifications, isLoading: isLoadingNotifications } = useQuery({
    queryKey: ['pendingFinancialNotifications', currentChurchId],
    queryFn: async () => {
      const { data, error } = await supabase.from('eventos_aplicacao').select('*').eq('church_id', currentChurchId!).eq('event_name', 'nova_contribuicao_pendente').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!currentChurchId,
  });

  const isLoadingData = isLoadingMembers || isLoadingBudgets || isLoadingGoals || isLoadingTransactions || isLoadingNotifications;

  useEffect(() => {
    if (!currentChurchId) return;
    const channel = supabase.channel(`financial-panel-${currentChurchId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transacoes_financeiras' }, () => queryClient.invalidateQueries({ queryKey: ['transactions'] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orcamentos' }, () => queryClient.invalidateQueries({ queryKey: ['budgets'] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'metas_financeiras' }, () => queryClient.invalidateQueries({ queryKey: ['financialGoals'] }))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'eventos_aplicacao' }, () => queryClient.invalidateQueries({ queryKey: ['pendingFinancialNotifications'] }))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentChurchId, queryClient]);

  const invalidateAllQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
    queryClient.invalidateQueries({ queryKey: ['budgets'] });
    queryClient.invalidateQueries({ queryKey: ['financialGoals'] });
    queryClient.invalidateQueries({ queryKey: ['pendingFinancialNotifications'] });
  }

  const markReceiptAsIssued = async (transactionId: string) => {
    // ... (implementation is fine)
  }

  const handleAddTransaction = async () => {
    // ... (implementation is fine)
    // On success:
    // invalidateAllQueries();
  }

  const handleEditTransaction = async () => {
    // ... (implementation is fine)
    // On success:
    // invalidateAllQueries();
  }

  const handleDeleteTransaction = async (transactionId: string) => {
    // ... (implementation is fine)
    // On success:
    // invalidateAllQueries();
  }

  const approveTransaction = async (transactionId: string) => {
    // ... (implementation is fine)
    // On success:
    // invalidateAllQueries();
  }

  const rejectTransaction = async (transactionId: string) => {
    // ... (implementation is fine)
    // On success:
    // invalidateAllQueries();
  }

  const generateReceipt = (transaction: FinancialTransaction) => {
    if (transaction.tipo === 'Saída') {
      toast.error('Recibos só podem ser gerados para entradas')
      return
    }
    setReceiptTransaction(transaction)
  }

  const openDetails = (transaction: FinancialTransaction) => {
    setDetailsTransaction(transaction)
    setDetailsOpen(true)
  }

  const viewReport = (report: FinancialReport) => {
    setSelectedReport(report)
    setReportViewerOpen(true)
  }

  const downloadReportCsv = (report: FinancialReport) => {
    // ... (implementation is fine)
  }

  const handleAddBudget = async () => {
    // ... (implementation is fine)
    // On success:
    // queryClient.invalidateQueries({ queryKey: ['budgets'] });
  }

  const handleEditBudget = async () => {
    // ... (implementation is fine)
    // On success:
    // queryClient.invalidateQueries({ queryKey: ['budgets'] });
  }

  const handleDeleteBudget = async (budgetId: string) => {
    // ... (implementation is fine)
    // On success:
    // queryClient.invalidateQueries({ queryKey: ['budgets'] });
  }

  const handleAddGoal = async () => {
    // ... (implementation is fine)
    // On success:
    // queryClient.invalidateQueries({ queryKey: ['financialGoals'] });
  }

  const handleEditGoal = async () => {
    // ... (implementation is fine)
    // On success:
    // queryClient.invalidateQueries({ queryKey: ['financialGoals'] });
  }

  const handleDeleteGoal = async (goalId: string) => {
    // ... (implementation is fine)
    // On success:
    // queryClient.invalidateQueries({ queryKey: ['financialGoals'] });
  }

  const generateReport = () => {
    // ... (implementation is fine)
  }

  const financialSummary = useMemo(() => {
    const allTransactions = queryClient.getQueryData<FinancialTransaction[]>(['transactions', currentChurchId]) || [];
    const currentMonth = new Date().toISOString().slice(0, 7)
    const confirmedTransactions = allTransactions.filter(t => t.status === 'Confirmado')
    
    const totalEntradas = confirmedTransactions.filter(t => t.tipo === 'Entrada').reduce((sum, t) => sum + t.valor, 0)
    const totalSaidas = confirmedTransactions.filter(t => t.tipo === 'Saída').reduce((sum, t) => sum + t.valor, 0)
    const saldoAtual = totalEntradas - totalSaidas

    const entradasMes = confirmedTransactions.filter(t => t.tipo === 'Entrada' && t.data_transacao.startsWith(currentMonth)).reduce((sum, t) => sum + t.valor, 0)
    const saidasMes = confirmedTransactions.filter(t => t.tipo === 'Saída' && t.data_transacao.startsWith(currentMonth)).reduce((sum, t) => sum + t.valor, 0)
    const saldoMes = entradasMes - saidasMes

    const pendingTransactionsCount = allTransactions.filter(t => t.status === 'Pendente').length

    return { totalEntradas, totalSaidas, saldoAtual, entradasMes, saidasMes, saldoMes, pendingTransactionsCount }
  }, [queryClient, currentChurchId, transactionsResponse]); // Depend on response to re-calculate

  const budgetSummary = useMemo(() => {
    const budgetTotal = budgets.reduce((sum, b) => sum + b.valor_orcado, 0)
    const budgetUsed = budgets.reduce((sum, b) => sum + b.valor_gasto, 0)
    const budgetProgress = budgetTotal > 0 ? (budgetUsed / budgetTotal) * 100 : 0
    return { budgetTotal, budgetUsed, budgetProgress }
  }, [budgets])

  const pendingTransactions = useMemo(() => transactions.filter(t => t.status === 'Pendente'), [transactions])

  if (!currentChurchId) {
    return (
      <div className="p-6 text-center text-gray-600">
        Selecione uma igreja para gerenciar o painel financeiro.
      </div>
    )
  }

  if (isLoadingData && !transactions.length) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        <p className="ml-3 text-lg text-gray-600">Carregando dados financeiros...</p>
      </div>
    )
  }

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* ... Rest of the JSX is largely the same, but I'll add pagination controls ... */}
      {/* In TabsContent for "transactions" */}
      <TabsContent value="transactions" className="space-y-4">
        {/* ... filters ... */}
        
        {/* ... pending transactions ... */}

        {/* All Transactions List */}
        <div className="space-y-4">
          {isLoadingTransactions && <div className="text-center p-4"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>}
          {!isLoadingTransactions && transactions.map((transaction) => (
            <Card key={transaction.id} className="border-0 shadow-sm">
              {/* ... card content ... */}
            </Card>
          ))}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between pt-4">
          <span className="text-sm text-gray-600">
            Página {page + 1} de {Math.ceil(transactionCount / PAGE_SIZE)}
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
      </TabsContent>
      {/* ... other tabs ... */}
    </div>
  )
}

export default FinancialPanel