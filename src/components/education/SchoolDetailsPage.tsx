import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  useSchools, 
  useSchoolLessons, 
  useQuizQuestions, 
  useUserQuizAnswers, 
  useStudentAttendance,
  useSubmitQuizAnswer,
  useRegisterAttendance,
  useStudentProgress,
  useMarkLessonAsCompleted
} from '@/hooks/useSchools'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { BookOpen, Play, CheckCircle, Calendar, User, FileText, MapPin, CheckSquare, Lock } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

const SchoolDetailsPage = () => {
  const { schoolId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { data: schools, isLoading: schoolsLoading, error: schoolsError } = useSchools()
  const { data: lessons, isLoading: lessonsLoading, error: lessonsError } = useSchoolLessons(schoolId || null)
  const [selectedLesson, setSelectedLesson] = useState<any>(null)
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null)
  const { data: quizQuestions } = useQuizQuestions(selectedLesson?.id || null)
  const { data: userQuizAnswers } = useUserQuizAnswers(selectedLesson?.id || null)
  const { data: attendance } = useStudentAttendance(selectedLesson?.id || null)
  const { data: studentProgress } = useStudentProgress(schoolId)
  
  const submitQuizAnswerMutation = useSubmitQuizAnswer()
  const registerAttendanceMutation = useRegisterAttendance()
  const markLessonAsCompletedMutation = useMarkLessonAsCompleted()
  
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false)
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false)
  const [isTextDialogOpen, setIsTextDialogOpen] = useState(false)
  
  const school = schools?.find(s => s.id === schoolId)
  
  // Mapear aulas concluídas para verificação rápida
  const completedLessons = new Set(studentProgress?.map(p => p.aula_id))

  // Verificar se o usuário está inscrito na escola
  const [isEnrolled, setIsEnrolled] = useState(false)
  
  useEffect(() => {
    // Aqui normalmente verificaríamos a inscrição no banco de dados
    // Por enquanto, vamos assumir que o usuário está inscrito
    setIsEnrolled(true)
  }, [schoolId, user?.id])
  
  const handleOpenLesson = (lesson: any) => {
    setSelectedLesson(lesson)
    
    switch (lesson.tipo_aula) {
      case 'video':
        setIsVideoDialogOpen(true)
        break
      case 'texto':
        setIsTextDialogOpen(true)
        break
      case 'quiz':
        setIsQuizDialogOpen(true)
        break
      default:
        // Para aulas presenciais, não abrimos um dialog
        break
    }
  }
  
  const handleSubmitQuiz = () => {
    if (selectedQuestion && selectedAnswer !== null) {
      submitQuizAnswerMutation.mutate({
        questionId: selectedQuestion.id,
        chosenAnswer: selectedAnswer
      })
      setSelectedAnswer(null)
    }
  }

  const handleMarkAsCompleted = (lessonId: string) => {
    markLessonAsCompletedMutation.mutate({ lessonId })
  }
  
  const handleRegisterAttendance = (lessonId: string) => {
    registerAttendanceMutation.mutate({
      lessonId,
      date: new Date().toISOString().split('T')[0], // Data atual no formato YYYY-MM-DD
      present: true
    })
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }
  
  // Extrair ID do vídeo do YouTube da URL
  const getYoutubeVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }
  
  // Mapear respostas do usuário
  const userAnswersMap = userQuizAnswers?.reduce((acc, answer) => {
    acc[answer.pergunta_id] = answer
    return acc
  }, {} as Record<string, any>) || {}
  
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
  
  if (schoolsLoading || lessonsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Carregando...</h1>
        </div>
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }
  
  if (schoolsError || lessonsError) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Erro</h1>
        </div>
        <div className="text-red-500 p-4 text-center">
          Erro ao carregar informações: {schoolsError?.message || lessonsError?.message}
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">{school?.nome || 'Escola'}</h1>
      </div>
      
      {lessons && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {lessons.map((lesson, index) => {
            const userAnswer = userAnswersMap[lesson.id]
            const userAttendance = attendance?.aula_id === lesson.id
            const isCompleted = completedLessons.has(lesson.id)
            
            const previousLesson = lessons[index - 1]
            const isPreviousCompleted = index === 0 || completedLessons.has(previousLesson.id)
            const isLocked = !isPreviousCompleted

            return (
              <Card key={lesson.id} className={`border-0 shadow-sm ${isLocked ? 'bg-gray-50 opacity-60' : ''}`}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {isLocked && <Lock className="w-4 h-4 text-gray-500" />}
                    {getLessonTypeIcon(lesson.tipo_aula)}
                    {lesson.titulo}
                  </CardTitle>
                  <div className="flex gap-2 items-center">
                    <Badge variant="outline">
                      {getLessonTypeLabel(lesson.tipo_aula)}
                    </Badge>
                    {isCompleted && <Badge variant="default" className="bg-green-500">Concluída</Badge>}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    {lesson.descricao || 'Nenhuma descrição fornecida'}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleOpenLesson(lesson)}
                        disabled={isLocked}
                      >
                        {lesson.tipo_aula === 'video' && (
                          <>
                            <Play className="w-4 h-4 mr-2" />
                            Assistir
                          </>
                        )}
                        {lesson.tipo_aula === 'texto' && (
                          <>
                            <FileText className="w-4 h-4 mr-2" />
                            Ler
                          </>
                        )}
                        {lesson.tipo_aula === 'quiz' && (
                          <>
                            <CheckSquare className="w-4 h-4 mr-2" />
                            Quiz
                          </>
                        )}
                        {lesson.tipo_aula === 'presencial' && (
                          <>
                            <MapPin className="w-4 h-4 mr-2" />
                            Presencial
                          </>
                        )}
                      </Button>
                    </div>
                    
                    <div className="flex gap-2">
                      {lesson.tipo_aula === 'presencial' && isCompleted && (
                        <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span>Presença Registrada</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
      
      {/* Dialog para conteúdo de texto */}
      <Dialog open={isTextDialogOpen} onOpenChange={setIsTextDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedLesson?.titulo}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="prose max-w-none">
              <p className="text-gray-600 whitespace-pre-wrap">
                {selectedLesson?.conteudo_texto || 'Nenhum conteúdo disponível'}
              </p>
            </div>
          </div>
          {!completedLessons.has(selectedLesson?.id) && (
            <Button onClick={() => handleMarkAsCompleted(selectedLesson.id)}>
              Marcar como Concluída
            </Button>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Dialog para vídeo da aula */}
      <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedLesson?.titulo}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedLesson?.youtube_url ? (
              <div className="aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${getYoutubeVideoId(selectedLesson.youtube_url)}`}
                  className="w-full h-full rounded-lg"
                  title={selectedLesson.titulo}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhum vídeo disponível para esta aula
              </div>
            )}
            
            <div className="mt-4">
              <h3 className="font-medium mb-2">Descrição</h3>
              <p className="text-gray-600">
                {selectedLesson?.descricao || 'Nenhuma descrição fornecida'}
              </p>
            </div>
          </div>
          {!completedLessons.has(selectedLesson?.id) && (
            <Button onClick={() => handleMarkAsCompleted(selectedLesson.id)}>
              Marcar como Concluída
            </Button>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Dialog para quiz da aula */}
      <Dialog open={isQuizDialogOpen} onOpenChange={(open) => {
        setIsQuizDialogOpen(open)
        if (!open) {
          setSelectedAnswer(null)
          setSelectedQuestion(null)
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Quiz: {selectedLesson?.titulo}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {quizQuestions && quizQuestions.length > 0 ? (
              <div className="space-y-6">
                {quizQuestions.map((question) => {
                  const userAnswer = userAnswersMap[question.id]
                  
                  return (
                    <div key={question.id} className="border-b pb-6 last:border-0">
                      <h3 className="font-medium mb-3">{question.pergunta_texto}</h3>
                      
                      {userAnswer ? (
                        <div className="space-y-2">
                          <div className="p-3 bg-green-50 rounded-md">
                            <p className="text-green-800">
                              Sua resposta: {question.opcoes[userAnswer.resposta_escolhida]}
                            </p>
                            <p className="text-sm text-green-600">
                              Pontuação obtida: {userAnswer.pontuacao_obtida}/{question.pontuacao}
                            </p>
                          </div>
                          
                          {userAnswer.resposta_escolhida !== question.resposta_correta && (
                            <div className="p-3 bg-blue-50 rounded-md">
                              <p className="text-blue-800">
                                Resposta correta: {question.opcoes[question.resposta_correta]}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <RadioGroup 
                            value={selectedAnswer?.toString() || ''} 
                            onValueChange={(value) => setSelectedAnswer(parseInt(value))}
                          >
                            {question.opcoes.map((option, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                                <Label htmlFor={`option-${index}`}>{option}</Label>
                              </div>
                            ))}
                          </RadioGroup>
                          
                          <Button 
                            onClick={() => {
                              setSelectedQuestion(question)
                              handleSubmitQuiz()
                            }}
                            disabled={selectedAnswer === null || submitQuizAnswerMutation.isPending}
                          >
                            {submitQuizAnswerMutation.isPending ? 'Enviando...' : 'Enviar resposta'}
                          </Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhuma pergunta de quiz disponível para esta aula
              </div>
            )}
          </div>
          {!completedLessons.has(selectedLesson?.id) && (
            <Button 
              onClick={() => handleMarkAsCompleted(selectedLesson.id)}
              disabled={!quizQuestions || quizQuestions.length === 0 || Object.keys(userAnswersMap).length < quizQuestions.length}
            >
              Marcar como Concluída
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SchoolDetailsPage