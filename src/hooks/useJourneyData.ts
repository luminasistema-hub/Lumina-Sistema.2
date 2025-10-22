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
  nota_de_corte_quiz?: number;
}

interface EtapaTrilha {
  id: string;
  id_trilha: string;
  ordem: number;
  titulo: string;
  descricao: string;
  cor: string;
  created_at?: string;
  escola_pre_requisito_id?: string | null;
}

interface ProgressoMembro {
  id: string;
  id_membro: string;
  id_passo: string;
  status: 'pendente' | 'concluido';
  data_conclusao?: string;
  tentativas_quiz?: number;
  pontuacao_quiz?: number;
  quiz_bloqueado?: boolean;
}

export interface JourneyPassoDisplay extends PassoEtapa {
  completed: boolean;
  completedDate?: string;
  progress?: ProgressoMembro | null;
}

export interface JourneyEtapaDisplay extends EtapaTrilha {
  passos: JourneyPassoDisplay[];
  allPassosCompleted: boolean;
  isLocked: boolean;
  lockReason: string | null;
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
          escola_pre_requisito_id: r.escola_pre_requisito_id,
          passos: [],
          allPassosCompleted: false,
          isLocked: false,
          lockReason: null,
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
        nota_de_corte_quiz: r.nota_de_corte_quiz,
        completed: false,
        progress: null,
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

    // 4) Carrega progresso das escolas
    const schoolPrereqIds = etapaArr.map(e => e.escola_pre_requisito_id).filter(Boolean) as string[];
    const completedSchools = new Set<string>();
    if (schoolPrereqIds.length > 0) {
        const { data: schoolLessons, error: lessonsErr } = await supabase.from('escola_aulas').select('id, escola_id').in('escola_id', schoolPrereqIds);
        const { data: userSchoolProgress, error: progressErr } = await supabase.from('escola_progresso_aulas').select('aula_id').eq('membro_id', user.id);

        if (!lessonsErr && !progressErr) {
            const userCompletedLessons = new Set(userSchoolProgress.map(p => p.aula_id));
            for (const schoolId of schoolPrereqIds) {
                const lessonsForSchool = schoolLessons.filter(l => l.escola_id === schoolId);
                if (lessonsForSchool.length > 0 && lessonsForSchool.every(l => userCompletedLessons.has(l.id))) {
                    completedSchools.add(schoolId);
                }
            }
        }
    }

    // 5) Aplica progresso e lógica de bloqueio
    const completedSet = new Set(progressoData.filter(p => p.status === 'concluido').map(p => p.id_passo));
    let previousEtapaCompleted = true;

    const etapasAtualizadas = etapaArr.map((et) => {
      const passosAtualizados = et.passos.map((p) => {
        const progress = progressoData.find(px => px.id_passo === p.id) || null;
        return {
          ...p,
          completed: completedSet.has(p.id),
          completedDate: progress?.data_conclusao,
          progress,
        };
      });
      const allDone = passosAtualizados.length > 0 && passosAtualizados.every(p => p.completed);
      
      let isLocked = false;
      let lockReason = null;

      if (!previousEtapaCompleted) {
        isLocked = true;
        lockReason = 'Conclua a etapa anterior para liberar esta.';
      } else if (et.escola_pre_requisito_id && !completedSchools.has(et.escola_pre_requisito_id)) {
        isLocked = true;
        lockReason = `Você precisa concluir a escola associada para liberar esta etapa.`;
      }

      previousEtapaCompleted = allDone;

      return { ...et, passos: passosAtualizados, allPassosCompleted: allDone, isLocked, lockReason };
    });

    setEtapas(etapasAtualizadas);

    // 6) Estatísticas
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

    const passo = etapas.flatMap(e => e.passos).find(p => p.id === passoId);
    if (!passo) {
      toast.error('Passo não encontrado.');
      return;
    }

    const { data: existingProgress } = await supabase
      .from('progresso_membros')
      .select('*')
      .eq('id_membro', user.id)
      .eq('id_passo', passoId)
      .maybeSingle();

    let isCompleted = true;
    let progressData: Partial<ProgressoMembro> = {
      status: 'pendente',
      data_conclusao: null,
      respostas_quiz: quizDetails || null,
      pontuacao_quiz: quizDetails?.score,
      tentativas_quiz: (existingProgress?.tentativas_quiz || 0),
      quiz_bloqueado: existingProgress?.quiz_bloqueado || false,
    };

    if (passo.tipo_passo === 'quiz') {
      progressData.tentativas_quiz!++;
      const score = quizDetails?.score || 0;
      const requiredScore = passo.nota_de_corte_quiz || 70;

      if (score >= requiredScore) {
        progressData.status = 'concluido';
        progressData.data_conclusao = new Date().toISOString();
        toast.success(`Parabéns! Você passou com ${score.toFixed(0)}%`);
      } else {
        isCompleted = false;
        const maxAttempts = 3;
        if (progressData.tentativas_quiz! >= maxAttempts) {
          progressData.quiz_bloqueado = true;
          toast.error(`Você não atingiu a nota mínima (${requiredScore}%) após ${maxAttempts} tentativas. Peça a um líder para liberar seu acesso.`);
        } else {
          toast.warning(`Você não atingiu a nota mínima (${requiredScore}%). Tente novamente!`);
        }
      }
    } else {
      progressData.status = 'concluido';
      progressData.data_conclusao = new Date().toISOString();
    }

    if (existingProgress) {
      await supabase
        .from('progresso_membros')
        .update(progressData as any)
        .eq('id', existingProgress.id);
    } else {
      await supabase
        .from('progresso_membros')
        .insert({
          id_membro: user.id,
          id_passo: passoId,
          id_igreja: currentChurchId,
          ...progressData,
        } as any);
    }

    if (isCompleted && passo.tipo_passo !== 'quiz') {
      toast.success('Passo concluído com sucesso!');
    }
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