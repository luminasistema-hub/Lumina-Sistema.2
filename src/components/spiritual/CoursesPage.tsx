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
import { toast } from 'sonner'
import { 
  BookOpen, 
  Play, 
  Clock, 
  Users, 
  Plus,
  Edit,
  Trash2,
  Award,
  Star,
  CheckCircle,
  Youtube,
  FileText,
  Download,
  Upload
} from 'lucide-react'

interface Course {
  id: string
  nome: string
  descricao: string
  tipo: 'Presencial' | 'Online' | 'Híbrido'
  categoria: 'Discipulado' | 'Liderança' | 'Teologia' | 'Ministério' | 'Evangelismo'
  nivel: 'Básico' | 'Intermediário' | 'Avançado'
  professor: {
    id: string
    nome: string
    email: string
  }
  duracao_horas: number
  status: 'Rascunho' | 'Ativo' | 'Pausado' | 'Finalizado'
  data_inicio: string
  data_fim: string
  modulos: CourseModule[]
  alunos_inscritos: Student[]
  certificado_disponivel: boolean
  nota_minima_aprovacao: number
  valor?: number
}

interface CourseModule {
  id: string
  titulo: string
  descricao: string
  ordem: number
  aulas: Lesson[]
  avaliacoes: Assessment[]
}

interface Lesson {
  id: string
  titulo: string
  descricao: string
  tipo: 'Video' | 'Texto' | 'PDF' | 'Quiz'
  conteudo: string // YouTube URL for videos, text content, etc.
  duracao_minutos: number
  obrigatoria: boolean
  ordem: number
}

interface Assessment {
  id: string
  titulo: string
  tipo: 'Quiz' | 'Dissertativa' | 'Prática'
  perguntas: Question[]
  nota_maxima: number
  tentativas_permitidas: number
}

interface Question {
  id: string
  pergunta: string
  tipo: 'Múltipla Escolha' | 'Verdadeiro/Falso' | 'Dissertativa'
  opcoes?: string[]
  resposta_correta?: string | number
  pontos: number
}

interface Student {
  id: string
  nome: string
  email: string
  data_inscricao: string
  progresso: number
  nota_final?: number
  certificado_emitido: boolean
  aulas_assistidas: string[]
  avaliacoes_respondidas: Array<{
    avaliacao_id: string
    nota: number
    data_resposta: string
  }>
}

const CoursesPage = () => {
  const { user } = useAuthStore()
  const [courses, setCourses] = useState<Course[]>([])
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'student' | 'teacher' | 'admin'>('student')

  const canManageCourses = user?.role === 'admin' || user?.role === 'pastor'
  const canTeach = canManageCourses || user?.role === 'lider_ministerio'

  const [newCourse, setNewCourse] = useState<Partial<Course>>({
    nome: '',
    descricao: '',
    tipo: 'Online',
    categoria: 'Discipulado',
    nivel: 'Básico',
    duracao_horas: 0,
    status: 'Rascunho',
    modulos: [],
    alunos_inscritos: [],
    certificado_disponivel: true,
    nota_minima_aprovacao: 70
  })

  // Mock data
  useEffect(() => {
    console.log('CoursesPage: Loading courses data...')
    const mockCourses: Course[] = [
      {
        id: '1',
        nome: 'Fundamentos da Fé Cristã',
        descricao: 'Curso básico sobre os pilares da fé cristã, ideal para novos convertidos e aqueles que desejam fortalecer seus fundamentos espirituais.',
        tipo: 'Online',
        categoria: 'Discipulado',
        nivel: 'Básico',
        professor: { id: '1', nome: 'Pastor João Silva', email: 'joao@igreja.com' },
        duracao_horas: 20,
        status: 'Ativo',
        data_inicio: '2025-09-01',
        data_fim: '2025-11-30',
        certificado_disponivel: true,
        nota_minima_aprovacao: 70,
        valor: 0,
        modulos: [
          {
            id: '1',
            titulo: 'Introdução à Fé',
            descricao: 'Conceitos básicos da fé cristã',
            ordem: 1,
            aulas: [
              {
                id: '1',
                titulo: 'O que é ser cristão?',
                descricao: 'Entendendo o significado de seguir a Cristo',
                tipo: 'Video',
                conteudo: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                duracao_minutos: 45,
                obrigatoria: true,
                ordem: 1
              },
              {
                id: '2',
                titulo: 'A Bíblia como Palavra de Deus',
                descricao: 'Compreendendo a autoridade das Escrituras',
                tipo: 'Video',
                conteudo: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                duracao_minutos: 50,
                obrigatoria: true,
                ordem: 2
              }
            ],
            avaliacoes: [
              {
                id: '1',
                titulo: 'Avaliação Módulo 1',
                tipo: 'Quiz',
                nota_maxima: 100,
                tentativas_permitidas: 3,
                perguntas: [
                  {
                    id: '1',
                    pergunta: 'Qual é o primeiro passo para ser cristão?',
                    tipo: 'Múltipla Escolha',
                    opcoes: ['Aceitar Jesus como Salvador', 'Ir à igreja', 'Ler a Bíblia', 'Fazer boas obras'],
                    resposta_correta: 0,
                    pontos: 25
                  }
                ]
              }
            ]
          }
        ],
        alunos_inscritos: [
          {
            id: '1',
            nome: 'Maria Santos',
            email: 'maria@email.com',
            data_inscricao: '2025-09-05',
            progresso: 75,
            aulas_assistidas: ['1'],
            avaliacoes_respondidas: [],
            certificado_emitido: false
          }
        ]
      },
      {
        id: '2',
        nome: 'Liderança Cristã Eficaz',
        descricao: 'Desenvolvimento de habilidades de liderança baseadas em princípios bíblicos para líderes de ministério.',
        tipo: 'Híbrido',
        categoria: 'Liderança',
        nivel: 'Intermediário',
        professor: { id: '2', nome: 'Pastora Maria Oliveira', email: 'maria@igreja.com' },
        duracao_horas: 40,
        status: 'Ativo',
        data_inicio: '2025-09-15',
        data_fim: '2025-12-15',
        certificado_disponivel: true,
        nota_minima_aprovacao: 80,
        valor: 150,
        modulos: [],
        alunos_inscritos: []
      }
    ]
    setCourses(mockCourses)
  }, [])

  const handleCreateCourse = () => {
    if (!newCourse.nome || !newCourse.descricao) {
      toast.error('Preencha os campos obrigatórios')
      return
    }

    const course: Course = {
      id: Date.now().toString(),
      nome: newCourse.nome!,
      descricao: newCourse.descricao!,
      tipo: newCourse.tipo as Course['tipo'] || 'Online',
      categoria: newCourse.categoria as Course['categoria'] || 'Discipulado',
      nivel: newCourse.nivel as Course['nivel'] || 'Básico',
      professor: { id: user?.id || '', nome: user?.name || '', email: user?.email || '' },
      duracao_horas: newCourse.duracao_horas || 0,
      status: 'Rascunho',
      data_inicio: newCourse.data_inicio || '',
      data_fim: newCourse.data_fim || '',
      modulos: [],
      alunos_inscritos: [],
      certificado_disponivel: newCourse.certificado_disponivel || false,
      nota_minima_aprovacao: newCourse.nota_minima_aprovacao || 70,
      valor: newCourse.valor
    }

    setCourses([...courses, course])
    setIsCreateDialogOpen(false)
    setNewCourse({
      nome: '',
      descricao: '',
      tipo: 'Online',
      categoria: 'Discipulado',
      nivel: 'Básico',
      duracao_horas: 0,
      status: 'Rascunho',
      modulos: [],
      alunos_inscritos: [],
      certificado_disponivel: true,
      nota_minima_aprovacao: 70
    })
    toast.success('Curso criado com sucesso!')
  }

  const getYouTubeVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    const match = url.match(regex)
    return match ? match[1] : null
  }

  const renderYouTubePlayer = (videoUrl: string) => {
    const videoId = getYouTubeVideoId(videoUrl)
    if (!videoId) return null

    return (
      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  const getStatusColor = (status: Course['status']) => {
    switch (status) {
      case 'Rascunho': return 'bg-gray-100 text-gray-800'
      case 'Ativo': return 'bg-green-100 text-green-800'
      case 'Pausado': return 'bg-yellow-100 text-yellow-800'
      case 'Finalizado': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryColor = (categoria: Course['categoria']) => {
    switch (categoria) {
      case 'Discipulado': return 'bg-purple-100 text-purple-800'
      case 'Liderança': return 'bg-blue-100 text-blue-800'
      case 'Teologia': return 'bg-green-100 text-green-800'
      case 'Ministério': return 'bg-orange-100 text-orange-800'
      case 'Evangelismo': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Cursos EAD 🎓</h1>
        <p className="text-blue-100 text-lg">
          Plataforma completa de ensino à distância
        </p>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as typeof viewMode)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="student">Meus Cursos</TabsTrigger>
            {canTeach && <TabsTrigger value="teacher">Cursos que Ensino</TabsTrigger>}
            {canManageCourses && <TabsTrigger value="admin">Administração</TabsTrigger>}
          </TabsList>

          {canTeach && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-500 hover:bg-blue-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Curso
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar Novo Curso</DialogTitle>
                  <DialogDescription>
                    Configure as informações básicas do curso
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome do Curso *</Label>
                    <Input
                      id="nome"
                      value={newCourse.nome}
                      onChange={(e) => setNewCourse({...newCourse, nome: e.target.value})}
                      placeholder="Nome do curso"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição *</Label>
                    <Textarea
                      id="descricao"
                      value={newCourse.descricao}
                      onChange={(e) => setNewCourse({...newCourse, descricao: e.target.value})}
                      placeholder="Descrição do curso"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo</Label>
                      <Select value={newCourse.tipo} onValueChange={(value) => setNewCourse({...newCourse, tipo: value as Course['tipo']})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Online">Online</SelectItem>
                          <SelectItem value="Presencial">Presencial</SelectItem>
                          <SelectItem value="Híbrido">Híbrido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="categoria">Categoria</Label>
                      <Select value={newCourse.categoria} onValueChange={(value) => setNewCourse({...newCourse, categoria: value as Course['categoria']})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Discipulado">Discipulado</SelectItem>
                          <SelectItem value="Liderança">Liderança</SelectItem>
                          <SelectItem value="Teologia">Teologia</SelectItem>
                          <SelectItem value="Ministério">Ministério</SelectItem>
                          <SelectItem value="Evangelismo">Evangelismo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="nivel">Nível</Label>
                      <Select value={newCourse.nivel} onValueChange={(value) => setNewCourse({...newCourse, nivel: value as Course['nivel']})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Básico">Básico</SelectItem>
                          <SelectItem value="Intermediário">Intermediário</SelectItem>
                          <SelectItem value="Avançado">Avançado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="duracao">Duração (horas)</Label>
                      <Input
                        id="duracao"
                        type="number"
                        value={newCourse.duracao_horas}
                        onChange={(e) => setNewCourse({...newCourse, duracao_horas: parseInt(e.target.value) || 0})}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nota_minima">Nota Mínima (%)</Label>
                      <Input
                        id="nota_minima"
                        type="number"
                        value={newCourse.nota_minima_aprovacao}
                        onChange={(e) => setNewCourse({...newCourse, nota_minima_aprovacao: parseInt(e.target.value) || 70})}
                        placeholder="70"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateCourse}>
                      Criar Curso
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <TabsContent value="student" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.filter(course => course.status === 'Ativo').map((course) => (
              <Card key={course.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">{course.nome}</CardTitle>
                      <div className="flex gap-2 mb-2">
                        <Badge className={getCategoryColor(course.categoria)}>
                          {course.categoria}
                        </Badge>
                        <Badge variant="outline">{course.nivel}</Badge>
                      </div>
                    </div>
                    <Badge className={getStatusColor(course.status)}>
                      {course.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">{course.descricao}</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>{course.duracao_horas}h</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span>{course.alunos_inscritos.length}</span>
                        </div>
                      </div>
                      {course.valor && course.valor > 0 && (
                        <div className="font-semibold text-green-600">
                          R$ {course.valor.toFixed(2)}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Professor: {course.professor.nome}</span>
                        <span>75% concluído</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>

                    <Button className="w-full" onClick={() => setSelectedCourse(course)}>
                      <Play className="w-4 h-4 mr-2" />
                      Continuar Curso
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {canTeach && (
          <TabsContent value="teacher" className="space-y-6">
            <div className="grid gap-6">
              {courses.filter(course => course.professor.id === user?.id).map((course) => (
                <Card key={course.id} className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{course.nome}</h3>
                        <div className="flex gap-2">
                          <Badge className={getCategoryColor(course.categoria)}>
                            {course.categoria}
                          </Badge>
                          <Badge className={getStatusColor(course.status)}>
                            {course.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </Button>
                        <Button variant="outline" size="sm">
                          <FileText className="w-4 h-4 mr-2" />
                          Relatórios
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{course.alunos_inscritos.length}</div>
                        <div className="text-sm text-gray-600">Alunos</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{course.modulos.length}</div>
                        <div className="text-sm text-gray-600">Módulos</div>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <div className="text-2xl font-bold text-orange-600">{course.duracao_horas}h</div>
                        <div className="text-sm text-gray-600">Duration</div>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">85%</div>
                        <div className="text-sm text-gray-600">Satisfação</div>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4">{course.descricao}</p>

                    <div className="flex gap-2">
                      <Button size="sm">
                        <Plus className="w-4 h-4 mr-2" />
                        Adicionar Módulo
                      </Button>
                      <Button variant="outline" size="sm">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Material
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}

        {canManageCourses && (
          <TabsContent value="admin" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{courses.length}</div>
                  <div className="text-sm text-gray-600">Total de Cursos</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {courses.reduce((acc, course) => acc + course.alunos_inscritos.length, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Alunos Ativos</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {courses.filter(c => c.status === 'Ativo').length}
                  </div>
                  <div className="text-sm text-gray-600">Cursos Ativos</div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {courses.reduce((acc, course) => acc + course.duracao_horas, 0)}h
                  </div>
                  <div className="text-sm text-gray-600">Conteúdo Total</div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              {courses.map((course) => (
                <Card key={course.id} className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold">{course.nome}</h3>
                          <Badge className={getCategoryColor(course.categoria)}>
                            {course.categoria}
                          </Badge>
                          <Badge className={getStatusColor(course.status)}>
                            {course.status}
                          </Badge>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{course.descricao}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>Professor: {course.professor.nome}</span>
                          <span>{course.alunos_inscritos.length} alunos</span>
                          <span>{course.duracao_horas}h</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Course Detail Modal */}
      {selectedCourse && (
        <Dialog open={!!selectedCourse} onOpenChange={() => setSelectedCourse(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedCourse.nome}</DialogTitle>
              <DialogDescription>
                Professor: {selectedCourse.professor.nome}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {selectedCourse.modulos.map((modulo) => (
                <div key={modulo.id} className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">{modulo.titulo}</h4>
                  <div className="space-y-3">
                    {modulo.aulas.map((aula) => (
                      <div key={aula.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {aula.tipo === 'Video' && <Youtube className="w-5 h-5 text-red-500" />}
                          <div>
                            <div className="font-medium">{aula.titulo}</div>
                            <div className="text-sm text-gray-600">{aula.duracao_minutos} min</div>
                          </div>
                        </div>
                        <Button size="sm">
                          <Play className="w-4 h-4 mr-2" />
                          Assistir
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default CoursesPage