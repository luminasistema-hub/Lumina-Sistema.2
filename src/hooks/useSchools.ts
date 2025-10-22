import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../integrations/supabase/client'
import { useAuthStore } from '../stores/authStore'
import { toast } from 'sonner'
import { useEffect } from 'react'

export interface School {
  id: string
  id_igreja: string
  nome: string
  descricao: string
  professor_id: string
  professor_nome?: string
  compartilhar_com_filhas: boolean
  created_at: string
  updated_at: string
  data_inicio?: string
  data_fim?: string
  status: 'aberta' | 'fechada' | 'concluida'
}

export interface SchoolEnrollment {
  id: string
  escola_id: string
  membro_id: string
  status: string
  data_inscricao: string
  created_at: string
  escolas?: School
}

export interface SchoolLesson {
  id: string
  escola_id: string
  titulo: string
  descricao: string
  tipo_aula: 'texto' | 'video' | 'quiz' | 'presencial'
  youtube_url?: string
  conteudo_texto?: string
  ordem: number
  created_at: string
  updated_at: string
  nota_de_corte?: number
}

export interface StudentAttendance {
  id: string
  aula_id: string
  membro_id: string
  presente: boolean
  data_aula: string
  created_at: string
}

export interface QuizQuestion {
  id: string
  aula_id: string
  pergunta_texto: string
  opcoes: string[]
  resposta_correta: number
  pontuacao: number
  ordem: number
  created_at: string
}

export interface QuizAnswer {
  id: string
  pergunta_id: string
  membro_id: string
  resposta_escolhida: number
  pontuacao_obtida: number
  created_at: string
}

export interface StudentProgress {
  id: string
  aula_id: string
  membro_id: string
  id_igreja: string
  completed_at: string
}

// Função para buscar escolas (incluindo as compartilhadas com igrejas filhas)
const fetchSchools = async (churchId: string) => {
  // Usar a função RPC correta para buscar escolas
  const { data, error } = await supabase.rpc('get_escolas_para_igreja', { id_igreja_atual: churchId })
  
  if (error) throw new Error(error.message)
  if (!data || data.length === 0) return []

  const schools = data as School[]
  
  // Coletar IDs dos professores para buscar os nomes em uma única query
  const professorIds = [...new Set(schools.map(school => school.professor_id).filter(Boolean))]
  
  let professorNames = new Map<string, string>()
  if (professorIds.length > 0) {
    const { data: professors, error: professorError } = await supabase
      .from('membros')
      .select('id, nome_completo')
      .in('id', professorIds)
    
    if (professorError) {
      console.error("Erro ao buscar nomes de professores:", professorError.message)
    } else {
      professors.forEach(p => {
        professorNames.set(p.id, p.nome_completo)
      })
    }
  }
  
  // Mapear os nomes dos professores de volta para as escolas
  return schools.map(school => ({
    ...school,
    professor_nome: school.professor_id ? professorNames.get(school.professor_id) || 'Professor não definido' : 'Professor não definido'
  }))
}

export const useSchools = () => {
  const { currentChurchId } = useAuthStore()
  const queryClient = useQueryClient()
  const queryKey = ['schools', currentChurchId]

  useEffect(() => {
    if (!currentChurchId) return

    const channel = supabase
      .channel(`public-schools-${currentChurchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'escolas', filter: `id_igreja=eq.${currentChurchId}` },
        () => queryClient.invalidateQueries({ queryKey })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'escola_inscricoes' },
        () => queryClient.invalidateQueries({ queryKey })
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentChurchId, queryClient, queryKey])
  
  return useQuery({
    queryKey: queryKey,
    queryFn: () => fetchSchools(currentChurchId!),
    enabled: !!currentChurchId
  })
}

// Função para buscar inscrições do usuário
const fetchUserEnrollments = async (userId: string) => {
  const { data, error } = await supabase
    .from('escola_inscricoes')
    .select(`
      *,
      escolas(nome, descricao)
    `)
    .eq('membro_id', userId)
    .order('data_inscricao', { ascending: false })
  
  if (error) throw new Error(error.message)
  return data
}

export const useUserEnrollments = () => {
  const { user } = useAuthStore()
  
  return useQuery({
    queryKey: ['user-enrollments', user?.id],
    queryFn: () => fetchUserEnrollments(user!.id),
    enabled: !!user?.id
  })
}

// Função para buscar aulas de uma escola
const fetchSchoolLessons = async (schoolId: string) => {
  const { data, error } = await supabase
    .from('escola_aulas')
    .select('*')
    .eq('escola_id', schoolId)
    .order('ordem')
  
  if (error) throw new Error(error.message)
  return data
}

export const useSchoolLessons = (schoolId: string | null) => {
  return useQuery({
    queryKey: ['school-lessons', schoolId],
    queryFn: () => fetchSchoolLessons(schoolId!),
    enabled: !!schoolId
  })
}

// Função para buscar frequência de uma escola inteira
const fetchSchoolAttendance = async (schoolId: string) => {
  const { data, error } = await supabase
    .from('escola_frequencia')
    .select('*, escola_aulas!inner(escola_id)')
    .eq('escola_aulas.escola_id', schoolId)

  if (error) throw new Error(error.message)
  return data
}

export const useSchoolAttendance = (schoolId: string | null) => {
  return useQuery({
    queryKey: ['school-attendance', schoolId],
    queryFn: () => fetchSchoolAttendance(schoolId!),
    enabled: !!schoolId
  })
}

// Função para buscar frequência do aluno
const fetchStudentAttendance = async (userId: string, lessonId: string) => {
  const { data, error } = await supabase
    .from('escola_frequencia')
    .select('*')
    .eq('membro_id', userId)
    .eq('aula_id', lessonId)
    .maybeSingle()
  
  if (error) throw new Error(error.message)
  return data
}

export const useStudentAttendance = (lessonId: string | null) => {
  const { user } = useAuthStore()
  
  return useQuery({
    queryKey: ['student-attendance', user?.id, lessonId],
    queryFn: () => fetchStudentAttendance(user!.id, lessonId!),
    enabled: !!user?.id && !!lessonId
  })
}

// Função para buscar perguntas do quiz de uma aula
const fetchQuizQuestions = async (lessonId: string) => {
  const { data, error } = await supabase
    .from('escola_quiz_perguntas')
    .select('*')
    .eq('aula_id', lessonId)
    .order('ordem')
  
  if (error) throw new Error(error.message)
  return data
}

export const useQuizQuestions = (lessonId: string | null) => {
  return useQuery({
    queryKey: ['quiz-questions', lessonId],
    queryFn: () => fetchQuizQuestions(lessonId!),
    enabled: !!lessonId
  })
}

// Função para buscar respostas do usuário para um quiz
const fetchUserQuizAnswers = async (userId: string, lessonId: string) => {
  const { data, error } = await supabase
    .from('escola_quiz_respostas')
    .select(`
      *,
      escola_quiz_perguntas(pergunta_texto, opcoes, resposta_correta, pontuacao)
    `)
    .eq('membro_id', userId)
    .eq('escola_quiz_perguntas.aula_id', lessonId)
    .order('created_at')
  
  if (error) throw new Error(error.message)
  return data
}

export const useUserQuizAnswers = (lessonId: string | null) => {
  const { user } = useAuthStore()
  
  return useQuery({
    queryKey: ['user-quiz-answers', user?.id, lessonId],
    queryFn: () => fetchUserQuizAnswers(user!.id, lessonId!),
    enabled: !!user?.id && !!lessonId
  })
}

// Função para buscar o progresso do aluno em uma escola
const fetchStudentProgress = async (userId: string, schoolId: string) => {
  const { data: lessons, error: lessonsError } = await supabase
    .from('escola_aulas')
    .select('id')
    .eq('escola_id', schoolId)

  if (lessonsError) throw new Error(lessonsError.message)
  const lessonIds = lessons.map(l => l.id)

  if (lessonIds.length === 0) return []

  const { data, error } = await supabase
    .from('escola_progresso_aulas')
    .select('*')
    .eq('membro_id', userId)
    .in('aula_id', lessonIds)

  if (error) throw new Error(error.message)
  return data
}

export const useStudentProgress = (schoolId: string | null) => {
  const { user } = useAuthStore()
  return useQuery({
    queryKey: ['student-progress', user?.id, schoolId],
    queryFn: () => fetchStudentProgress(user!.id, schoolId!),
    enabled: !!user?.id && !!schoolId
  })
}

// Função para buscar inscrições de uma escola específica
const fetchSchoolEnrollments = async (schoolId: string) => {
  const { data, error } = await supabase
    .from('escola_inscricoes')
    .select(`
      *,
      membros(id, nome_completo, email)
    `)
    .eq('escola_id', schoolId)

  if (error) throw new Error(error.message)
  return data
}

export const useSchoolEnrollments = (schoolId: string | null) => {
  return useQuery({
    queryKey: ['school-enrollments', schoolId],
    queryFn: () => fetchSchoolEnrollments(schoolId!),
    enabled: !!schoolId
  })
}

// Hook para criar/editar/deletar escolas
export const useCreateSchool = () => {
  const queryClient = useQueryClient()
  const { currentChurchId } = useAuthStore()
  
  return useMutation({
    mutationFn: async (school: Partial<School>) => {
      const { data, error } = await supabase
        .from('escolas')
        .insert({
          ...school,
          id_igreja: currentChurchId
        })
        .select()
      
      if (error) throw new Error(error.message)
      return data[0]
    },
    onSuccess: () => {
      toast.success('Escola criada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['schools'] })
    },
    onError: (error) => {
      toast.error(`Erro ao criar escola: ${error.message}`)
    }
  })
}

export const useUpdateSchool = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<School> & { id: string }) => {
      const { data, error } = await supabase
        .from('escolas')
        .update(updates)
        .eq('id', id)
        .select()
      
      if (error) throw new Error(error.message)
      return data[0]
    },
    onSuccess: () => {
      toast.success('Escola atualizada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['schools'] })
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar escola: ${error.message}`)
    }
  })
}

export const useDeleteSchool = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('escolas')
        .delete()
        .eq('id', id)
      
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      toast.success('Escola removida com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['schools'] })
    },
    onError: (error) => {
      toast.error(`Erro ao remover escola: ${error.message}`)
    }
  })
}

// Hook para inscrever/desinscrever em escolas
export const useEnrollInSchool = () => {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  
  return useMutation({
    mutationFn: async (schoolId: string) => {
      const { data, error } = await supabase
        .from('escola_inscricoes')
        .insert({
          escola_id: schoolId,
          membro_id: user?.id
        })
        .select()
      
      if (error) throw new Error(error.message)
      return data[0]
    },
    onSuccess: () => {
      toast.success('Inscrição realizada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['user-enrollments'] })
      queryClient.invalidateQueries({ queryKey: ['schools'] })
    },
    onError: (error) => {
      toast.error(`Erro ao se inscrever: ${error.message}`)
    }
  })
}

export const useUnenrollFromSchool = () => {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  
  return useMutation({
    mutationFn: async (enrollmentId: string) => {
      const { error } = await supabase
        .from('escola_inscricoes')
        .delete()
        .eq('id', enrollmentId)
      
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      toast.success('Inscrição cancelada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['user-enrollments'] })
      queryClient.invalidateQueries({ queryKey: ['schools'] })
    },
    onError: (error) => {
      toast.error(`Erro ao cancelar inscrição: ${error.message}`)
    }
  })
}

// Hook para registrar frequência
export const useRegisterAttendance = () => {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  
  return useMutation({
    mutationFn: async ({ lessonId, date, present }: { lessonId: string, date: string, present: boolean }) => {
      const { data, error } = await supabase
        .from('escola_frequencia')
        .upsert({
          aula_id: lessonId,
          membro_id: user?.id,
          data_aula: date,
          presente: present
        }, { onConflict: 'aula_id,membro_id,data_aula' })
        .select()
      
      if (error) throw new Error(error.message)
      return data[0]
    },
    onSuccess: () => {
      toast.success('Frequência registrada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['student-attendance'] })
    },
    onError: (error) => {
      toast.error(`Erro ao registrar frequência: ${error.message}`)
    }
  })
}

// Hook para registrar frequência (professor)
export const useRegisterStudentAttendance = () => {
  const queryClient = useQueryClient()
  const { currentChurchId } = useAuthStore()

  return useMutation({
    mutationFn: async ({ lessonId, memberId, date, present, schoolId }: { lessonId: string, memberId: string, date: string, present: boolean, schoolId: string }) => {
      // Etapa 1: Atualizar o registro de frequência
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('escola_frequencia')
        .upsert({
          aula_id: lessonId,
          membro_id: memberId,
          data_aula: date,
          presente: present
        }, { onConflict: 'aula_id,membro_id,data_aula' })
        .select()
        .single()
      
      if (attendanceError) throw new Error(`Erro de Frequência: ${attendanceError.message}`)

      // Etapa 2: Atualizar o progresso do aluno com base na frequência
      if (present) {
        // Se presente, marca a aula como concluída
        const { error: progressError } = await supabase
          .from('escola_progresso_aulas')
          .upsert({
            aula_id: lessonId,
            membro_id: memberId,
            id_igreja: currentChurchId!
          }, { onConflict: 'aula_id,membro_id' })
        
        if (progressError) throw new Error(`Erro de Progresso: ${progressError.message}`)
      } else {
        // Se ausente, remove o registro de conclusão
        const { error: progressError } = await supabase
          .from('escola_progresso_aulas')
          .delete()
          .match({ aula_id: lessonId, membro_id: memberId })
        
        if (progressError) throw new Error(`Erro de Progresso: ${progressError.message}`)
      }
      
      return attendanceData
    },
    onSuccess: (_, variables) => {
      toast.success('Frequência registrada com sucesso!')
      // Invalida todas as queries relevantes para atualizar a interface
      queryClient.invalidateQueries({ queryKey: ['school-attendance', variables.schoolId] })
      queryClient.invalidateQueries({ queryKey: ['student-progress'] })
    },
    onError: (error) => {
      toast.error(`Erro ao registrar frequência: ${error.message}`)
    }
  })
}

// Hook para graduar um aluno de uma escola
export const useGraduateStudent = () => {
  const queryClient = useQueryClient()
  const { currentChurchId } = useAuthStore()

  return useMutation({
    mutationFn: async ({ schoolId, memberId }: { schoolId: string, memberId: string }) => {
      if (!currentChurchId) throw new Error('ID da Igreja não encontrado.')

      // 1. Buscar todas as aulas da escola
      const { data: lessons, error: lessonsError } = await supabase
        .from('escola_aulas')
        .select('id')
        .eq('escola_id', schoolId)

      if (lessonsError) throw new Error(`Erro ao buscar aulas: ${lessonsError.message}`)
      if (!lessons || lessons.length === 0) {
        // Se a escola não tem aulas, não há o que fazer, mas consideramos sucesso.
        return;
      }

      const lessonIds = lessons.map(l => l.id)

      // 2. Criar os registros de progresso para todas as aulas
      const progressRecords = lessonIds.map(lessonId => ({
        aula_id: lessonId,
        membro_id: memberId,
        id_igreja: currentChurchId,
      }))

      const { error: progressError } = await supabase
        .from('escola_progresso_aulas')
        .upsert(progressRecords, { onConflict: 'aula_id,membro_id' })

      if (progressError) throw new Error(`Erro ao registrar progresso: ${progressError.message}`)
    },
    onSuccess: (_, variables) => {
      toast.success('Aluno concluído na escola com sucesso! O progresso na jornada será atualizado.')
      // Invalida queries para atualizar a lista de alunos e a jornada do membro
      queryClient.invalidateQueries({ queryKey: ['school-enrollments', variables.schoolId] })
      queryClient.invalidateQueries({ queryKey: ['student-progress'] })
      queryClient.invalidateQueries({ queryKey: ['journey-data'] }) // Forçar recarregamento da jornada
    },
    onError: (error) => {
      toast.error(`Erro ao concluir aluno: ${error.message}`)
    }
  })
}

// Hook para responder quiz
export const useSubmitQuizAnswer = () => {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  
  return useMutation({
    mutationFn: async ({ questionId, chosenAnswer }: { questionId: string, chosenAnswer: number }) => {
      // Buscar a pergunta para verificar a resposta correta
      const { data: question, error: questionError } = await supabase
        .from('escola_quiz_perguntas')
        .select('resposta_correta, pontuacao')
        .eq('id', questionId)
        .single()
      
      if (questionError) throw new Error(questionError.message)
      
      // Calcular pontuação obtida
      const score = chosenAnswer === question.resposta_correta ? question.pontuacao : 0
      
      const { data, error } = await supabase
        .from('escola_quiz_respostas')
        .upsert({
          pergunta_id: questionId,
          membro_id: user?.id,
          resposta_escolhida: chosenAnswer,
          pontuacao_obtida: score
        }, { onConflict: 'pergunta_id,membro_id' })
        .select()
      
      if (error) throw new Error(error.message)
      return data[0]
    },
    onSuccess: () => {
      toast.success('Resposta registrada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['user-quiz-answers'] })
    },
    onError: (error) => {
      toast.error(`Erro ao registrar resposta: ${error.message}`)
    }
  })
}

// Hook para marcar aula como concluída
export const useMarkLessonAsCompleted = () => {
  const queryClient = useQueryClient()
  const { user, currentChurchId } = useAuthStore()

  return useMutation({
    mutationFn: async ({ lessonId }: { lessonId: string }) => {
      const { data, error } = await supabase
        .from('escola_progresso_aulas')
        .upsert({
          aula_id: lessonId,
          membro_id: user!.id,
          id_igreja: currentChurchId!
        }, { onConflict: 'aula_id,membro_id' })
        .select()
      
      if (error) throw new Error(error.message)
      return data?.[0]
    },
    onSuccess: (_, variables) => {
      toast.success('Aula concluída!')
      queryClient.invalidateQueries({ queryKey: ['student-progress', user?.id] })
    },
    onError: (error) => {
      toast.error(`Erro ao marcar aula como concluída: ${error.message}`)
    }
  })
}

// Hook para criar aulas
export const useCreateLesson = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (lesson: Partial<SchoolLesson>) => {
      const { data, error } = await supabase
        .from('escola_aulas')
        .insert(lesson)
        .select()
      
      if (error) throw new Error(error.message)
      return data[0]
    },
    onSuccess: (_, variables) => {
      toast.success('Aula criada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['school-lessons', variables.escola_id] })
    },
    onError: (error) => {
      toast.error(`Erro ao criar aula: ${error.message}`)
    }
  })
}

// Hook para atualizar aulas
export const useUpdateLesson = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<SchoolLesson> & { id: string }) => {
      const { data, error } = await supabase
        .from('escola_aulas')
        .update(updates)
        .eq('id', id)
        .select()
      
      if (error) throw new Error(error.message)
      return data[0]
    },
    onSuccess: (_, variables) => {
      toast.success('Aula atualizada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['school-lessons', variables.escola_id] })
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar aula: ${error.message}`)
    }
  })
}

// Hook para deletar aulas
export const useDeleteLesson = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('escola_aulas')
        .delete()
        .eq('id', id)
      
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      toast.success('Aula removida com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['school-lessons'] })
    },
    onError: (error) => {
      toast.error(`Erro ao remover aula: ${error.message}`)
    }
  })
}

// Hook para criar perguntas do quiz
export const useCreateQuizQuestion = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (question: Partial<QuizQuestion>) => {
      const { data, error } = await supabase
        .from('escola_quiz_perguntas')
        .insert(question)
        .select()
      
      if (error) throw new Error(error.message)
      return data[0]
    },
    onSuccess: (_, variables) => {
      toast.success('Pergunta criada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['quiz-questions', variables.aula_id] })
    },
    onError: (error) => {
      toast.error(`Erro ao criar pergunta: ${error.message}`)
    }
  })
}

// Hook para atualizar perguntas do quiz
export const useUpdateQuizQuestion = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<QuizQuestion> & { id: string }) => {
      const { data, error } = await supabase
        .from('escola_quiz_perguntas')
        .update(updates)
        .eq('id', id)
        .select()
      
      if (error) throw new Error(error.message)
      return data[0]
    },
    onSuccess: (_, variables) => {
      toast.success('Pergunta atualizada com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['quiz-questions'] })
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar pergunta: ${error.message}`)
    }
  })
}

// Hook para deletar perguntas do quiz
export const useDeleteQuizQuestion = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('escola_quiz_perguntas')
        .delete()
        .eq('id', id)
      
      if (error) throw new Error(error.message)
    },
    onSuccess: () => {
      toast.success('Pergunta removida com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['quiz-questions'] })
    },
    onError: (error) => {
      toast.error(`Erro ao remover pergunta: ${error.message}`)
    }
  })
}