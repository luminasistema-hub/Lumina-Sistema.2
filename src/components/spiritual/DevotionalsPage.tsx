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
import { toast } from 'sonner'
import { 
  BookOpen, 
  Heart, 
  Calendar, 
  User, 
  Plus,
  Edit,
  Trash2,
  Eye,
  MessageCircle,
  Share2,
  Search,
  Filter,
  Tag,
  Clock,
  ThumbsUp,
  Loader2
} from 'lucide-react'
import { useDevotionals, Devotional, DevotionalComment } from '@/hooks/useDevotionals'
import { ImageUploader } from '../ui/ImageUploader'

interface DevotionalDetails extends Devotional {
  comments: DevotionalComment[];
  likesCount: number;
  hasLiked?: boolean;
}

const DevotionalsPage = () => {
  const { user } = useAuthStore()
  const [selectedDevotional, setSelectedDevotional] = useState<DevotionalDetails | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'published' | 'my-posts' | 'drafts'>('published')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTag, setSelectedTag] = useState<string>('all')
  const [newComment, setNewComment] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const canCreateDevotionals = user?.role === 'admin' || user?.role === 'pastor' || user?.role === 'lider_ministerio'
  const canModerateComments = user?.role === 'admin' || user?.role === 'pastor'

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

  const filters = {
    status: viewMode === 'published' ? 'Publicado' : (viewMode === 'drafts' ? 'Rascunho' : undefined),
    autor_id: viewMode === 'my-posts' || viewMode === 'drafts' ? user?.id : undefined,
    categoria: selectedCategory,
    tag: selectedTag,
    searchTerm: searchTerm,
  }

  const { devotionals, isLoading, createDevotional, likeDevotional, addComment, fetchDevotionalDetails } = useDevotionals(filters)

  const handleCreateDevotional = async (status: 'Publicado' | 'Rascunho') => {
    if (!newDevotional.titulo || !newDevotional.conteudo || !newDevotional.versiculo_referencia) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    await createDevotional({
      devotionalData: { ...newDevotional, status },
      imageFile: imageFile,
    })

    setIsCreateDialogOpen(false)
    setNewDevotional({
      titulo: '',
      conteudo: '',
      versiculo_referencia: '',
      versiculo_texto: '',
      categoria: 'Diário',
      tags: [],
      status: 'Rascunho',
      featured: false
    })
    setImageFile(null)
    setPreviewUrl(null)
  }

  const handleLike = (devotionalId: string) => {
    if (!selectedDevotional) return;
    const hasLiked = !!selectedDevotional.hasLiked;
    likeDevotional({ devotionalId, hasLiked });
    // Optimistic update
    setSelectedDevotional(prev => prev ? {
        ...prev,
        likesCount: hasLiked ? prev.likesCount - 1 : prev.likesCount + 1,
        hasLiked: !hasLiked
    } : null);
  }

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedDevotional) return;
    addComment({ devotionalId: selectedDevotional.id, content: newComment });
    setNewComment('');
  }

  const handleOpenDetails = async (devotional: Devotional) => {
    try {
      const details = await fetchDevotionalDetails(devotional.id);
      const { data: like } = await supabase.from('devocional_curtidas').select('id').eq('devocional_id', devotional.id).eq('membro_id', user!.id).maybeSingle();
      setSelectedDevotional({ ...details, hasLiked: !!like });
    } catch (error: any) {
      toast.error("Erro ao buscar detalhes: " + error.message);
    }
  }

  const stripHtml = (html: string) => {
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

  const allTags = [...new Set(devotionals.flatMap(d => d.tags || []))]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Devocionais 📖</h1>
        <p className="text-green-100 text-lg">
          Alimento espiritual diário para fortalecer sua fé
        </p>
      </div>

      {/* Navigation and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as typeof viewMode)}>
          <TabsList>
            <TabsTrigger value="published">Publicados</TabsTrigger>
            {canCreateDevotionals && <TabsTrigger value="my-posts">Meus Posts</TabsTrigger>}
            {canCreateDevotionals && <TabsTrigger value="drafts">Rascunhos</TabsTrigger>}
          </TabsList>
        </Tabs>

        <div className="flex gap-3 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Pesquisar devocionais..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="Diário">Diário</SelectItem>
              <SelectItem value="Semanal">Semanal</SelectItem>
              <SelectItem value="Especial">Especial</SelectItem>
              <SelectItem value="Temático">Temático</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedTag} onValueChange={setSelectedTag}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {allTags.map(tag => (
                <SelectItem key={tag} value={tag}>{tag}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {canCreateDevotionals && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-500 hover:bg-green-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Devocional
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar Novo Devocional</DialogTitle>
                  <DialogDescription>
                    Compartilhe uma palavra de edificação com a igreja
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Imagem de Capa</Label>
                    <ImageUploader onFileSelect={setImageFile} previewUrl={previewUrl} setPreviewUrl={setPreviewUrl} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="titulo">Título *</Label>
                    <Input
                      id="titulo"
                      value={newDevotional.titulo}
                      onChange={(e) => setNewDevotional({...newDevotional, titulo: e.target.value})}
                      placeholder="Título do devocional"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="versiculo_referencia">Versículo de Referência *</Label>
                      <Input
                        id="versiculo_referencia"
                        value={newDevotional.versiculo_referencia}
                        onChange={(e) => setNewDevotional({...newDevotional, versiculo_referencia: e.target.value})}
                        placeholder="Ex: João 3:16"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="categoria">Categoria</Label>
                      <Select value={newDevotional.categoria} onValueChange={(value) => setNewDevotional({...newDevotional, categoria: value as Devotional['categoria']})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Diário">Diário</SelectItem>
                          <SelectItem value="Semanal">Semanal</SelectItem>
                          <SelectItem value="Especial">Especial</SelectItem>
                          <SelectItem value="Temático">Temático</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="versiculo_texto">Texto do Versículo</Label>
                    <Textarea
                      id="versiculo_texto"
                      value={newDevotional.versiculo_texto}
                      onChange={(e) => setNewDevotional({...newDevotional, versiculo_texto: e.target.value})}
                      placeholder="Cole aqui o texto completo do versículo"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="conteudo">Conteúdo *</Label>
                    <Textarea
                      id="conteudo"
                      value={newDevotional.conteudo}
                      onChange={(e) => setNewDevotional({...newDevotional, conteudo: e.target.value})}
                      placeholder="Escreva o conteúdo do devocional... Você pode usar HTML básico para formatação."
                      rows={10}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                    <Input
                      id="tags"
                      value={newDevotional.tags?.join(', ')}
                      onChange={(e) => setNewDevotional({...newDevotional, tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)})}
                      placeholder="fé, oração, amor, perdão"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => handleCreateDevotional('Rascunho')}
                    >
                      Salvar Rascunho
                    </Button>
                    <Button onClick={() => handleCreateDevotional('Publicado')}>
                      Publicar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Featured Devotional */}
      {!isLoading && viewMode === 'published' && devotionals.find(d => d.featured) && (
        <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
          <CardContent className="p-6">
            {(() => {
              const featured = devotionals.find(d => d.featured)!
              return (
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-green-500 text-white">Destaque</Badge>
                      <Badge className={getCategoryColor(featured.categoria)}>
                        {featured.categoria}
                      </Badge>
                    </div>
                    <h2 className="text-2xl font-bold mb-2">{featured.titulo}</h2>
                    <p className="text-gray-600 mb-3">
                      {stripHtml(featured.conteudo).substring(0, 200)}...
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{featured.membros.nome_completo}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(featured.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{featured.tempo_leitura} min</span>
                      </div>
                    </div>
                    <Button onClick={() => handleOpenDetails(featured)}>
                      Ler Devocional Completo
                    </Button>
                  </div>
                  {featured.imagem_capa && (
                    <div className="w-48 h-32 bg-gray-200 rounded-lg overflow-hidden">
                      <img 
                        src={featured.imagem_capa} 
                        alt={featured.titulo}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}

      {/* Devotionals Grid */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devotionals.filter(d => !d.featured || viewMode !== 'published').map((devotional) => (
            <Card key={devotional.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleOpenDetails(devotional)}>
              {devotional.imagem_capa && (
                <div className="h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                  <img 
                    src={devotional.imagem_capa} 
                    alt={devotional.titulo}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Badge className={getCategoryColor(devotional.categoria)}>
                    {devotional.categoria}
                  </Badge>
                  {devotional.status !== 'Publicado' && (
                    <Badge variant="outline">
                      {devotional.status}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg line-clamp-2">{devotional.titulo}</CardTitle>
                <CardDescription className="text-sm font-medium text-green-600">
                  {devotional.versiculo_referencia}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {stripHtml(devotional.conteudo)}
                </p>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  {(devotional.tags || []).slice(0, 3).map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                  {(devotional.tags?.length || 0) > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{(devotional.tags?.length || 0) - 3}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    <span>{devotional.membros.nome_completo}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{devotional.tempo_leitura} min</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      <span>{0 /* TODO */}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" />
                      <span>{devotional.devocional_curtidas[0]?.count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{devotional.devocional_comentarios[0]?.count || 0}</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(devotional.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && devotionals.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum devocional encontrado</h3>
            <p className="text-gray-600">
              {searchTerm || selectedCategory !== 'all' || selectedTag !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Não há devocionais disponíveis no momento'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Devotional Detail Modal */}
      {!isLoading && selectedDevotional && (
        <Dialog open={!!selectedDevotional} onOpenChange={() => setSelectedDevotional(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <Badge className={getCategoryColor(selectedDevotional.categoria)}>
                  {selectedDevotional.categoria}
                </Badge>
                {selectedDevotional.featured && (
                  <Badge className="bg-green-500 text-white">Destaque</Badge>
                )}
              </div>
              <DialogTitle className="text-2xl">{selectedDevotional.titulo}</DialogTitle>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{selectedDevotional.membros.nome_completo}</span>
                  {selectedDevotional.membros.funcao && (
                    <span className="text-gray-400">• {selectedDevotional.membros.funcao}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(selectedDevotional.created_at).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{selectedDevotional.tempo_leitura} min de leitura</span>
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-6">
              {selectedDevotional.imagem_capa && (
                <div className="h-64 bg-gray-200 rounded-lg overflow-hidden">
                  <img src={selectedDevotional.imagem_capa} alt={selectedDevotional.titulo} className="w-full h-full object-cover" />
                </div>
              )}
              {/* Bible Verse */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                <div className="font-semibold text-blue-900 mb-2">{selectedDevotional.versiculo_referencia}</div>
                {selectedDevotional.versiculo_texto && (
                  <div className="text-blue-800 italic">"{selectedDevotional.versiculo_texto}"</div>
                )}
              </div>

              {/* Content */}
              <div 
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedDevotional.conteudo }}
              />

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {(selectedDevotional.tags || []).map(tag => (
                  <Badge key={tag} variant="outline">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t">
                <Button 
                  variant={selectedDevotional.hasLiked ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleLike(selectedDevotional.id)}
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Curtir ({selectedDevotional.likesCount})
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartilhar
                </Button>
                <div className="flex items-center gap-1 text-sm text-gray-500 ml-auto">
                  <Eye className="w-4 h-4" />
                  <span>{0 /* TODO */} visualizações</span>
                </div>
              </div>

              {/* Comments Section */}
              <div className="pt-6 border-t">
                <h4 className="font-semibold mb-4">Comentários ({selectedDevotional.comments.length})</h4>
                <div className="space-y-4 mb-6">
                  {selectedDevotional.comments.map(comment => (
                    <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{comment.membros.nome_completo}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(comment.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-gray-700">{comment.conteudo}</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Adicione um comentário..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <Button onClick={handleAddComment}>Enviar</Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default DevotionalsPage