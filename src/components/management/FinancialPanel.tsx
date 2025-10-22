import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '../../stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { toast } from 'sonner'
import { supabase } from '../../integrations/supabase/client'
import { UnifiedReceiptDialog } from '../financial/UnifiedReceiptDialog'
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
  X
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

const PAGE_SIZE = 10

const FinancialPanel = () => {
  const { user, currentChurchId } = useAuthStore()
  const queryClient = useQueryClient()

  const [viewMode, setViewMode] = useState<'dashboard' | 'transactions' | 'budget' | 'goals' | 'reports'>('dashboard')
  const [page, setPage] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 500)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedMemberFilter, setSelectedMemberFilter] = useState('all')
  
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false)
  const [isEditTransactionOpen, setIsEditTransactionOpen] = useState(false)
  const [transactionToEdit, setTransactionToEdit] = useState<FinancialTransaction | null>(null)
  const [receiptTransaction, setReceiptTransaction] = useState<FinancialTransaction | null>(null)
  const [detailsTransaction, setDetailsTransaction] = useState<FinancialTransaction | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

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
    membro_id: '' as string
  })

  const categoriesEntrada = ['Dízimos', 'Ofertas', 'Doações Especiais', 'Eventos', 'Vendas', 'Outros']
  const categoriesSaida = ['Pessoal', 'Manutenção', 'Utilidades', 'Ministérios', 'Eventos', 'Equipamentos', 'Outros']
  const allCategories = useMemo(() => Array.from(new Set([...categoriesEntrada, ...categoriesSaida])), [])
  const metodosPagamento = ['PIX', 'Dinheiro', 'Cartão Débito', 'Cartão Crédito', 'Transferência', 'Cheque', 'Boleto']

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
    gcTime: 10 * 60 * 1000,
  })

  // Query para transações paginadas
  const { data: transactionsResponse, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ['transactions', currentChurchId, page, debouncedSearchTerm, selectedCategory, selectedMemberFilter],
    queryFn: async () => {
      if (!currentChurchId) return { data: [], count: 0 }
      
      let query = supabase
        .from('transacoes_financeiras')
        .select('*', { count: 'exact' })
        .eq('id_igreja', currentChurchId)
        .order('data_transacao', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

      if (debouncedSearchTerm) {
        query = query.or(`descricao.ilike.%${debouncedSearchTerm}%,numero_documento.ilike.%${debouncedSearchTerm}%`)
      }
      if (selectedCategory !== 'all') query = query.eq('categoria', selectedCategory)
      if (selectedMemberFilter !== 'all') query = query.eq('membro_id', selectedMemberFilter)

      const { data, error, count } = await query
      if (error) throw error
      return { data: (data || []) as FinancialTransaction[], count: count || 0 }
    },
    enabled: !!currentChurchId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  const transactions = transactionsResponse?.data || []
  const transactionCount = transactionsResponse?.count || 0

  // Query para resumo financeiro
  const { data: financialSummary } = useQuery({
    queryKey: ['financial-summary', currentChurchId],
    queryFn: async () => {
      if (!currentChurchId) return { saldoAtual: 0, entradasMes: 0, saidasMes: 0, pendingTransactionsCount: 0 }
      
      const currentMonth = new Date().toISOString().slice(0, 7)
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

      return { saldoAtual, entradasMes, saidasMes, pendingTransactionsCount: pendingCount }
    },
    enabled: !!currentChurchId,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  const summary = financialSummary || { saldoAtual: 0, entradasMes: 0, saidasMes: 0, pendingTransactionsCount: 0 }
  const pendingTransactions = useMemo(() => transactions.filter(t => t.status === 'Pendente'), [transactions])

  // Realtime subscription
  useEffect(() => {
    if (!currentChurchId) return
    const channel = supabase
      .channel(`financial-${currentChurchId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transacoes_financeiras', filter: `id_igreja=eq.${currentChurchId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['transactions', currentChurchId] })
          queryClient.invalidateQueries({ queryKey: ['financial-summary', currentChurchId] })
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [currentChurchId, queryClient])

  // Mutations
  const addTransactionMutation = useMutation({
    mutationFn: async (transaction: any) => {
      const { error } = await supabase.from('transacoes_financeiras').insert({
        ...transaction,
        id_igreja: currentChurchId,
        status: 'Confirmado',
        responsavel: user?.name || transaction.responsavel
      })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Transação adicionada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['financial-summary'] })
      setIsAddTransactionOpen(false)
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
        membro_id: ''
      })
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

  if (!currentChurchId) {
    return <div className="p-6 text-center text-gray-600">Selecione uma igreja para gerenciar o painel financeiro.</div>
  }

  if (isLoadingTransactions && transactions.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        <p className="ml-3 text-lg text-gray-600">Carregando dados financeiros...</p>
      </div>
    )
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
          {viewMode === 'transactions' && canManageFinancial && (
            <Button onClick={() => setIsAddTransactionOpen(true)}><Plus className="w-4 h-4 mr-2" /> Nova Transação</Button>
          )}
        </div>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Saldo Atual</CardTitle></CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${summary.saldoAtual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {summary.saldoAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Entradas (Mês)</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  R$ {summary.entradasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Saídas (Mês)</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  R$ {summary.saidasMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Pendências</CardTitle></CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{summary.pendingTransactionsCount}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardContent className="p-4 grid gap-4 md:grid-cols-3">
              <Input placeholder="Buscar..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(0) }} />
              <Select value={selectedCategory} onValueChange={(v) => { setSelectedCategory(v); setPage(0) }}>
                <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {allCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={selectedMemberFilter} onValueChange={(v) => { setSelectedMemberFilter(v); setPage(0) }}>
                <SelectTrigger><SelectValue placeholder="Membro" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {members.map(m => <SelectItem key={m.id} value={m.id}>{m.nome_completo}</SelectItem>)}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {pendingTransactions.length > 0 && canManageFinancial && (
            <Card>
              <CardHeader><CardTitle>Transações Pendentes</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {pendingTransactions.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-2 border rounded-md">
                    <span>{t.descricao} - R$ {t.valor.toFixed(2)}</span>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => approveTransactionMutation.mutate(t.id)}>
                        <CheckCircle className="w-4 h-4 mr-1" /> Aprovar
                      </Button>
                    </div>
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
                    <p className="text-sm text-gray-500">
                      {transaction.categoria} - {new Date(transaction.data_transacao).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${transaction.tipo === 'Entrada' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.tipo === 'Entrada' ? '+' : '-'} R$ {transaction.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => openDetails(transaction)}>Ver</Button>
                    {transaction.tipo === 'Entrada' && canManageFinancial && (
                      <Button variant="ghost" size="sm" onClick={() => generateReceipt(transaction)}><Receipt className="w-4 h-4" /></Button>
                    )}
                    {canManageFinancial && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => { setTransactionToEdit(transaction); setIsEditTransactionOpen(true) }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteTransactionMutation.mutate(transaction.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4">
            <span className="text-sm text-gray-600">Página {page + 1} de {Math.ceil(transactionCount / PAGE_SIZE) || 1}</span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>Anterior</Button>
              <Button variant="outline" onClick={() => setPage(p => p + 1)} disabled={(page + 1) * PAGE_SIZE >= transactionCount}>Próxima</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="budget"><p className="text-center text-gray-600 py-8">Gerenciamento de Orçamento em breve.</p></TabsContent>
        <TabsContent value="goals"><p className="text-center text-gray-600 py-8">Gerenciamento de Metas em breve.</p></TabsContent>
        <TabsContent value="reports"><p className="text-center text-gray-600 py-8">Relatórios em breve.</p></TabsContent>
      </Tabs>

      {/* Dialog para adicionar transação */}
      <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Nova Transação</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo *</Label>
                <Select value={newTransaction.tipo} onValueChange={(v: any) => setNewTransaction({...newTransaction, tipo: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Entrada">Entrada</SelectItem>
                    <SelectItem value="Saída">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
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
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valor *</Label>
                <Input type="number" step="0.01" value={newTransaction.valor} onChange={(e) => setNewTransaction({...newTransaction, valor: parseFloat(e.target.value) || 0})} />
              </div>
              <div>
                <Label>Data *</Label>
                <Input type="date" value={newTransaction.data_transacao} onChange={(e) => setNewTransaction({...newTransaction, data_transacao: e.target.value})} />
              </div>
            </div>
            <div>
              <Label>Descrição *</Label>
              <Input value={newTransaction.descricao} onChange={(e) => setNewTransaction({...newTransaction, descricao: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Método de Pagamento</Label>
                <Select value={newTransaction.metodo_pagamento} onValueChange={(v) => setNewTransaction({...newTransaction, metodo_pagamento: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {metodosPagamento.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Membro (opcional)</Label>
                <Select value={newTransaction.membro_id} onValueChange={(v) => setNewTransaction({...newTransaction, membro_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {members.map(m => <SelectItem key={m.id} value={m.id}>{m.nome_completo}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={newTransaction.observacoes} onChange={(e) => setNewTransaction({...newTransaction, observacoes: e.target.value})} rows={3} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddTransactionOpen(false)}>Cancelar</Button>
              <Button onClick={handleAddTransaction} disabled={addTransactionMutation.isPending}>
                {addTransactionMutation.isPending ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar transação */}
      <Dialog open={isEditTransactionOpen} onOpenChange={setIsEditTransactionOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Editar Transação</DialogTitle></DialogHeader>
          {transactionToEdit && (
            <div className="space-y-4">
              <div>
                <Label>Descrição</Label>
                <Input value={transactionToEdit.descricao} onChange={(e) => setTransactionToEdit({...transactionToEdit, descricao: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Valor</Label>
                  <Input type="number" step="0.01" value={transactionToEdit.valor} onChange={(e) => setTransactionToEdit({...transactionToEdit, valor: parseFloat(e.target.value) || 0})} />
                </div>
                <div>
                  <Label>Data</Label>
                  <Input type="date" value={transactionToEdit.data_transacao} onChange={(e) => setTransactionToEdit({...transactionToEdit, data_transacao: e.target.value})} />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditTransactionOpen(false)}>Cancelar</Button>
                <Button onClick={handleEditTransaction} disabled={updateTransactionMutation.isPending}>
                  {updateTransactionMutation.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {receiptTransaction && (
        <UnifiedReceiptDialog
          transaction={receiptTransaction}
          isOpen={!!receiptTransaction}
          onOpenChange={() => setReceiptTransaction(null)}
          onReceiptIssued={() => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] })
            setReceiptTransaction(null)
          }}
        />
      )}

      {detailsTransaction && (
        <TransactionDetailsDialog
          transaction={detailsTransaction}
          isOpen={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      )}
    </div>
  )
}

export default FinancialPanel