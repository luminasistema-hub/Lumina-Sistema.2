import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'sonner';

// Interfaces duplicadas de MemberJourney para uso no hook
interface QuizPergunta {
  id?: string;
  passo_id?: string;
  ordem: number;
  pergunta_texto: string;
  opcoes: string[];
  resposta_correta: number;
  pontuacao: number;
}

interface PassoEtapa {
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
  const [progresso, setProgresso] = useState<ProgressoMembro[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallProgress, setOverallProgress] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [trilhaInfo, setTrilhaInfo] = useState<{ titulo: string; descricao: string } | null>(null);

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
        .single();

      if (trilhaError && trilhaError.code !== 'PGRST116') throw trilhaError;
      if (!trilhaData) {
        setEtapas([]);
        setProgresso([]);
        setTrilhaInfo(null);
        return;
      }
      
      setTrilhaInfo({ titulo: trilhaData.titulo, descricao: trilhaData.descricao });
      const trilhaId = trilhaData.id;

      const { data: etapasRawData, error: etapasDataError } = await supabase
        .from('etapas_trilha')
        .select('*')
        .eq('id_trilha', trilhaId)
        .order('ordem', { ascending: true });
      if (etapasDataError) throw etapasDataError;

      const etapaIds = (etapasRawData || []).map(etapa => etapa.id);
      if (etapaIds.length === 0) {
        setEtapas([]);
        return;
      }

      const { data: passosRawData, error: passosError } = await supabase
        .from('passos_etapa')
        .select('*')
        .in('id_etapa', etapaIds)
        .order('ordem', { ascending: true });
      if (passosError) throw passosError;

      const passoIds = (passosRawData || []).map(passo => passo.id);
      const { data: progressoData, error: progressoError } = await supabase
        .from('progresso_membros')
        .select('*')
        .eq('id_membro', user.id)
        .in('id_passo', passoIds);
      if (progressoError) throw progressoError;
      setProgresso(progressoData || []);

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
                ? quizPerguntasData.filter(qp => qp.passo_id === passo.id) 
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
    }
  }, [etapas, loading]);

  return {
    loading,
    etapas,
    progresso,
    overallProgress,
    completedSteps,
    totalSteps,
    currentLevel,
    trilhaInfo,
    loadJourneyData,
  };
};