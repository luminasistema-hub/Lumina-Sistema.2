import { useState } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { toast } from 'sonner' 
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
import DescricaoFormatada from '../utils/DescricaoFormatada';
import JourneyActionDialog from './JourneyActionDialog';
import { useJourneyData, PassoEtapa } from '../../hooks/useJourneyData';

const MemberJourney = () => {
  const { user, currentChurchId } = useAuthStore();
  const {
    loading,
    etapas,
    overallProgress,
    completedSteps,
    totalSteps,
    currentLevel,
    trilhaInfo,
    markPassoCompleted,
  } = useJourneyData();

  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [currentActionPasso, setCurrentActionPasso] = useState<PassoEtapa | null>(null);

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

  const findNextUncompletedPasso = (): PassoEtapa | null => {
    for (const etapa of etapas) {
      for (const passo of etapa.passos) {
        if (!passo.completed) {
          return passo;
        }
      }
    }
    return null;
  };

  const nextUncompletedPasso = findNextUncompletedPasso();

  const handleOpenActionDialog = (passo: PassoEtapa) => {
    setCurrentActionPasso(passo);
    setIsActionDialogOpen(true);
  };

  const handleCompleteAndClose = async (passoId: string, quizDetails?: any) => {
    setIsActionDialogOpen(false);
    await markPassoCompleted(passoId, quizDetails);
  };

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

  if (!trilhaInfo) {
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
              Parece que sua igreja ainda não configurou uma trilha de crescimento.
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
                onClick={() => toast.info('Aguarde a configuração da trilha pelo administrador da sua igreja.')}
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
        <h1 className="text-3xl font-bold mb-2">{trilhaInfo.titulo} 🎯</h1>
        <p className="text-blue-100 text-lg">
          {trilhaInfo.descricao}
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
              {completedSteps} de {totalSteps} passos concluídos
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Etapas da Jornada</h2>
        
        {etapas.map((etapa, index) => {
          const { color, bgColor } = getStepColorAndBg(etapa.titulo);
          const isEtapaCompleted = etapa.allPassosCompleted;

          return (
            <Card 
              key={etapa.id} 
              className={`relative ${bgColor} ${isEtapaCompleted ? 'ring-2 ring-green-200' : ''}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full ${isEtapaCompleted ? 'bg-green-100' : 'bg-white'} border-2 ${isEtapaCompleted ? 'border-green-500' : 'border-gray-300'} flex items-center justify-center ${color}`}>
                      {isEtapaCompleted ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        getStepIcon(etapa.titulo)
                      )}
                    </div>
                    {index < etapas.length - 1 && (
                      <div className={`w-0.5 h-16 mt-2 ${isEtapaCompleted ? 'bg-green-300' : 'bg-gray-300'}`}></div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{etapa.ordem}. {etapa.titulo}</h3>
                      <div className="flex items-center gap-2">
                        {isEtapaCompleted && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Concluído
                          </Badge>
                        )}
                      </div>
                    </div>

                    <DescricaoFormatada texto={etapa.descricao} />

                    <div className="mt-4 space-y-3">
                      <h4 className="font-medium text-gray-900 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        Passos desta Etapa:
                      </h4>
                      {etapa.passos.length > 0 ? (
                        <ul className="space-y-2">
                          {etapa.passos.map((passo) => (
                            <li key={passo.id} className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm">
                              <div className="flex items-center gap-3">
                                {passo.completed ? (
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : (
                                  <Circle className="w-5 h-5 text-gray-400" />
                                )}
                                <div>
                                  <p className={`font-medium ${passo.completed ? 'text-gray-600 line-through' : 'text-gray-900'}`}>
                                    {passo.titulo}
                                  </p>
                                  {passo.completedDate && (
                                    <p className="text-xs text-gray-500">
                                      Concluído em {new Date(passo.completedDate).toLocaleDateString('pt-BR')}
                                    </p>
                                  )}
                                </div>
                              </div>
                              {!passo.completed && (
                                <Button 
                                  size="sm" 
                                  onClick={() => handleOpenActionDialog(passo)}
                                >
                                  Começar Agora
                                </Button>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500 italic">Nenhum passo configurado para esta etapa.</p>
                      )}
                    </div>

                    {isEtapaCompleted && (
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200 mt-4">
                        <div className="flex items-center gap-2 text-green-800">
                          <Award className="w-4 h-4" />
                          <span className="text-sm font-medium">Parabéns! Você concluiu todos os passos desta etapa.</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Continue Crescendo! 🌱</h3>
            <p className="text-gray-700 mb-4">
              Cada passo na sua jornada espiritual é importante. Deus tem um plano maravilhoso para sua vida e ministério.
            </p>
            <div className="flex justify-center gap-3">
              {nextUncompletedPasso ? (
                <Button 
                  className="bg-green-500 hover:bg-green-600"
                  onClick={() => handleOpenActionDialog(nextUncompletedPasso)}
                >
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Continuar Jornada
                </Button>
              ) : (
                <Button className="bg-green-500 hover:bg-green-600" disabled>
                  Jornada Concluída!
                </Button>
              )}
              <Button variant="outline">
                Conversar com um Líder
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <JourneyActionDialog
        isOpen={isActionDialogOpen}
        onClose={() => setIsActionDialogOpen(false)}
        passo={currentActionPasso}
        onCompletePasso={handleCompleteAndClose}
      />
    </div>
  )
}

export default MemberJourney