import { useState, useMemo } from 'react'
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
import { toast } from 'sonner'
import { 
  BookOpen, 
  Calendar, 
  User, 
  Plus,
  Eye,
  MessageCircle,
  Share2,
  Search,
  Tag,
  Clock,
  ThumbsUp,
  Loader2
} from 'lucide-react'
import { useDevotionals, useDevotionalDetails, useCreateDevotional, useLikeDevotional, useAddComment, Devotional } from '../../hooks/useDevotionals'

const DevotionalDetailView = ({ devotionalId, onLike, onComment, onClose }: any) => {
  const { user } = useAuthStore()
  const { data: devotional, isLoading, error } = useDevotionalDetails(devotionalId)
  const addCommentMutation = useAddComment()
  const [comment, setComment] = useState('')

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return
    addCommentMutation.mutate({ devotionalId, content: comment }, {
      onSuccess: () => setComment('')
    })
  }

  if (isLoading) return <div className="flex justify-center items-center p-8"><Loader2 className="w-8 h-8 animate-spin" /></div>
  if (error || !devotional) return <div className="p-8 text-red-500">Erro ao carregar devocional.</div>

  const userHasLiked = devotional.devocional_curtidas.some(like => like.membro_id === user?.id)

  const getCategoryColor = (categoria: Devotional['categoria']) => {
    switch (categoria) {
      case 'Diário': return 'bg-blue-100 text-blue-800'
      case 'Semanal': return 'bg-green-100 text-green-800'
      case 'Especial': return 'bg-purple-100 text-purple-800'
      case 'Temático': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <div className="flex items-center gap-2 mb-2">
          <Badge className={getCategoryColor(devotional.categoria)}>
            {devotional.categoria}
          </Badge>
          {devotional.featured && (
            <Badge className="bg-green-500 text-white">Destaque</Badge>
          )}
        </div>
        <DialogTitle className="text-2xl">{devotional.titulo}</DialogTitle>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <User className="w-4 h-4" />
            <span>{devotional.membros?.nome_completo || 'Autor desconhecido'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{new Date(devotional.data_publicacao).toLocaleDateString('pt-BR')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{devotional.tempo_leitura} min de leitura</span>
          </div>
        </div>
      </DialogHeader>
      
      <div className="space-y-6 py-4">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
          <div className="font-semibold text-blue-900 mb-2">{devotional.versiculo_referencia}</div>
          {devotional.versiculo_texto && (
            <div className="text-blue-800 italic">"{devotional.versiculo_texto}"</div>
          )}
        </div>

        <div 
          className="prose prose-lg max-w-none whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: devotional.conteudo }}
        />

        <div className="flex flex-wrap gap-2">
          {devotional.tags.map(tag => (
            <Badge key={tag} variant="outline">
              <Tag className="w-3 h-3 mr-1" />
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center gap-3 pt-4 border-t">
          <Button 
            variant={userHasLiked ? "default" : "outline"} 
            size="sm"
            onClick={() => onLike({ devotionalId: devotional.id, hasLiked: userHasLiked })}
          >
            <ThumbsUp className="w-4 h-4 mr-2" />
            {userHasLiked ? 'Curtido' : 'Curtir'} ({devotional.devocional_curtidas.length})
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(window.location.href)}>
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>
          <div className="flex items-center gap-1 text-sm text-gray-500 ml-auto">
            <Eye className="w-4 h-4" />
            <span>{devotional.visualizacoes} visualizações</span>
          </div>
        </div>

        <div className="pt-6 border-t">
          <h4 className="font-semibold mb-4">Comentários ({devotional.comments.length})</h4>
          <div className="space-y-4 mb-6">
            {devotional.comments.map(comment => (
              <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{comment.membros?.nome_completo || 'Usuário'}</span>
                  <span className="text-sm text-gray-500">
                    {new Date(comment.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <p className="text-gray-700">{comment.conteudo}</p>
              </div>
            ))}
          </div>
          <form onSubmit={handleCommentSubmit} className="flex gap-2">
            <Input 
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Escreva um comentário..."
              disabled={addCommentMutation.isPending}
            />
            <Button type="submit" disabled={addCommentMutation.isPending}>
              {addCommentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar'}
            </Button>
          </form>
        </div>
      </div>
    </DialogContent>
  )
}

const DevotionalsPage = () => {
  const { user } = useAuthStore()
  const [selectedDevotionalId, setSelectedDevotionalId] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'published' | 'my-posts' | 'drafts'>('published')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTag, setSelectedTag] = useState<string>('all')

  const canCreateDevotionals = user?.role === 'admin' || user?.role === 'pastor' || user?.role === 'lider_ministerio'

  const [newDevotional, setNewDevotional] = useState<Partial<Devotional>>({
    titulo: '',
    conteudo: '',
    versiculo_referencia: '',
    versiculo_texto: '',
    categoria: 'Diário',
    tags: [],
    status: 'Rascunho',
    featured: false
  })

  const filters = useMemo(() => ({
    status: viewMode === 'published' ? 'Publicado' : (viewMode === 'drafts' ? 'Rascunho' : undefined),
    authorId: viewMode === 'my-posts' || viewMode === 'drafts' ? user?.id : undefined,
    category: selectedCategory,
    tag: selectedTag,
    searchTerm: searchTerm,
  }), [viewMode, user?.id, selectedCategory, selectedTag, searchTerm])

  const { data: devotionals, isLoading, error } = useDevotionals(filters)
  const createDevotionalMutation = useCreateDevotional()
  const likeMutation = useLikeDevotional()

  const handleCreateDevotional = (status: 'Publicado' | 'Rascunho') => {
    if (!newDevotional.titulo || !newDevotional.conteudo || !newDevotional.versiculo_referencia) {
      toast.error('Preencha todos os campos obrigatórios.')
      return
    }
    createDevotionalMutation.mutate({ ...newDevotional, status }, {
      onSuccess: () => {
        setIsCreateDialogOpen(false)
        setNewDevotional({ titulo: '', conteudo: '', versiculo_referencia: '', categoria: 'Diário', tags: [], status: 'Rascunho' })
      }
    })
  }

  const stripHtml = (html: string) => {
    if (typeof window === 'undefined') return html
    const tmp = document.createElement('DIV')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  const getCategoryColor = (categoria: Devotional['categoria']) => {
    switch (categoria) {
      case 'Diário': return 'bg-blue-100 text-blue-800'
      case 'Semanal': return 'bg-green-100 text-green-800'
      case 'Especial': return 'bg-purple-100 text-purple-800'
      case 'Temático': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const allTags = useMemo(() => [...new Set(devotionals?.flatMap(d => d.tags) || [])], [devotionals])
  const featuredDevotional = useMemo(() => devotionals?.find(d => d.featured), [devotionals])

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Devocionais 📖</h1>
        <p className="text-green-100 text-lg">Alimento espiritual diário para fortalecer sua fé</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
          <TabsList>
            <TabsTrigger value="published">Publicados</TabsTrigger>
            {canCreateDevotionals && <TabsTrigger value="my-posts">Meus Posts</TabsTrigger>}
            {canCreateDevotionals && <TabsTrigger value="drafts">Rascunhos</TabsTrigger>}
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Pesquisar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-full sm:w-48" />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todas</SelectItem><SelectItem value="Diário">Diário</SelectItem><SelectItem value="Semanal">Semanal</SelectItem><SelectItem value="Especial">Especial</SelectItem><SelectItem value="Temático">Temático</SelectItem></SelectContent>
          </Select>
          <Select value={selectedTag} onValueChange={setSelectedTag}>
            <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Tags" /></SelectTrigger>
            <SelectContent><SelectItem value="all">Todas</SelectItem>{allTags.map(tag => <SelectItem key={tag} value={tag}>{tag}</SelectItem>)}</SelectContent>
          </Select>
          {canCreateDevotionals && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild><Button className="bg-green-500 hover:bg-green-600 w-full sm:w-auto"><Plus className="w-4 h-4 mr-2" />Novo</Button></DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Criar Novo Devocional</DialogTitle><DialogDescription>Compartilhe uma palavra de edificação com a igreja.</DialogDescription></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2"><Label htmlFor="titulo">Título *</Label><Input id="titulo" value={newDevotional.titulo} onChange={(e) => setNewDevotional({...newDevotional, titulo: e.target.value})} /></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="versiculo_referencia">Versículo de Referência *</Label><Input id="versiculo_referencia" value={newDevotional.versiculo_referencia} onChange={(e) => setNewDevotional({...newDevotional, versiculo_referencia: e.target.value})} /></div>
                    <div className="space-y-2"><Label htmlFor="categoria">Categoria</Label><Select value={newDevotional.categoria} onValueChange={(value) => setNewDevotional({...newDevotional, categoria: value as any})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Diário">Diário</SelectItem><SelectItem value="Semanal">Semanal</SelectItem><SelectItem value="Especial">Especial</SelectItem><SelectItem value="Temático">Temático</SelectItem></SelectContent></Select></div>
                  </div>
                  <div className="space-y-2"><Label htmlFor="versiculo_texto">Texto do Versículo</Label><Textarea id="versiculo_texto" value={newDevotional.versiculo_texto} onChange={(e) => setNewDevotional({...newDevotional, versiculo_texto: e.target.value})} rows={2} /></div>
                  <div className="space-y-2"><Label htmlFor="conteudo">Conteúdo * (HTML básico suportado)</Label><Textarea id="conteudo" value={newDevotional.conteudo} onChange={(e) => setNewDevotional({...newDevotional, conteudo: e.target.value})} rows={10} /></div>
                  <div className="space-y-2"><Label htmlFor="tags">Tags (separadas por vírgula)</Label><Input id="tags" value={newDevotional.tags?.join(', ')} onChange={(e) => setNewDevotional({...newDevotional, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)})} /></div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
                    <Button variant="outline" onClick={() => handleCreateDevotional('Rascunho')} disabled={createDevotionalMutation.isPending}>Salvar Rascunho</Button>
                    <Button onClick={() => handleCreateDevotional('Publicado')} disabled={createDevotionalMutation.isPending}>{createDevotionalMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publicar'}</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {isLoading && <div className="flex justify-center p-12"><Loader2 className="w-10 h-10 animate-spin text-gray-400" /></div>}
      {error && <div className="text-red-500 text-center p-12">Erro ao carregar devocionais: {error.message}</div>}
      
      {devotionals && (
        <>
          {viewMode === 'published' && featuredDevotional && (
            <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
              <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2"><Badge className="bg-green-500 text-white">Destaque</Badge><Badge className={getCategoryColor(featuredDevotional.categoria)}>{featuredDevotional.categoria}</Badge></div>
                  <h2 className="text-2xl font-bold mb-2">{featuredDevotional.titulo}</h2>
                  <p className="text-gray-600 mb-3">{stripHtml(featuredDevotional.conteudo).substring(0, 200)}...</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <div className="flex items-center gap-1"><User className="w-4 h-4" /><span>{featuredDevotional.membros?.nome_completo}</span></div>
                    <div className="flex items-center gap-1"><Calendar className="w-4 h-4" /><span>{new Date(featuredDevotional.data_publicacao).toLocaleDateString('pt-BR')}</span></div>
                    <div className="flex items-center gap-1"><Clock className="w-4 h-4" /><span>{featuredDevotional.tempo_leitura} min</span></div>
                  </div>
                  <Button onClick={() => setSelectedDevotionalId(featuredDevotional.id)}>Ler Completo</Button>
                </div>
                {featuredDevotional.imagem_capa && <img src={featuredDevotional.imagem_capa} alt={featuredDevotional.titulo} className="w-full md:w-48 h-48 md:h-32 object-cover rounded-lg" />}
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {devotionals.filter(d => !d.featured || viewMode !== 'published').map((devotional) => (
              <Card key={devotional.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col" onClick={() => setSelectedDevotionalId(devotional.id)}>
                {devotional.imagem_capa && <img src={devotional.imagem_capa} alt={devotional.titulo} className="h-48 w-full object-cover rounded-t-lg" />}
                <CardHeader>
                  <div className="flex items-start justify-between mb-2"><Badge className={getCategoryColor(devotional.categoria)}>{devotional.categoria}</Badge>{devotional.status !== 'Publicado' && <Badge variant="outline">{devotional.status}</Badge>}</div>
                  <CardTitle className="text-lg line-clamp-2">{devotional.titulo}</CardTitle>
                  <CardDescription className="text-sm font-medium text-green-600">{devotional.versiculo_referencia}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col flex-grow">
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">{stripHtml(devotional.conteudo)}</p>
                  <div className="flex flex-wrap gap-1 mb-4">{devotional.tags.slice(0, 3).map(tag => <Badge key={tag} variant="outline" className="text-xs"><Tag className="w-3 h-3 mr-1" />{tag}</Badge>)}{devotional.tags.length > 3 && <Badge variant="outline" className="text-xs">+{devotional.tags.length - 3}</Badge>}</div>
                  <div className="flex items-center justify-between text-sm text-gray-500 mt-auto">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1"><Eye className="w-4 h-4" /><span>{devotional.visualizacoes}</span></div>
                      <div className="flex items-center gap-1"><ThumbsUp className="w-4 h-4" /><span>{devotional.devocional_curtidas.length}</span></div>
                      <div className="flex items-center gap-1"><MessageCircle className="w-4 h-4" /><span>{devotional.devocional_comentarios[0]?.count || 0}</span></div>
                    </div>
                    <span className="text-xs text-gray-400">{new Date(devotional.data_publicacao).toLocaleDateString('pt-BR')}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {devotionals.length === 0 && !isLoading && (
            <Card className="border-0 shadow-sm"><CardContent className="p-12 text-center"><BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" /><h3 className="text-lg font-medium">Nenhum devocional encontrado</h3><p className="text-gray-600">Tente ajustar os filtros ou crie um novo devocional.</p></CardContent></Card>
          )}
        </>
      )}

      <Dialog open={!!selectedDevotionalId} onOpenChange={(open) => !open && setSelectedDevotionalId(null)}>
        {selectedDevotionalId && <DevotionalDetailView devotionalId={selectedDevotionalId} onLike={likeMutation.mutate} />}
      </Dialog>
    </div>
  )
}

export default DevotionalsPage