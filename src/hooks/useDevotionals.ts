import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'sonner';

export interface Devotional {
  id: string;
  titulo: string;
  conteudo: string;
  versiculo_referencia: string;
  versiculo_texto?: string;
  categoria: 'Diário' | 'Semanal' | 'Especial' | 'Temático';
  tags: string[];
  autor: {
    id: string;
    nome: string;
    ministerio?: string;
  };
  data_publicacao: string;
  status: 'Rascunho' | 'Publicado' | 'Arquivado';
  imagem_capa?: string;
  tempo_leitura: number;
  visualizacoes: number;
  curtidas: number;
  comentarios: Comment[];
  featured: boolean;
  id_igreja: string;
}

export interface Comment {
  id: string;
  autor_nome: string;
  autor_id: string;
  conteudo: string;
  data_comentario: string;
  aprovado: boolean;
}

export const useDevotionals = () => {
  const queryClient = useQueryClient();
  const { user, currentChurchId } = useAuthStore();

  const { data: devotionals, isLoading, error } = useQuery({
    queryKey: ['devotionals', currentChurchId],
    queryFn: async () => {
      if (!currentChurchId) return [];
      
      const { data, error } = await supabase
        .from('devocionais')
        .select(`
          *,
          autor:membros!devocionais_autor_id_fkey(
            id,
            nome_completo,
            ministerio_recomendado
          )
        `)
        .eq('id_igreja', currentChurchId)
        .eq('status', 'Publicado')
        .order('data_publicacao', { ascending: false });

      if (error) throw error;

      return data.map((item: any) => ({
        ...item,
        autor: {
          id: item.autor?.id || '',
          nome: item.autor?.nome_completo || 'Autor Desconhecido',
          ministerio: item.autor?.ministerio_recomendado
        }
      })) as Devotional[];
    },
    enabled: !!currentChurchId,
  });

  const { data: devotionalDetails } = useQuery({
    queryKey: ['devotionalDetails'],
    queryFn: async () => {
      if (!currentChurchId) return null;
      
      const { data, error } = await supabase
        .from('devocionais')
        .select(`
          *,
          autor:membros!devocionais_autor_id_fkey(
            id,
            nome_completo,
            ministerio_recomendado
          ),
          comentarios:devocional_comentarios(
            id,
            conteudo,
            data_comentario,
            autor_nome:membros!devocional_comentarios_autor_id_fkey(nome_completo)
          )
        `)
        .eq('id_igreja', currentChurchId)
        .eq('status', 'Publicado')
        .order('data_publicacao', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
    enabled: !!currentChurchId,
  });

  const likeMutation = useMutation({
    mutationFn: async ({ devotionalId, hasLiked }: { devotionalId: string, hasLiked: boolean }) => {
      if (!user || !currentChurchId) throw new Error("Usuário não autenticado ou igreja não selecionada.");

      if (hasLiked) {
        const { error } = await supabase.from('devocional_curtidas').delete().match({ 
          devocional_id: devotionalId, 
          membro_id: user.id,
          id_igreja: currentChurchId
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from('devocional_curtidas').insert({ 
          devocional_id: devotionalId, 
          membro_id: user.id,
          id_igreja: currentChurchId
        });
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
      if (!user || !currentChurchId) throw new Error("Usuário não autenticado ou igreja não selecionada.");
      const { error } = await supabase.from('devocional_comentarios').insert({ 
        devocional_id: devotionalId, 
        autor_id: user.id, 
        conteudo: content,
        id_igreja: currentChurchId
      });
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
    devotionals: devotionals || [],
    devotionalDetails,
    isLoading,
    error,
    likeMutation,
    commentMutation,
  };
};