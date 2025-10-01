import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'
import { Course, CourseModule, Lesson, StudentInscription, NewCourse } from '@/types/course'
import { v4 as uuidv4 } from 'uuid'

const uploadCourseCover = async (file: File): Promise<string> => {
  const fileName = `${uuidv4()}-${file.name}`
  const { data, error } = await supabase.storage
    .from('course_covers')
    .upload(fileName, file)

  if (error) {
    throw new Error(`Erro no upload da imagem: ${error.message}`)
  }

  const { data: { publicUrl } } = supabase.storage
    .from('course_covers')
    .getPublicUrl(data.path)

  return publicUrl
}

// Função para buscar e estruturar todos os dados dos cursos
const fetchCoursesData = async (churchId: string): Promise<Course[]> => {
  const { data: coursesData, error: coursesError } = await supabase
    .from('cursos')
    .select('*')
    .eq('id_igreja', churchId)
    .order('created_at', { ascending: false })

  if (coursesError) throw new Error(coursesError.message)

  const courseIds = coursesData.map(c => c.id)

  const { data: modulesData, error: modulesError } = await supabase
    .from('cursos_modulos')
    .select('*')
    .in('id_curso', courseIds)
    .order('ordem', { ascending: true })

  if (modulesError) throw new Error(modulesError.message)

  const moduleIds = modulesData.map(m => m.id)

  const { data: lessonsData, error: lessonsError } = await supabase
    .from('cursos_aulas')
    .select('*')
    .in('id_modulo', moduleIds)
    .order('ordem', { ascending: true })

  if (lessonsError) throw new Error(lessonsError.message)

  const { data: inscriptionsData, error: inscriptionsError } = await supabase
    .from('cursos_inscricoes')
    .select('*')
    .in('id_curso', courseIds)

  if (inscriptionsError) throw new Error(inscriptionsError.message)

  const coursesWithDetails: Course[] = coursesData.map(course => {
    const courseModules = modulesData
      .filter(module => module.id_curso === course.id)
      .map(module => ({
        ...module,
        aulas: lessonsData.filter(lesson => lesson.id_modulo === module.id)
      }))

    const courseInscriptions = inscriptionsData.filter(inscription => inscription.id_curso === course.id)

    return {
      ...course,
      modulos: courseModules,
      alunos_inscritos: courseInscriptions,
      professor: course.professor_id ? { id: course.professor_id, nome_completo: course.professor_nome || 'Professor' } : undefined
    }
  })

  return coursesWithDetails
}

export const useCourses = () => {
  const { currentChurchId } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: courses = [], isLoading, error } = useQuery<Course[]>({
    queryKey: ['courses', currentChurchId],
    queryFn: () => fetchCoursesData(currentChurchId!),
    enabled: !!currentChurchId,
  })

  const createCourseMutation = useMutation({
    mutationFn: async ({ courseData, coverFile }: { courseData: NewCourse, coverFile: File | null }) => {
      let coverImageUrl: string | undefined = undefined;
      if (coverFile) {
        coverImageUrl = await uploadCourseCover(coverFile);
      }

      const { data, error } = await supabase
        .from('cursos')
        .insert([{ 
          ...courseData, 
          id_igreja: currentChurchId, 
          status: 'Rascunho',
          imagem_capa: coverImageUrl 
        }])
        .select()
        .single()

      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      toast.success('Curso criado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['courses', currentChurchId] })
    },
    onError: (err) => {
      toast.error(`Erro ao criar curso: ${err.message}`)
    },
  })

  const enrollInCourseMutation = useMutation({
    mutationFn: async (courseId: string) => {
      const { user } = useAuthStore.getState()
      if (!user) throw new Error('Usuário não autenticado')

      const { data, error } = await supabase
        .from('cursos_inscricoes')
        .insert({ id_curso: courseId, id_membro: user.id, status: 'ativo' })
      
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      toast.success('Inscrição realizada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['courses', currentChurchId] })
    },
    onError: (err) => {
      toast.error(`Erro ao se inscrever: ${err.message}`)
    }
  })

  const createModuleMutation = useMutation({
    mutationFn: async (moduleData: { id_curso: string; titulo: string; ordem: number }) => {
      const { data, error } = await supabase.from('cursos_modulos').insert(moduleData).select().single()
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: (data) => {
      toast.success('Módulo criado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['course', data.id_curso] })
    },
    onError: (err) => toast.error(`Erro ao criar módulo: ${err.message}`)
  })

  const createLessonMutation = useMutation({
    mutationFn: async (lessonData: Partial<Lesson>) => {
      const { data, error } = await supabase.from('cursos_aulas').insert(lessonData).select().single()
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: (data) => {
      toast.success('Aula criada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['course', data.id_curso] }) // Assumindo que o cursoId está no contexto
    },
    onError: (err) => toast.error(`Erro ao criar aula: ${err.message}`)
  })

  return {
    courses,
    isLoading,
    error,
    createCourse: createCourseMutation.mutate,
    enrollInCourse: enrollInCourseMutation.mutate,
    createModule: createModuleMutation.mutate,
    createLesson: createLessonMutation.mutate,
  }
}