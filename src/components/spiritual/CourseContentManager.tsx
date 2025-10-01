import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Course, CourseModule, Lesson } from '@/types/course'
import { useCourses } from '@/hooks/useCourses'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, GripVertical, Youtube, BookOpen, HelpCircle, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

const LessonIcon = ({ type }: { type: Lesson['tipo'] }) => {
  switch (type) {
    case 'Video': return <Youtube className="w-5 h-5 text-red-500" />
    case 'Texto': return <BookOpen className="w-5 h-5 text-blue-500" />
    case 'Quiz': return <HelpCircle className="w-5 h-5 text-green-500" />
    default: return <FileText className="w-5 h-5 text-gray-500" />
  }
}

const AddModuleDialog = ({ courseId, onModuleCreated }: { courseId: string, onModuleCreated: () => void }) => {
  const [title, setTitle] = useState('')
  const { createModule } = useCourses()
  const queryClient = useQueryClient()

  const handleCreate = () => {
    if (!title) {
      toast.error('O título do módulo é obrigatório.')
      return
    }
    const course: Course | undefined = queryClient.getQueryData(['course', courseId])
    const order = (course?.modulos?.length || 0) + 1
    createModule({ id_curso: courseId, titulo: title, ordem: order }, {
      onSuccess: () => {
        setTitle('')
        onModuleCreated()
        queryClient.invalidateQueries({ queryKey: ['course', courseId] })
      }
    })
  }

  return (
    <>
      <Label htmlFor="module-title">Título do Módulo</Label>
      <Input id="module-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Introdução ao Discipulado" />
      <Button onClick={handleCreate} className="mt-4 w-full">Criar Módulo</Button>
    </>
  )
}

const AddLessonDialog = ({ moduleId, courseId, onLessonCreate }: { moduleId: string, courseId: string, onLessonCreate: () => void }) => {
  const [lessonData, setLessonData] = useState<Partial<Lesson>>({ titulo: '', tipo: 'Video', conteudo: '' })
  const { createLesson } = useCourses()
  const queryClient = useQueryClient()

  const handleCreate = () => {
    if (!lessonData.titulo || !lessonData.tipo) {
      toast.error('Título e Tipo são obrigatórios.')
      return
    }
    const course: Course | undefined = queryClient.getQueryData(['course', courseId])
    const module = course?.modulos.find(m => m.id === moduleId)
    const order = (module?.aulas?.length || 0) + 1
    
    createLesson({ ...lessonData, id_modulo: moduleId, ordem: order }, {
      onSuccess: () => {
        setLessonData({ titulo: '', tipo: 'Video', conteudo: '' })
        onLessonCreate()
        queryClient.invalidateQueries({ queryKey: ['course', courseId] })
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="lesson-title">Título da Aula</Label>
        <Input id="lesson-title" value={lessonData.titulo} onChange={(e) => setLessonData(d => ({ ...d, titulo: e.target.value }))} placeholder="Ex: O que é um discípulo?" />
      </div>
      <div className="space-y-2">
        <Label>Tipo de Aula</Label>
        <Select value={lessonData.tipo} onValueChange={(v) => setLessonData(d => ({ ...d, tipo: v as Lesson['tipo'] }))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Video">Vídeo (YouTube)</SelectItem>
            <SelectItem value="Texto">Texto</SelectItem>
            <SelectItem value="Quiz">Quiz (em breve)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {lessonData.tipo === 'Video' && (
        <div className="space-y-2">
          <Label htmlFor="lesson-content">Link do Vídeo no YouTube</Label>
          <Input id="lesson-content" value={lessonData.conteudo} onChange={(e) => setLessonData(d => ({ ...d, conteudo: e.target.value }))} placeholder="Cole a URL completa do vídeo" />
        </div>
      )}
      {lessonData.tipo === 'Texto' && (
        <div className="space-y-2">
          <Label htmlFor="lesson-content-text">Conteúdo da Aula</Label>
          <Textarea id="lesson-content-text" value={lessonData.conteudo} onChange={(e) => setLessonData(d => ({ ...d, conteudo: e.target.value }))} rows={10} />
        </div>
      )}
      <Button onClick={handleCreate} className="w-full">Criar Aula</Button>
    </div>
  )
}

export const CourseContentManager = ({ course }: { course: Course }) => {
  const [isModuleDialogOpen, setIsModuleDialogOpen] = useState(false)
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false)
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)

  const openLessonDialog = (moduleId: string) => {
    setSelectedModuleId(moduleId)
    setIsLessonDialogOpen(true)
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle>Estrutura do Curso</CardTitle>
          <CardDescription>Adicione e organize módulos e aulas.</CardDescription>
        </div>
        <Dialog open={isModuleDialogOpen} onOpenChange={setIsModuleDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Novo Módulo</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Criar Novo Módulo</DialogTitle></DialogHeader>
            <AddModuleDialog courseId={course.id} onModuleCreated={() => setIsModuleDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {course.modulos?.sort((a, b) => a.ordem - b.ordem).map(module => (
          <div key={module.id} className="border rounded-lg p-4 bg-gray-50/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" />
                <h4 className="font-semibold text-lg">{module.titulo}</h4>
              </div>
              <Button variant="ghost" size="sm" onClick={() => openLessonDialog(module.id)}>
                <Plus className="w-4 h-4 mr-2" /> Nova Aula
              </Button>
            </div>
            <div className="space-y-2 pl-4">
              {module.aulas?.sort((a, b) => a.ordem - b.ordem).map(lesson => (
                <div key={lesson.id} className="flex items-center justify-between p-2 rounded-md bg-white shadow-sm">
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" />
                    <LessonIcon type={lesson.tipo} />
                    <span>{lesson.titulo}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
              {(!module.aulas || module.aulas.length === 0) && (
                <p className="text-sm text-center text-gray-500 py-4">Nenhuma aula neste módulo.</p>
              )}
            </div>
          </div>
        ))}
        {(!course.modulos || course.modulos.length === 0) && (
          <p className="text-center text-muted-foreground py-8">Este curso ainda não tem módulos. Comece criando um!</p>
        )}
      </CardContent>
      <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Criar Nova Aula</DialogTitle></DialogHeader>
          {selectedModuleId && <AddLessonDialog moduleId={selectedModuleId} courseId={course.id} onLessonCreate={() => setIsLessonDialogOpen(false)} />}
        </DialogContent>
      </Dialog>
    </Card>
  )
}