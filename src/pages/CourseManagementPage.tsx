import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Course } from '@/types/course'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

const fetchCourseById = async (courseId: string) => {
  const { data, error } = await supabase
    .from('cursos')
    .select('*, professor:membros(id, nome_completo)')
    .eq('id', courseId)
    .single()
  
  if (error) throw new Error(error.message)
  return data as Course
}

const CourseManagementPage = () => {
  const { courseId } = useParams<{ courseId: string }>()
  
  const { data: course, isLoading, error } = useQuery<Course>({
    queryKey: ['course', courseId],
    queryFn: () => fetchCourseById(courseId!),
    enabled: !!courseId,
  })

  if (isLoading) {
    return <div className="p-6">Carregando informações do curso...</div>
  }

  if (error) {
    return <div className="p-6 text-red-500">Erro ao carregar o curso: {error.message}</div>
  }

  if (!course) {
    return <div className="p-6">Curso não encontrado.</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link to="/dashboard?tab=spiritual">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{course.nome}</h1>
          <p className="text-muted-foreground">Modo de Gerenciamento</p>
        </div>
      </div>

      <Tabs defaultValue="content">
        <TabsList>
          <TabsTrigger value="content">Conteúdo</TabsTrigger>
          <TabsTrigger value="students">Alunos</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>
        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>Estrutura do Curso</CardTitle>
              <CardDescription>Adicione módulos e aulas (vídeos, textos, quizzes).</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">Em breve: Gerenciador de conteúdo do curso.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="students">
          <Card>
            <CardHeader>
              <CardTitle>Alunos Inscritos</CardTitle>
              <CardDescription>Acompanhe o progresso e a frequência dos seus alunos.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">Em breve: Lista de alunos e suas estatísticas.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Curso</CardTitle>
              <CardDescription>Edite as informações gerais do seu curso.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">Em breve: Formulário de edição do curso.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default CourseManagementPage