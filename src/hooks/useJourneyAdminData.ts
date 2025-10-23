import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Interfaces
export interface QuizPergunta {
  id?: string;
  passo_id?: string;
  ordem: number;
  pergunta_texto: string;
  opcoes: string[];
  resposta_correta: number;
  pontuacao: number;
}

export interface PassoEtapa {
  id: string;
  id_etapa: string;
  ordem: number;
  titulo: string;
  tipo_passo: 'video' | 'quiz' | 'leitura' | 'acao' | 'link_externo' | 'conclusao_escola';
  conteudo?: string;
  created_at: string;
  quiz_perguntas?: QuizPergunta[];
  nota_de_corte_quiz?: number;
  escola_pre_requisito_id?: string | null;
}

export interface EtapaTrilha {
  id: string;
  id_trilha: string;
  ordem: number;
  titulo: string;
  descricao: string;
  cor: string;
  created_at: string;
  passos: PassoEtapa[];
  escola_pre_requisito_id?: string | null;
}

export interface Trilha {
  id: string;
  titulo: string;
  descricao: string;
  compartilhar_com_filhas: boolean;
  etapas_trilha: EtapaTrilha[];
}

// --- Hook de Busca (Query) ---
const fetchJourneyAdminData = async (churchId: string) => {
  const { data: trilhaData, error } = await supabase
    .from('trilhas_crescimento')
    .select(`
      id, titulo, descricao, compartilhar_com_filhas,
      etapas_trilha (
        *,
        passos_etapa (
          *,
          quiz_perguntas (*)
        )
      )
    `)
    .eq('id_igreja', churchId)
    .eq('is_ativa', true)
    .maybeSingle();

  if (error) {
    console.error("Erro ao carregar a jornada completa:", error);
    toast.error("Erro ao carregar a jornada. Tente novamente.");
    throw error;
  }

  if (!trilhaData) return null;

  const etapasOrdenadas = (trilhaData.etapas_trilha as any[]).map(etapa => {
    const passosOrdenados = etapa.passos_etapa 
      ? [...etapa.passos_etapa].sort((a, b) => a.ordem - b.ordem)
      : [];
    
    const passosComQuizCorreto = passosOrdenados.map(passo => ({
      ...passo,
      quiz_perguntas: passo.quiz_perguntas ? [...passo.quiz_perguntas].sort((a,b) => a.ordem - b.ordem) : []
    }));
    
    return { ...etapa, passos: passosComQuizCorreto };
  }).sort((a, b) => a.ordem - b.ordem);

  return { ...trilhaData, etapas_trilha: etapasOrdenadas } as Trilha;
};

export const useJourneyAdminData = (churchId: string | null) => {
  return useQuery({
    queryKey: ['journeyAdminData', churchId],
    queryFn: () => fetchJourneyAdminData(churchId!),
    enabled: !!churchId,
  });
};

// --- Hooks de Modificação (Mutations) ---

export const useSaveTrilha = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ trilha, currentChurchId }: { trilha: Partial<Trilha> & { titulo: string }, currentChurchId: string }) => {
      if (trilha.id) {
        const { error } = await supabase
          .from('trilhas_crescimento')
          .update({
            titulo: trilha.titulo.trim(),
            descricao: trilha.descricao?.trim(),
            compartilhar_com_filhas: trilha.compartilhar_com_filhas,
          })
          .eq('id', trilha.id);
        if (error) throw error;
        return 'updated';
      } else {
        await supabase
          .from('trilhas_crescimento')
          .update({ is_ativa: false })
          .eq('id_igreja', currentChurchId)
          .eq('is_ativa', true);

        const { error } = await supabase
          .from('trilhas_crescimento')
          .insert({
            id_igreja: currentChurchId,
            titulo: trilha.titulo.trim(),
            descricao: trilha.descricao?.trim(),
            is_ativa: true,
            compartilhar_com_filhas: trilha.compartilhar_com_filhas,
          });
        if (error) throw error;
        return 'created';
      }
    },
    onSuccess: (result, variables) => {
      toast.success(result === 'updated' ? 'Trilha atualizada!' : 'Trilha criada!');
      queryClient.invalidateQueries({ queryKey: ['journeyAdminData', variables.currentChurchId] });
    },
    onError: (error: any) => {
      toast.error(`Não foi possível salvar a trilha: ${error.message}`);
    },
  });
};

export const useSaveEtapa = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ etapa, churchId, trilhaId, totalEtapas }: { etapa: Partial<EtapaTrilha>, churchId: string, trilhaId: string, totalEtapas: number }) => {
      if (etapa.id) {
        const { error } = await supabase
          .from('etapas_trilha')
          .update({
            titulo: etapa.titulo,
            descricao: etapa.descricao,
            cor: etapa.cor,
          })
          .eq('id', etapa.id);
        if (error) throw error;
      } else {
        const novaOrdem = totalEtapas > 0 ? totalEtapas + 1 : 1;
        const { error } = await supabase
          .from('etapas_trilha')
          .insert({
            id_trilha: trilhaId,
            ordem: novaOrdem,
            titulo: etapa.titulo,
            descricao: etapa.descricao,
            cor: etapa.cor,
            id_igreja: churchId,
          });
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      toast.success(variables.etapa.id ? 'Etapa atualizada!' : 'Etapa criada!');
      queryClient.invalidateQueries({ queryKey: ['journeyAdminData', variables.churchId] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao salvar etapa: ${error.message}`);
    }
  });
};

export const useDeleteEtapa = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (etapaId: string) => {
      const { error } = await supabase.from('etapas_trilha').delete().eq('id', etapaId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Etapa apagada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['journeyAdminData'] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao apagar etapa: ${error.message}`);
    }
  });
};

export const useSavePasso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ passo, churchId, etapaId, totalPassos }: { passo: Partial<PassoEtapa>, churchId: string, etapaId: string, totalPassos: number }) => {
      let passoId: string;
      if (passo.id) {
        const { data, error } = await supabase
          .from('passos_etapa')
          .update({
            titulo: passo.titulo,
            tipo_passo: passo.tipo_passo,
            conteudo: passo.conteudo,
            nota_de_corte_quiz: passo.tipo_passo === 'quiz' ? passo.nota_de_corte_quiz : null,
            escola_pre_requisito_id: passo.escola_pre_requisito_id,
          })
          .eq('id', passo.id)
          .select('id')
          .single();
        if (error) throw error;
        passoId = data.id;
      } else {
        const novaOrdem = totalPassos > 0 ? totalPassos + 1 : 1;
        const { data, error } = await supabase
          .from('passos_etapa')
          .insert({
            id_etapa: etapaId,
            ordem: novaOrdem,
            titulo: passo.titulo,
            tipo_passo: passo.tipo_passo,
            conteudo: passo.conteudo,
            id_igreja: churchId,
            nota_de_corte_quiz: passo.tipo_passo === 'quiz' ? passo.nota_de_corte_quiz : null,
            escola_pre_requisito_id: passo.escola_pre_requisito_id,
          })
          .select('id')
          .single();
        if (error) throw error;
        passoId = data.id;
      }

      if (passo.tipo_passo === 'quiz' && passo.quiz_perguntas) {
        await supabase.from('quiz_perguntas').delete().eq('passo_id', passoId);
        const perguntasToInsert = passo.quiz_perguntas.map((q, index) => ({
          passo_id: passoId,
          ordem: index + 1,
          pergunta_texto: q.pergunta_texto,
          opcoes: q.opcoes,
          resposta_correta: q.resposta_correta,
          pontuacao: q.pontuacao || 1,
          id_igreja: churchId,
        }));
        if (perguntasToInsert.length > 0) {
          await supabase.from('quiz_perguntas').insert(perguntasToInsert);
        }
      }
      return passo.id ? 'updated' : 'created';
    },
    onSuccess: (result, variables) => {
      toast.success(result === 'updated' ? 'Passo atualizado!' : 'Passo criado!');
      queryClient.invalidateQueries({ queryKey: ['journeyAdminData', variables.churchId] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao salvar passo: ${error.message}`);
    }
  });
};

export const useDeletePasso = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (passoId: string) => {
      const { error } = await supabase.from('passos_etapa').delete().eq('id', passoId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Passo apagado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['journeyAdminData'] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao apagar passo: ${error.message}`);
    }
  });
};

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ items, tableName }: { items: { id: string, ordem: number }[], tableName: 'etapas_trilha' | 'passos_etapa' }) => {
      const { error } = await supabase.from(tableName).upsert(items);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(`Ordem atualizada!`);
      queryClient.invalidateQueries({ queryKey: ['journeyAdminData'] });
    },
    onError: (error: any) => {
      toast.error(`Erro ao salvar a nova ordem: ${error.message}`);
    }
  });
};