import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../integrations/supabase/client'
import { useAuthStore } from '../stores/authStore'
import { toast } from 'sonner'

// Type Definitions
export type StatusCurso = 'Rascunho' | 'Ativo' | 'Pausado' | 'Finalizado'
export type TipoCurso = 'Presencial' | 'Online' | 'Híbrido'
export type CategoriaCurso = 'Discipulado' | 'Liderança' | 'Teologia' | 'Ministério' | 'Evangelismo'
export type NivelCurso = 'Básico' | 'Intermediário' | 'Avançado'

export interface Course {
  id: string
  nome: string
  descricao: string
  tipo: TipoCurso
  categoria: CategoriaCurso
  nivel: NivelCurso | null
  professor: {
    id: string | null
    nome: string | null
    email: string | null
  }
  duracao_horas: number | null
  status: StatusCurso
  data_inicio: string | null
  data_fim: string | null
  certificado_disponivel: boolean
  nota_minima_aprovacao: number | null
  valor?: number | null
  modulos: CourseModule[]
  alunos_inscritos: Student[]
}

export interface CourseModule {
  id: string
  titulo: string
  descricao: string | null
  ordem: number
  aulas: Lesson[]
  avaliacoes: Assessment[]
}

export interface Lesson {
  id: string
  titulo: string
  descricao: string | null
  tipo: 'Video' | 'Texto' | 'PDF' | 'Quiz'
  conteudo: string | null
  duracao_minutos: number | null
  obrigatoria: boolean | null
  ordem: number
}

export interface Assessment {
  id: string
  titulo: string
  tipo: 'Quiz' | 'Dissertativa' | 'Prática'
  perguntas: Question[]
  nota_maxima: number
  tentativas_permitidas: number
}

export interface Question {
  id: string
  pergunta: string
  tipo: 'Múltipla Escolha' | 'Verdadeiro/Falso' | 'Dissertativa'
  opcoes?: string[]
  resposta_correta?: string | number
  pontos: number
}

export interface Student {
  id: string
  nome: string
  email: string
  data_inscricao: string
  progresso: number
  certificado_emitido: boolean
  aulas_assistidas: string[]
  avaliacoes_respondidas: Array<{
    avaliacao_id: string
    nota: number
    data_resposta: string
  }>
}

// Data Fetching function
const fetchCourses = async (churchId: string): Promise<Course[]> => {
  const { data, error } = await supabase
    .from('cursos')
    .select(`
      id, id_igreja, nome, descricao, tipo, categoria, nivel, professor_id, duracao_horas, status, data_inicio, data_fim, certificado_disponivel, nota_minima_aprovacao, valor
    `)
    .eq('id_igreja', churchId)

  if (error) {
    console.error('Erro ao carregar cursos:', error.message)
    throw new Error('Erro ao carregar cursos.')
  }

  const coursesWithChildren: Course[] = []
  for (const c of data || []) {
    const { data: modulos } = await supabase
      .from('cursos_modulos')
      .select(`id, id_curso, titulo, descricao, ordem`)
      .eq('id_curso', c.id)
      .order('ordem', { ascending: true })

    const modules: CourseModule[] = []
    for (const m of modulos || []) {
      const { data: aulas } = await supabase
        .from('cursos_aulas')
        .select(`id, id_modulo, titulo, tipo, conteudo, duracao_minutos, obrigatoria, ordem, descricao`)
        .eq('id_modulo', m.id)
        .order('ordem', { ascending: true })

      modules.push({
        id: m.id,
        titulo: m.titulo,
        descricao: m.descricao,
        ordem: m.ordem,
        aulas: (aulas || []).map(a => ({
          id: a.id,
          titulo: a.titulo,
          descricao: a.descricao || null,
          tipo: (a.tipo === 'video' || a.tipo === 'Video') ? 'Video' : (a.tipo === 'Texto' ? 'Texto' : (a.tipo === 'PDF' ? 'PDF' : 'Quiz')),
          conteudo: a.conteudo || null,
          duracao_minutos: a.duracao_minutos ?? null,
          obrigatoria: a.obrigatoria ?? null,
          ordem: a.ordem
        })),
        avaliacoes: [] // manter vazio por agora
      })
    }

    const professor = { id: c.professor_id || null, nome: null, email: null }
    if (c.professor_id) {
      const { data: profData } = await supabase
        .from('membros')
        .select('id, nome_completo, email')
        .eq('id', c.professor_id)
        .maybeSingle()
      if (profData) {
        professor.nome = profData.nome_completo
        professor.email = profData.email
      }
    }

    coursesWithChildren.push({
      id: c.id,
      nome: c.nome,
      descricao: c.descricao || '',
      tipo: c.tipo as TipoCurso,
      categoria: (c.categoria || 'Discipulado') as CategoriaCurso,
      nivel: (c.nivel || 'Básico') as NivelCurso,
      professor,
      duracao_horas: c.duracao_horas ?? 0,
      status: (c.status || 'Rascunho') as StatusCurso,
      data_inicio: c.data_inicio || null,
      data_fim: c.data_fim || null,
      certificado_disponivel: !!c.certificado_disponivel,
      nota_minima_aprovacao: c.nota_minima_aprovacao ?? 70,
      valor: c.valor ?? 0,
      modulos: modules,
      alunos_inscritos: [] // manter vazio por agora
    })
  }

  return coursesWithChildren
}

// React Query Hook for fetching courses
export const useCourses = () => {
  const { currentChurchId } = useAuthStore()
  return useQuery({
    queryKey: ['courses', currentChurchId],
    queryFn: () => fetchCourses(currentChurchId!),
    enabled: !!currentChurchId,
  })
}

// React Query Hook for creating a course
export const useCreateCourse = () => {
  const queryClient = useQueryClient()
  const { user, currentChurchId } = useAuthStore()

  return useMutation({
    mutationFn: async (newCourse: Partial<Course>) => {
      if (!currentChurchId || !user) throw new Error('Usuário ou igreja não autenticados.')
      
      const { data, error } = await supabase
        .from('cursos')
        .insert({
          id_igreja: currentChurchId,
          nome: newCourse.nome,
          descricao: newCourse.descricao,
          tipo: newCourse.tipo || 'Online',
          categoria: newCourse.categoria || 'Discipulado',
          nivel: newCourse.nivel || 'Básico',
          professor_id: user.id,
          duracao_horas: newCourse.duracao_horas || 0,
          status: 'Rascunho',
          data_inicio: newCourse.data_inicio || null,
          data_fim: newCourse.data_fim || null,
          certificado_disponivel: newCourse.certificado_disponivel ?? true,
          nota_minima_aprovacao: newCourse.nota_minima_aprovacao ?? 70,
          valor: newCourse.valor ?? 0
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      toast.success('Curso criado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['courses', currentChurchId] })
    },
    onError: (error) => {
      toast.error(`Erro ao criar curso: ${error.message}`)
    },
  })
}