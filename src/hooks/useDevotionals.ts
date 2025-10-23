import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../integrations/supabase/client'
import { useAuthStore } from '../stores/authStore'
import { toast } from 'sonner'
import { useEffect } from 'react'

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
  status: 'Rascunho' | 'Publicado' | 'Arquivado' | 'Pendente'
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
  const { data: churchData, error: churchError } = await supabase
    .from('igrejas')
    .select('parent_church_id, compartilha_devocionais_da_mae')
    .eq('id', churchId)
    .single();

  if (churchError) throw new Error(churchError.message);

  const churchIdsToFetch = [churchId];
  if (churchData?.parent_church_id && churchData.compartilha_devocionais_da_mae) {
    churchIdsToFetch.push(churchData.parent_church_id);
  }

  let query = supabase
    .from('devocionais')
    .select(`
      *,
      membros ( nome_completo ),
      devocional_curtidas ( membro_id ),
      devocional_comentarios ( count )
    `)
    .in('id_igreja', churchIdsToFetch);

  // Para igrejas filhas, só pegar os compartilhados da mãe
  if (churchIdsToFetch.length > 1) {
    query = query.or(`id_igreja.eq.${churchId},and(id_igreja.eq.${churchData.parent_church_id},compartilhar_com_filhas.eq.true)`);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message)
  let rows = (data as any[]) as Devotional[]

  // Filtros aplicados no cliente
  if (filters.status) rows = rows.filter(d => d.status === filters.status)
  if (filters.authorId) rows = rows.filter(d => d.autor_id === filters.authorId)
  if (filters.category && filters.category !== 'all') rows = rows.filter(d => d.categoria === filters.category)
  if (filters.tag && filters.tag !== 'all') rows = rows.filter(d => Array.isArray(d.tags) && d.tags.includes(filters.tag))
  if (filters.searchTerm) {
    const t = String(filters.searchTerm).toLowerCase()
    rows = rows.filter(d => (d.titulo?.toLowerCase().includes(t) || d.conteudo?.toLowerCase().includes(t)))
  }

  // Ordenação similar à anterior
  rows.sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1
    const da = a.data_publicacao ? new Date(a.data_publicacao).getTime() : 0
    const db = b.data_publicacao ? new Date(b.data_publicacao).getTime() : 0
    return db - da
  })

  return rows
}

export const useDevotionals = (filters: any) => {
  const { user, currentChurchId } = useAuthStore();
  const queryClient = useQueryClient();
  const queryKey = ['devotionals', currentChurchId, user?.id, filters];

  useEffect(() => {
    if (!currentChurchId) return;

    const channel = supabase
      .channel(`public-devotionals-${currentChurchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'devocionais' },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'devocional_comentarios' },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'devocional_curtidas' },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentChurchId, queryClient, queryKey]);

  return useQuery({
    queryKey,
    queryFn: () => fetchDevotionals(currentChurchId!, filters),
    enabled: !!currentChurchId && !!user?.id,
    refetchOnWindowFocus: false,
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
    refetchOnWindowFocus: false,
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