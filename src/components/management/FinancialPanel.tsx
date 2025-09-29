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
import { Progress } from '../ui/progress'
import { Checkbox } from '../ui/checkbox'
import { toast } from 'sonner'
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
  MinusCircle
} from 'lucide-react'

interface FinancialTransaction {
  id: string
  tipo: 'Entrada' | 'Saída'
  categoria: string
  subcategoria?: string
  valor: number
  data: string
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
    maior_entrada: FinancialTransaction
    maior_saida: FinancialTransaction
  }
}

const FinancialPanel = () => {
  const { user } = useAuthStore()
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [goals, setGoals] = useState<FinancialGoal[]>([])
  const [reports, setReports] = useState<FinancialReport[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
  const [isAddBudgetOpen, setIsAddBudgetOpen] = useState(false)
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false)
  const [isGenerateReportOpen, setIsGenerateReportOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'dashboard' | 'transactions' | 'budget' | 'goals' | 'reports'>('dashboard')

  const canManageFinancial = user?.role === 'admin' || user?.role === 'pastor' || user?.role === 'financeiro'

  const [newTransaction, setNewTransaction] = useState({
    tipo: 'Entrada' as const,
    categoria: '',
    subcategoria: '',
    valor: 0,
    data: new Date().toISOString().split('T')[0],
    descricao: '',
    metodo_pagamento: 'PIX',
    observacoes: '',
    centro_custo: '',
    numero_documento: ''
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
    campanha_ativa: false
  })

  const [reportParams, setReportParams] = useState({
    tipo: 'Mensal' as const,
    periodo_inicio: new Date().toISOString().split('T')[0],
    periodo_fim: new Date().toISOString().split('T')[0],
    incluir_graficos: true,
    incluir_detalhes: true
  })

  // Categorias financeiras
  const categoriesEntrada = [
    'Dízimos',
    'Ofertas',
    'Doações Especiais',
    'Eventos',
    'Vendas',
    'Aluguel de Espaço',
    'Investimentos',
    'Rendimentos',
    'Transferências',
    'Outros'
  ]

  const categoriesSaida = [
    'Pessoal',
    'Manutenção',
    'Utilidades',
    'Ministérios',
    'Eventos',
    'Equipamentos',
    'Reforma/Construção',
    'Ação Social',
    'Missões',
    'Impostos',
    'Seguros',
    'Transporte',
    'Marketing',
    'Jurídico',
    'Outros'
  ]

  const subcategorias = {
    'Pessoal': ['Salários', 'Benefícios', 'Encargos', 'Ajuda de Custo', 'Treinamentos'],
    'Utilidades': ['Energia Elétrica', 'Água', 'Internet', 'Telefone', 'Gás'],
    'Manutenção': ['Limpeza', 'Jardinagem', 'Reparos', 'Materiais'],
    'Ministérios': ['Louvor', 'Kids', 'Jovens', 'Diaconato', 'Ensino'],
    'Eventos': ['Materiais', 'Alimentação', 'Decoração', 'Equipamentos'],
    'Equipamentos': ['Som', 'Vídeo', 'Instrumentos', 'Móveis', 'Informática']
  }

  const metodosPagamento = ['PIX', 'Dinheiro', 'Cartão Débito', 'Cartão Crédito', 'Transferência', 'Cheque', 'Boleto']

  // Mock data mais completo
  useEffect(() => {
    console.log('FinancialPanel: Loading complete financial data...')
    const mockTransactions: FinancialTransaction[] = [
      {
        id: '1',
        tipo: 'Entrada',
        categoria: 'Dízimos',
        valor: 15000.00,
        data: '2025-09-01',
        descricao: 'Dízimos do mês de setembro - Coleta automática',
        metodo_pagamento: 'Múltiplos',
        responsavel: 'Sistema Automático',
        status: 'Confirmado',
        recibo_emitido: true,
        numero_documento: 'DZ-202509-001',
        centro_custo: 'Geral',
        aprovado_por: 'Pastor João',
        data_aprovacao: '2025-09-01'
      },
      {
        id: '2',
        tipo: 'Entrada',
        categoria: 'Ofertas',
        valor: 5200.00,
        data: '2025-09-08',
        descricao: 'Ofertas dos cultos dominicais',
        metodo_pagamento: 'Múltiplos',
        responsavel: 'Sistema Automático',
        status: 'Confirmado',
        recibo_emitido: true,
        numero_documento: 'OF-202509-008',
        centro_custo: 'Geral'
      },
      {
        id: '3',
        tipo: 'Saída',
        categoria: 'Pessoal',
        subcategoria: 'Salários',
        valor: 8000.00,
        data: '2025-09-05',
        descricao: 'Salários equipe pastoral - Setembro',
        metodo_pagamento: 'Transferência',
        responsavel: user?.name || 'Administrador Financeiro',
        status: 'Confirmado',
        numero_documento: 'SAL-202509-001',
        centro_custo: 'Administrativo',
        aprovado_por: 'Pastor João',
        data_aprovacao: '2025-09-05'
      },
      {
        id: '4',
        tipo: 'Saída',
        categoria: 'Utilidades',
        subcategoria: 'Energia Elétrica',
        valor: 850.00,
        data: '2025-09-10',
        descricao: 'Conta de energia elétrica - Setembro',
        metodo_pagamento: 'PIX',
        responsavel: user?.name || 'Administrador Financeiro',
        status: 'Confirmado',
        numero_documento: 'EE-202509-001',
        centro_custo: 'Infraestrutura'
      },
      {
        id: '5',
        tipo: 'Entrada',
        categoria: 'Doações Especiais',
        valor: 2500.00,
        data: '2025-09-12',
        descricao: 'Doação para reforma do templo',
        metodo_pagamento: 'PIX',
        responsavel: 'Maria Santos', // Corrigido de 'responsável' para 'responsavel'
        status: 'Confirmado',
        membro_nome: 'Maria Santos Silva',
        recibo_emitido: true,
        numero_documento: 'DE-202509-012',
        centro_custo: 'Projetos Especiais'
      },
      {
        id: '6',
        tipo: 'Saída',
        categoria: 'Ministérios',
        subcategoria: 'Kids',
        valor: 300.00,
        data: '2025-09-13',
        descricao: 'Materiais didáticos ministério kids',
        metodo_pagamento: 'Cartão Débito',
        responsavel: 'Líder Kids',
        status: 'Pendente',
        numero_documento: 'MK-202509-013',
        centro_custo: 'Ministério Kids'
      }
    ]

    const mockBudgets: Budget[] = [
      {
        id: '1',
        categoria: 'Pessoal',
        valor_orcado: 12000,
        valor_gasto: 8000,
        valor_disponivel: 4000,
        mes_ano: '2025-09',
        responsavel: 'Administração',
        status: 'Ativo',
        alertas_configurados: true,
        descricao: 'Orçamento para folha de pagamento'
      },
      {
        id: '2',
        categoria: 'Utilidades',
        valor_orcado: 2500,
        valor_gasto: 1850,
        valor_disponivel: 650,
        mes_ano: '2025-09',
        responsavel: 'Administração',
        status: 'Ativo',
        alertas_configurados: true,
        descricao: 'Contas básicas (luz, água, internet)'
      },
      {
        id: '3',
        categoria: 'Ministérios',
        valor_orcado: 1500,
        valor_gasto: 1600,
        valor_disponivel: -100,
        mes_ano: '2025-09',
        responsavel: 'Coordenação de Ministérios',
        status: 'Excedido',
        alertas_configurados: true,
        descricao: 'Atividades dos ministérios'
      }
    ]

    const mockGoals: FinancialGoal[] = [
      {
        id: '1',
        nome: 'Reforma do Templo Principal',
        valor_meta: 80000,
        valor_atual: 25000,
        data_inicio: '2025-01-01',
        data_limite: '2025-12-31',
        categoria: 'Reforma/Construção',
        descricao: 'Reforma completa do templo principal incluindo pintura, piso e sistema elétrico',
        status: 'Ativo',
        contribuidores: 45,
        campanha_ativa: true
      },
      {
        id: '2',
        nome: 'Equipamentos de Som Novos',
        valor_meta: 15000,
        valor_atual: 8500,
        data_inicio: '2025-06-01',
        data_limite: '2025-11-30',
        categoria: 'Equipamentos',
        descricao: 'Aquisição de novo sistema de som digital para o templo',
        status: 'Ativo',
        contribuidores: 12,
        campanha_ativa: true
      },
      {
        id: '3',
        nome: 'Fundo de Emergência',
        valor_meta: 30000,
        valor_atual: 30000,
        data_inicio: '2024-01-01',
        data_limite: '2025-12-31',
        categoria: 'Reserva',
        descricao: 'Fundo para emergências e imprevistos da igreja',
        status: 'Concluído',
        contribuidores: 78,
        campanha_ativa: false
      }
    ]

    setTransactions(mockTransactions)
    setBudgets(mockBudgets)
    setGoals(mockGoals)
  }, [user])

  const handleAddTransaction = () => {
    if (!newTransaction.categoria || !newTransaction.valor || !newTransaction.descricao) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    const numeroDocumento = `${newTransaction.tipo === 'Entrada' ? 'ENT' : 'SAI'}-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(transactions.length + 1).padStart(3, '0')}`

    const transaction: FinancialTransaction = {
      id: Date.now().toString(),
      tipo: newTransaction.tipo,
      categoria: newTransaction.categoria,
      subcategoria: newTransaction.subcategoria,
      valor: newTransaction.valor,
      data: newTransaction.data,
      descricao: newTransaction.descricao,
      metodo_pagamento: newTransaction.metodo_pagamento,
      responsavel: user?.name || '',
      status: 'Pendente',
      observacoes: newTransaction.observacoes,
      numero_documento: numeroDocumento,
      centro_custo: newTransaction.centro_custo || 'Geral'
    }

    setTransactions([transaction, ...transactions])
    setIsAddTransactionOpen(false)
    setNewTransaction({
      tipo: 'Entrada',
      categoria: '',
      subcategoria: '',
      valor: 0,
      data: new Date().toISOString().split('T')[0],
      descricao: '',
      metodo_pagamento: 'PIX',
      observacoes: '',
      centro_custo: '',
      numero_documento: ''
    })
    toast.success('Transação adicionada com sucesso!')
  }

  const handleAddBudget = () => {
    if (!newBudget.categoria || !newBudget.valor_orcado) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    const budget: Budget = {
      id: Date.now().toString(),
      categoria: newBudget.categoria,
      subcategoria: newBudget.subcategoria,
      valor_orcado: newBudget.valor_orcado,
      valor_gasto: 0,
      valor_disponivel: newBudget.valor_orcado,
      mes_ano: newBudget.mes_ano,
      descricao: newBudget.descricao,
      responsavel: user?.name || '',
      status: 'Ativo',
      alertas_configurados: newBudget.alertas_configurados
    }

    setBudgets([...budgets, budget])
    setIsAddBudgetOpen(false)
    setNewBudget({
      categoria: '',
      subcategoria: '',
      valor_orcado: 0,
      mes_ano: new Date().toISOString().slice(0, 7),
      descricao: '',
      alertas_configurados: true
    })
    toast.success('Orçamento criado com sucesso!')
  }

  const handleAddGoal = () => {
    if (!newGoal.nome || !newGoal.valor_meta || !newGoal.data_limite) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    const goal: FinancialGoal = {
      id: Date.now().toString(),
      nome: newGoal.nome,
      valor_meta: newGoal.valor_meta,
      valor_atual: 0,
      data_inicio: new Date().toISOString().split('T')[0],
      data_limite: newGoal.data_limite,
      categoria: newGoal.categoria,
      descricao: newGoal.descricao,
      status: 'Ativo',
      contribuidores: 0,
      campanha_ativa: newGoal.campanha_ativa
    }

    setGoals([...goals, goal])
    setIsAddGoalOpen(false)
    setNewGoal({
      nome: '',
      valor_meta: 0,
      data_limite: '',
      categoria: '',
      descricao: '',
      campanha_ativa: false
    })
    toast.success('Meta financeira criada com sucesso!')
  }

  const approveTransaction = (transactionId: string) => {
    setTransactions(prev => prev.map(t => 
      t.id === transactionId 
        ? { 
            ...t, 
            status: 'Confirmado' as const,
            aprovado_por: user?.name,
            data_aprovacao: new Date().toISOString().split('T')[0]
          }
        : t
    ))

    // Atualizar orçamentos
    const transaction = transactions.find(t => t.id === transactionId)
    if (transaction && transaction.tipo === 'Saída') {
      setBudgets(prev => prev.map(budget => {
        if (budget.categoria === transaction.categoria && budget.mes_ano === transaction.data.slice(0, 7)) {
          const novoGasto = budget.valor_gasto + transaction.valor
          return {
            ...budget,
            valor_gasto: novoGasto,
            valor_disponivel: budget.valor_orcado - novoGasto,
            status: novoGasto > budget.valor_orcado ? 'Excedido' as const : 'Ativo' as const
          }
        }
        return budget
      }))
    }

    toast.success('Transação aprovada com sucesso!')
  }

  const generateReceipt = (transaction: FinancialTransaction) => {
    if (transaction.tipo === 'Saída') {
      toast.error('Recibos só podem ser gerados para entradas')
      return
    }

    const receiptData = {
      numero: transaction.numero_documento || `REC-${transaction.id}`,
      data_emissao: new Date().toLocaleDateString('pt-BR'),
      valor: transaction.valor,
      descricao: transaction.descricao,
      categoria: transaction.categoria,
      metodo_pagamento: transaction.metodo_pagamento,
      igreja: {
        nome: 'Igreja Connect Vida',
        endereco: 'Rua da Igreja, 123 - Centro - São Paulo/SP',
        cnpj: '12.345.678/0001-90',
        telefone: '(11) 99999-9999'
      },
      doador: transaction.membro_nome || 'Anônimo'
    }

    console.log('Generating receipt:', receiptData)
    
    setTransactions(prev => prev.map(t => 
      t.id === transaction.id 
        ? { ...t, recibo_emitido: true }
        : t
    ))

    toast.success('Recibo gerado com sucesso!')
  }

  const generateReport = () => {
    const startDate = new Date(reportParams.periodo_inicio)
    const endDate = new Date(reportParams.periodo_fim)
    
    const filteredTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.data)
      return transactionDate >= startDate && transactionDate <= endDate && t.status === 'Confirmado'
    })

    const entradas = filteredTransactions.filter(t => t.tipo === 'Entrada')
    const saidas = filteredTransactions.filter(t => t.tipo === 'Saída')

    const total_entradas = entradas.reduce((sum, t) => sum + t.valor, 0)
    const total_saidas = saidas.reduce((sum, t) => sum + t.valor, 0)

    const categorias_entrada = categoriesEntrada.map(cat => ({
      categoria: cat,
      valor: entradas.filter(t => t.categoria === cat).reduce((sum, t) => sum + t.valor, 0)
    })).filter(c => c.valor > 0)

    const categorias_saida = categoriesSaida.map(cat => ({
      categoria: cat,
      valor: saidas.filter(t => t.categoria === cat).reduce((sum, t) => sum + t.valor, 0)
    })).filter(c => c.valor > 0)

    const report: FinancialReport = {
      id: Date.now().toString(),
      tipo: reportParams.tipo,
      periodo_inicio: reportParams.periodo_inicio,
      periodo_fim: reportParams.periodo_fim,
      gerado_por: user?.name || '',
      data_geracao: new Date().toISOString(),
      dados: {
        total_entradas,
        total_saidas,
        saldo_periodo: total_entradas - total_saidas,
        categorias_entrada,
        categorias_saida,
        maior_entrada: entradas.sort((a, b) => b.valor - a.valor)[0],
        maior_saida: saidas.sort((a, b) => b.valor - a.valor)[0]
      }
    }

    setReports([report, ...reports])
    setIsGenerateReportOpen(false)
    toast.success('Relatório gerado com sucesso!')
  }

  // Cálculos para dashboard
  const currentMonth = new Date().toISOString().slice(0, 7)
  const confirmedTransactions = transactions.filter(t => t.status === 'Confirmado')
  const pendingTransactions = transactions.filter(t => t.status === 'Pendente')
  
  const totalEntradas = confirmedTransactions.filter(t => t.tipo === 'Entrada').reduce((sum, t) => sum + t.valor, 0)
  const totalSaidas = confirmedTransactions.filter(t => t.tipo === 'Saída').reduce((sum, t) => sum + t.valor, 0)
  const saldoAtual = totalEntradas - totalSaidas

  const entradasMes = confirmedTransactions.filter(t => t.tipo === 'Entrada' && t.data.startsWith(currentMonth)).reduce((sum, t) => sum + t.valor, 0)
  const saidasMes = confirmedTransactions.filter(t => t.tipo === 'Saída' && t.data.startsWith(currentMonth)).reduce((sum, t) => sum + t.valor, 0)
  const saldoMes = entradasMes - saidasMes

  const budgetTotal = budgets.reduce((sum, b) => sum + b.valor_orcado, 0)
  const budgetUsed = budgets.reduce((sum, b) => sum + b.valor_gasto, 0)
  const budgetProgress = budgetTotal > 0 ? (budgetUsed / budgetTotal) * 100 : 0

  const activeGoals = goals.filter(g => g.status === 'Ativo')
  const completedGoals = goals.filter(g => g.status === 'Concluído')

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-xl md:rounded-2xl p-4 md:p-6 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Gestão Financeira 💰</h1>
        <p className="text-green-100 text-base md:text-lg">
          Controle completo das finanças da igreja com relatórios avançados
        </p>
      </div>

      {/* Navigation */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as typeof viewMode)}>
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <TabsList className="grid grid-cols-5 w-full lg:w-auto">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="transactions">Transações</TabsTrigger>
            <TabsTrigger value="budget">Orçamento</TabsTrigger>
            <TabsTrigger value="goals">Metas</TabsTrigger>
            <TabsTrigger value="reports">Relatórios</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Dialog open={isGenerateReportOpen} onOpenChange={setIsGenerateReportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Gerar Relatório
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Gerar Relatório Financeiro</DialogTitle>
                  <DialogDescription>
                    Configure os parâmetros do relatório
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tipo de Relatório</Label>
                    <Select value={reportParams.tipo} onValueChange={(value) => setReportParams({...reportParams, tipo: value as typeof reportParams.tipo})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mensal">Mensal</SelectItem>
                        <SelectItem value="Trimestral">Trimestral</SelectItem>
                        <SelectItem value="Anual">Anual</SelectItem>
                        <SelectItem value="Personalizado">Personalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data Início</Label>
                      <Input
                        type="date"
                        value={reportParams.periodo_inicio}
                        onChange={(e) => setReportParams({...reportParams, periodo_inicio: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data Fim</Label>
                      <Input
                        type="date"
                        value={reportParams.periodo_fim}
                        onChange={(e) => setReportParams({...reportParams, periodo_fim: e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="graficos"
                        checked={reportParams.incluir_graficos}
                        onCheckedChange={(checked) => setReportParams({...reportParams, incluir_graficos: checked as boolean})}
                      />
                      <Label htmlFor="graficos">Incluir gráficos</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="detalhes"
                        checked={reportParams.incluir_detalhes}
                        onCheckedChange={(checked) => setReportParams({...reportParams, incluir_detalhes: checked as boolean})}
                      />
                      <Label htmlFor="detalhes">Incluir detalhes das transações</Label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsGenerateReportOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={generateReport}>
                      Gerar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Financial Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Saldo Atual</p>
                    <p className={`text-xl md:text-2xl font-bold ${saldoAtual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      R$ {saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Wallet className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Entradas (Mês)</p>
                    <p className="text-xl md:text-2xl font-bold text-green-600">
                      R$ {entradasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-green-50 rounded-lg flex items-center justify-center">
                    <ArrowUpRight className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Saídas (Mês)</p>
                    <p className="text-xl md:text-2xl font-bold text-red-600">
                      R$ {saidasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-red-50 rounded-lg flex items-center justify-center">
                    <ArrowDownRight className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pendências</p>
                    <p className="text-xl md:text-2xl font-bold text-orange-600">
                      {pendingTransactions.length}
                    </p>
                  </div>
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions and Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-green-500" />
                  Ações Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full justify-start" variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Transação
                    </Button>
                  </DialogTrigger>
                </Dialog>
                <Dialog open={isAddBudgetOpen} onOpenChange={setIsAddBudgetOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full justify-start" variant="outline">
                      <Target className="w-4 h-4 mr-2" />
                      Novo Orçamento
                    </Button>
                  </DialogTrigger>
                </Dialog>
                <Dialog open={isAddGoalOpen} onOpenChange={setIsAddGoalOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full justify-start" variant="outline">
                      <Calculator className="w-4 h-4 mr-2" />
                      Nova Meta
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-yellow-500" />
                  Alertas Financeiros
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {budgets.filter(b => b.status === 'Excedido').map(budget => (
                  <div key={budget.id} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg border-l-4 border-red-400">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <div className="text-sm">
                      <p className="font-medium text-red-800">Orçamento Excedido</p>
                      <p className="text-red-600">{budget.categoria}</p>
                    </div>
                  </div>
                ))}
                {pendingTransactions.length > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                    <Clock className="w-4 h-4 text-yellow-500" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800">{pendingTransactions.length} Pendências</p>
                      <p className="text-yellow-600">Aguardando aprovação</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  Metas em Andamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {activeGoals.slice(0, 3).map(goal => (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium truncate">{goal.nome}</span>
                      <span>{Math.round((goal.valor_atual / goal.valor_meta) * 100)}%</span>
                    </div>
                    <Progress value={(goal.valor_atual / goal.valor_meta) * 100} className="h-2" />
                    <p className="text-xs text-gray-500">
                      R$ {goal.valor_atual.toLocaleString('pt-BR')} de R$ {goal.valor_meta.toLocaleString('pt-BR')}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Budget Overview */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-500" />
                Execução Orçamentária - {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {budgets.map(budget => (
                  <div key={budget.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{budget.categoria}</span>
                        {budget.subcategoria && (
                          <Badge variant="outline" className="text-xs">{budget.subcategoria}</Badge>
                        )}
                        {budget.status === 'Excedido' && (
                          <Badge className="bg-red-100 text-red-800 text-xs">Excedido</Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          R$ {budget.valor_gasto.toLocaleString('pt-BR')} / R$ {budget.valor_orcado.toLocaleString('pt-BR')}
                        </p>
                        <p className="text-xs text-gray-500">
                          {((budget.valor_gasto / budget.valor_orcado) * 100).toFixed(1)}% utilizado
                        </p>
                      </div>
                    </div>
                    <Progress 
                      value={(budget.valor_gasto / budget.valor_orcado) * 100} 
                      className={`h-2 ${budget.status === 'Excedido' ? 'bg-red-100' : ''}`}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          {/* Transaction Filters and Add Button */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex gap-3 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar transações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {[...categoriesEntrada, ...categoriesSaida].map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {canManageFinancial && (
              <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-500 hover:bg-green-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Transação
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Nova Transação</DialogTitle>
                    <DialogDescription>
                      Registre uma nova movimentação financeira
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tipo">Tipo *</Label>
                        <Select value={newTransaction.tipo} onValueChange={(value) => setNewTransaction({...newTransaction, tipo: value as 'Entrada' | 'Saída'})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo" /> {/* Adicionado placeholder */}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Entrada">Entrada</SelectItem>
                            <SelectItem value="Saída">Saída</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="categoria">Categoria *</Label>
                        <Select value={newTransaction.categoria} onValueChange={(value) => setNewTransaction({...newTransaction, categoria: value, subcategoria: ''})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {(newTransaction.tipo === 'Entrada' ? categoriesEntrada : categoriesSaida).map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {newTransaction.categoria && subcategorias[newTransaction.categoria as keyof typeof subcategorias] && (
                      <div className="space-y-2">
                        <Label htmlFor="subcategoria">Subcategoria</Label>
                        <Select value={newTransaction.subcategoria} onValueChange={(value) => setNewTransaction({...newTransaction, subcategoria: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a subcategoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {subcategorias[newTransaction.categoria as keyof typeof subcategorias]?.map(subcat => (
                              <SelectItem key={subcat} value={subcat}>{subcat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="valor">Valor (R$) *</Label>
                        <Input
                          id="valor"
                          type="number"
                          step="0.01"
                          value={newTransaction.valor || ''}
                          onChange={(e) => setNewTransaction({...newTransaction, valor: parseFloat(e.target.value) || 0})}
                          placeholder="0,00"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="data">Data *</Label>
                        <Input
                          id="data"
                          type="date"
                          value={newTransaction.data}
                          onChange={(e) => setNewTransaction({...newTransaction, data: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="descricao">Descrição *</Label>
                      <Input
                        id="descricao"
                        value={newTransaction.descricao}
                        onChange={(e) => setNewTransaction({...newTransaction, descricao: e.target.value})}
                        placeholder="Descrição da transação"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="metodo">Método de Pagamento</Label>
                        <Select value={newTransaction.metodo_pagamento} onValueChange={(value) => setNewTransaction({...newTransaction, metodo_pagamento: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {metodosPagamento.map(metodo => (
                              <SelectItem key={metodo} value={metodo}>{metodo}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="centro_custo">Centro de Custo</Label>
                        <Input
                          id="centro_custo"
                          value={newTransaction.centro_custo}
                          onChange={(e) => setNewTransaction({...newTransaction, centro_custo: e.target.value})}
                          placeholder="Ex: Geral, Ministério Kids"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="observacoes">Observações</Label>
                      <Textarea
                        id="observacoes"
                        value={newTransaction.observacoes}
                        onChange={(e) => setNewTransaction({...newTransaction, observacoes: e.target.value})}
                        placeholder="Observações adicionais"
                        rows={2}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsAddTransactionOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleAddTransaction}>
                        Adicionar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Transactions List */}
          <div className="space-y-4">
            {transactions
              .filter(t => 
                (selectedCategory === 'all' || t.categoria === selectedCategory) &&
                (searchTerm === '' || 
                  t.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  t.numero_documento?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  t.responsavel.toLowerCase().includes(searchTerm.toLowerCase())
                )
              )
              .map((transaction) => (
              <Card key={transaction.id} className="border-0 shadow-sm">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          R$ {transaction.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </h3>
                        <div className="flex gap-2">
                          <Badge className={transaction.tipo === 'Entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {transaction.tipo === 'Entrada' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                            {transaction.tipo}
                          </Badge>
                          <Badge variant="outline">{transaction.categoria}</Badge>
                          {transaction.subcategoria && (
                            <Badge variant="outline" className="text-xs">{transaction.subcategoria}</Badge>
                          )}
                          <Badge className={
                            transaction.status === 'Confirmado' ? 'bg-blue-100 text-blue-800' :
                            transaction.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {transaction.status === 'Confirmado' && <CheckCircle className="w-3 h-3 mr-1" />}
                            {transaction.status === 'Pendente' && <Clock className="w-3 h-3 mr-1" />}
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-2">{transaction.descricao}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-sm text-gray-600 mb-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(transaction.data).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          <span>{transaction.metodo_pagamento}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4" />
                          <span>{transaction.responsavel}</span>
                        </div>
                        {transaction.numero_documento && (
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            <span>{transaction.numero_documento}</span>
                          </div>
                        )}
                      </div>

                      {transaction.centro_custo && (
                        <p className="text-sm text-blue-600 mb-1">
                          📊 Centro de Custo: {transaction.centro_custo}
                        </p>
                      )}

                      {transaction.observacoes && (
                        <p className="text-sm text-gray-600 mb-1">
                          💬 {transaction.observacoes}
                        </p>
                      )}

                      {transaction.aprovado_por && transaction.data_aprovacao && (
                        <p className="text-xs text-green-600">
                          ✅ Aprovado por {transaction.aprovado_por} em {new Date(transaction.data_aprovacao).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {transaction.status === 'Pendente' && canManageFinancial && (
                        <Button 
                          size="sm" 
                          className="bg-green-500 hover:bg-green-600"
                          onClick={() => approveTransaction(transaction.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Aprovar
                        </Button>
                      )}
                      {transaction.tipo === 'Entrada' && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => generateReceipt(transaction)}
                          disabled={transaction.recibo_emitido}
                        >
                          <Receipt className="w-4 h-4 mr-2" />
                          {transaction.recibo_emitido ? 'Recibo Emitido' : 'Gerar Recibo'}
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-2" />
                        Ver
                      </Button>
                      {canManageFinancial && (
                        <>
                          <Button variant="outline" size="sm">
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="budget" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Orçamento Mensal</h2>
            {canManageFinancial && (
              <Dialog open={isAddBudgetOpen} onOpenChange={setIsAddBudgetOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-500 hover:bg-blue-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Orçamento
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Criar Orçamento</DialogTitle>
                    <DialogDescription>
                      Configure um novo orçamento mensal
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="categoria">Categoria *</Label>
                      <Select value={newBudget.categoria} onValueChange={(value) => setNewBudget({...newBudget, categoria: value, subcategoria: ''})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoriesSaida.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {newBudget.categoria && subcategorias[newBudget.categoria as keyof typeof subcategorias] && (
                      <div className="space-y-2">
                        <Label htmlFor="subcategoria">Subcategoria</Label>
                        <Select value={newBudget.subcategoria} onValueChange={(value) => setNewBudget({...newBudget, subcategoria: value})}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a subcategoria" />
                          </SelectTrigger>
                          <SelectContent>
                            {subcategorias[newBudget.categoria as keyof typeof subcategorias]?.map(subcat => (
                              <SelectItem key={subcat} value={subcat}>{subcat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="valor_orcado">Valor Orçado (R$) *</Label>
                      <Input
                        id="valor_orcado"
                        type="number"
                        step="0.01"
                        value={newBudget.valor_orcado || ''}
                        onChange={(e) => setNewBudget({...newBudget, valor_orcado: parseFloat(e.target.value) || 0})}
                        placeholder="0,00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mes_ano">Mês/Ano</Label>
                      <Input
                        id="mes_ano"
                        type="month"
                        value={newBudget.mes_ano}
                        onChange={(e) => setNewBudget({...newBudget, mes_ano: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="descricao">Descrição</Label>
                      <Textarea
                        id="descricao"
                        value={newBudget.descricao}
                        onChange={(e) => setNewBudget({...newBudget, descricao: e.target.value})}
                        placeholder="Descrição do orçamento"
                        rows={2}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="alertas"
                        checked={newBudget.alertas_configurados}
                        onCheckedChange={(checked) => setNewBudget({...newBudget, alertas_configurados: checked as boolean})}
                      />
                      <Label htmlFor="alertas">Configurar alertas automáticos</Label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsAddBudgetOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleAddBudget}>
                        Criar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="space-y-4">
            {budgets.map(budget => (
              <Card key={budget.id} className={`border-0 shadow-sm ${budget.status === 'Excedido' ? 'border-l-4 border-red-400' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{budget.categoria}</h3>
                      {budget.subcategoria && (
                        <p className="text-sm text-gray-600">{budget.subcategoria}</p>
                      )}
                      <p className="text-sm text-gray-500">{budget.descricao}</p>
                    </div>
                    <div className="text-right">
                      <Badge className={
                        budget.status === 'Ativo' ? 'bg-green-100 text-green-800' :
                        budget.status === 'Excedido' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {budget.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Orçado: R$ {budget.valor_orcado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      <span>Gasto: R$ {budget.valor_gasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <Progress 
                      value={(budget.valor_gasto / budget.valor_orcado) * 100} 
                      className={`h-3 ${budget.status === 'Excedido' ? 'bg-red-100' : ''}`}
                    />
                    <div className="flex justify-between text-sm">
                      <span className={`font-medium ${budget.valor_disponivel < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        Disponível: R$ {budget.valor_disponivel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-gray-500">
                        {((budget.valor_gasto / budget.valor_orcado) * 100).toFixed(1)}% utilizado
                      </span>
                    </div>
                  </div>
                  
                  {budget.status === 'Excedido' && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <p className="text-sm text-red-800 font-medium">Orçamento excedido!</p>
                      </div>
                      <p className="text-xs text-red-600 mt-1">
                        Valor excedente: R$ {Math.abs(budget.valor_disponivel).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Metas Financeiras</h2>
            {canManageFinancial && (
              <Dialog open={isAddGoalOpen} onOpenChange={setIsAddGoalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-500 hover:bg-purple-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Meta
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Criar Meta Financeira</DialogTitle>
                    <DialogDescription>
                      Configure uma nova meta de arrecadação
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome da Meta *</Label>
                      <Input
                        id="nome"
                        value={newGoal.nome}
                        onChange={(e) => setNewGoal({...newGoal, nome: e.target.value})}
                        placeholder="Ex: Reforma do Templo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="valor_meta">Valor da Meta (R$) *</Label>
                      <Input
                        id="valor_meta"
                        type="number"
                        step="0.01"
                        value={newGoal.valor_meta || ''}
                        onChange={(e) => setNewGoal({...newGoal, valor_meta: parseFloat(e.target.value) || 0})}
                        placeholder="0,00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="data_limite">Data Limite *</Label>
                      <Input
                        id="data_limite"
                        type="date"
                        value={newGoal.data_limite}
                        onChange={(e) => setNewGoal({...newGoal, data_limite: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="categoria">Categoria</Label>
                      <Select value={newGoal.categoria} onValueChange={(value) => setNewGoal({...newGoal, categoria: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoriesEntrada.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="descricao">Descrição</Label>
                      <Textarea
                        id="descricao"
                        value={newGoal.descricao}
                        onChange={(e) => setNewGoal({...newGoal, descricao: e.target.value})}
                        placeholder="Descrição da meta"
                        rows={2}
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="campanha"
                        checked={newGoal.campanha_ativa}
                        onCheckedChange={(checked) => setNewGoal({...newGoal, campanha_ativa: checked as boolean})}
                      />
                      <Label htmlFor="campanha">Criar campanha de arrecadação</Label>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsAddGoalOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleAddGoal}>
                        Criar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {goals.map(goal => (
              <Card key={goal.id} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">{goal.nome}</h3>
                      <p className="text-sm text-gray-600">{goal.categoria}</p>
                    </div>
                    <Badge className={
                      goal.status === 'Ativo' ? 'bg-green-100 text-green-800' :
                      goal.status === 'Concluído' ? 'bg-blue-100 text-blue-800' :
                      goal.status === 'Pausado' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {goal.status}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-4">{goal.descricao}</p>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Progresso</span>
                      <span className="font-medium">
                        {Math.round((goal.valor_atual / goal.valor_meta) * 100)}%
                      </span>
                    </div>
                    <Progress value={(goal.valor_atual / goal.valor_meta) * 100} className="h-3" />
                    <div className="flex justify-between text-sm">
                      <span>R$ {goal.valor_atual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      <span>R$ {goal.valor_meta.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t flex justify-between text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{goal.contribuidores} contribuidores</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>até {new Date(goal.data_limite).toLocaleDateString('pt-BR')}</span>
                    </div>
                  </div>
                  
                  {goal.campanha_ativa && (
                    <div className="mt-3 p-2 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-xs text-purple-800 font-medium">🎯 Campanha ativa</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Relatórios Financeiros</h2>
          </div>

          {reports.length > 0 ? (
            <div className="space-y-4">
              {reports.map(report => (
                <Card key={report.id} className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">Relatório {report.tipo}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(report.periodo_inicio).toLocaleDateString('pt-BR')} até {new Date(report.periodo_fim).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-xs text-gray-500">
                          Gerado por {report.gerado_por} em {new Date(report.data_geracao).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Visualizar
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          R$ {report.dados.total_entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-gray-600">Total Entradas</p>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <p className="text-2xl font-bold text-red-600">
                          R$ {report.dados.total_saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-gray-600">Total Saídas</p>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <p className={`text-2xl font-bold ${report.dados.saldo_periodo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          R$ {report.dados.saldo_periodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-gray-600">Saldo do Período</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum relatório gerado</h3>
                <p className="text-gray-600 mb-4">
                  Gere seu primeiro relatório financeiro para análise detalhada.
                </p>
                <Button onClick={() => setIsGenerateReportOpen(true)}>
                  <FileText className="w-4 h-4 mr-2" />
                  Gerar Primeiro Relatório
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default FinancialPanel