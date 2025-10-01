import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../../stores/authStore'
import { useCourses } from '../../hooks/useCourses'
import { useMembers } from '../../hooks/useMembers'
import { Course, NewCourse } from '../../types/course'
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
import { ImageUploader } from '../ui/ImageUploader'
import { 
  Play, Clock, Users, Plus, Edit, FileText, Trash2, Youtube, BookOpen
} from 'lucide-react'

const CoursesPage = () => {
  const { user } = useAuthStore()
  const { courses, isLoading, createCourse } = useCourses()
  const { members: potentialTeachers } = useMembers(['admin', 'pastor', 'lider_ministerio'])
  
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'student' | 'teacher' | 'admin'>('student')
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const canManageCourses = user?.role === 'admin' || user?.role === 'pastor'
  const canTeach = canManageCourses || user?.role === 'lider_ministerio'

  const [newCourseData, setNewCourseData] = useState<Partial<NewCourse>>({
    nome: '',
    descricao: '',
    tipo: 'Online',
    categoria: 'Discipulado',
    nivel: 'Básico',
    duracao_horas: 0,
    certificado_disponivel: true,
    nota_minima_aprovacao: 70,
    professor_id: undefined,
  })

  const handleCreateCourse = () => {
    if (!newCourseData.nome || !newCourseData.descricao) {
      toast.error('Preencha os campos obrigatórios: Nome e Descrição.')
      return
    }
    createCourse({ courseData: newCourseData as NewCourse, coverFile })
    setIsCreateDialogOpen(false)
    setNewCourseData({ // Reset form
      nome: '',
      descricao: '',
      tipo: 'Online',
      categoria: 'Discipulado',
      nivel: 'Básico',
      duracao_horas: 0,
      certificado_disponivel: true,
      nota_minima_aprovacao: 70,
      professor_id: undefined,
    })
    setCoverFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
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

  const getCategoryColor = (categoria?: Course['categoria']) => {
    switch (categoria) {
      case 'Discipulado': return 'bg-purple-100 text-purple-800'
      case 'Liderança': return 'bg-blue-100 text-blue-800'
      case 'Teologia': return 'bg-green-100 text-green-800'
      case 'Ministério': return 'bg-orange-100 text-orange-800'
      case 'Evangelismo': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const myCourses = courses.filter(course => 
    course.alunos_inscritos.some(insc => insc.id_membro === user?.id)
  )
  const teachingCourses = courses.filter(course => course.professor?.id === user?.id)

  if (isLoading) {
    return <div className="p-6">Carregando cursos...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Cursos EAD 🎓</h1>
        <p className="text-blue-100 text-lg">Plataforma completa de ensino à distância</p>
      </div>

      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as typeof viewMode)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="student">Meus Cursos</TabsTrigger>
            {canTeach && <TabsTrigger value="teacher">Cursos que Ensino</TabsTrigger>}
            {canManageCourses && <TabsTrigger value="admin">Administração</TabsTrigger>}
          </TabsList>

          {canManageCourses && (
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
                  <DialogDescription>Configure as informações básicas do curso</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Imagem de Capa</Label>
                    <ImageUploader 
                      onFileSelect={setCoverFile}
                      previewUrl={previewUrl}
                      setPreviewUrl={setPreviewUrl}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome do Curso *</Label>
                    <Input id="nome" value={newCourseData.nome} onChange={(e) => setNewCourseData({...newCourseData, nome: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição *</Label>
                    <Textarea id="descricao" value={newCourseData.descricao} onChange={(e) => setNewCourseData({...newCourseData, descricao: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Professor Responsável</Label>
                      <Select value={newCourseData.professor_id} onValueChange={(v) => setNewCourseData({...newCourseData, professor_id: v})}>
                        <SelectTrigger><SelectValue placeholder="Selecione um professor" /></SelectTrigger>
                        <SelectContent>
                          {potentialTeachers.map(teacher => (
                            <SelectItem key={teacher.id} value={teacher.id}>{teacher.nome_completo}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Duração (horas)</Label>
                      <Input type="number" value={newCourseData.duracao_horas} onChange={(e) => setNewCourseData({...newCourseData, duracao_horas: parseInt(e.target.value) || 0})} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select value={newCourseData.tipo} onValueChange={(v) => setNewCourseData({...newCourseData, tipo: v as NewCourse['tipo']})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Online">Online</SelectItem>
                          <SelectItem value="Presencial">Presencial</SelectItem>
                          <SelectItem value="Híbrido">Híbrido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select value={newCourseData.categoria} onValueChange={(v) => setNewCourseData({...newCourseData, categoria: v as NewCourse['categoria']})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
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
                      <Label>Nível</Label>
                      <Select value={newCourseData.nivel} onValueChange={(v) => setNewCourseData({...newCourseData, nivel: v as NewCourse['nivel']})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Básico">Básico</SelectItem>
                          <SelectItem value="Intermediário">Intermediário</SelectItem>
                          <SelectItem value="Avançado">Avançado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleCreateCourse}>Criar Curso</Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <TabsContent value="student" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myCourses.map((course) => (
              <Card key={course.id} className="flex flex-col border-0 shadow-sm hover:shadow-md transition-shadow">
                {course.imagem_capa && (
                  <img src={course.imagem_capa} alt={`Capa do curso ${course.nome}`} className="rounded-t-lg w-full h-40 object-cover" />
                )}
                <CardHeader className={course.imagem_capa ? 'pt-4' : ''}>
                  <CardTitle className="text-lg mb-2">{course.nome}</CardTitle>
                  <div className="flex gap-2 flex-wrap">
                    <Badge className={getCategoryColor(course.categoria)}>{course.categoria}</Badge>
                    <Badge variant="outline">{course.nivel}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col">
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3 flex-grow">{course.descricao}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Professor: {course.professor?.nome_completo || 'N/A'}</span>
                      <span>{Math.round(course.alunos_inscritos.find(i => i.id_membro === user?.id)?.progresso || 0)}% concluído</span>
                    </div>
                    <Progress value={course.alunos_inscritos.find(i => i.id_membro === user?.id)?.progresso || 0} className="h-2" />
                  </div>
                  <Button className="w-full mt-4" onClick={() => setSelectedCourse(course)}>
                    <Play className="w-4 h-4 mr-2" />
                    Continuar Curso
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {canTeach && (
          <TabsContent value="teacher" className="space-y-6">
            {teachingCourses.map((course) => (
              <Card key={course.id}><CardContent className="p-4">Curso: {course.nome}</CardContent></Card>
            ))}
          </TabsContent>
        )}

        {canManageCourses && (
          <TabsContent value="admin" className="space-y-6">
            {courses.map((course) => (
              <Card key={course.id} className="border-0 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{course.nome}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Badge className={getStatusColor(course.status)}>{course.status}</Badge>
                        <span>{course.alunos_inscritos.length} alunos</span>
                        <span>{course.modulos.length} módulos</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link to={`/cursos/${course.id}/gerenciar`}>
                          <Edit className="w-4 h-4 mr-2" /> Gerenciar
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        )}
      </Tabs>

      {selectedCourse && (
        <Dialog open={!!selectedCourse} onOpenChange={() => setSelectedCourse(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedCourse.nome}</DialogTitle>
              <DialogDescription>Professor: {selectedCourse.professor?.nome_completo || 'N/A'}</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {selectedCourse.modulos.map((modulo) => (
                <div key={modulo.id} className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-3">{modulo.titulo}</h4>
                  <div className="space-y-3">
                    {modulo.aulas.map((aula) => (
                      <div key={aula.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {aula.tipo === 'Video' && <Youtube className="w-5 h-5 text-red-500" />}
                          {aula.tipo === 'Texto' && <BookOpen className="w-5 h-5 text-blue-500" />}
                          <div>
                            <div className="font-medium">{aula.titulo}</div>
                            <div className="text-sm text-gray-600">{aula.duracao_minutos} min</div>
                          </div>
                        </div>
                        <Button size="sm"><Play className="w-4 h-4 mr-2" /> Acessar</Button>
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