import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BookOpen, Plus, Search, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'

interface Devotional {
  id: string
  id_igreja: string
  titulo: string
  conteudo: string
  categoria: string
  status: string
  autor_id: string
  data_publicacao?: string
  membros?: { nome_completo: string }
}

const PAGE_SIZE = 20

const DevotionalsManagementPage = () => {
  const { user, currentChurchId } = useAuthStore()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [page, setPage] = useState(0)

  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300)

  const queryKey = useMemo(
    () => ['devotionals-management', currentChurchId, debouncedSearchTerm, statusFilter, categoryFilter, page],
    [currentChurchId, debouncedSearchTerm, statusFilter, categoryFilter, page]
  )

  const { data: devotionalsResponse, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!currentChurchId) return { data: [], count: 0 }
      
      try {
        let query = supabase
          .from('devocionais')
          .select('*, membros(nome_completo)', { count: 'exact' })
          .eq('id_igreja', currentChurchId)

        if (statusFilter !== 'all') query = query.eq('status', statusFilter)
        if (categoryFilter !== 'all') query = query.eq('categoria', categoryFilter)
        if (debouncedSearchTerm) query = query.ilike('titulo', `%${debouncedSearchTerm}%`)

        query = query.order('created_at', { ascending: false })
        query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

        const { data, error, count } = await query
        if (error) throw error
        return { data: (data || []) as Devotional[], count: count || 0 }
      } catch (err: any) {
        console.error('Erro ao buscar devocionais:', err)
        toast.error('Erro ao carregar devocionais: ' + err.message)
        return { data: [], count: 0 }
      }
    },
    enabled: !!currentChurchId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
  })

  const devotionals = devotionalsResponse?.data || []
  const totalCount = devotionalsResponse?.count || 0
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const deleteMutation = useMutation({
    mutationFn: async (devotionalId: string) => {
      const { error } = await supabase.from('devocionais').delete().eq('id', devotionalId)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Devocional excluído com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['devotionals-management'] })
    },
    onError: (error: any) => {
      toast.error('Erro ao excluir devocional: ' + error.message)
    },
  })

  const handleDelete = (devotionalId: string) => {
    if (confirm('Tem certeza que deseja excluir este devocional?')) {
      deleteMutation.mutate(devotionalId)
    }
  }

  if (!currentChurchId) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Selecione uma igreja para gerenciar devocionais.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-900 mb-2">Erro ao carregar devocionais</h3>
            <p className="text-red-700 mb-4">{(error as Error).message}</p>
            <Button onClick={() => refetch()} variant="outline">
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Devocionais</h1>
          <p className="text-sm text-muted-foreground">Crie e gerencie os devocionais da igreja</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Novo Devocional
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar devocionais..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Rascunho">Rascunho</SelectItem>
                <SelectItem value="Publicado">Publicado</SelectItem>
                <SelectItem value="Arquivado">Arquivado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Categorias</SelectItem>
                <SelectItem value="Diário">Diário</SelectItem>
                <SelectItem value="Semanal">Semanal</SelectItem>
                <SelectItem value="Especial">Especial</SelectItem>
                <SelectItem value="Temático">Temático</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="ml-3 text-gray-600">Carregando devocionais...</span>
        </div>
      ) : devotionals.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum devocional encontrado</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Comece criando seu primeiro devocional'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4">
            {devotionals.map((devotional) => (
              <Card key={devotional.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">{devotional.titulo}</h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{devotional.conteudo}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Categoria: {devotional.categoria}</span>
                        <span>Status: {devotional.status}</span>
                        <span>Autor: {devotional.membros?.nome_completo || 'Desconhecido'}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Editar</Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(devotional.id)}>
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                Anterior
              </Button>
              <span className="text-sm text-gray-600">
                Página {page + 1} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                Próxima
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default DevotionalsManagementPage