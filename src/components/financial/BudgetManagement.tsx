import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Progress } from '../ui/progress'
import { Badge } from '../ui/badge'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, TrendingUp, TrendingDown, AlertTriangle, Loader2 } from 'lucide-react'

interface Budget {
  id: string
  id_igreja: string
  categoria: string
  subcategoria?: string
  valor_orcado: number
  valor_gasto: number
  mes_ano: string
  descricao?: string
  responsavel?: string
  status: 'Ativo' | 'Excedido' | 'Concluído'
}

const BudgetManagement = () => {
  const { currentChurchId } = useAuthStore()
  const queryClient = useQueryClient()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  
  const [formData, setFormData] = useState({
    categoria: '',
    subcategoria: '',
    valor_orcado: 0,
    mes_ano: new Date().toISOString().slice(0, 7),
    descricao: '',
    responsavel: ''
  })

  const categories = ['Pessoal', 'Manutenção', 'Utilidades', 'Ministérios', 'Eventos', 'Equipamentos', 'Outros']

  // Query para orçamentos
  const { data: budgets, isLoading } = useQuery({
    queryKey: ['budgets', currentChurchId, selectedMonth],
    queryFn: async () => {
      if (!currentChurchId) return []
      const { data, error } = await supabase
        .from('orcamentos')
        .select('*')
        .eq('id_igreja', currentChurchId)
        .eq('mes_ano', selectedMonth)
        .order('categoria')
      if (error) throw error
      return data as Budget[]
    },
    enabled: !!currentChurchId,
    staleTime: 30 * 1000,
  })

  // Query para gastos do mês
  const { data: monthExpenses } = useQuery({
    queryKey: ['month-expenses', currentChurchId, selectedMonth],
    queryFn: async () => {
      if (!currentChurchId) return []
      const { data, error } = await supabase
        .from('transacoes_financeiras')
        .select('categoria, valor')
        .eq('id_igreja', currentChurchId)
        .eq('tipo', 'Saída')
        .eq('status', 'Confirmado')
        .gte('data_transacao', `${selectedMonth}-01`)
        .lt('data_transacao', `${selectedMonth}-32`)
      if (error) throw error
      return data
    },
    enabled: !!currentChurchId,
  })

  // Atualizar valores gastos
  useEffect(() => {
    if (budgets && monthExpenses) {
      budgets.forEach(budget => {
        const spent = monthExpenses
          .filter(exp => exp.categoria === budget.categoria)
          .reduce((sum, exp) => sum + exp.valor, 0)
        
        if (spent !== budget.valor_gasto) {
          updateBudgetMutation.mutate({ id: budget.id, valor_gasto: spent })
        }
      })
    }
  }, [budgets, monthExpenses])

  // Mutations
  const createBudgetMutation = useMutation({
    mutationFn: async (budget: any) => {
      const { error } = await supabase.from('orcamentos').insert({ ...budget, id_igreja: currentChurchId, status: 'Ativo' })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Orçamento criado!')
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      setIsDialogOpen(false)
      resetForm()
    },
    onError: (error: any) => toast.error(`Erro: ${error.message}`)
  })

  const updateBudgetMutation = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase.from('orcamentos').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    }
  })

  const deleteBudgetMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('orcamentos').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Orçamento removido!')
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    },
    onError: (error: any) => toast.error(`Erro: ${error.message}`)
  })

  const resetForm = () => {
    setFormData({
      categoria: '',
      subcategoria: '',
      valor_orcado: 0,
      mes_ano: new Date().toISOString().slice(0, 7),
      descricao: '',
      responsavel: ''
    })
    setEditingBudget(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.categoria || formData.valor_orcado <= 0) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }
    if (editingBudget) {
      updateBudgetMutation.mutate({ id: editingBudget.id, ...formData })
      setIsDialogOpen(false)
      resetForm()
    } else {
      createBudgetMutation.mutate(formData)
    }
  }

  const openDialog = (budget?: Budget) => {
    if (budget) {
      setEditingBudget(budget)
      setFormData({
        categoria: budget.categoria,
        subcategoria: budget.subcategoria || '',
        valor_orcado: budget.valor_orcado,
        mes_ano: budget.mes_ano,
        descricao: budget.descricao || '',
        responsavel: budget.responsavel || ''
      })
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const getProgressColor = (percentage: number) => {
    if (percentage < 70) return 'bg-green-500'
    if (percentage < 90) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const totalBudget = budgets?.reduce((sum, b) => sum + b.valor_orcado, 0) || 0
  const totalSpent = budgets?.reduce((sum, b) => sum + b.valor_gasto, 0) || 0
  const totalPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  if (!currentChurchId) {
    return <div className="p-6 text-center text-gray-600">Selecione uma igreja.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Input 
            type="month" 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-48"
          />
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="w-4 h-4 mr-2" /> Novo Orçamento
        </Button>
      </div>

      {/* Resumo Geral */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo do Orçamento - {new Date(selectedMonth).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Total Orçado</p>
                <p className="text-2xl font-bold">R$ {totalBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Gasto</p>
                <p className="text-2xl font-bold text-red-600">R$ {totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Disponível</p>
                <p className="text-2xl font-bold text-green-600">R$ {(totalBudget - totalSpent).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            <Progress value={totalPercentage} className={getProgressColor(totalPercentage)} />
            <p className="text-sm text-gray-600 text-center">{totalPercentage.toFixed(1)}% do orçamento utilizado</p>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Orçamentos */}
      {isLoading ? (
        <div className="text-center p-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets?.map((budget) => {
            const percentage = budget.valor_orcado > 0 ? (budget.valor_gasto / budget.valor_orcado) * 100 : 0
            const remaining = budget.valor_orcado - budget.valor_gasto
            
            return (
              <Card key={budget.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{budget.categoria}</CardTitle>
                      {budget.subcategoria && <p className="text-sm text-gray-500">{budget.subcategoria}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openDialog(budget)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteBudgetMutation.mutate(budget.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Orçado:</span>
                    <span className="font-semibold">R$ {budget.valor_orcado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Gasto:</span>
                    <span className="font-semibold text-red-600">R$ {budget.valor_gasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Disponível:</span>
                    <span className={`font-semibold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      R$ {Math.abs(remaining).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <Progress value={percentage} className={getProgressColor(percentage)} />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{percentage.toFixed(1)}% utilizado</span>
                    {percentage > 100 && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Excedido
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog para criar/editar orçamento */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBudget ? 'Editar Orçamento' : 'Novo Orçamento'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select value={formData.categoria} onValueChange={(v) => setFormData({...formData, categoria: v})}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subcategoria</Label>
              <Input value={formData.subcategoria} onChange={(e) => setFormData({...formData, subcategoria: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Valor Orçado *</Label>
              <Input type="number" step="0.01" value={formData.valor_orcado} onChange={(e) => setFormData({...formData, valor_orcado: parseFloat(e.target.value) || 0})} />
            </div>
            <div className="space-y-2">
              <Label>Mês/Ano *</Label>
              <Input type="month" value={formData.mes_ano} onChange={(e) => setFormData({...formData, mes_ano: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Input value={formData.responsavel} onChange={(e) => setFormData({...formData, responsavel: e.target.value})} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">{editingBudget ? 'Atualizar' : 'Criar'}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default BudgetManagement