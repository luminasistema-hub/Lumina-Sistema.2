import { useState, useEffect, useMemo } from 'react'
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
import { toast } from 'sonner'
import { supabase } from '../../integrations/supabase/client'
import { UnifiedReceiptDialog } from '../financial/UnifiedReceiptDialog'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  PieChart,
  BarChart3,
  Download,
  Plus,
  Edit,
  Trash2,
  Receipt,
  Target,
  CheckCircle,
  Filter,
  Search,
  FileText,
  Clock,
  Wallet,
  Loader2,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Calculator
} from 'lucide-react'
import TransactionDetailsDialog from '../financial/TransactionDetailsDialog'
import ReportViewerDialog from '../financial/ReportViewerDialog'

// Interfaces
interface FinancialTransaction {
  id: string;
  tipo: 'Entrada' | 'Saída';
  categoria: string;
  subcategoria?: string;
  valor: number;
  data_transacao: string;
  descricao: string;
  metodo_pagamento: string;
  responsavel: string;
  status: 'Pendente' | 'Confirmado' | 'Cancelado';
  comprovante?: string;
  observacoes?: string;
  membro_id?: string;
  membro_nome?: string;
  recibo_emitido?: boolean;
  numero_documento?: string;
  centro_custo?: string;
  aprovado_por?: string;
  data_aprovacao?: string;
  id_igreja: string;
}

interface Budget {
  id: string;
  categoria: string;
  subcategoria?: string;
  valor_orcado: number;
  valor_gasto: number;
  valor_disponivel: number;
  mes_ano: string;
  descricao?: string;
  responsavel: string;
  status: 'Ativo' | 'Excedido' | 'Finalizado';
  alertas_configurados: boolean;
  id_igreja: string;
}

interface FinancialGoal {
  id: string;
  nome: string;
  valor_meta: number;
  valor_atual: number;
  data_inicio: string;
  data_limite: string;
  categoria: string;
  descricao: string;
  status: 'Ativo' | 'Concluído' | 'Pausado' | 'Cancelado';
  contribuidores: number;
  campanha_ativa: boolean;
  id_igreja: string;
}

interface FinancialReport {
  id: string;
  tipo: 'Mensal' | 'Trimestral' | 'Anual' | 'Personalizado';
  periodo_inicio: string;
  periodo_fim: string;
  gerado_por: string;
  data_geracao: string;
  dados: any;
}

const PAGE_SIZE = 10;

const FinancialPanel = () => {
  const { user, currentChurchId } = useAuthStore();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<'dashboard' | 'transactions' | 'budget' | 'goals' | 'reports'>('dashboard');
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 500);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMemberFilter, setSelectedMemberFilter] = useState('all');

  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isEditTransactionOpen, setIsEditTransactionOpen] = useState(false);
  const [transactionToEdit, setTransactionToEdit] = useState<FinancialTransaction | null>(null);
  
  const [receiptTransaction, setReceiptTransaction] = useState<FinancialTransaction | null>(null);
  const [detailsTransaction, setDetailsTransaction] = useState<FinancialTransaction | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const canManageFinancial = user?.role === 'admin' || user?.role === 'pastor' || user?.role === 'financeiro';

  // Queries
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
      if (selectedCategory !== 'all') query = query.eq('categoria', selectedCategory);
      if (selectedMemberFilter !== 'all') query = query.eq('membro_id', selectedMemberFilter);

      const { data, error, count } = await query;
      if (error) throw error;
      return { data: data as FinancialTransaction[], count };
    },
    enabled: !!currentChurchId,
  });
  const transactions = transactionsResponse?.data || [];
  const transactionCount = transactionsResponse?.count || 0;

  const { data: allTransactionsData } = useQuery({
    queryKey: ['allTransactions', currentChurchId],
    queryFn: async () => {
        const { data, error } = await supabase.from('transacoes_financeiras').select('valor, tipo, status, data_transacao').eq('id_igreja', currentChurchId!);
        if (error) throw error;
        return data;
    },
    enabled: !!currentChurchId,
  });

  // Memos for performance
  const financialSummary = useMemo(() => {
    const allTrans = allTransactionsData || [];
    const currentMonth = new Date().toISOString().slice(0, 7);
    const confirmed = allTrans.filter(t => t.status === 'Confirmado');
    
    const totalEntradas = confirmed.filter(t => t.tipo === 'Entrada').reduce((sum, t) => sum + t.valor, 0);
    const totalSaidas = confirmed.filter(t => t.tipo === 'Saída').reduce((sum, t) => sum + t.valor, 0);
    const saldoAtual = totalEntradas - totalSaidas;

    const entradasMes = confirmed.filter(t => t.tipo === 'Entrada' && t.data_transacao.startsWith(currentMonth)).reduce((sum, t) => sum + t.valor, 0);
    const saidasMes = confirmed.filter(t => t.tipo === 'Saída' && t.data_transacao.startsWith(currentMonth)).reduce((sum, t) => sum + t.valor, 0);
    
    const pendingCount = allTrans.filter(t => t.status === 'Pendente').length;

    return { saldoAtual, entradasMes, saidasMes, pendingTransactionsCount: pendingCount };
  }, [allTransactionsData]);

  const pendingTransactions = useMemo(() => transactions.filter(t => t.status === 'Pendente'), [transactions]);

  // Realtime subscription
  useEffect(() => {
    if (!currentChurchId) return;
    const channel = supabase.channel(`financial-panel-${currentChurchId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transacoes_financeiras' }, () => {
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
        queryClient.invalidateQueries({ queryKey: ['allTransactions'] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [currentChurchId, queryClient]);

  // Handlers
  const openDetails = (transaction: FinancialTransaction) => {
    setDetailsTransaction(transaction);
    setDetailsOpen(true);
  };

  const generateReceipt = (transaction: FinancialTransaction) => {
    if (transaction.tipo === 'Saída') {
      toast.error('Recibos só podem ser gerados para entradas');
      return;
    }
    setReceiptTransaction(transaction);
  };

  const isLoading = isLoadingTransactions || isLoadingMembers;

  if (!currentChurchId) {
    return <div className="p-6 text-center text-gray-600">Selecione uma igreja para gerenciar o painel financeiro.</div>;
  }

  if (isLoading && page === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        <p className="ml-3 text-lg text-gray-600">Carregando dados financeiros...</p>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TabsList>
            <TabsTrigger value="dashboard"><PieChart className="w-4 h-4 mr-2" />Dashboard</TabsTrigger>
            <TabsTrigger value="transactions"><BarChart3 className="w-4 h-4 mr-2" />Transações</TabsTrigger>
            <TabsTrigger value="budget" disabled><Calculator className="w-4 h-4 mr-2" />Orçamento</TabsTrigger>
            <TabsTrigger value="goals" disabled><Target className="w-4 h-4 mr-2" />Metas</TabsTrigger>
            <TabsTrigger value="reports" disabled><FileText className="w-4 h-4 mr-2" />Relatórios</TabsTrigger>
          </TabsList>
          <div className="flex-grow flex justify-end">
            {viewMode === 'transactions' && (
              <Button onClick={() => setIsAddTransactionOpen(true)}><Plus className="w-4 h-4 mr-2" /> Nova Transação</Button>
            )}
          </div>
        </div>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Saldo Atual</CardTitle></CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${financialSummary.saldoAtual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {financialSummary.saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Entradas (Mês)</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  R$ {financialSummary.entradasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Saídas (Mês)</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  R$ {financialSummary.saidasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Pendências</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {financialSummary.pendingTransactionsCount}
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Other dashboard components can go here */}
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardContent className="p-4 grid gap-4 md:grid-cols-3">
              <Input placeholder="Buscar por descrição, doc..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger><SelectValue placeholder="Filtrar por categoria" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Categorias</SelectItem>
                  {/* Add categories here */}
                </SelectContent>
              </Select>
              <Select value={selectedMemberFilter} onValueChange={setSelectedMemberFilter}>
                <SelectTrigger><SelectValue placeholder="Filtrar por membro" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Membros</SelectItem>
                  {members.map(m => <SelectItem key={m.id} value={m.id}>{m.nome_completo}</SelectItem>)}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {pendingTransactions.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Transações Pendentes</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {pendingTransactions.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-2 border rounded-md">
                    <span>{t.descricao} - R$ {t.valor.toFixed(2)}</span>
                    {/* Add approve/reject buttons */}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {isLoadingTransactions && <div className="text-center p-4"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>}
            {!isLoadingTransactions && transactions.map((transaction) => (
              <Card key={transaction.id}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{transaction.descricao}</p>
                    <p className="text-sm text-gray-500">{transaction.categoria} - {new Date(transaction.data_transacao).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${transaction.tipo === 'Entrada' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.tipo === 'Entrada' ? '+' : '-'} R$ {transaction.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => openDetails(transaction)}>Ver</Button>
                    {transaction.tipo === 'Entrada' && <Button variant="ghost" size="sm" onClick={() => generateReceipt(transaction)}><Receipt /></Button>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4">
            <span className="text-sm text-gray-600">
              Página {page + 1} de {Math.ceil(transactionCount / PAGE_SIZE)}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Anterior</Button>
              <Button variant="outline" onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= transactionCount}>Próxima</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="budget"><p>Gerenciamento de Orçamento em breve.</p></TabsContent>
        <TabsContent value="goals"><p>Gerenciamento de Metas Financeiras em breve.</p></TabsContent>
        <TabsContent value="reports"><p>Geração de Relatórios em breve.</p></TabsContent>
      </Tabs>

      {receiptTransaction && (
        <UnifiedReceiptDialog
          transaction={receiptTransaction}
          isOpen={!!receiptTransaction}
          onOpenChange={() => setReceiptTransaction(null)}
          onReceiptIssued={() => queryClient.invalidateQueries({ queryKey: ['transactions'] })}
        />
      )}

      {detailsTransaction && (
        <TransactionDetailsDialog
          transaction={detailsTransaction}
          isOpen={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      )}
      
      {/* Add/Edit Transaction Dialogs would go here */}
    </div>
  )
}

export default FinancialPanel