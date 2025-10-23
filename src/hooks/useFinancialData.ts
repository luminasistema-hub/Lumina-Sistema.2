import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../integrations/supabase/client'
import { useAuthStore } from '../stores/authStore'
import { toast } from 'sonner'
import { useEffect } from 'react'

export interface FinancialTransaction {
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

export interface Budget {
  id: string
  categoria: string
  subcategoria?: string
  valor_orcado: number
  valor_gasto: number
  mes_ano: string
  descricao?: string
  responsavel: string
  status: 'Ativo' | 'Excedido' | 'Finalizado'
  alertas_configurados: boolean
  id_igreja: string
}

export interface FinancialGoal {
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

export interface Member {
  id: string;
  nome_completo: string;
}

interface FinancialData {
  transactions: FinancialTransaction[]
  budgets: (Budget & { valor_disponivel: number })[]
  goals: FinancialGoal[]
  members: Member[]
  pendingNotifications: any[]
}

interface FinancialFilters {
  searchTerm?: string
  category?: string
  memberId?: string
  period?: { start: string; end: string } | null
}

const fetchFinancialData = async (churchId: string, filters: FinancialFilters): Promise<FinancialData> => {
  if (!churchId) {
    return { transactions: [], budgets: [], goals: [], members: [], pendingNotifications: [] }
  }

  // 1. Fetch Transactions with filters
  let transactionQuery = supabase
    .from('transacoes_financeiras')
    .select('*')
    .eq('id_igreja', churchId)

  if (filters.searchTerm) {
    transactionQuery = transactionQuery.or(
      `descricao.ilike.%${filters.searchTerm}%,numero_documento.ilike.%${filters.searchTerm}%,responsavel.ilike.%${filters.searchTerm}%`
    )
  }
  if (filters.category && filters.category !== 'all') {
    transactionQuery = transactionQuery.eq('categoria', filters.category)
  }
  if (filters.memberId && filters.memberId !== 'all') {
    transactionQuery = transactionQuery.eq('membro_id', filters.memberId)
  }
  if (filters.period) {
    transactionQuery = transactionQuery
      .gte('data_transacao', filters.period.start)
      .lte('data_transacao', filters.period.end)
  }

  const { data: transactions, error: transactionsError } = await transactionQuery.order('data_transacao', { ascending: false })
  if (transactionsError) throw new Error(`Transactions: ${transactionsError.message}`)

  // 2. Fetch Budgets
  const { data: budgetsData, error: budgetsError } = await supabase
    .from('orcamentos')
    .select('*')
    .eq('id_igreja', churchId)
    .order('mes_ano', { ascending: false })
  if (budgetsError) throw new Error(`Budgets: ${budgetsError.message}`)
  const budgets = budgetsData.map(b => ({
    ...b,
    valor_disponivel: b.valor_orcado - b.valor_gasto
  })) as (Budget & { valor_disponivel: number })[]

  // 3. Fetch Goals
  const { data: goals, error: goalsError } = await supabase
    .from('metas_financeiras')
    .select('*')
    .eq('id_igreja', churchId)
    .order('data_limite', { ascending: true })
  if (goalsError) throw new Error(`Goals: ${goalsError.message}`)

  // 4. Fetch Members
  const { data: members, error: membersError } = await supabase
    .from('membros')
    .select('id, nome_completo')
    .eq('id_igreja', churchId)
    .order('nome_completo', { ascending: true })
  if (membersError) throw new Error(`Members: ${membersError.message}`)

  // 5. Fetch Pending Notifications
  const { data: pendingNotifications, error: notificationsError } = await supabase
    .from('eventos_aplicacao')
    .select('*')
    .eq('church_id', churchId)
    .eq('event_name', 'nova_contribuicao_pendente')
    .order('created_at', { ascending: false })
  if (notificationsError) console.error('Error loading notifications:', notificationsError)

  return {
    transactions: (transactions || []) as FinancialTransaction[],
    budgets: budgets || [],
    goals: (goals || []) as FinancialGoal[],
    members: (members || []) as Member[],
    pendingNotifications: pendingNotifications || [],
  }
}

export const useFinancialData = (filters: FinancialFilters) => {
  const { currentChurchId } = useAuthStore()
  const queryClient = useQueryClient()
  const queryKey = ['financialData', currentChurchId, filters]

  useEffect(() => {
    if (!currentChurchId) return

    const channel = supabase
      .channel(`financial-panel-${currentChurchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transacoes_financeiras', filter: `id_igreja=eq.${currentChurchId}` },
        () => queryClient.invalidateQueries({ queryKey: ['financialData'] })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orcamentos', filter: `id_igreja=eq.${currentChurchId}` },
        () => queryClient.invalidateQueries({ queryKey: ['financialData'] })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'metas_financeiras', filter: `id_igreja=eq.${currentChurchId}` },
        () => queryClient.invalidateQueries({ queryKey: ['financialData'] })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'eventos_aplicacao', filter: `church_id=eq.${currentChurchId}` },
        () => queryClient.invalidateQueries({ queryKey: ['financialData'] })
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentChurchId, queryClient])

  return useQuery<FinancialData>({
    queryKey,
    queryFn: () => fetchFinancialData(currentChurchId!, filters),
    enabled: !!currentChurchId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

const useFinancialMutation = <TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<any>,
  { successMessage, errorMessage }: { successMessage: string; errorMessage: string }
) => {
  const queryClient = useQueryClient()
  const { currentChurchId } = useAuthStore()

  return useMutation({
    mutationFn,
    onSuccess: () => {
      toast.success(successMessage)
      queryClient.invalidateQueries({ queryKey: ['financialData', currentChurchId] })
    },
    onError: (error: any) => {
      toast.error(`${errorMessage}: ${error.message}`)
    },
  })
}

export const useCreateTransaction = () => useFinancialMutation(
  async (transaction: Partial<FinancialTransaction>) => {
    const { error } = await supabase.from('transacoes_financeiras').insert(transaction)
    if (error) throw error
  },
  { successMessage: 'Transação adicionada!', errorMessage: 'Erro ao adicionar transação' }
)

export const useUpdateTransaction = () => useFinancialMutation(
  async (transaction: Partial<FinancialTransaction> & { id: string }) => {
    const { id, ...updates } = transaction
    const { error } = await supabase.from('transacoes_financeiras').update(updates).eq('id', id)
    if (error) throw error
  },
  { successMessage: 'Transação atualizada!', errorMessage: 'Erro ao atualizar transação' }
)

export const useDeleteTransaction = () => useFinancialMutation(
  async (transactionId: string) => {
    const { error } = await supabase.from('transacoes_financeiras').delete().eq('id', transactionId)
    if (error) throw error
  },
  { successMessage: 'Transação excluída!', errorMessage: 'Erro ao excluir transação' }
)

export const useUpdateTransactionStatus = () => {
  const queryClient = useQueryClient()
  const { currentChurchId, user } = useAuthStore()

  return useMutation({
    mutationFn: async ({ transactionId, status }: { transactionId: string; status: 'Confirmado' | 'Cancelado' }) => {
      const { error } = await supabase
        .from('transacoes_financeiras')
        .update({
          status,
          aprovado_por: user?.name || 'Admin',
          data_aprovacao: new Date().toISOString().split('T')[0],
        })
        .eq('id', transactionId)
      if (error) throw error
      await supabase.from('eventos_aplicacao').delete().eq('event_details->>transaction_id', transactionId)
    },
    onSuccess: (_, { status }) => {
      toast.success(`Transação ${status === 'Confirmado' ? 'aprovada' : 'rejeitada'}!`)
      queryClient.invalidateQueries({ queryKey: ['financialData', currentChurchId] })
    },
    onError: (error: any) => toast.error(`Erro ao atualizar status: ${error.message}`),
  })
}

export const useMarkReceiptAsIssued = () => useFinancialMutation(
  async (transactionId: string) => {
    const { error } = await supabase.from('transacoes_financeiras').update({ recibo_emitido: true }).eq('id', transactionId)
    if (error) throw error
  },
  { successMessage: 'Recibo marcado como emitido!', errorMessage: 'Erro ao marcar recibo' }
)

export const useCreateBudget = () => useFinancialMutation(
  async (budget: Partial<Budget>) => {
    const { error } = await supabase.from('orcamentos').insert(budget)
    if (error) throw error
  },
  { successMessage: 'Orçamento criado!', errorMessage: 'Erro ao criar orçamento' }
)

export const useUpdateBudget = () => useFinancialMutation(
  async (budget: Partial<Budget> & { id: string }) => {
    const { id, ...updates } = budget
    const { error } = await supabase.from('orcamentos').update(updates).eq('id', id)
    if (error) throw error
  },
  { successMessage: 'Orçamento atualizado!', errorMessage: 'Erro ao atualizar orçamento' }
)

export const useDeleteBudget = () => useFinancialMutation(
  async (budgetId: string) => {
    const { error } = await supabase.from('orcamentos').delete().eq('id', budgetId)
    if (error) throw error
  },
  { successMessage: 'Orçamento excluído!', errorMessage: 'Erro ao excluir orçamento' }
)

export const useCreateGoal = () => useFinancialMutation(
  async (goal: Partial<FinancialGoal>) => {
    const { error } = await supabase.from('metas_financeiras').insert(goal)
    if (error) throw error
  },
  { successMessage: 'Meta criada!', errorMessage: 'Erro ao criar meta' }
)

export const useUpdateGoal = () => useFinancialMutation(
  async (goal: Partial<FinancialGoal> & { id: string }) => {
    const { id, ...updates } = goal
    const { error } = await supabase.from('metas_financeiras').update(updates).eq('id', id)
    if (error) throw error
  },
  { successMessage: 'Meta atualizada!', errorMessage: 'Erro ao atualizar meta' }
)

export const useDeleteGoal = () => useFinancialMutation(
  async (goalId: string) => {
    const { error } = await supabase.from('metas_financeiras').delete().eq('id', goalId)
    if (error) throw error
  },
  { successMessage: 'Meta excluída!', errorMessage: 'Erro ao excluir meta' }
)