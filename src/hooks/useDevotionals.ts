import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../integrations/supabase/client'
import { useAuthStore } from '../stores/authStore'
import { toast } from 'sonner'

// Type Definitions
export interface DevotionalComment {
  id: string
  autor_id: string
  conteudo: string
  created_at: string
  aprovado: boolean
  membros: {
    nome_completo: string
  }
}

export interface Devotional {
  id: string
  id_igreja: string
  titulo: string
  conteudo: string
  versiculo_referencia: string
  versiculo_texto: string
  categoria: 'Diário' | 'Semanal' | 'Especial' | 'Temático'
  tags: string[]
  autor_id: string
  data_publicacao: string
  status: 'Rascunho' | 'Publicado' | 'Arquivado'
  imagem_capa?: string
  tempo_leitura: number
  featured: boolean
  visualizacoes: number
  membros: {
    nome_completo: string
  }
  devocional_curtidas: { membro_id: string }[]
  devocional_comentarios: { count: number }[]
}

export interface DevotionalDetails extends Devotional {
  comments: DevotionalComment[]
}

const fetchDevotionals = async (churchId: string, filters: any) => {
  let query = supabase
    .from('devocionais')
    .select(
      `
      *,
      membros ( nome_completo ),
      devocional_curtidas ( membro_id ),
      devocional_comentarios ( count )
    `
    )
    .eq('id_igreja', churchId)

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.authorId) query = query.eq('autor_id', filters.authorId)
  if (filters.category && filters.category !== 'all') query = query.eq('categoria', filters.category)
  if (filters.tag && filters.tag !== 'all') query = query.contains('tags', [filters.tag])
  if (filters.searchTerm) query = query.or(`titulo.ilike.%${filters.searchTerm}%,conteudo.ilike.%${filters.searchTerm}%`)

  const { data, error } = await query.order('featured', { ascending: false }).order('data_publicacao', { ascending: false })

  if (error) throw new Error(error.message)
  return data as Devotional[]
}

export const useDevotionals = (filters: any) => {
  const { user, currentChurchId } = useAuthStore();
  return useQuery({
    queryKey: ['devotionals', currentChurchId, user?.id, filters],
    queryFn: () => fetchDevotionals(currentChurchId!, filters),
    enabled: !!currentChurchId && !!user?.id,
  });
}

const fetchDevotionalDetails = async (devotionalId: string) => {
  const { data: devotional, error: devotionalError } = await supabase
    .from('devocionais')
    .select(
      `
      *,
      membros ( nome_completo ),
      devocional_curtidas ( membro_id )
    `
    )
    .eq('id', devotionalId)
    .single()

  if (devotionalError) throw new Error(devotionalError.message)

  const { data: comments, error: commentsError } = await supabase
    .from('devocional_comentarios')
    .select('*, membros ( nome_completo )')
    .eq('devocional_id', devotionalId)
    .order('created_at', { ascending: true })

  if (commentsError) throw new Error(commentsError.message)

  return { ...devotional, comments } as DevotionalDetails
}

export const useDevotionalDetails = (devotionalId: string | null) => {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: ['devotionalDetails', devotionalId, user?.id],
    queryFn: () => fetchDevotionalDetails(devotionalId!),
    enabled: !!devotionalId && !!user?.id,
  });
}

export const useCreateDevotional = () => {
  const queryClient = useQueryClient()
  const { user, currentChurchId } = useAuthStore()

  return useMutation({
    mutationFn: async (newDevotional: Partial<Devotional>) => {
      if (!user || !currentChurchId) throw new Error('Usuário não autenticado.')
      const { data, error } = await supabase
        .from('devocionais')
        .insert([
          {
            ...newDevotional,
            id_igreja: currentChurchId,
            autor_id: user.id,
            tempo_leitura: Math.ceil((newDevotional.conteudo?.length || 0) / 200),
          },
        ])
        .select()

      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      toast.success('Devocional criado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['devotionals'] })
    },
    onError: (error) => {
      toast.error(`Erro ao criar devocional: ${error.message}`)
    },
  })
}

export const useLikeDevotional = () => {
  const queryClient = useQueryClient()
  const { user, currentChurchId } = useAuthStore()

  return useMutation({
    mutationFn: async ({ devotionalId, hasLiked }: { devotionalId: string; hasLiked: boolean }) => {
      if (!user || !currentChurchId) throw new Error('Usuário não autenticado.')

      if (hasLiked) {
        const { error } = await supabase.from('devocional_curtidas').delete().match({ devocional_id: devotionalId, membro_id: user.id })
        if (error) throw error
      } else {
        const { error } = await supabase.from('devocional_curtidas').insert({
          devocional_id: devotionalId,
          membro_id: user.id,
          id_igreja: currentChurchId,
        })
        if (error) throw error
      }
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['devotionalDetails', vars.devotionalId] })
      queryClient.invalidateQueries({ queryKey: ['devotionals'] })
    },
    onError: (error) => {
      toast.error(`Erro ao curtir: ${error.message}`)
    },
  })
}

export const useAddComment = () => {
  const queryClient = useQueryClient()
  const { user, currentChurchId } = useAuthStore()

  return useMutation({
    mutationFn: async ({ devotionalId, content }: { devotionalId: string; content: string }) => {
      if (!user || !currentChurchId) throw new Error('Usuário não autenticado.')
      const { error } = await supabase.from('devocional_comentarios').insert({
        devocional_id: devotionalId,
        autor_id: user.id,
        conteudo: content,
        id_igreja: currentChurchId,
      })
      if (error) throw error
    },
    onSuccess: (_, vars) => {
      toast.success('Comentário adicionado!')
      queryClient.invalidateQueries({ queryKey: ['devotionalDetails', vars.devotionalId] })
    },
    onError: (error) => {
      toast.error(`Erro ao comentar: ${error.message}`)
    },
  })
}