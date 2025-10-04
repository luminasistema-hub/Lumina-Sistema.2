import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'sonner';

// Interfaces para os dados da Jornada
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
  tipo_passo: 'video' | 'quiz' | 'leitura' | 'acao' | 'link_externo';
  conteudo?: string;
  created_at: string;
  quiz_perguntas?: QuizPergunta[];
}

interface EtapaTrilha {
  id: string;
  id_trilha: string;
  ordem: number;
  titulo: string;
  descricao: string;
  cor: string;
  created_at: string;
}

interface ProgressoMembro {
  id: string;
  id_membro: string;
  id_passo: string;
  status: 'pendente' | 'concluido';
  data_conclusao?: string;
}

export interface JourneyPassoDisplay extends PassoEtapa {
  completed: boolean;
  completedDate?: string;
}

export interface JourneyEtapaDisplay extends EtapaTrilha {
  passos: JourneyPassoDisplay[];
  allPassosCompleted: boolean;
}

export const useJourneyData = () => {
  const { user, currentChurchId } = useAuthStore();
  const [etapas, setEtapas] = useState<JourneyEtapaDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallProgress, setOverallProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [trilhaInfo, setTrilhaInfo] = useState<{ id: string; titulo: string; descricao: string } | null>(null);

  const loadJourneyData = useCallback(async () => {
    if (!user?.id || !currentChurchId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const { data: trilhaData, error: trilhaError } = await supabase
        .from('trilhas_crescimento')
        .select('id, titulo, descricao')
        .eq('id_igreja', currentChurchId)
        .eq('is_ativa', true)
        .maybeSingle();

      if (trilhaError) throw trilhaError;
      if (!trilhaData) {
        setEtapas([]);
        setTrilhaInfo(null);
        setLoading(false);
        return;
      }
      
      setTrilhaInfo({ id: trilhaData.id, titulo: trilhaData.titulo, descricao: trilhaData.descricao });

      const { data: etapasRawData, error: etapasDataError } = await supabase
        .from('etapas_trilha')
        .select('*')
        .eq('id_trilha', trilhaData.id)
        .order('ordem', { ascending: true });
      if (etapasDataError) throw etapasDataError;

      const etapaIds = (etapasRawData || []).map(etapa => etapa.id);
      if (etapaIds.length === 0) {
        setEtapas([]);
        setLoading(false);
        return;
      }

      const { data: passosRawData, error: passosError } = await supabase
        .from('passos_etapa')
        .select('*')
        .in('id_etapa', etapaIds)
        .order('ordem', { ascending: true });
      if (passosError) throw passosError;

      const passoIds = (passosRawData || []).map(passo => passo.id);
      let progressoData: ProgressoMembro[] = [];
      if (passoIds.length > 0) {
        const { data, error: progressoError } = await supabase
          .from('progresso_membros')
          .select('*')
          .eq('id_membro', user.id)
          .in('id_passo', passoIds);
        if (progressoError) throw progressoError;
        progressoData = data || [];
      }

      const quizPassoIds = (passosRawData || []).filter(p => p.tipo_passo === 'quiz').map(p => p.id);
      let quizPerguntasData: QuizPergunta[] = [];
      if (quizPassoIds.length > 0) {
        const { data: qData, error: qError } = await supabase
          .from('quiz_perguntas')
          .select('*')
          .in('passo_id', quizPassoIds)
          .order('ordem', { ascending: true });
        if (qError) console.error('Erro ao carregar perguntas de quiz:', qError);
        quizPerguntasData = qData || [];
      }

      const etapasComPassos: JourneyEtapaDisplay[] = (etapasRawData || []).map(etapa => {
        const passosDaEtapa: JourneyPassoDisplay[] = (passosRawData || [])
          .filter(passo => passo.id_etapa === etapa.id)
          .map(passo => {
            const passoProgresso = (progressoData || []).find(p => p.id_passo === passo.id);
            return {
              ...passo,
              completed: passoProgresso?.status === 'concluido',
              completedDate: passoProgresso?.data_conclusao,
              quiz_perguntas: passo.tipo_passo === 'quiz' 
                ? quizPerguntasData.filter(qp => qp.passo_id === passo.id).sort((a, b) => a.ordem - b.ordem)
                : undefined
            };
          });
        
        const allPassosCompleted = passosDaEtapa.length > 0 && passosDaEtapa.every(p => p.completed);

        return {
          ...etapa,
          passos: passosDaEtapa,
          allPassosCompleted: allPassosCompleted,
        };
      });
      
      setEtapas(etapasComPassos);

    } catch (error: any) {
      console.error('useJourneyData: Error loading journey data:', error);
      toast.error('Ocorreu um erro ao carregar sua jornada espiritual.');
    } finally {
      setLoading(false);
    }
  }, [user?.id, currentChurchId]);

  useEffect(() => {
    loadJourneyData();
  }, [loadJourneyData]);

  useEffect(() => {
    if (!loading && etapas.length > 0) {
      const allPassos = etapas.flatMap(etapa => etapa.passos);
      const completed = allPassos.filter(passo => passo.completed).length;
      const total = allPassos.length;
      
      setCompletedSteps(completed);
      setTotalSteps(total);
      setOverallProgress(total > 0 ? (completed / total) * 100 : 0);
      setCurrentLevel(etapas.filter(etapa => etapa.allPassosCompleted).length);
    } else if (!loading) {
      setCompletedSteps(0);
      setTotalSteps(0);
      setOverallProgress(0);
      setCurrentLevel(0);
    }
  }, [etapas, loading]);

  const markPassoCompleted = async (passoId: string, quizDetails?: any) => {
    if (!user?.id) {
      toast.error('Erro: Usuário não identificado.');
      return;
    }

    try {
      const { data: existingProgress, error: fetchError } = await supabase
        .from('progresso_membros')
        .select('id')
        .eq('id_membro', user.id)
        .eq('id_passo', passoId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      const progressData = {
        status: 'concluido',
        data_conclusao: new Date().toISOString(),
        respostas_quiz: quizDetails || null,
      };

      if (existingProgress) {
        const { error } = await supabase
          .from('progresso_membros')
          .update(progressData)
          .eq('id', existingProgress.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('progresso_membros')
          .insert({
            id_membro: user.id,
            id_passo: passoId,
            ...progressData,
          });
        if (error) throw error;
      }

      toast.success('Passo concluído com sucesso!');
      await loadJourneyData();
    } catch (error: any) {
      console.error('useJourneyData: Error marking passo completed:', error);
      toast.error('Ocorreu um erro ao marcar o passo como concluído.');
    }
  };

  return {
    loading,
    etapas,
    overallProgress,
    completedSteps,
    totalSteps,
    currentLevel,
    trilhaInfo,
    loadJourneyData,
    markPassoCompleted,
  };
};