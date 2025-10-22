import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../integrations/supabase/client';
import { useAuthStore } from '../stores/authStore';
import { toast } from 'sonner';
import { useEffect } from 'react';

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
  tipo_passo: 'video' | 'quiz' | 'leitura' | 'acao' | 'link_externo' | 'conclusao_escola';
  conteudo?: string;
  created_at?: string;
  quiz_perguntas?: QuizPergunta[];
  nota_de_corte_quiz?: number;
  escola_pre_requisito_id?: string | null;
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
  tentativas_quiz?: number;
  pontuacao_quiz?: number;
  quiz_bloqueado?: boolean;
}

export interface JourneyPassoDisplay extends PassoEtapa {
  completed: boolean;
  completedDate?: string;
  progress?: ProgressoMembro | null;
  isLocked: boolean;
  lockReason: string | null;
  escola_pre_requisito_nome?: string | null;
}

export interface JourneyEtapaDisplay extends EtapaTrilha {
  passos: JourneyPassoDisplay[];
  allPassosCompleted: boolean;
  isLocked: boolean;
  lockReason: string | null;
}

const fetchJourneyData = async (userId: string | null, churchId: string | null) => {
  if (!userId || !churchId) {
    return {
      etapas: [],
      trilhaInfo: null,
      overallProgress: 0,
      completedSteps: 0,
      totalSteps: 0,
      currentLevel: 0,
    };
  }

  // 1) Carrega trilha/etapas/passos via RPC
  const { data, error } = await supabase.rpc('get_jornada_para_igreja', {
    id_igreja_atual: churchId,
  });

  if (error) {
    console.error('useJourneyData: RPC error', error.message);
    toast.error('Ocorreu um erro ao carregar sua jornada espiritual.');
    throw new Error(error.message);
  }

  const rows = (data || []) as any[];

  if (rows.length === 0) {
    return {
      etapas: [],
      trilhaInfo: null,
      overallProgress: 0,
      completedSteps: 0,
      totalSteps: 0,
      currentLevel: 0,
    };
  }

  // 2) Reconstrói estrutura
  const trilhaMap = new Map<string, { titulo: string; descricao: string }>();
  const etapaMap = new Map<string, JourneyEtapaDisplay>();
  const passosPorEtapa = new Map<string, JourneyPassoDisplay[]>();

  for (const r of rows) {
    const trilhaId = r.trilha_id as string;
    const etapaId = r.etapa_id as string;
    const passoId = r.passo_id as string;

    if (!trilhaMap.has(trilhaId)) {
      trilhaMap.set(trilhaId, {
        titulo: r.trilha_titulo || '',
        descricao: r.trilha_descricao || '',
      });
    }

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
        isLocked: false,
        lockReason: null,
      });
    }

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
      escola_pre_requisito_id: r.escola_pre_requisito_id,
      completed: false,
      progress: null,
      isLocked: false,
      lockReason: null,
    };

    const list = passosPorEtapa.get(etapaId) || [];
    list.push(passo);
    passosPorEtapa.set(etapaId, list);
  }

  const etapaArr: JourneyEtapaDisplay[] = Array.from(etapaMap.values())
    .sort((a, b) => a.ordem - b.ordem)
    .map((et) => {
      const passos = (passosPorEtapa.get(et.id) || []).sort((a, b) => a.ordem - b.ordem);
      return { ...et, passos };
    });

  const firstTrilhaId = rows[0].trilha_id as string;
  const header = trilhaMap.get(firstTrilhaId) || { titulo: 'Jornada do Membro', descricao: '' };
  const trilhaInfo = { id: firstTrilhaId, titulo: header.titulo, descricao: header.descricao };

  // 3) Carrega progresso do usuário
  const passoIds = etapaArr.flatMap((et) => et.passos.map((p) => p.id));
  let progressoData: ProgressoMembro[] = [];
  if (passoIds.length > 0) {
    const { data: progresso, error: progErr } = await supabase
      .from('progresso_membros')
      .select('*')
      .eq('id_membro', userId)
      .in('id_passo', passoIds);
    if (progErr) throw new Error(progErr.message);
    progressoData = progresso as any[];
  }

  // 4) Carrega progresso das escolas
  const schoolPrereqIds = etapaArr.flatMap(e => e.passos).map(p => p.escola_pre_requisito_id).filter(Boolean) as string[];
  const completedSchools = new Set<string>();
  const schoolNames = new Map<string, string>();
  if (schoolPrereqIds.length > 0) {
    const { data: schoolsData } = await supabase.from('escolas').select('id, nome').in('id', schoolPrereqIds);
    (schoolsData || []).forEach(s => schoolNames.set(s.id, s.nome));

    const { data: schoolLessons } = await supabase.from('escola_aulas').select('id, escola_id').in('escola_id', schoolPrereqIds);
    const { data: userSchoolProgress } = await supabase.from('escola_progresso_aulas').select('aula_id').eq('membro_id', userId);

    if (schoolLessons && userSchoolProgress) {
      const userCompletedLessons = new Set(userSchoolProgress.map(p => p.aula_id));
      for (const schoolId of schoolPrereqIds) {
        const lessonsForSchool = schoolLessons.filter(l => l.escola_id === schoolId);
        if (lessonsForSchool.length > 0 && lessonsForSchool.every(l => userCompletedLessons.has(l.id))) {
          completedSchools.add(schoolId);
        }
      }
    }
  }

  // Auto-complete steps
  const stepsToAutoComplete = etapaArr
    .flatMap(e => e.passos)
    .filter(p => 
      p.escola_pre_requisito_id && 
      p.tipo_passo === 'conclusao_escola' &&
      completedSchools.has(p.escola_pre_requisito_id) &&
      !progressoData.some(prog => prog.id_passo === p.id && prog.status === 'concluido')
    )
    .map(p => p.id);

  if (stepsToAutoComplete.length > 0) {
    const recordsToUpsert = stepsToAutoComplete.map(passoId => ({
      id_membro: userId,
      id_passo: passoId,
      id_igreja: churchId,
      status: 'concluido' as const,
      data_conclusao: new Date().toISOString(),
    }));

    const { error: autoCompleteError } = await supabase
      .from('progresso_membros')
      .upsert(recordsToUpsert, { onConflict: 'id_membro,id_passo' });

    if (!autoCompleteError) {
      const { data: newProgresso } = await supabase
        .from('progresso_membros')
        .select('*')
        .eq('id_membro', userId)
        .in('id_passo', passoIds);
      if (newProgresso) progressoData = newProgresso;
    }
  }

  // 5) Aplica progresso e lógica de bloqueio
  const completedSet = new Set(progressoData.filter(p => p.status === 'concluido').map(p => p.id_passo));
  let previousEtapaCompleted = true;

  const etapasAtualizadas = etapaArr.map((et) => {
    const passosAtualizados = et.passos.map((p) => {
      const progress = progressoData.find(px => px.id_passo === p.id) || null;
      const isCompleted = completedSet.has(p.id);
      
      let isPassoLocked = false;
      let passoLockReason = null;

      if (p.tipo_passo === 'conclusao_escola' && p.escola_pre_requisito_id && !completedSchools.has(p.escola_pre_requisito_id)) {
        isPassoLocked = true;
        passoLockReason = `Você precisa concluir a escola associada para liberar este passo.`;
      }

      return {
        ...p,
        escola_pre_requisito_nome: p.escola_pre_requisito_id ? schoolNames.get(p.escola_pre_requisito_id) : null,
        completed: isCompleted,
        completedDate: progress?.data_conclusao,
        progress,
        isLocked: isPassoLocked,
        lockReason: passoLockReason,
      };
    });
    const allDone = passosAtualizados.length > 0 && passosAtualizados.every(p => p.completed);
    
    let isLocked = !previousEtapaCompleted;
    let lockReason = !previousEtapaCompleted ? 'Conclua a etapa anterior para liberar esta.' : null;

    previousEtapaCompleted = allDone;

    return { ...et, passos: passosAtualizados, allPassosCompleted: allDone, isLocked, lockReason };
  });

  // 6) Estatísticas
  const allPassos = etapasAtualizadas.flatMap((e) => e.passos);
  const completed = allPassos.filter((p) => p.completed).length;
  const total = allPassos.length;
  const overallProgress = total > 0 ? (completed / total) * 100 : 0;
  const currentLevel = etapasAtualizadas.filter(e => e.allPassosCompleted).length;

  return {
    etapas: etapasAtualizadas,
    trilhaInfo,
    overallProgress,
    completedSteps: completed,
    totalSteps: total,
    currentLevel,
  };
};

export const useJourneyData = () => {
  const { user, currentChurchId } = useAuthStore();
  const queryClient = useQueryClient();
  const queryKey = ['journeyData', user?.id, currentChurchId];

  const { data, isLoading, isError } = useQuery({
    queryKey,
    queryFn: () => fetchJourneyData(user?.id, currentChurchId),
    enabled: !!user?.id && !!currentChurchId,
  });

  const markPassoMutation = useMutation({
    mutationFn: async ({ passoId, quizDetails }: { passoId: string; quizDetails?: any }) => {
      if (!user?.id || !currentChurchId) throw new Error('Usuário não identificado.');

      const passo = data?.etapas.flatMap(e => e.passos).find(p => p.id === passoId);
      if (!passo) throw new Error('Passo não encontrado.');

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

      const { error } = existingProgress
        ? await supabase.from('progresso_membros').update(progressData as any).eq('id', existingProgress.id)
        : await supabase.from('progresso_membros').insert({
            id_membro: user.id,
            id_passo: passoId,
            id_igreja: currentChurchId,
            ...progressData,
          } as any);

      if (error) throw error;

      if (isCompleted && passo.tipo_passo !== 'quiz') {
        toast.success('Passo concluído com sucesso!');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar passo: ${error.message}`);
    },
  });

  return {
    loading: isLoading,
    error: isError,
    etapas: data?.etapas || [],
    overallProgress: data?.overallProgress || 0,
    completedSteps: data?.completedSteps || 0,
    totalSteps: data?.totalSteps || 0,
    currentLevel: data?.currentLevel || 0,
    trilhaInfo: data?.trilhaInfo || null,
    markPassoCompleted: markPassoMutation.mutateAsync,
  };
};