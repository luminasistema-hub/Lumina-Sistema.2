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
  ThumbsUp
} from 'lucide-react'

interface Devotional {
  id: string
  titulo: string
  conteudo: string
  versiculo_referencia: string
  versiculo_texto: string
  categoria: 'Diário' | 'Semanal' | 'Especial' | 'Temático'
  tags: string[]
  autor: {
    id: string
    nome: string
    ministerio?: string
  }
  data_publicacao: string
  status: 'Rascunho' | 'Publicado' | 'Arquivado'
  imagem_capa?: string
  tempo_leitura: number
  visualizacoes: number
  curtidas: number
  comentarios: Comment[]
  featured: boolean
}

interface Comment {
  id: string
  autor_nome: string
  autor_id: string
  conteudo: string
  data_comentario: string
  aprovado: boolean
}

const DevotionalsPage = () => {
  const { user } = useAuthStore()
  const [devotionals, setDevotionals] = useState<Devotional[]>([])
  const [filteredDevotionals, setFilteredDevotionals] = useState<Devotional[]>([])
  const [selectedDevotional, setSelectedDevotional] = useState<Devotional | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'published' | 'my-posts' | 'drafts'>('published')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTag, setSelectedTag] = useState<string>('all')

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

  // Mock data
  useEffect(() => {
    console.log('DevotionalsPage: Loading devotionals data...')
    const mockDevotionals: Devotional[] = [
      {
        id: '1',
        titulo: 'A Força do Perdão',
        conteudo: `
          <p>O perdão é uma das maiores demonstrações de força espiritual que podemos exercer. Quando Jesus nos ensinou a orar "perdoa as nossas dívidas, assim como perdoamos aos nossos devedores", Ele estava estabelecendo um princípio fundamental para a vida cristã.</p>
          
          <p>Perdoar não significa esquecer ou fingir que nada aconteceu. Perdoar é um ato consciente de liberar o ressentimento e a amargura que carregamos em nossos corações. É escolher abençoar em vez de amaldiçoar, amar em vez de odiar.</p>
          
          <p>Quando perdoamos, não estamos apenas libertando aquele que nos ofendeu - estamos libertando a nós mesmos. A amargura é como um veneno que tomamos esperando que o outro morra. O perdão é o antídoto que nos cura e restaura.</p>
          
          <h3>Reflexão para Hoje</h3>
          <p>Há alguém em sua vida que você precisa perdoar? Que tal começar hoje? Ore por essa pessoa, peça a Deus para abençoá-la e libere esse peso do seu coração.</p>
          
          <h3>Oração</h3>
          <p><em>Senhor, ajuda-me a perdoar assim como Tu me perdoaste. Remove de mim toda amargura e ressentimento. Ensina-me a amar mesmo quando é difícil. Em nome de Jesus, amém.</em></p>
        `,
        versiculo_referencia: 'Mateus 6:14-15',
        versiculo_texto: 'Porque, se perdoardes aos homens as suas ofensas, também vosso Pai celestial vos perdoará a vós.',
        categoria: 'Diário',
        tags: ['perdão', 'cura', 'relacionamentos', 'oração'],
        autor: { id: '1', nome: 'Pastor João Silva', ministerio: 'Pastor Principal' },
        data_publicacao: '2025-09-11T06:00:00',
        status: 'Publicado',
        imagem_capa: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop',
        tempo_leitura: 3,
        visualizacoes: 245,
        curtidas: 18,
        featured: true,
        comentarios: [
          {
            id: '1',
            autor_nome: 'Maria Santos',
            autor_id: '2',
            conteudo: 'Palavra muito edificante! Exatamente o que eu precisava ouvir hoje.',
            data_comentario: '2025-09-11T10:30:00',
            aprovado: true
          },
          {
            id: '2',
            autor_nome: 'Carlos Silva',
            autor_id: '3',
            conteudo: 'Obrigado por compartilhar essa reflexão. Deus continue abençoando seu ministério!',
            data_comentario: '2025-09-11T14:15:00',
            aprovado: true
          }
        ]
      },
      {
        id: '2',
        titulo: 'Caminhando pela Fé',
        conteudo: `
          <p>A vida cristã é uma jornada de fé. Nem sempre vemos o caminho completo à nossa frente, mas Deus nos convida a dar o próximo passo confiando em Sua direção.</p>
          
          <p>Abraão saiu de sua terra sem saber para onde ia, mas sabia Quem o estava guiando. Moisés conduziu o povo pelo deserto seguindo uma coluna de nuvem de dia e de fogo à noite. Os discípulos deixaram suas redes para seguir Jesus.</p>
          
          <p>Todos esses heróis da fé tinham algo em comum: eles deram o próximo passo mesmo quando não podiam ver o destino final. A fé não é sobre ter todas as respostas, mas sobre confiar nAquele que tem.</p>
        `,
        versiculo_referencia: 'Hebreus 11:1',
        versiculo_texto: 'Ora, a fé é o firme fundamento das coisas que se esperam, e a prova das coisas que se não veem.',
        categoria: 'Semanal',
        tags: ['fé', 'confiança', 'jornada', 'crescimento'],
        autor: { id: '2', nome: 'Pastora Maria Oliveira', ministerio: 'Pastora Auxiliar' },
        data_publicacao: '2025-09-10T06:00:00',
        status: 'Publicado',
        imagem_capa: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
        tempo_leitura: 2,
        visualizacoes: 189,
        curtidas: 12,
        featured: false,
        comentarios: []
      },
      {
        id: '3',
        titulo: 'O Poder da Gratidão',
        conteudo: `
          <p>Em um mundo que constantemente nos ensina a focar no que não temos, a gratidão surge como um ato revolucionário de fé. Quando escolhemos ser gratos, mudamos nossa perspectiva e permitimos que Deus transforme nosso coração.</p>
          
          <p>A gratidão não é apenas sobre ser educado ou bem-mannered. É um princípio espiritual poderoso que abre as portas dos céus em nossa vida.</p>
        `,
        versiculo_referencia: '1 Tessalonicenses 5:18',
        versiculo_texto: 'Em tudo dai graças, porque esta é a vontade de Deus em Cristo Jesus para convosco.',
        categoria: 'Temático',
        tags: ['gratidão', 'adoração', 'bênçãos'],
        autor: { id: '3', nome: 'Líder Pedro Costa', ministerio: 'Líder de Ministério' },
        data_publicacao: '2025-09-09T06:00:00',
        status: 'Rascunho',
        tempo_leitura: 2,
        visualizacoes: 0,
        curtidas: 0,
        featured: false,
        comentarios: []
      }
    ]
    setDevotionals(mockDevotionals)
    setFilteredDevotionals(mockDevotionals.filter(d => d.status === 'Publicado'))
  }, [])

  useEffect(() => {
    let filtered = devotionals

    // Filter by view mode
    if (viewMode === 'published') {
      filtered = filtered.filter(d => d.status === 'Publicado')
    } else if (viewMode === 'my-posts') {
      filtered = filtered.filter(d => d.autor.id === user?.id)
    } else if (viewMode === 'drafts') {
      filtered = filtered.filter(d => d.status === 'Rascunho' && d.autor.id === user?.id)
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(d => d.categoria === selectedCategory)
    }

    // Filter by tag
    if (selectedTag !== 'all') {
      filtered = filtered.filter(d => d.tags.includes(selectedTag))
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(d => 
        d.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.conteudo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    setFilteredDevotionals(filtered)
  }, [devotionals, viewMode, selectedCategory, selectedTag, searchTerm, user?.id])

  const handleCreateDevotional = () => {
    if (!newDevotional.titulo || !newDevotional.conteudo || !newDevotional.versiculo_referencia) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    const devotional: Devotional = {
      id: Date.now().toString(),
      titulo: newDevotional.titulo!,
      conteudo: newDevotional.conteudo!,
      versiculo_referencia: newDevotional.versiculo_referencia!,
      versiculo_texto: newDevotional.versiculo_texto || '',
      categoria: newDevotional.categoria as Devotional['categoria'] || 'Diário',
      tags: newDevotional.tags || [],
      autor: { id: user?.id || '', nome: user?.name || '', ministerio: user?.ministry },
      data_publicacao: new Date().toISOString(),
      status: newDevotional.status as Devotional['status'] || 'Rascunho',
      tempo_leitura: Math.ceil(newDevotional.conteudo!.length / 200), // Estimativa: 200 caracteres por minuto
      visualizacoes: 0,
      curtidas: 0,
      comentarios: [],
      featured: newDevotional.featured || false
    }

    setDevotionals([devotional, ...devotionals])
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
    toast.success('Devocional criado com sucesso!')
  }

  const handleLike = (devotionalId: string) => {
    setDevotionals(prev => prev.map(d => 
      d.id === devotionalId 
        ? { ...d, curtidas: d.curtidas + 1 }
        : d
    ))
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

  const allTags = [...new Set(devotionals.flatMap(d => d.tags))]

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
                      onClick={() => {
                        setNewDevotional({...newDevotional, status: 'Rascunho'})
                        handleCreateDevotional()
                      }}
                    >
                      Salvar Rascunho
                    </Button>
                    <Button onClick={() => {
                      setNewDevotional({...newDevotional, status: 'Publicado'})
                      handleCreateDevotional()
                    }}>
                      Publicar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Featured Devotional */}
      {viewMode === 'published' && filteredDevotionals.find(d => d.featured) && (
        <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
          <CardContent className="p-6">
            {(() => {
              const featured = filteredDevotionals.find(d => d.featured)!
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
                        <span>{featured.autor.nome}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(featured.data_publicacao).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{featured.tempo_leitura} min</span>
                      </div>
                    </div>
                    <Button onClick={() => setSelectedDevotional(featured)}>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDevotionals.filter(d => !d.featured || viewMode !== 'published').map((devotional) => (
          <Card key={devotional.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedDevotional(devotional)}>
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
                {devotional.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
                {devotional.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{devotional.tags.length - 3}
                  </Badge>
                )}
              </div>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  <span>{devotional.autor.nome}</span>
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
                    <span>{devotional.visualizacoes}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ThumbsUp className="w-4 h-4" />
                    <span>{devotional.curtidas}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-4 h-4" />
                    <span>{devotional.comentarios.length}</span>
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(devotional.data_publicacao).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDevotionals.length === 0 && (
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
      {selectedDevotional && (
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
                  <span>{selectedDevotional.autor.nome}</span>
                  {selectedDevotional.autor.ministerio && (
                    <span className="text-gray-400">• {selectedDevotional.autor.ministerio}</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(selectedDevotional.data_publicacao).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{selectedDevotional.tempo_leitura} min de leitura</span>
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-6">
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
                {selectedDevotional.tags.map(tag => (
                  <Badge key={tag} variant="outline">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleLike(selectedDevotional.id)}
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Curtir ({selectedDevotional.curtidas})
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Compartilhar
                </Button>
                <div className="flex items-center gap-1 text-sm text-gray-500 ml-auto">
                  <Eye className="w-4 h-4" />
                  <span>{selectedDevotional.visualizacoes} visualizações</span>
                </div>
              </div>

              {/* Comments Section */}
              {selectedDevotional.comentarios.length > 0 && (
                <div className="pt-6 border-t">
                  <h4 className="font-semibold mb-4">Comentários ({selectedDevotional.comentarios.length})</h4>
                  <div className="space-y-4">
                    {selectedDevotional.comentarios.map(comment => (
                      <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{comment.autor_nome}</span>
                          <span className="text-sm text-gray-500">
                            {new Date(comment.data_comentario).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-gray-700">{comment.conteudo}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default DevotionalsPage