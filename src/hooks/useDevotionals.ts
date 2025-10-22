import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useEffect, useMemo } from 'react';
import { toast } from 'sonner';

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
  if (!churchId) return [];

  try {
    // Buscar devocionais da própria igreja
    let query = supabase
      .from('devocionais')
      .select(`
        *,
        membros!devocionais_autor_id_fkey(nome_completo)
      `)
      .eq('id_igreja', churchId);

    // Aplicar filtros
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.authorId) query = query.eq('autor_id', filters.authorId);
    if (filters.category && filters.category !== 'all') query = query.eq('categoria', filters.category);
    if (filters.searchTerm) {
      query = query.or(`titulo.ilike.%${filters.searchTerm}%,conteudo.ilike.%${filters.searchTerm}%`);
    }

    const { data: ownDevotionals, error: ownError } = await query.order('created_at', { ascending: false });
    if (ownError) throw ownError;

    let allDevotionals = ownDevotionals || [];

    // Buscar devocionais compartilhados da igreja-mãe (se aplicável)
    try {
      const { data: churchData } = await supabase
        .from('igrejas')
        .select('parent_church_id, compartilha_devocionais_da_mae')
        .eq('id', churchId)
        .single();

      if (churchData?.parent_church_id && churchData?.compartilha_devocionais_da_mae) {
        const { data: sharedDevotionals, error: sharedError } = await supabase
          .from('devocionais')
          .select(`
            *,
            membros!devocionais_autor_id_fkey(nome_completo)
          `)
          .eq('id_igreja', churchData.parent_church_id)
          .eq('compartilhar_com_filhas', true)
          .eq('status', 'Publicado');

        if (!sharedError && sharedDevotionals) {
          allDevotionals = [...allDevotionals, ...sharedDevotionals];
        }
      }
    } catch (err) {
      console.warn('Erro ao buscar devocionais compartilhados:', err);
    }

    // Buscar curtidas e comentários para todos os devocionais
    const devotionalIds = allDevotionals.map(d => d.id);
    
    let likesMap = new Map<string, string[]>();
    let commentsCountMap = new Map<string, number>();

    if (devotionalIds.length > 0) {
      // Buscar curtidas
      const { data: likesData } = await supabase
        .from('devocional_curtidas')
        .select('devocional_id, membro_id')
        .in('devocional_id', devotionalIds);

      if (likesData) {
        likesData.forEach(like => {
          if (!likesMap.has(like.devocional_id)) {
            likesMap.set(like.devocional_id, []);
          }
          likesMap.get(like.devocional_id)!.push(like.membro_id);
        });
      }

      // Buscar contagem de comentários
      const { data: commentsData } = await supabase
        .from('devocional_comentarios')
        .select('devocional_id')
        .in('devocional_id', devotionalIds);

      if (commentsData) {
        commentsData.forEach(comment => {
          const count = commentsCountMap.get(comment.devocional_id) || 0;
          commentsCountMap.set(comment.devocional_id, count + 1);
        });
      }
    }

    // Mapear dados completos
    const devotionals: Devotional[] = allDevotionals.map(d => ({
      ...d,
      membros: d.membros || { nome_completo: 'Desconhecido' },
      devocional_curtidas: (likesMap.get(d.id) || []).map(membro_id => ({ membro_id })),
      devocional_comentarios: [{ count: commentsCountMap.get(d.id) || 0 }],
    }));

    // Filtrar por tag se necessário
    let filtered = devotionals;
    if (filters.tag && filters.tag !== 'all') {
      filtered = filtered.filter(d => Array.isArray(d.tags) && d.tags.includes(filters.tag));
    }

    // Ordenar: featured primeiro, depois por data
    filtered.sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      const da = a.data_publicacao ? new Date(a.data_publicacao).getTime() : 0;
      const db = b.data_publicacao ? new Date(b.data_publicacao).getTime() : 0;
      return db - da;
    });

    return filtered;
  } catch (error: any) {
    console.error('Erro ao buscar devocionais:', error);
    toast.error(`Erro ao carregar devocionais: ${error.message}`);
    return [];
  }
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

  const queryKey = useMemo(() => ['devotionals', currentChurchId, user?.id, memoizedFilters], [currentChurchId, user?.id, memoizedFilters]);

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
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
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