import { useState } from 'react'
import { useQuizQuestions, useCreateQuizQuestion, useUpdateQuizQuestion, useDeleteQuizQuestion, QuizQuestion } from '@/hooks/useSchools'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface QuizQuestionsManagerProps {
  lessonId: string
}

const QuizQuestionsManager = ({ lessonId }: QuizQuestionsManagerProps) => {
  const { data: questions, isLoading } = useQuizQuestions(lessonId)
  const createQuestionMutation = useCreateQuizQuestion()
  const updateQuestionMutation = useUpdateQuizQuestion()
  const deleteQuestionMutation = useDeleteQuizQuestion()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Partial<QuizQuestion> | null>(null)
  const [formData, setFormData] = useState({
    pergunta_texto: '',
    opcoes: ['', '', '', ''],
    resposta_correta: 0,
    pontuacao: 10,
    ordem: 1
  })

  const resetForm = () => {
    setFormData({
      pergunta_texto: '',
      opcoes: ['', '', '', ''],
      resposta_correta: 0,
      pontuacao: 10,
      ordem: (questions?.length || 0) + 1
    })
    setEditingQuestion(null)
  }

  const handleOpenForm = (question?: QuizQuestion) => {
    if (question) {
      setEditingQuestion(question)
      setFormData({
        pergunta_texto: question.pergunta_texto,
        opcoes: question.opcoes.concat(Array(4 - question.opcoes.length).fill('')), // Garante 4 opções
        resposta_correta: question.resposta_correta,
        pontuacao: question.pontuacao,
        ordem: question.ordem
      })
    } else {
      if ((questions?.length || 0) >= 10) {
        toast.warning('Limite de 10 perguntas por quiz atingido.')
        return
      }
      resetForm()
    }
    setIsFormOpen(true)
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...formData.opcoes]
    newOptions[index] = value
    setFormData({ ...formData, opcoes: newOptions })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.pergunta_texto.trim()) {
      toast.error('O texto da pergunta é obrigatório.')
      return
    }
    if (formData.opcoes.some(opt => !opt.trim())) {
      toast.error('Todas as 4 opções devem ser preenchidas.')
      return
    }

    const questionData = { ...formData, aula_id: lessonId }

    if (editingQuestion?.id) {
      updateQuestionMutation.mutate({ id: editingQuestion.id, ...questionData })
    } else {
      createQuestionMutation.mutate(questionData)
    }
    setIsFormOpen(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Gerenciar Perguntas do Quiz</h3>
        <Dialog open={isFormOpen} onOpenChange={(open) => {
          setIsFormOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenForm()}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Pergunta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingQuestion ? 'Editar Pergunta' : 'Nova Pergunta'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pergunta_texto">Pergunta</Label>
                <Input id="pergunta_texto" value={formData.pergunta_texto} onChange={e => setFormData({...formData, pergunta_texto: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Opções de Resposta (4 obrigatórias)</Label>
                {formData.opcoes.map((opt, i) => (
                  <Input key={i} value={opt} onChange={e => handleOptionChange(i, e.target.value)} placeholder={`Opção ${i + 1}`} />
                ))}
              </div>
              <div className="space-y-2">
                <Label>Resposta Correta</Label>
                <RadioGroup value={formData.resposta_correta.toString()} onValueChange={val => setFormData({...formData, resposta_correta: parseInt(val)})}>
                  {formData.opcoes.map((opt, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <RadioGroupItem value={i.toString()} id={`opt-correct-${i}`} />
                      <Label htmlFor={`opt-correct-${i}`}>{opt || `Opção ${i + 1}`}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pontuacao">Pontuação</Label>
                <Input id="pontuacao" type="number" value={formData.pontuacao} onChange={e => setFormData({...formData, pontuacao: parseInt(e.target.value)})} />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                <Button type="submit">{editingQuestion ? 'Atualizar' : 'Criar'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <p>Carregando perguntas...</p> : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pergunta</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions?.map(q => (
              <TableRow key={q.id}>
                <TableCell>{q.pergunta_texto}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleOpenForm(q)}><Pencil className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteQuestionMutation.mutate(q.id)}><Trash2 className="w-4 h-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

export default QuizQuestionsManager