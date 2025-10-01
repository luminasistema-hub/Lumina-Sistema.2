import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'
import { v4 as uuidv4 } from 'uuid'

// Tipagem alinhada com o banco de dados
export interface Devotional {
  id: string
  id_igreja: string
  autor_id: string
  titulo: string
  conteudo: string
  versiculo_referencia: string
  versiculo_texto?: string
  categoria: string
  tags?: string[]
  status: 'Rascunho' | 'Publicado' | 'Arquivado'
  imagem_capa?: string
  tempo_leitura: number
  featured: boolean
  created_at: string
  updated_at: string
  membros: { // autor
    nome_completo: string
    funcao: string
  }
  devocional_curtidas: { count: number }[]
  devocional_comentarios: { count: number }[]
}

export interface DevotionalComment {
  id: string
  conteudo: string
  created_at: string
  membros: {
    nome_completo: string
  }
}

const fetchDevotionals = async (churchId: string, filters: any) => {
  let query = supabase
    .from('devocionais')
    .select(`
      *,
      membros ( nome_completo, funcao ),
      devocional_curtidas ( count ),
      devocional_comentarios ( count )
    `, { count: 'exact' })
    .eq('id_igreja', churchId)
    .order('created_at', { ascending: false })

  // Aplicar filtros
  if (filters.status) query = query.eq('status', filters.status)
  if (filters.autor_id) query = query.eq('autor_id', filters.autor_id)
  if (filters.categoria && filters.categoria !== 'all') query = query.eq('categoria', filters.categoria)
  if (filters.tag && filters.tag !== 'all') query = query.contains('tags', [filters.tag])
  if (filters.searchTerm) query = query.or(`titulo.ilike.%${filters.searchTerm}%,conteudo.ilike.%${filters.searchTerm}%`)

  const { data, error } = await query

  if (error) {
    toast.error('Erro ao buscar devocionais: ' + error.message)
    throw new Error(error.message)
  }
  return data as Devotional[]
}

const fetchDevotionalDetails = async (devotionalId: string) => {
    const { data: devotional, error: devotionalError } = await supabase
      .from('devocionais')
      .select(`*, membros ( nome_completo, funcao )`)
      .eq('id', devotionalId)
      .single()

    if (devotionalError) throw new Error(devotionalError.message)

    const { data: comments, error: commentsError } = await supabase
      .from('devocional_comentarios')
      .select(`*, membros ( nome_completo )`)
      .eq('devocional_id', devotionalId)
      .order('created_at', { ascending: true })

    if (commentsError) throw new Error(commentsError.message)

    const { data: likes, error: likesError } = await supabase
      .from('devocional_curtidas')
      .select('id')
      .eq('devocional_id', devotionalId)

    if (likesError) throw new Error(likesError.message)

    return { ...devotional, comments, likesCount: likes.length }
}

const uploadImage = async (file: File, churchId: string): Promise<string> => {
  const fileName = `${uuidv4()}-${file.name}`
  const filePath = `devotional_covers/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('imagens')
    .upload(filePath, file)

  if (uploadError) {
    throw new Error('Falha no upload da imagem: ' + uploadError.message)
  }

  const { data } = supabase.storage.from('imagens').getPublicUrl(filePath)
  return data.publicUrl
}

export const useDevotionals = (filters: any) => {
  const queryClient = useQueryClient()
  const { user, currentChurchId } = useAuthStore()

  const { data: devotionals = [], isLoading, isError } = useQuery<Devotional[]>({
    queryKey: ['devotionals', currentChurchId, filters],
    queryFn: () => fetchDevotionals(currentChurchId!, filters),
    enabled: !!currentChurchId,
  })

  const createDevotionalMutation = useMutation({
    mutationFn: async ({ devotionalData, imageFile }: { devotionalData: Partial<Devotional>, imageFile: File | null }) => {
      if (!user || !currentChurchId) throw new Error('Usuário não autenticado ou igreja não selecionada.')

      let imageUrl: string | undefined = undefined
      if (imageFile) {
        imageUrl = await uploadImage(imageFile, currentChurchId)
      }

      const finalData = {
        ...devotionalData,
        id_igreja: currentChurchId,
        autor_id: user.id,
        imagem_capa: imageUrl,
        tempo_leitura: Math.ceil((devotionalData.conteudo?.length || 0) / 200),
      }

      const { data, error } = await supabase.from('devocionais').insert(finalData).select().single()
      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      toast.success('Devocional criado com sucesso!')
      queryClient.invalidateQueries({ queryKey: ['devotionals'] })
    },
    onError: (error) => {
      toast.error('Erro ao criar devocional: ' + error.message)
    },
  })

  const likeMutation = useMutation({
    mutationFn: async ({ devotionalId, hasLiked }: { devotionalId: string, hasLiked: boolean }) => {
        if (!user) throw new Error("Usuário não autenticado.");

        if (hasLiked) {
            const { error } = await supabase.from('devocional_curtidas').delete().match({ devocional_id: devotionalId, membro_id: user.id });
            if (error) throw error;
        } else {
            const { error } = await supabase.from('devocional_curtidas').insert({ devocional_id: devotionalId, membro_id: user.id });
            if (error) throw error;
        }
    },
    onSuccess: (_, vars) => {
        queryClient.invalidateQueries({ queryKey: ['devotionalDetails', vars.devotionalId] });
        queryClient.invalidateQueries({ queryKey: ['devotionals'] });
    },
    onError: (error) => {
        toast.error("Erro ao curtir: " + error.message);
    }
  });

  const commentMutation = useMutation({
      mutationFn: async ({ devotionalId, content }: { devotionalId: string, content: string }) => {
          if (!user) throw new Error("Usuário não autenticado.");
          const { error } = await supabase.from('devocional_comentarios').insert({ devocional_id: devotionalId, autor_id: user.id, conteudo: content });
          if (error) throw error;
      },
      onSuccess: (_, vars) => {
          toast.success("Comentário adicionado!");
          queryClient.invalidateQueries({ queryKey: ['devotionalDetails', vars.devotionalId] });
          queryClient.invalidateQueries({ queryKey: ['devotionals'] });
      },
      onError: (error) => {
          toast.error("Erro ao comentar: " + error.message);
      }
  });

  return {
    devotionals,
    isLoading,
    isError,
    createDevotional: createDevotionalMutation.mutateAsync,
    likeDevotional: likeMutation.mutate,
    addComment: commentMutation.mutate,
    fetchDevotionalDetails,
  }
}