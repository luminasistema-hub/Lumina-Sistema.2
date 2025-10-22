import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { DatePicker } from '@/components/ui/datepicker'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Users, BookOpen, Play, FileText, CheckSquare, MapPin, HelpCircle, CheckCircle, GraduationCap, Lock, Unlock, Loader2 } from 'lucide-react'
import QuizQuestionsManager from './QuizQuestionsManager'

interface School {
  id: string
  id_igreja: string
  nome: string
  descricao: string
  professor_id: string
  professor_nome?: string
  compartilhar_com_filhas: boolean
  data_inicio?: string
  data_fim?: string
  status: 'aberta' | 'fechada' | 'concluida'
}

interface SchoolLesson {
  id: string
  escola_id: string
  titulo: string
  descricao: string
  tipo_aula: 'texto' | 'video' | 'quiz' | 'presencial'
  youtube_url?: string
  conteudo_texto?: string
  ordem: number
  nota_de_corte?: number
}

const SchoolsManagementPage = () => {
  const { user, currentChurchId } = useAuthStore()
  const queryClient = useQueryClient()
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false)
  const [isStudentsDialogOpen, setIsStudentsDialogOpen] = useState(false)
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false)
  const [isQuizManagerOpen, setIsQuizManagerOpen] = useState(false)
  const [isGraduationDialogOpen, setIsGraduationDialogOpen] = useState(false)
  const [editingSchool, setEditingSchool] = useState<School | null>(null)
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null)
  const [editingLesson, setEditingLesson] = useState<SchoolLesson | null>(null)
  const [lessonForAttendance, setLessonForAttendance] = useState<SchoolLesson | null>(null)
  const [lessonForQuiz, setLessonForQuiz] = useState<SchoolLesson | null>(null)
  const [schoolToGraduate, setSchoolToGraduate] = useState<School | null>(null)
  
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

  // Query para escolas
  const { data: schools, isLoading } = useQuery({
    queryKey: ['schools', currentChurchId],
    queryFn: async () => {
      if (!currentChurchId) return []
      const { data, error } = await supabase.rpc('get_escolas_para_igreja', { id_igreja_atual: currentChurchId })
      if (error) throw error
      
      const schoolsData = (data || []) as School[]
      const professorIds = [...new Set(schoolsData.map(s => s.professor_id).filter(Boolean))]
      
      let professorNames = new Map<string, string>()
      if (professorIds.length > 0) {
        const { data: professors } = await supabase.from('membros').select('id, nome_completo').in('id', professorIds)
        professors?.forEach(p => professorNames.set(p.id, p.nome_completo))
      }
      
      return schoolsData.map(school => ({
        ...school,
        professor_nome: school.professor_id ? professorNames.get(school.professor_id) || 'Professor não definido' : 'Professor não definido'
      }))
    },
    enabled: !!currentChurchId,
    staleTime: 60 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  // Query para membros (professores)
  const { data: members = [] } = useQuery({
    queryKey: ['members', currentChurchId],
    queryFn: async () => {
      if (!currentChurchId) return []
      const { data, error } = await supabase.from('membros').select('id, nome_completo, funcao').eq('id_igreja', currentChurchId).order('nome_completo')
      if (error) throw error
      return data || []
    },
    enabled: !!currentChurchId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  // Query para aulas da escola selecionada
  const { data: lessons } = useQuery({
    queryKey: ['school-lessons', selectedSchool?.id],
    queryFn: async () => {
      if (!selectedSchool?.id) return []
      const { data, error } = await supabase.from('escola_aulas').select('*').eq('escola_id', selectedSchool.id).order('ordem')
      if (error) throw error
      return data as SchoolLesson[]
    },
    enabled: !!selectedSchool?.id,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  // Query para inscrições
  const { data: enrollments } = useQuery({
    queryKey: ['school-enrollments', selectedSchool?.id],
    queryFn: async () => {
      if (!selectedSchool?.id) return []
      const { data, error } = await supabase.from('escola_inscricoes').select('*, membros(id, nome_completo, email)').eq('escola_id', selectedSchool.id)
      if (error) throw error
      return data
    },
    enabled: !!selectedSchool?.id,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  // Query para frequência
  const { data: schoolAttendance } = useQuery({
    queryKey: ['school-attendance', selectedSchool?.id],
    queryFn: async () => {
      if (!selectedSchool?.id) return []
      const { data, error } = await supabase.from('escola_frequencia').select('*, escola_aulas!inner(escola_id)').eq('escola_aulas.escola_id', selectedSchool.id)
      if (error) throw error
      return data
    },
    enabled: !!selectedSchool?.id,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  })

  // Realtime subscriptions
  useEffect(() => {
    if (!currentChurchId) return
    const channel = supabase.channel(`schools-${currentChurchId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'escolas', filter: `id_igreja=eq.${currentChurchId}` },
        () => queryClient.invalidateQueries({ queryKey: ['schools', currentChurchId] })
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'escola_aulas' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['school-lessons'] })
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'escola_inscricoes' },
        () => queryClient.invalidateQueries({ queryKey: ['school-enrollments'] })
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'escola_frequencia' },
        () => queryClient.invalidateQueries({ queryKey: ['school-attendance'] })
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [currentChurchId, queryClient])

  // Mutations
  const createSchoolMutation = useMutation({
    mutationFn: async (school: any) => {
      const { error } = await supabase.from('escolas').insert({ ...school, id_igreja: currentChurchId })
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Escola criada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['schools'] })
      setIsDialogOpen(false)
      resetForm()
    },
    onError: (error: any) => toast.error(`Erro: ${error.message}`)
  })

  const updateSchoolMutation = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase.from('escolas').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Escola atualizada!')
      queryClient.invalidateQueries({ queryKey: ['schools'] })
      setIsDialogOpen(false)
      resetForm()
    },
    onError: (error: any) => toast.error(`Erro: ${error.message}`)
  })

  const deleteSchoolMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('escolas').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Escola removida!')
      queryClient.invalidateQueries({ queryKey: ['schools'] })
    },
    onError: (error: any) => toast.error(`Erro: ${error.message}`)
  })

  const createLessonMutation = useMutation({
    mutationFn: async (lesson: any) => {
      const { error } = await supabase.from('escola_aulas').insert(lesson)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Aula criada!')
      queryClient.invalidateQueries({ queryKey: ['school-lessons'] })
      setIsLessonDialogOpen(false)
      resetLessonForm()
    },
    onError: (error: any) => toast.error(`Erro: ${error.message}`)
  })

  const updateLessonMutation = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase.from('escola_aulas').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Aula atualizada!')
      queryClient.invalidateQueries({ queryKey: ['school-lessons'] })
      setIsLessonDialogOpen(false)
      resetLessonForm()
    },
    onError: (error: any) => toast.error(`Erro: ${error.message}`)
  })

  const deleteLessonMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('escola_aulas').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      toast.success('Aula removida!')
      queryClient.invalidateQueries({ queryKey: ['school-lessons'] })
    },
    onError: (error: any) => toast.error(`Erro: ${error.message}`)
  })

  const registerAttendanceMutation = useMutation({
    mutationFn: async ({ lessonId, memberId, date, present }: any) => {
      const { data: attendanceData, error: attendanceError } = await supabase.from('escola_frequencia')
        .upsert({ aula_id: lessonId, membro_id: memberId, data_aula: date, presente: present }, { onConflict: 'aula_id,membro_id,data_aula' })
        .select().single()
      if (attendanceError) throw attendanceError

      if (present) {
        const { error: progressError } = await supabase.from('escola_progresso_aulas')
          .upsert({ aula_id: lessonId, membro_id: memberId, id_igreja: currentChurchId! }, { onConflict: 'aula_id,membro_id' })
        if (progressError) throw progressError
      } else {
        await supabase.from('escola_progresso_aulas').delete().match({ aula_id: lessonId, membro_id: memberId })
      }
    },
    onSuccess: () => {
      toast.success('Frequência registrada!')
      queryClient.invalidateQueries({ queryKey: ['school-attendance'] })
    },
    onError: (error: any) => toast.error(`Erro: ${error.message}`)
  })

  const graduateStudentMutation = useMutation({
    mutationFn: async ({ schoolId, memberId }: { schoolId: string, memberId: string }) => {
      const { data: lessons, error: lessonsError } = await supabase.from('escola_aulas').select('id').eq('escola_id', schoolId)
      if (lessonsError) throw lessonsError
      if (!lessons || lessons.length === 0) return

      const progressRecords = lessons.map(l => ({ aula_id: l.id, membro_id: memberId, id_igreja: currentChurchId! }))
      const { error: progressError } = await supabase.from('escola_progresso_aulas').upsert(progressRecords, { onConflict: 'aula_id,membro_id' })
      if (progressError) throw progressError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['school-enrollments'] })
      queryClient.invalidateQueries({ queryKey: ['journey-data'] })
    }
  })

  const handleGraduateSchool = async () => {
    if (!schoolToGraduate) return
    const toastId = toast.loading("Iniciando conclusão da escola...")

    try {
      const { data: enrollments, error } = await supabase.from('escola_inscricoes').select('membro_id').eq('escola_id', schoolToGraduate.id)
      if (error) throw new Error("Erro ao buscar alunos inscritos.")

      if (enrollments && enrollments.length > 0) {
        toast.loading(`Concluindo ${enrollments.length} aluno(s)...`, { id: toastId })
        const graduationPromises = enrollments.map(e => graduateStudentMutation.mutateAsync({ schoolId: schoolToGraduate.id, memberId: e.membro_id }))
        await Promise.all(graduationPromises)
        toast.success(`${enrollments.length} aluno(s) foram concluídos com sucesso!`, { id: toastId })
      } else {
        toast.info("Não há alunos inscritos para concluir.", { id: toastId })
      }

      updateSchoolMutation.mutate({ id: schoolToGraduate.id, status: 'concluida' }, {
        onSuccess: () => toast.success("Escola marcada como concluída.")
      })
    } catch (e: any) {
      toast.error(e.message || "Ocorreu um erro ao concluir a escola.", { id: toastId })
    } finally {
      setIsGraduationDialogOpen(false)
      setSchoolToGraduate(null)
    }
  }

  const resetForm = () => {
    setFormData({ nome: '', descricao: '', professor_id: '', compartilhar_com_filhas: false, data_inicio: undefined, data_fim: undefined })
    setEditingSchool(null)
  }

  const resetLessonForm = () => {
    setLessonFormData({ titulo: '', descricao: '', tipo_aula: 'texto', youtube_url: '', conteudo_texto: '', ordem: 1, nota_de_corte: 70 })
    setEditingLesson(null)
  }

  const handleOpenDialog = (school?: School) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nome.trim()) {
      toast.error('O nome da escola é obrigatório')
      return
    }
    if (editingSchool) {
      updateSchoolMutation.mutate({ id: editingSchool.id, ...formData })
    } else {
      createSchoolMutation.mutate(formData)
    }
  }

  const handleOpenLessonDialog = (lesson?: SchoolLesson) => {
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

  const handleSubmitLesson = (e: React.FormEvent) => {
    e.preventDefault()
    if (!lessonFormData.titulo.trim()) {
      toast.error('O título da aula é obrigatório')
      return
    }
    const lessonData = { ...lessonFormData, escola_id: selectedSchool!.id }
    if (editingLesson) {
      updateLessonMutation.mutate({ id: editingLesson.id, ...lessonData })
    } else {
      createLessonMutation.mutate(lessonData)
    }
  }

  const potentialTeachers = members.filter(m => m.funcao === 'pastor' || m.funcao === 'admin' || m.funcao === 'lider_ministerio')
  const churchSchools = schools?.filter(s => s.id_igreja === currentChurchId) || []
  const canManageLessons = (school: School) => user?.role === 'admin' || user?.role === 'pastor' || user?.id === school.professor_id

  const getLessonTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return <Play className="w-4 h-4" />
      case 'quiz': return <CheckSquare className="w-4 h-4" />
      case 'presencial': return <MapPin className="w-4 h-4" />
      default: return <FileText className="w-4 h-4" />
    }
  }

  const getLessonTypeLabel = (type: string) => {
    switch (type) {
      case 'video': return 'Vídeo'
      case 'quiz': return 'Quiz'
      case 'presencial': return 'Presencial'
      default: return 'Texto'
    }
  }

  if (!currentChurchId) {
    return <div className="p-6 text-center text-gray-600">Selecione uma igreja para gerenciar escolas.</div>
  }

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="ml-3 text-lg text-gray-600">Carregando escolas...</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestão de Escolas</h1>
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm() }}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}><Plus className="w-4 h-4 mr-2" />Nova Escola</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{editingSchool ? 'Editar Escola' : 'Nova Escola'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome da Escola *</Label>
                <Input id="nome" value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} placeholder="Ex: Escola de Liderança" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea id="descricao" value={formData.descricao} onChange={(e) => setFormData({...formData, descricao: e.target.value})} placeholder="Descreva o propósito e objetivos da escola" rows={3} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data de Início</Label>
                  <DatePicker date={formData.data_inicio} setDate={(date) => setFormData({ ...formData, data_inicio: date })} placeholder="Selecione a data de início" />
                </div>
                <div className="space-y-2">
                  <Label>Data de Fim</Label>
                  <DatePicker date={formData.data_fim} setDate={(date) => setFormData({ ...formData, data_fim: date })} placeholder="Selecione a data de término" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Professor</Label>
                <Select value={formData.professor_id} onValueChange={(value) => setFormData({...formData, professor_id: value})}>
                  <SelectTrigger><SelectValue placeholder="Selecione um professor" /></SelectTrigger>
                  <SelectContent>
                    {potentialTeachers.map((member) => <SelectItem key={member.id} value={member.id}>{member.nome_completo}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-md">
                <div className="space-y-1">
                  <Label>Compartilhar com igrejas filhas</Label>
                  <p className="text-sm text-gray-500">Se ativado, esta escola ficará visível para igrejas filhas</p>
                </div>
                <Switch checked={formData.compartilhar_com_filhas} onCheckedChange={(checked) => setFormData({...formData, compartilhar_com_filhas: checked})} />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button type="submit">{editingSchool ? 'Atualizar' : 'Criar'} Escola</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>Escolas Cadastradas</CardTitle></CardHeader>
        <CardContent>
          {churchSchools.length > 0 ? (
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
                    <TableCell>{school.professor_nome || <span className="text-gray-500">Não definido</span>}</TableCell>
                    <TableCell>
                      {school.data_inicio && school.data_fim 
                        ? `${new Date(school.data_inicio).toLocaleDateString()} - ${new Date(school.data_fim).toLocaleDateString()}`
                        : <span className="text-gray-500">Não definido</span>
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={school.status === 'aberta' ? 'default' : school.status === 'fechada' ? 'secondary' : 'destructive'}>
                        {school.status.charAt(0).toUpperCase() + school.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {school.compartilhar_com_filhas ? <Badge variant="default">Sim</Badge> : <Badge variant="secondary">Não</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setSelectedSchool(school); setIsStudentsDialogOpen(true) }} disabled={school.status === 'concluida'}>
                          <Users className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleOpenDialog(school)} disabled={school.status === 'concluida'}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setSelectedSchool(school)} disabled={school.status === 'concluida'}>
                          <BookOpen className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => updateSchoolMutation.mutate({ id: school.id, status: school.status === 'aberta' ? 'fechada' : 'aberta' })} disabled={school.status === 'concluida'} title={school.status === 'aberta' ? 'Encerrar matrículas' : 'Abrir matrículas'}>
                          {school.status === 'aberta' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => { setSchoolToGraduate(school); setIsGraduationDialogOpen(true) }} disabled={school.status === 'concluida'} title="Concluir Escola">
                          <GraduationCap className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => deleteSchoolMutation.mutate(school.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-gray-500">Nenhuma escola cadastrada ainda</div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs para alunos, aulas, frequência, quiz e graduação */}
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

      {selectedSchool && (
        <>
          <Dialog open={isStudentsDialogOpen} onOpenChange={() => setIsStudentsDialogOpen(false)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader><DialogTitle>Alunos Inscritos - {selectedSchool.nome}</DialogTitle></DialogHeader>
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

          <Dialog open={!!selectedSchool && !isStudentsDialogOpen} onOpenChange={() => setSelectedSchool(null)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Aulas - {selectedSchool.nome}</DialogTitle>
                <div className="text-sm text-gray-500">Professor: {selectedSchool.professor_nome || 'Não definido'}</div>
              </DialogHeader>
              <div className="space-y-4">
                {canManageLessons(selectedSchool) && (
                  <div className="flex justify-end">
                    <Button onClick={() => handleOpenLessonDialog()}><Plus className="w-4 h-4 mr-2" />Nova Aula</Button>
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
                                    <Button variant="outline" size="sm" onClick={() => { setLessonForQuiz(lesson); setIsQuizManagerOpen(true) }}>
                                      <HelpCircle className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {lesson.tipo_aula === 'presencial' && (
                                    <Button variant="outline" size="sm" onClick={() => { setLessonForAttendance(lesson); setIsAttendanceDialogOpen(true) }}>
                                      <CheckCircle className="w-4 h-4" />
                                    </Button>
                                  )}
                                  <Button variant="outline" size="sm" onClick={() => handleOpenLessonDialog(lesson)}>
                                    <Pencil className="w-4 h-4" />
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => deleteLessonMutation.mutate(lesson.id)}>
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
                  <div className="text-center py-8 text-gray-500">Nenhuma aula cadastrada ainda</div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}

      {lessonForQuiz && (
        <Dialog open={isQuizManagerOpen} onOpenChange={() => setIsQuizManagerOpen(false)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader><DialogTitle>Gerenciar Quiz - {lessonForQuiz.titulo}</DialogTitle></DialogHeader>
            <QuizQuestionsManager lessonId={lessonForQuiz.id} />
          </DialogContent>
        </Dialog>
      )}

      {lessonForAttendance && (
        <Dialog open={isAttendanceDialogOpen} onOpenChange={() => setIsAttendanceDialogOpen(false)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Registrar Frequência - {lessonForAttendance.titulo}</DialogTitle></DialogHeader>
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
                            onCheckedChange={(checked) => registerAttendanceMutation.mutate({ lessonId: lessonForAttendance.id, memberId: enrollment.membro_id, date: new Date().toISOString().split('T')[0], present: checked })}
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

      <Dialog open={isLessonDialogOpen} onOpenChange={(open) => { setIsLessonDialogOpen(open); if (!open) resetLessonForm() }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{editingLesson ? 'Editar Aula' : 'Nova Aula'}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmitLesson} className="space-y-4">
            <div className="space-y-2">
              <Label>Título da Aula *</Label>
              <Input value={lessonFormData.titulo} onChange={(e) => setLessonFormData({...lessonFormData, titulo: e.target.value})} placeholder="Ex: Introdução ao Discipulado" />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={lessonFormData.descricao} onChange={(e) => setLessonFormData({...lessonFormData, descricao: e.target.value})} placeholder="Descreva o conteúdo desta aula" rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Aula *</Label>
              <Select value={lessonFormData.tipo_aula} onValueChange={(value: any) => setLessonFormData({...lessonFormData, tipo_aula: value})}>
                <SelectTrigger><SelectValue placeholder="Selecione o tipo de aula" /></SelectTrigger>
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
                <Label>URL do YouTube</Label>
                <Input value={lessonFormData.youtube_url} onChange={(e) => setLessonFormData({...lessonFormData, youtube_url: e.target.value})} placeholder="https://www.youtube.com/watch?v=..." />
              </div>
            )}
            {lessonFormData.tipo_aula === 'texto' && (
              <div className="space-y-2">
                <Label>Conteúdo</Label>
                <Textarea value={lessonFormData.conteudo_texto} onChange={(e) => setLessonFormData({...lessonFormData, conteudo_texto: e.target.value})} placeholder="Digite o conteúdo da aula..." rows={6} />
              </div>
            )}
            {lessonFormData.tipo_aula === 'quiz' && (
              <div className="space-y-2">
                <Label>Nota de Corte (%)</Label>
                <Input type="number" min="0" max="100" value={lessonFormData.nota_de_corte} onChange={(e) => setLessonFormData({...lessonFormData, nota_de_corte: parseInt(e.target.value) || 0})} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Ordem</Label>
              <Input type="number" min="1" value={lessonFormData.ordem} onChange={(e) => setLessonFormData({...lessonFormData, ordem: parseInt(e.target.value) || 1})} />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsLessonDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">{editingLesson ? 'Atualizar' : 'Criar'} Aula</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SchoolsManagementPage