import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'
import { Course, CourseModule, Lesson, StudentInscription, NewCourse } from '@/types/course'

// Função para buscar e estruturar todos os dados dos cursos
const fetchCoursesData = async (churchId: string): Promise<Course[]> => {
  // 1. Buscar cursos e nome dos professores
  const { data: coursesData, error: coursesError } = await supabase
    .from('cursos')
    .select('*, professor:membros(id, nome_completo)')
    .eq('id_igreja', churchId)

  if (coursesError) throw new Error(`Erro ao buscar cursos: ${coursesError.message}`)
  if (!coursesData) return []

  const courseIds = coursesData.map(c => c.id)
  if (courseIds.length === 0) return []

  // 2. Buscar módulos, aulas e inscrições em paralelo
  const [
    { data: modulesData, error: modulesError },
    { data: inscriptionsData, error: inscriptionsError },
  ] = await Promise.all([
    supabase.from('cursos_modulos').select('*').in('id_curso', courseIds).order('ordem'),
    supabase.from('cursos_inscricoes').select('*, membro:membros(id, nome_completo, email)').in('id_curso', courseIds),
  ])

  if (modulesError) throw new Error(`Erro ao buscar módulos: ${modulesError.message}`)
  if (inscriptionsError) throw new Error(`Erro ao buscar inscrições: ${inscriptionsError.message}`)

  const moduleIds = modulesData?.map(m => m.id) || []
  const inscriptionIds = inscriptionsData?.map(i => i.id) || []

  const [
    { data: lessonsData, error: lessonsError },
    { data: progressData, error: progressError },
  ] = await Promise.all([
    moduleIds.length > 0 ? supabase.from('cursos_aulas').select('*').in('id_modulo', moduleIds).order('ordem') : Promise.resolve({ data: [], error: null }),
    inscriptionIds.length > 0 ? supabase.from('cursos_progresso').select('*').in('id_inscricao', inscriptionIds) : Promise.resolve({ data: [], error: null }),
  ])

  if (lessonsError) throw new Error(`Erro ao buscar aulas: ${lessonsError.message}`)
  if (progressError) throw new Error(`Erro ao buscar progresso: ${progressError.message}`)

  // 3. Estruturar os dados aninhados
  return coursesData.map(course => {
    const courseModules = (modulesData || [])
      .filter(m => m.id_curso === course.id)
      .map(module => ({
        ...module,
        aulas: (lessonsData || []).filter(l => l.id_modulo === module.id),
      }))

    const courseInscriptions = (inscriptionsData || [])
      .filter(i => i.id_curso === course.id)
      .map(inscription => {
        const totalLessons = courseModules.reduce((acc, mod) => acc + mod.aulas.length, 0)
        const completedLessons = (progressData || []).filter(p => p.id_inscricao === inscription.id && p.status === 'concluido').length
        const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0
        
        return {
          ...inscription,
          progresso: progressPercentage,
        }
      })

    return {
      ...course,
      modulos: courseModules,
      alunos_inscritos: courseInscriptions,
    } as Course
  })
}

// Hook principal
export const useCourses = () => {
  const { currentChurchId } = useAuthStore()
  const queryClient = useQueryClient()

  const { data: courses = [], isLoading, error } = useQuery<Course[]>({
    queryKey: ['courses', currentChurchId],
    queryFn: () => fetchCoursesData(currentChurchId!),
    enabled: !!currentChurchId,
  })

  const createCourseMutation = useMutation({
    mutationFn: async (newCourse: NewCourse) => {
      const { data, error } = await supabase
        .from('cursos')
        .insert([{ ...newCourse, id_igreja: currentChurchId, status: 'Rascunho' }])
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

  return {
    courses,
    isLoading,
    error,
    createCourse: createCourseMutation.mutate,
  }
}