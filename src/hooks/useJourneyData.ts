import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'sonner';

export interface QuizPergunta {
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
  created_at?: string;
  quiz_perguntas?: QuizPergunta[];
}

interface EtapaTrilha {
  id: string;
  id_trilha: string;
  ordem: number;
  titulo: string;
  descricao: string;
  cor: string;
  created_at?: string;
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
      setEtapas([]);
      setTrilhaInfo(null);
      setLoading(false);
      return;
    }
    setLoading(true);

    // 1) Carrega trilha/etapas/passos via RPC (inclui trilha da mãe compartilhada)
    const { data, error } = await supabase.rpc('get_jornada_para_igreja', {
      id_igreja_atual: currentChurchId,
    });

    if (error) {
      console.error('useJourneyData: RPC error', error.message);
      toast.error('Ocorreu um erro ao carregar sua jornada espiritual.');
      setEtapas([]);
      setTrilhaInfo(null);
      setLoading(false);
      return;
    }

    const rows = (data || []) as any[];

    if (rows.length === 0) {
      setEtapas([]);
      setTrilhaInfo(null);
      setLoading(false);
      return;
    }

    // 2) Reconstrói estrutura: trilhas -> etapas -> passos
    const trilhaMap = new Map<string, { titulo: string; descricao: string }>();
    const etapaMap = new Map<string, JourneyEtapaDisplay>();
    const passosPorEtapa = new Map<string, JourneyPassoDisplay[]>();

    for (const r of rows) {
      const trilhaId = r.trilha_id as string;
      const etapaId = r.etapa_id as string;
      const passoId = r.passo_id as string;

      // trilha
      if (!trilhaMap.has(trilhaId)) {
        trilhaMap.set(trilhaId, {
          titulo: r.trilha_titulo || '',
          descricao: r.trilha_descricao || '',
        });
      }

      // etapa
      if (!etapaMap.has(etapaId)) {
        etapaMap.set(etapaId, {
          id: etapaId,
          id_trilha: trilhaId,
          ordem: Number(r.etapa_ordem || 0),
          titulo: r.etapa_titulo || '',
          descricao: r.etapa_descricao || '',
          cor: r.etapa_cor || '#e5e7eb',
          passos: [],
          allPassosCompleted: false,
        });
      }

      // passo
      const quizList: QuizPergunta[] = Array.isArray(r.quiz) ? r.quiz : [];
      const passo: JourneyPassoDisplay = {
        id: passoId,
        id_etapa: etapaId,
        ordem: Number(r.passo_ordem || 0),
        titulo: r.passo_titulo || '',
        tipo_passo: r.passo_tipo || 'leitura',
        conteudo: r.passo_conteudo || '',
        quiz_perguntas: quizList,
        completed: false,
      };

      const list = passosPorEtapa.get(etapaId) || [];
      list.push(passo);
      passosPorEtapa.set(etapaId, list);
    }

    // Ordena etapas e passos e monta array final
    const etapaArr: JourneyEtapaDisplay[] = Array.from(etapaMap.values())
      .sort((a, b) => a.ordem - b.ordem)
      .map((et) => {
        const passos = (passosPorEtapa.get(et.id) || []).sort((a, b) => a.ordem - b.ordem);
        return { ...et, passos };
      });

    setEtapas(etapaArr);

    // Define trilhaInfo como a primeira trilha encontrada (da igreja atual ou mãe compartilhada)
    const firstTrilhaId = rows[0].trilha_id as string;
    const header = trilhaMap.get(firstTrilhaId) || { titulo: 'Jornada do Membro', descricao: '' };
    setTrilhaInfo({ id: firstTrilhaId, titulo: header.titulo, descricao: header.descricao });

    // 3) Carrega progresso do usuário para marcar passos concluídos
    const passoIds = etapaArr.flatMap((et) => et.passos.map((p) => p.id));
    let progressoData: ProgressoMembro[] = [];
    if (passoIds.length > 0) {
      const { data: progresso, error: progErr } = await supabase
        .from('progresso_membros')
        .select('*')
        .eq('id_membro', user.id)
        .in('id_passo', passoIds);

      if (!progErr && progresso) {
        progressoData = progresso as any[];
      }
    }

    // Aplica progresso
    const completedSet = new Set(progressoData.filter(p => p.status === 'concluido').map(p => p.id_passo));
    const etapasAtualizadas = etapaArr.map((et) => {
      const passosAtualizados = et.passos.map((p) => ({
        ...p,
        completed: completedSet.has(p.id),
        completedDate: progressoData.find(px => px.id_passo === p.id)?.data_conclusao,
      }));
      const allDone = passosAtualizados.length > 0 && passosAtualizados.every(p => p.completed);
      return { ...et, passos: passosAtualizados, allPassosCompleted: allDone };
    });

    setEtapas(etapasAtualizadas);

    // 4) Estatísticas
    const allPassos = etapasAtualizadas.flatMap((e) => e.passos);
    const completed = allPassos.filter((p) => p.completed).length;
    const total = allPassos.length;

    setCompletedSteps(completed);
    setTotalSteps(total);
    setOverallProgress(total > 0 ? (completed / total) * 100 : 0);
    setCurrentLevel(etapasAtualizadas.filter(e => e.allPassosCompleted).length);

    setLoading(false);
  }, [user?.id, currentChurchId]);

  useEffect(() => {
    loadJourneyData();
  }, [loadJourneyData]);

  const markPassoCompleted = async (passoId: string, quizDetails?: any) => {
    if (!user?.id) {
      toast.error('Erro: Usuário não identificado.');
      return;
    }

    const { data: existingProgress } = await supabase
      .from('progresso_membros')
      .select('id')
      .eq('id_membro', user.id)
      .eq('id_passo', passoId)
      .maybeSingle();

    const progressData = {
      status: 'concluido',
      data_conclusao: new Date().toISOString(),
      respostas_quiz: quizDetails || null,
    };

    if (existingProgress) {
      await supabase
        .from('progresso_membros')
        .update(progressData)
        .eq('id', existingProgress.id);
    } else {
      await supabase
        .from('progresso_membros')
        .insert({
          id_membro: user.id,
          id_passo: passoId,
          id_igreja: currentChurchId,
          ...progressData,
        });
    }

    toast.success('Passo concluído com sucesso!');
    await loadJourneyData();
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