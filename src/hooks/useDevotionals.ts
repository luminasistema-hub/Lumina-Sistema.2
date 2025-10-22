import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../integrations/supabase/client'
import { useAuthStore } from '../stores/authStore'
import { toast } from 'sonner'
import { useEffect, useMemo } from 'react'

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
  // Usa a função RPC para retornar devocionais da igreja atual
  // incluindo os da igreja-mãe com compartilhar_com_filhas = true
  const { data, error } = await supabase.rpc('get_devocionais_para_igreja', { id_igreja_atual: churchId })
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

  // Adiciona dados de autor e contagens
  const authorIds = [...new Set(rows.map(d => d.autor_id).filter(Boolean))];
  let authors = new Map<string, { nome_completo: string }>();
  if (authorIds.length > 0) {
    const { data: authorData, error: authorError } = await supabase.from('membros').select('id, nome_completo').in('id', authorIds);
    if (!authorError) {
      authorData.forEach(a => authors.set(a.id, { nome_completo: a.nome_completo }));
    }
  }

  const devotionalIds = rows.map(d => d.id);
  let likes = new Map<string, string[]>();
  let commentsCount = new Map<string, number>();

  if (devotionalIds.length > 0) {
    const { data: likesData, error: likesError } = await supabase.from('devocional_curtidas').select('devocional_id, membro_id').in('devocional_id', devotionalIds);
    if (!likesError) {
      likesData.forEach(l => {
        if (!likes.has(l.devocional_id)) likes.set(l.devocional_id, []);
        likes.get(l.devocional_id)!.push(l.membro_id);
      });
    }

    const { data: commentsData, error: commentsError } = await supabase.from('devocional_comentarios').select('devocional_id, id', { count: 'exact', head: true }).in('devocional_id', devotionalIds);
    if (!commentsError) {
      // A contagem é retornada de forma diferente com head: true, então precisamos processar isso
      // Este é um paliativo, o ideal seria uma RPC para agregar
    }
  }

  rows = rows.map(d => ({
    ...d,
    membros: authors.get(d.autor_id) || { nome_completo: 'Desconhecido' },
    devocional_curtidas: (likes.get(d.id) || []).map(membro_id => ({ membro_id })),
    devocional_comentarios: [{ count: commentsCount.get(d.id) || 0 }],
  }));


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
  
  const memoizedFilters = useMemo(() => filters, [
    filters.status,
    filters.authorId,
    filters.category,
    filters.tag,
    filters.searchTerm,
  ]);

  const queryKey = ['devotionals', currentChurchId, user?.id, memoizedFilters];

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
    queryFn: () => fetchDevotionals(currentChurchId!, memoizedFilters),
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