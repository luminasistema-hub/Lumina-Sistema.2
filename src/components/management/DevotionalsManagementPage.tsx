import { useMemo, useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Calendar, User, Tag, Pencil, Trash2, Plus, Loader2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { useChurchStore } from '@/stores/churchStore'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'

type DevotionalStatus = 'Rascunho' | 'Publicado' | 'Arquivado'
type DevotionalCategory = 'Diário' | 'Semanal' | 'Especial' | 'Temático'

interface Devotional {
  id: string
  id_igreja: string
  titulo: string
  conteudo: string
  versiculo_referencia: string
  versiculo_texto?: string | null
  categoria: DevotionalCategory
  tags: string[]
  autor_id: string
  data_publicacao: string | null
  status: DevotionalStatus
  imagem_capa?: string | null
  tempo_leitura: number
  featured: boolean
  membros?: { nome_completo: string | null }
  created_at: string
  compartilhar_com_filhas?: boolean
}

const PAGE_SIZE = 6

const DevotionalsManagementPage = () => {
  const { currentChurchId, user } = useAuthStore()
  const qc = useQueryClient()
  const churchStore = useChurchStore()

  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 500)
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [page, setPage] = useState(0)
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Devotional | null>(null)

  const [form, setForm] = useState<Partial<Devotional>>({
    titulo: '',
    conteudo: '',
    versiculo_referencia: '',
    versiculo_texto: '',
    categoria: 'Diário',
    tags: [],
    status: 'Rascunho',
    imagem_capa: '',
    featured: false,
    compartilhar_com_filhas: false,
  })

  const queryKey = useMemo(
    () => ['devos-mgmt', currentChurchId, statusFilter, categoryFilter, debouncedSearchTerm, page],
    [currentChurchId, statusFilter, categoryFilter, debouncedSearchTerm, page]
  )

  const { data: devotionalsResponse, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!currentChurchId) return { data: [], count: 0 }
      
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
    },
    enabled: !!currentChurchId,
    staleTime: 30 * 1000, // 30 segundos
    gcTime: 5 * 60 * 1000, // 5 minutos
  })

  const devotionalsData = devotionalsResponse?.data || []
  const devotionalsCount = devotionalsResponse?.count || 0

  useEffect(() => {
    if (!currentChurchId) return
    
    const channel = supabase
      .channel(`devotionals-mgmt-${currentChurchId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'devocionais',
          filter: `id_igreja=eq.${currentChurchId}`
        },
        () => {
          qc.invalidateQueries({ queryKey: ['devos-mgmt', currentChurchId] })
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentChurchId, qc])

  const resetForm = () => {
    setForm({
      titulo: '',
      conteudo: '',
      versiculo_referencia: '',
      versiculo_texto: '',
      categoria: 'Diário',
      tags: [],
      status: 'Rascunho',
      imagem_capa: '',
      featured: false,
      compartilhar_com_filhas: churchStore.getChurchById(currentChurchId!)?.share_devocionais_to_children ?? false,
    })
    setEditingItem(null)
  }

  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { error } = await supabase.from('devocionais').insert(payload)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      toast.success('Devocional criado com sucesso!')
      qc.invalidateQueries({ queryKey: ['devos-mgmt'] })
      setIsDialogOpen(false)
      resetForm()
    },
    onError: (err: any) => toast.error(`Erro ao criar: ${err.message}`),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ payload, id }: { payload: any, id: string }) => {
      const { error } = await supabase.from('devocionais').update(payload).eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      toast.success('Devocional atualizado!')
      qc.invalidateQueries({ queryKey: ['devos-mgmt'] })
      setIsDialogOpen(false)
      resetForm()
    },
    onError: (err: any) => toast.error(`Erro ao atualizar: ${err.message}`),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('devocionais').delete().eq('id', id)
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      toast.success('Devocional removido.')
      qc.invalidateQueries({ queryKey: ['devos-mgmt'] })
    },
    onError: (err: any) => toast.error(`Erro ao remover: ${err.message}`),
  })

  const handleSave = () => {
    const tempo = Math.ceil((form.conteudo?.length || 0) / 200)
    const isPublishing = form.status === 'Publicado'
    
    if (editingItem) {
      const payload = {
        ...form,
        tempo_leitura: tempo,
        data_publicacao: isPublishing ? (editingItem.data_publicacao || new Date().toISOString()) : null,
      }
      updateMutation.mutate({ payload, id: editingItem.id })
    } else {
      if (!user || !currentChurchId) {
        toast.error('Usuário não autenticado.')
        return
      }
      if (!form.titulo || !form.conteudo || !form.versiculo_referencia) {
        toast.error('Preencha os campos obrigatórios.')
        return
      }
      const payload = {
        ...form,
        id_igreja: currentChurchId,
        autor_id: user.id,
        tempo_leitura: tempo,
        data_publicacao: isPublishing ? new Date().toISOString() : null,
        compartilhar_com_filhas: form.compartilhar_com_filhas ?? false,
      }
      createMutation.mutate(payload)
    }
  }

  const openNewDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const openEditDialog = (item: Devotional) => {
    setEditingItem(item)
    setForm({
      titulo: item.titulo,
      conteudo: item.conteudo,
      versiculo_referencia: item.versiculo_referencia,
      versiculo_texto: item.versiculo_texto || '',
      categoria: item.categoria,
      tags: item.tags || [],
      status: item.status,
      imagem_capa: item.imagem_capa || '',
      featured: item.featured,
      compartilhar_com_filhas: item.compartilhar_com_filhas ?? false,
    })
    setIsDialogOpen(true)
  }

  const stripHtml = (html: string) => {
    if (typeof window === 'undefined' || !html) return ''
    const tmp = document.createElement('DIV')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  const categories: string[] = ['all', 'Diário', 'Semanal', 'Especial', 'Temático']
  const statusOptions: string[] = ['all', 'Publicado', 'Rascunho', 'Arquivado']

  if (!currentChurchId) {
    return (
      <div className="p-6 text-center text-gray-600">
        Selecione uma igreja para gerenciar devocionais.
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestão de Devocionais</h1>
        <Button onClick={openNewDialog}>
          <Plus className="w-4 h-4 mr-2" /> Novo Devocional
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Pesquisar por título..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(0)
              }}
            />
          </div>
          <div>
            <Select value={categoryFilter} onValueChange={(v) => {
              setCategoryFilter(v)
              setPage(0)
            }}>
              <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c === 'all' ? 'Todas' : c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={statusFilter} onValueChange={(v) => {
              setStatusFilter(v)
              setPage(0)
            }}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                {statusOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === 'all' ? 'Todos' : s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="p-8 text-center text-gray-500 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando...
        </div>
      )}
      
      {error && (
        <div className="p-8 text-center text-red-500">
          Erro ao carregar: {(error as any).message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {devotionalsData.map((d) => (
          <Card key={d.id} className="border hover:shadow-sm transition flex flex-col">
            {d.imagem_capa && (
              <img src={d.imagem_capa} alt={d.titulo} className="h-40 w-full object-cover rounded-t-lg" />
            )}
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg line-clamp-2">{d.titulo}</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-600" 
                  onClick={() => deleteMutation.mutate(d.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-0 flex-grow">
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-2">
                <Badge variant="outline">{d.status}</Badge>
                <Badge className="bg-blue-100 text-blue-800">{d.categoria}</Badge>
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{d.membros?.nome_completo || 'Autor'}</span>
                </div>
                {d.data_publicacao && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(d.data_publicacao).toLocaleDateString('pt-BR')}</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-700 line-clamp-3 mb-2">{stripHtml(d.conteudo)}</p>
              <div className="flex flex-wrap gap-1">
                {(d.tags || []).slice(0, 4).map((t) => (
                  <Badge key={t} variant="secondary" className="text-xs">
                    <Tag className="w-3 h-3 mr-1" />{t}
                  </Badge>
                ))}
              </div>
            </CardContent>
            <div className="p-4 pt-0 flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => openEditDialog(d)}>
                <Pencil className="w-4 h-4 mr-1" /> Editar
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4">
        <span className="text-sm text-gray-600">
          Página {page + 1} de {Math.ceil(devotionalsCount / PAGE_SIZE) || 1}
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
            disabled={(page + 1) * PAGE_SIZE >= devotionalsCount}
          >
            Próxima
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Devocional' : 'Novo Devocional'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input 
              placeholder="Título *" 
              value={form.titulo || ''} 
              onChange={(e) => setForm({ ...form, titulo: e.target.value })} 
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input 
                placeholder="Versículo de Referência *" 
                value={form.versiculo_referencia || ''} 
                onChange={(e) => setForm({ ...form, versiculo_referencia: e.target.value })} 
              />
              <Select 
                value={(form.categoria as string) || 'Diário'} 
                onValueChange={(v) => setForm({ ...form, categoria: v as DevotionalCategory })}
              >
                <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Diário">Diário</SelectItem>
                  <SelectItem value="Semanal">Semanal</SelectItem>
                  <SelectItem value="Especial">Especial</SelectItem>
                  <SelectItem value="Temático">Temático</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea 
              placeholder="Texto do Versículo (opcional)" 
              value={form.versiculo_texto || ''} 
              onChange={(e) => setForm({ ...form, versiculo_texto: e.target.value })} 
              rows={2} 
            />
            <Textarea 
              placeholder="Conteúdo * (HTML básico suportado)" 
              value={form.conteudo || ''} 
              onChange={(e) => setForm({ ...form, conteudo: e.target.value })} 
              rows={10} 
            />
            <Input 
              placeholder="Imagem de capa (URL)" 
              value={form.imagem_capa || ''} 
              onChange={(e) => setForm({ ...form, imagem_capa: e.target.value })} 
            />
            <Input 
              placeholder="Tags separadas por vírgula" 
              value={(form.tags || []).join(', ')} 
              onChange={(e) => setForm({ ...form, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })} 
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Select 
                value={(form.status as string) || 'Rascunho'} 
                onValueChange={(v) => setForm({ ...form, status: v as DevotionalStatus })}
              >
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Rascunho">Rascunho</SelectItem>
                  <SelectItem value="Publicado">Publicado</SelectItem>
                  <SelectItem value="Arquivado">Arquivado</SelectItem>
                </SelectContent>
              </Select>
              <Select 
                value={String(form.featured ? 'true' : 'false')} 
                onValueChange={(v) => setForm({ ...form, featured: v === 'true' })}
              >
                <SelectTrigger><SelectValue placeholder="Destaque" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Sem destaque</SelectItem>
                  <SelectItem value="true">Destacado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-3 border rounded-md flex items-center justify-between">
              <div className="space-y-1">
                <Label>Compartilhar com igrejas filhas</Label>
                <p className="text-xs text-gray-600">
                  Se ativado, este devocional ficará visível para igrejas filhas.
                </p>
              </div>
              <Switch 
                checked={!!form.compartilhar_com_filhas} 
                onCheckedChange={(v) => setForm({ ...form, compartilhar_com_filhas: v })} 
                aria-label="Compartilhar devocional com igrejas filhas" 
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsDialogOpen(false)
                  resetForm()
                }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default DevotionalsManagementPage