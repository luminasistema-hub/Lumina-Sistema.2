import { useState } from 'react'
import { useSchools, useCreateSchool, useUpdateSchool, useDeleteSchool, useSchoolLessons, useCreateLesson, useUpdateLesson, useDeleteLesson, useSchoolEnrollments, useSchoolAttendance, useRegisterStudentAttendance, useQuizQuestions, useGraduateStudent } from '@/hooks/useSchools'
import { useMembers } from '@/hooks/useMembers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Users, BookOpen, Play, FileText, CheckSquare, MapPin, HelpCircle, CheckCircle, GraduationCap, Lock, Unlock } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import QuizQuestionsManager from './QuizQuestionsManager'
import { Progress } from '@/components/ui/progress'
import { DatePicker } from '@/components/ui/datepicker'
import { supabase } from '@/integrations/supabase/client'

const SchoolsManagementPage = () => {
  const { user, currentChurchId } = useAuthStore()
  const { data: schools, isLoading, error } = useSchools()
  const { data: members } = useMembers()
  const createSchoolMutation = useCreateSchool()
  const updateSchoolMutation = useUpdateSchool()
  const deleteSchoolMutation = useDeleteSchool()
  const graduateStudentMutation = useGraduateStudent()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false)
  const [isStudentsDialogOpen, setIsStudentsDialogOpen] = useState(false)
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false)
  const [isQuizManagerOpen, setIsQuizManagerOpen] = useState(false)
  const [isGraduationDialogOpen, setIsGraduationDialogOpen] = useState(false)
  const [editingSchool, setEditingSchool] = useState<any>(null)
  const [selectedSchool, setSelectedSchool] = useState<any>(null)
  const [editingLesson, setEditingLesson] = useState<any>(null)
  const [lessonForAttendance, setLessonForAttendance] = useState<any>(null)
  const [lessonForQuiz, setLessonForQuiz] = useState<any>(null)
  const [schoolToGraduate, setSchoolToGraduate] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    professor_id: '',
    compartilhar_com_filhas: false,
    data_inicio: undefined as Date | undefined,
    data_fim: undefined as Date | undefined
  })
  
  const [lessonFormData, setLessonFormData] = useState({
    titulo: '',
    descricao: '',
    tipo_aula: 'texto' as 'texto' | 'video' | 'quiz' | 'presencial',
    youtube_url: '',
    conteudo_texto: '',
    ordem: 1,
    nota_de_corte: 70
  })

  const { data: lessons } = useSchoolLessons(selectedSchool?.id || null)
  const createLessonMutation = useCreateLesson()
  const updateLessonMutation = useUpdateLesson()
  const deleteLessonMutation = useDeleteLesson()
  const { data: enrollments } = useSchoolEnrollments(selectedSchool?.id || null)
  const { data: schoolAttendance } = useSchoolAttendance(selectedSchool?.id || null)
  const registerAttendanceMutation = useRegisterStudentAttendance()

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      professor_id: '',
      compartilhar_com_filhas: false,
      data_inicio: undefined,
      data_fim: undefined
    })
    setEditingSchool(null)
  }

  const resetLessonForm = () => {
    setLessonFormData({
      titulo: '',
      descricao: '',
      tipo_aula: 'texto',
      youtube_url: '',
      conteudo_texto: '',
      ordem: 1,
      nota_de_corte: 70
    })
    setEditingLesson(null)
  }

  const handleOpenDialog = (school?: any) => {
    if (school) {
      setEditingSchool(school)
      setFormData({
        nome: school.nome || '',
        descricao: school.descricao || '',
        professor_id: school.professor_id || '',
        compartilhar_com_filhas: school.compartilhar_com_filhas || false,
        data_inicio: school.data_inicio ? new Date(school.data_inicio) : undefined,
        data_fim: school.data_fim ? new Date(school.data_fim) : undefined
      })
    } else {
      resetForm()
    }
    setIsDialogOpen(true)
  }

  const handleOpenLessons = (school: any) => {
    setSelectedSchool(school)
  }

  const handleOpenStudentsDialog = (school: any) => {
    setSelectedSchool(school)
    setIsStudentsDialogOpen(true)
  }

  const handleOpenAttendanceDialog = (lesson: any) => {
    setLessonForAttendance(lesson)
    setIsAttendanceDialogOpen(true)
  }

  const handleOpenQuizDialog = (lesson: any) => {
    setLessonForQuiz(lesson)
    setIsQuizManagerOpen(true)
  }

  const handleOpenLessonDialog = (lesson?: any) => {
    if (lesson) {
      setEditingLesson(lesson)
      setLessonFormData({
        titulo: lesson.titulo || '',
        descricao: lesson.descricao || '',
        tipo_aula: lesson.tipo_aula || 'texto',
        youtube_url: lesson.youtube_url || '',
        conteudo_texto: lesson.conteudo_texto || '',
        ordem: lesson.ordem || 1,
        nota_de_corte: lesson.nota_de_corte || 70
      })
    } else {
      resetLessonForm()
    }
    setIsLessonDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nome.trim()) {
      toast.error('O nome da escola é obrigatório')
      return
    }
    
    if (editingSchool) {
      updateSchoolMutation.mutate({
        id: editingSchool.id,
        ...formData
      })
    } else {
      createSchoolMutation.mutate(formData)
    }
    
    setIsDialogOpen(false)
    resetForm()
  }

  const handleSubmitLesson = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!lessonFormData.titulo.trim()) {
      toast.error('O título da aula é obrigatório')
      return
    }
    
    const lessonData = {
      ...lessonFormData,
      escola_id: selectedSchool.id
    }
    
    if (editingLesson) {
      updateLessonMutation.mutate({
        id: editingLesson.id,
        ...lessonData
      })
    } else {
      createLessonMutation.mutate(lessonData)
    }
    
    setIsLessonDialogOpen(false)
    resetLessonForm()
  }

  const handleDelete = (schoolId: string) => {
    if (confirm('Tem certeza que deseja remover esta escola?')) {
      deleteSchoolMutation.mutate(schoolId)
    }
  }

  const handleDeleteLesson = (lessonId: string) => {
    if (confirm('Tem certeza que deseja remover esta aula?')) {
      deleteLessonMutation.mutate(lessonId)
    }
  }

  const handleToggleEnrollmentStatus = (school: any) => {
    const newStatus = school.status === 'aberta' ? 'fechada' : 'aberta';
    updateSchoolMutation.mutate({
      id: school.id,
      status: newStatus
    }, {
      onSuccess: () => {
        toast.success(`Matrículas ${newStatus === 'fechada' ? 'encerradas' : 'abertas'} com sucesso!`);
      }
    });
  };

  const handleGraduateSchool = async () => {
    if (!schoolToGraduate) return;

    const toastId = toast.loading("Iniciando conclusão da escola...");

    try {
      // 1. Fetch enrollments for this school
      const { data: enrollments, error } = await supabase
        .from('escola_inscricoes')
        .select('membro_id')
        .eq('escola_id', schoolToGraduate.id);

      if (error) {
        throw new Error("Erro ao buscar alunos inscritos.");
      }

      if (enrollments && enrollments.length > 0) {
        toast.loading(`Concluindo ${enrollments.length} aluno(s)...`, { id: toastId });
        // 2. Graduate each student
        const graduationPromises = enrollments.map(enrollment => 
          graduateStudentMutation.mutateAsync({ schoolId: schoolToGraduate.id, memberId: enrollment.membro_id })
        );
        
        await Promise.all(graduationPromises);
        toast.success(`${enrollments.length} aluno(s) foram concluídos com sucesso!`, { id: toastId });
      } else {
        toast.info("Não há alunos inscritos para concluir.", { id: toastId });
      }

      // 3. Update school status to 'concluida'
      updateSchoolMutation.mutate({
        id: schoolToGraduate.id,
        status: 'concluida'
      }, {
        onSuccess: () => {
          toast.success("Escola marcada como concluída.");
        }
      });

    } catch (e: any) {
      toast.error(e.message || "Ocorreu um erro ao concluir a escola.", { id: toastId });
    } finally {
      setIsGraduationDialogOpen(false);
      setSchoolToGraduate(null);
    }
  };

  const handleRegisterAttendance = (memberId: string, present: boolean) => {
    if (!lessonForAttendance || !selectedSchool) return
    registerAttendanceMutation.mutate({
      lessonId: lessonForAttendance.id,
      memberId,
      date: new Date().toISOString().split('T')[0],
      present,
      schoolId: selectedSchool.id
    })
  }

  // Filtrar membros que podem ser professores (pastores, admins, líderes de ministério)
  const potentialTeachers = members?.filter(member => 
    member.funcao === 'pastor' || 
    member.funcao === 'admin' || 
    member.funcao === 'lider_ministerio'
  ) || []

  // Filtrar apenas as escolas da igreja atual para gestão
  const churchSchools = schools?.filter(school => school.id_igreja === currentChurchId) || []

  // Verificar se o usuário é professor da escola ou admin
  const canManageLessons = (school: any) => {
    return user?.role === 'admin' || 
           user?.role === 'pastor' || 
           user?.id === school.professor_id
  }

  const getLessonTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="w-4 h-4" />
      case 'quiz':
        return <CheckSquare className="w-4 h-4" />
      case 'presencial':
        return <MapPin className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getLessonTypeLabel = (type: string) => {
    switch (type) {
      case 'video':
        return 'Vídeo'
      case 'quiz':
        return 'Quiz'
      case 'presencial':
        return 'Presencial'
      default:
        return 'Texto'
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestão de Escolas</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Escola
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingSchool ? 'Editar Escola' : 'Nova Escola'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Escola *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  placeholder="Ex: Escola de Liderança"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  placeholder="Descreva o propósito e objetivos da escola"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data_inicio">Data de Início</Label>
                  <DatePicker 
                    date={formData.data_inicio}
                    setDate={(date) => setFormData({ ...formData, data_inicio: date })}
                    placeholder="Selecione a data de início"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_fim">Data de Fim</Label>
                  <DatePicker 
                    date={formData.data_fim}
                    setDate={(date) => setFormData({ ...formData, data_fim: date })}
                    placeholder="Selecione a data de término"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="professor">Professor</Label>
                <Select 
                  value={formData.professor_id} 
                  onValueChange={(value) => setFormData({...formData, professor_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um professor" />
                  </SelectTrigger>
                  <SelectContent>
                    {potentialTeachers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.nome_completo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="space-y-1">
                  <Label>Compartilhar com igrejas filhas</Label>
                  <p className="text-sm text-gray-500">
                    Se ativado, esta escola ficará visível para igrejas filhas
                  </p>
                </div>
                <Switch
                  checked={formData.compartilhar_com_filhas}
                  onCheckedChange={(checked) => 
                    setFormData({...formData, compartilhar_com_filhas: checked})
                  }
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingSchool ? 'Atualizar' : 'Criar'} Escola
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Escolas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          )}
          
          {error && (
            <div className="text-red-500 p-4 text-center">
              Erro ao carregar escolas: {(error as Error).message}
            </div>
          )}
          
          {churchSchools && churchSchools.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Professor</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Compartilhada</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {churchSchools.map((school) => (
                  <TableRow key={school.id}>
                    <TableCell className="font-medium">{school.nome}</TableCell>
                    <TableCell>
                      {school.professor_nome || (
                        <span className="text-gray-500">Não definido</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {school.data_inicio && school.data_fim 
                        ? `${new Date(school.data_inicio).toLocaleDateString()} - ${new Date(school.data_fim).toLocaleDateString()}`
                        : <span className="text-gray-500">Não definido</span>
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                        school.status === 'aberta' ? 'default' :
                        school.status === 'fechada' ? 'secondary' :
                        'destructive'
                      }>
                        {school.status.charAt(0).toUpperCase() + school.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {school.compartilhar_com_filhas ? (
                        <Badge variant="default">Sim</Badge>
                      ) : (
                        <Badge variant="secondary">Não</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleOpenStudentsDialog(school)}
                          disabled={school.status === 'concluida'}
                        >
                          <Users className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleOpenDialog(school)}
                          disabled={school.status === 'concluida'}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleOpenLessons(school)}
                          disabled={school.status === 'concluida'}
                        >
                          <BookOpen className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleToggleEnrollmentStatus(school)}
                          disabled={school.status === 'concluida'}
                          title={school.status === 'aberta' ? 'Encerrar matrículas' : 'Abrir matrículas'}
                        >
                          {school.status === 'aberta' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setSchoolToGraduate(school)
                            setIsGraduationDialogOpen(true)
                          }}
                          disabled={school.status === 'concluida'}
                          title="Concluir Escola"
                        >
                          <GraduationCap className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDelete(school.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhuma escola cadastrada ainda
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={isGraduationDialogOpen} onOpenChange={setIsGraduationDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Concluir Escola?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja concluir a escola "{schoolToGraduate?.nome}"? Todos os alunos inscritos serão marcados como formados, o progresso na jornada será atualizado e não será mais possível editar a escola.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSchoolToGraduate(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleGraduateSchool}>Sim, Concluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog para gerenciar alunos */}
      {selectedSchool && (
        <Dialog open={isStudentsDialogOpen} onOpenChange={() => setIsStudentsDialogOpen(false)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Alunos Inscritos - {selectedSchool.nome}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {enrollments && lessons ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aluno</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Progresso de Frequência</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enrollments.map((enrollment: any) => {
                      const presencialLessons = lessons.filter(l => l.tipo_aula === 'presencial')
                      const attendedLessons = schoolAttendance?.filter(att => att.membro_id === enrollment.membro_id && att.presente && presencialLessons.some(l => l.id === att.aula_id)) || []
                      const progress = presencialLessons.length > 0 ? (attendedLessons.length / presencialLessons.length) * 100 : 0

                      return (
                        <TableRow key={enrollment.id}>
                          <TableCell>{enrollment.membros.nome_completo}</TableCell>
                          <TableCell>{enrollment.membros.email}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={progress} className="w-full" />
                              <span>{Math.round(progress)}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              ) : (
                <p>Carregando alunos...</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog para gerenciar aulas */}
      {selectedSchool && (
        <Dialog open={!!selectedSchool && !isStudentsDialogOpen} onOpenChange={() => setSelectedSchool(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                Aulas - {selectedSchool.nome}
              </DialogTitle>
              <div className="text-sm text-gray-500">
                Professor: {selectedSchool.professor_nome || 'Não definido'}
              </div>
            </DialogHeader>
            
            <div className="space-y-4">
              {canManageLessons(selectedSchool) && (
                <div className="flex justify-end">
                  <Button onClick={() => handleOpenLessonDialog()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Aula
                  </Button>
                </div>
              )}
              
              {lessons && lessons.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Ordem</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lessons.map((lesson) => (
                      <TableRow key={lesson.id}>
                        <TableCell className="font-medium">{lesson.titulo}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getLessonTypeIcon(lesson.tipo_aula)}
                            <span className="ml-1">{getLessonTypeLabel(lesson.tipo_aula)}</span>
                          </Badge>
                        </TableCell>
                        <TableCell>{lesson.ordem}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {canManageLessons(selectedSchool) && (
                              <>
                                {lesson.tipo_aula === 'quiz' && (
                                  <Button variant="outline" size="sm" onClick={() => handleOpenQuizDialog(lesson)}>
                                    <HelpCircle className="w-4 h-4" />
                                  </Button>
                                )}
                                {lesson.tipo_aula === 'presencial' && (
                                  <Button variant="outline" size="sm" onClick={() => handleOpenAttendanceDialog(lesson)}>
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleOpenLessonDialog(lesson)}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={() => handleDeleteLesson(lesson.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma aula cadastrada ainda
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog para gerenciar quiz */}
      {lessonForQuiz && (
        <Dialog open={isQuizManagerOpen} onOpenChange={() => setIsQuizManagerOpen(false)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Gerenciar Quiz - {lessonForQuiz.titulo}</DialogTitle>
            </DialogHeader>
            <QuizQuestionsManager lessonId={lessonForQuiz.id} />
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog para registrar frequência */}
      {lessonForAttendance && (
        <Dialog open={isAttendanceDialogOpen} onOpenChange={() => setIsAttendanceDialogOpen(false)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Frequência - {lessonForAttendance.titulo}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aluno</TableHead>
                    <TableHead className="text-right">Presente</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments?.map((enrollment: any) => {
                    const attendanceRecord = schoolAttendance?.find(att => att.membro_id === enrollment.membro_id && att.aula_id === lessonForAttendance.id)
                    return (
                      <TableRow key={enrollment.id}>
                        <TableCell>{enrollment.membros.nome_completo}</TableCell>
                        <TableCell className="text-right">
                          <Switch
                            checked={attendanceRecord?.presente || false}
                            onCheckedChange={(checked) => handleRegisterAttendance(enrollment.membro_id, checked)}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog para criar/editar aula */}
      <Dialog open={isLessonDialogOpen} onOpenChange={(open) => {
        setIsLessonDialogOpen(open)
        if (!open) resetLessonForm()
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingLesson ? 'Editar Aula' : 'Nova Aula'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitLesson} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título da Aula *</Label>
              <Input
                id="titulo"
                value={lessonFormData.titulo}
                onChange={(e) => setLessonFormData({...lessonFormData, titulo: e.target.value})}
                placeholder="Ex: Introdução ao Discipulado"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={lessonFormData.descricao}
                onChange={(e) => setLessonFormData({...lessonFormData, descricao: e.target.value})}
                placeholder="Descreva o conteúdo desta aula"
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tipo_aula">Tipo de Aula *</Label>
              <Select 
                value={lessonFormData.tipo_aula} 
                onValueChange={(value) => setLessonFormData({...lessonFormData, tipo_aula: value as any})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de aula" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="texto">Texto</SelectItem>
                  <SelectItem value="video">Vídeo</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="presencial">Presencial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {lessonFormData.tipo_aula === 'video' && (
              <div className="space-y-2">
                <Label htmlFor="youtube_url">URL do YouTube</Label>
                <Input
                  id="youtube_url"
                  value={lessonFormData.youtube_url}
                  onChange={(e) => setLessonFormData({...lessonFormData, youtube_url: e.target.value})}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
            )}
            
            {lessonFormData.tipo_aula === 'texto' && (
              <div className="space-y-2">
                <Label htmlFor="conteudo_texto">Conteúdo</Label>
                <Textarea
                  id="conteudo_texto"
                  value={lessonFormData.conteudo_texto}
                  onChange={(e) => setLessonFormData({...lessonFormData, conteudo_texto: e.target.value})}
                  placeholder="Digite o conteúdo da aula..."
                  rows={6}
                />
              </div>
            )}
            
            {lessonFormData.tipo_aula === 'quiz' && (
              <div className="space-y-2">
                <Label htmlFor="nota_de_corte">Nota de Corte (%)</Label>
                <Input
                  id="nota_de_corte"
                  type="number"
                  min="0"
                  max="100"
                  value={lessonFormData.nota_de_corte}
                  onChange={(e) => setLessonFormData({...lessonFormData, nota_de_corte: parseInt(e.target.value) || 0})}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="ordem">Ordem</Label>
              <Input
                id="ordem"
                type="number"
                min="1"
                value={lessonFormData.ordem}
                onChange={(e) => setLessonFormData({...lessonFormData, ordem: parseInt(e.target.value) || 1})}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsLessonDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingLesson ? 'Atualizar' : 'Criar'} Aula
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SchoolsManagementPage