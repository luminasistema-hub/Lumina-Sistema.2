import { useState, useEffect } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { toast } from 'sonner' 
import { supabase } from '../../integrations/supabase/client' 
import { 
  Heart, 
  Droplets, 
  BookOpen, 
  Users, 
  Crown,
  CheckCircle,
  Circle,
  ArrowRight,
  Calendar,
  Award,
  Target
} from 'lucide-react'
import DescricaoFormatada from '../utils/DescricaoFormatada'; // Importar o novo componente

// Interfaces para os dados do Supabase
interface TrilhaCrescimento {
  id: string;
  id_igreja: string;
  titulo: string;
  descricao: string;
  is_ativa: boolean;
}

interface EtapaTrilha {
  id: string;
  id_trilha: string;
  ordem: number;
  titulo: string;
  descricao: string;
  tipo_conteudo: string;
  conteudo: string;
  cor: string;
}

interface ProgressoMembro {
  id: string;
  id_membro: string;
  id_etapa: string;
  status: 'pendente' | 'concluido';
  data_conclusao?: string;
}

// A estrutura final que será usada para renderizar
interface JourneyStepDisplay extends EtapaTrilha {
  completed: boolean;
  completedDate?: string;
  requirements?: string[]; // Mocked for now, could come from DB
  nextSteps?: string[]; // Mocked for now, could come from DB
  icon: React.ReactNode; // Derived from type or title
  color: string; // Derived
  bgColor: string; // Derived
}

const MemberJourney = () => {
  const { user, currentChurchId } = useAuthStore() 
  const [currentStep, setCurrentStep] = useState<'intro' | 'journey'>('intro') // Alterado para 'journey'
  const [etapas, setEtapas] = useState<EtapaTrilha[]>([])
  const [progresso, setProgresso] = useState<ProgressoMembro[]>([])
  const [loading, setLoading] = useState(true)
  const [overallProgress, setOverallProgress] = useState(0)
  const [currentLevel, setCurrentLevel] = useState(0)

  // Funções auxiliares para ícones e cores (mantidas do mock, podem ser ajustadas)
  const getStepIcon = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('decisão') || lowerTitle.includes('fé')) return <Heart className="w-6 h-6" />;
    if (lowerTitle.includes('frequência') || lowerTitle.includes('culto')) return <Calendar className="w-6 h-6" />;
    if (lowerTitle.includes('batismo')) return <Droplets className="w-6 h-6" />;
    if (lowerTitle.includes('discipulado') || lowerTitle.includes('estudo')) return <BookOpen className="w-6 h-6" />;
    if (lowerTitle.includes('ministério') || lowerTitle.includes('serviço')) return <Users className="w-6 h-6" />;
    if (lowerTitle.includes('liderança')) return <Crown className="w-6 h-6" />;
    return <Circle className="w-6 h-6" />;
  };

  const getStepColorAndBg = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('decisão') || lowerTitle.includes('fé')) return { color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' };
    if (lowerTitle.includes('frequência') || lowerTitle.includes('culto')) return { color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' };
    if (lowerTitle.includes('batismo')) return { color: 'text-cyan-600', bgColor: 'bg-cyan-50 border-cyan-200' };
    if (lowerTitle.includes('discipulado') || lowerTitle.includes('estudo')) return { color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' };
    if (lowerTitle.includes('ministério') || lowerTitle.includes('serviço')) return { color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200' };
    if (lowerTitle.includes('liderança')) return { color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-200' };
    return { color: 'text-gray-600', bgColor: 'bg-gray-50 border-gray-200' };
  };

  useEffect(() => {
    const loadJourneyData = async () => {
      if (!user?.id || !currentChurchId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      console.log('MemberJourney: Loading journey data for user:', user.id, 'church:', currentChurchId);

      try {
        // 1. Buscar a trilha de crescimento da igreja
        const { data: trilhaData, error: trilhaError } = await supabase
          .from('trilhas_crescimento')
          .select('id, titulo, descricao')
          .eq('id_igreja', currentChurchId)
          .eq('is_ativa', true)
          .single();

        if (trilhaError && trilhaError.code !== 'PGRST116') { // PGRST116 = No rows found
          console.error('MemberJourney: Error loading trilha_crescimento:', trilhaError);
          toast.error('Erro ao carregar a trilha de crescimento da igreja.');
          setLoading(false);
          return;
        }

        if (!trilhaData) {
          console.log('MemberJourney: No active journey found for this church.');
          setEtapas([]);
          setProgresso([]);
          setLoading(false);
          return;
        }

        const trilhaId = trilhaData.id;

        // 2. Buscar as etapas da trilha
        const { data: etapasData, error: etapasDataError } = await supabase
          .from('etapas_trilha')
          .select('*')
          .eq('id_trilha', trilhaId)
          .order('ordem', { ascending: true });

        if (etapasDataError) {
          console.error('MemberJourney: Error loading etapas_trilha:', etapasDataError);
          toast.error('Erro ao carregar as etapas da trilha.');
          setLoading(false);
          return;
        }
        setEtapas(etapasData || []);

        // 3. Buscar o progresso do membro para essas etapas
        const etapaIds = (etapasData || []).map(etapa => etapa.id);
        const { data: progressoData, error: progressoError } = await supabase
          .from('progresso_membros')
          .select('*')
          .eq('id_membro', user.id)
          .in('id_etapa', etapaIds);

        if (progressoError) {
          console.error('MemberJourney: Error loading progresso_membros:', progressoError);
          toast.error('Erro ao carregar seu progresso na jornada.');
          setLoading(false);
          return;
        }
        setProgresso(progressoData || []);

      } catch (error) {
        console.error('MemberJourney: Unexpected error during data loading:', error);
        toast.error('Ocorreu um erro inesperado ao carregar a jornada.');
      } finally {
        setLoading(false);
      }
    };

    loadJourneyData();
  }, [user?.id, currentChurchId]);

  useEffect(() => {
    if (!loading && etapas.length > 0) {
      const completedStepsCount = progresso.filter(p => p.status === 'concluido').length;
      const totalSteps = etapas.length;
      const progressPercentage = (completedStepsCount / totalSteps) * 100;
      
      setOverallProgress(progressPercentage);
      setCurrentLevel(completedStepsCount);
      setCurrentStep('journey'); // Mudar para a visualização da jornada após carregar
    } else if (!loading && etapas.length === 0) {
      setCurrentStep('intro'); // Se não houver etapas, volta para a introdução ou exibe mensagem
    }
  }, [etapas, progresso, loading]);

  const markStepCompleted = async (etapaId: string) => {
    if (!user?.id || !currentChurchId) {
      toast.error('Erro: Usuário ou igreja não identificados.');
      return;
    }

    setLoading(true);
    try {
      // Verificar se já existe um registro de progresso para esta etapa
      const existingProgress = progresso.find(p => p.id_etapa === etapaId && p.id_membro === user.id);

      if (existingProgress) {
        // Atualizar o registro existente
        const { error } = await supabase
          .from('progresso_membros')
          .update({ status: 'concluido', data_conclusao: new Date().toISOString() })
          .eq('id', existingProgress.id);

        if (error) {
          console.error('MemberJourney: Error updating progress:', error);
          toast.error('Erro ao atualizar o progresso da etapa.');
          return;
        }
      } else {
        // Inserir um novo registro
        const { error } = await supabase
          .from('progresso_membros')
          .insert({
            id_membro: user.id,
            id_etapa: etapaId,
            status: 'concluido',
            data_conclusao: new Date().toISOString(),
          });

        if (error) {
          console.error('MemberJourney: Error inserting new progress:', error);
          toast.error('Erro ao registrar o progresso da etapa.');
          return;
        }
      }

      // Re-fetch para atualizar o estado local
      const { data: updatedProgresso, error: fetchError } = await supabase
        .from('progresso_membros')
        .select('*')
        .eq('id_membro', user.id)
        .in('id_etapa', etapas.map(e => e.id));

      if (fetchError) {
        console.error('MemberJourney: Error re-fetching progress after update:', fetchError);
        toast.error('Progresso atualizado, mas houve um erro ao recarregar os dados.');
      } else {
        setProgresso(updatedProgresso || []);
        toast.success('Etapa marcada como concluída!');
      }

    } catch (error) {
      console.error('MemberJourney: Unexpected error marking step completed:', error);
      toast.error('Ocorreu um erro inesperado ao marcar a etapa.');
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = () => {
    if (overallProgress < 33) return 'bg-red-500'
    if (overallProgress < 66) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getLevelTitle = () => {
    if (currentLevel === 0) return 'Iniciante na Fé';
    if (currentLevel <= 1) return 'Novo na Fé';
    if (currentLevel <= 3) return 'Membro Comprometido';
    if (currentLevel <= 4) return 'Servo Ativo';
    return 'Líder em Desenvolvimento';
  }

  const getLevelDescription = () => {
    if (currentLevel === 0) return 'Comece sua jornada espiritual agora!';
    if (currentLevel <= 1) return 'Você está começando sua jornada cristã. Continue firme!';
    if (currentLevel <= 3) return 'Você demonstra compromisso com sua fé e igreja.';
    if (currentLevel <= 4) return 'Você está servindo ativamente no Reino de Deus.';
    return 'Você está se desenvolvendo como líder cristão.';
  }

  if (!currentChurchId) {
    return (
      <div className="p-6 text-center text-gray-600">
        Selecione uma igreja para visualizar sua jornada espiritual.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="ml-4 text-lg text-gray-600">Carregando sua jornada espiritual...</p>
      </div>
    );
  }

  // Mapear etapas do banco de dados para o formato de exibição
  const journeyStepsDisplay: JourneyStepDisplay[] = etapas.map(etapa => {
    const memberProgress = progresso.find(p => p.id_etapa === etapa.id);
    const { color, bgColor } = getStepColorAndBg(etapa.titulo);
    return {
      ...etapa,
      completed: memberProgress?.status === 'concluido',
      completedDate: memberProgress?.data_conclusao,
      icon: getStepIcon(etapa.titulo),
      color,
      bgColor,
      // Mocked requirements and nextSteps for now, as they are not in DB schema
      requirements: ['Requisito 1', 'Requisito 2'], 
      nextSteps: ['Próximo passo 1', 'Próximo passo 2']
    };
  });

  if (currentStep === 'intro' || journeyStepsDisplay.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">Jornada do Membro 🎯</h1>
          <p className="text-blue-100 text-lg">
            Acompanhe seu crescimento espiritual e ministerial
          </p>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Target className="w-6 h-6" />
              Comece Sua Jornada!
            </CardTitle>
            <CardDescription className="text-base">
              Parece que sua igreja ainda não configurou uma trilha de crescimento, ou você ainda não iniciou a sua.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-gray-700 text-lg leading-relaxed">
              A jornada do membro é um caminho de crescimento espiritual e desenvolvimento ministerial,
              desenhado para te ajudar a aprofundar sua fé e descobrir seu propósito no Reino de Deus.
            </p>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">O que esperar da sua jornada:</h4>
              <ul className="space-y-2 text-blue-800 text-sm">
                <li>• Passos claros para o crescimento espiritual</li>
                <li>• Descoberta de dons e talentos</li>
                <li>• Integração e serviço nos ministérios</li>
                <li>• Desenvolvimento de liderança</li>
              </ul>
            </div>
            <div className="text-center">
              <Button 
                onClick={() => toast.info('Aguarde a configuração da trilha pela sua igreja ou inicie a sua!')}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 text-lg px-8 py-3"
              >
                Entendi!
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Jornada do Membro 🎯</h1>
        <p className="text-blue-100 text-lg">
          Acompanhe seu crescimento espiritual e ministerial
        </p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Seu Nível Atual</CardTitle>
              <CardDescription className="text-lg mt-1">{getLevelDescription()}</CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{currentLevel}/{etapas.length}</div>
              <Badge className={`${getProgressColor()} text-white text-sm px-3 py-1`}>
                {getLevelTitle()}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Progresso Geral</span>
              <span className="font-medium">{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
            <p className="text-sm text-gray-600">
              {currentLevel} de {etapas.length} etapas concluídas
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Etapas da Jornada</h2>
        
        {journeyStepsDisplay.map((step, index) => (
          <Card 
            key={step.id} 
            className={`relative ${step.bgColor} ${step.completed ? 'ring-2 ring-green-200' : ''}`}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full ${step.completed ? 'bg-green-100' : 'bg-white'} border-2 ${step.completed ? 'border-green-500' : 'border-gray-300'} flex items-center justify-center ${step.color}`}>
                    {step.completed ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  {index < journeyStepsDisplay.length - 1 && (
                    <div className={`w-0.5 h-16 mt-2 ${step.completed ? 'bg-green-300' : 'bg-gray-300'}`}></div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{step.titulo}</h3>
                    <div className="flex items-center gap-2">
                      {step.completed && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Concluído
                        </Badge>
                      )}
                      {step.completedDate && (
                        <Badge variant="outline" className="text-xs">
                          {new Date(step.completedDate).toLocaleDateString('pt-BR')}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <DescricaoFormatada texto={step.descricao} /> {/* Usando o novo componente */}

                  {step.requirements && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">Requisitos:</h4>
                      <ul className="space-y-1">
                        {step.requirements.map((req, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {step.nextSteps && !step.completed && (
                    <div className="bg-white/70 rounded-lg p-4 border border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Próximos Passos:
                      </h4>
                      <ul className="space-y-1">
                        {step.nextSteps.map((nextStep, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                            <ArrowRight className="w-3 h-3 text-blue-500" />
                            {nextStep}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" className="bg-blue-500 hover:bg-blue-600">
                          Começar Agora
                        </Button>
                        {!step.completed && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => markStepCompleted(step.id)}
                          >
                            Marcar como Concluído
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {step.completed && (
                    <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                      <div className="flex items-center gap-2 text-green-800">
                        <Award className="w-4 h-4" />
                        <span className="text-sm font-medium">Parabéns! Você concluiu esta etapa da sua jornada cristã.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Continue Crescendo! 🌱</h3>
            <p className="text-gray-700 mb-4">
              Cada passo na sua jornada espiritual é importante. Deus tem um plano maravilhoso para sua vida e ministério.
            </p>
            <div className="flex justify-center gap-3">
              <Button className="bg-green-500 hover:bg-green-600">
                Ver Cursos Disponíveis
              </Button>
              <Button variant="outline">
                Conversar com um Líder
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default MemberJourney