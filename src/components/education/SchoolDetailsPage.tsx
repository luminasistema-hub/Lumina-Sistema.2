import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { 
  useSchools, 
  useSchoolLessons, 
  useQuizQuestions, 
  useUserQuizAnswers, 
  useStudentAttendance,
  useSubmitQuizAnswer,
  useRegisterAttendance
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
import { toast } from 'sonner'
import { BookOpen, Play, CheckCircle, Calendar, User } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

const SchoolDetailsPage = () => {
  const { schoolId } = useParams()
  const { user } = useAuthStore()
  const { data: schools } = useSchools()
  const { data: lessons, isLoading: lessonsLoading } = useSchoolLessons(schoolId || null)
  const [selectedLesson, setSelectedLesson] = useState<any>(null)
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null)
  const { data: quizQuestions } = useQuizQuestions(selectedLesson?.id || null)
  const { data: userQuizAnswers } = useUserQuizAnswers(selectedLesson?.id || null)
  const { data: attendance } = useStudentAttendance(selectedLesson?.id || null)
  
  const submitQuizAnswerMutation = useSubmitQuizAnswer()
  const registerAttendanceMutation = useRegisterAttendance()
  
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isQuizDialogOpen, setIsQuizDialogOpen] = useState(false)
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false)
  
  const school = schools?.find(s => s.id === schoolId)
  
  // Verificar se o usuário está inscrito na escola
  const [isEnrolled, setIsEnrolled] = useState(false)
  
  useEffect(() => {
    // Aqui normalmente verificaríamos a inscrição no banco de dados
    // Por enquanto, vamos assumir que o usuário está inscrito
    setIsEnrolled(true)
  }, [schoolId, user?.id])
  
  const handleOpenLesson = (lesson: any) => {
    setSelectedLesson(lesson)
    setIsVideoDialogOpen(true)
  }
  
  const handleOpenQuiz = (lesson: any) => {
    setSelectedLesson(lesson)
    setIsQuizDialogOpen(true)
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
  
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => window.history.back()}>
          Voltar
        </Button>
        <h1 className="text-2xl font-bold">{school?.nome || 'Escola'}</h1>
      </div>
      
      {lessonsLoading && (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      )}
      
      {lessons && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {lessons.map((lesson) => {
            const userAnswer = userAnswersMap[lesson.id]
            const userAttendance = attendance?.aula_id === lesson.id
            
            return (
              <Card key={lesson.id} className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    {lesson.titulo}
                  </CardTitle>
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
                        disabled={!lesson.youtube_url}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Assistir
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleOpenQuiz(lesson)}
                      >
                        Quiz
                      </Button>
                    </div>
                    
                    <div className="flex gap-2">
                      {userAttendance ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleRegisterAttendance(lesson.id)}
                        >
                          Registrar presença
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
      
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
        </DialogContent>
      </Dialog>
      
      {/* Dialog para quiz da aula */}
      <Dialog open={isQuizDialogOpen} onOpenChange={setIsQuizDialogOpen}>
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
                            disabled={selectedAnswer === null}
                          >
                            Enviar resposta
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
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SchoolDetailsPage