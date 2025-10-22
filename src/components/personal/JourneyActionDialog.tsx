import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Progress } from '../ui/progress';
import { toast } from 'sonner';
import { Check, ChevronsRight, ExternalLink, X, Info, Loader2 } from 'lucide-react';
import DescricaoFormatada from '../utils/DescricaoFormatada';
import { PassoEtapa } from '../../hooks/useJourneyData';
import { useUserEnrollments } from '../../hooks/useSchools';

interface JourneyActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  passo: PassoEtapa | null;
  onCompletePasso: (passoId: string, quizDetails?: any) => Promise<void>;
}

const getYoutubeVideoId = (url: string): string | null => {
  if (!url) return null;
  // Suporta várias formas de URL do YouTube
  const shortMatch = url.match(/youtu\.be\/([^#&?]{11})/);
  if (shortMatch) return shortMatch[1];
  const embedMatch = url.match(/youtube\.com\/embed\/([^#&?]{11})/);
  if (embedMatch) return embedMatch[1];
  const vParam = new URL(url, window.location.origin).searchParams.get('v');
  if (vParam && vParam.length === 11) return vParam;
  return null;
};

const isVideoFileUrl = (url: string): boolean => {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(url);
};

const QuizComponent = ({ passo, onQuizComplete }: { passo: PassoEtapa; onQuizComplete: (details: any) => void }) => {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const questions = passo.quiz_perguntas || [];
  const requiredScore = passo.nota_de_corte_quiz || 70;
  const attempts = passo.progress?.tentativas_quiz || 0;
  const maxAttempts = 3;

  const handleAnswerChange = (qIndex: number, oIndex: number) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qIndex]: oIndex }));
  };

  const handleSubmit = () => {
    let correctAnswers = 0;
    questions.forEach((q, index) => {
      if (q.resposta_correta === answers[index]) {
        correctAnswers++;
      }
    });
    const finalScore = (correctAnswers / questions.length) * 100;
    setScore(finalScore);
    setSubmitted(true);
    
    const passed = finalScore >= requiredScore;
    if (passed) {
      toast.success(`Você acertou ${correctAnswers} de ${questions.length}! Pontuação: ${finalScore.toFixed(0)}%`);
    } else {
      toast.warning(`Você acertou ${correctAnswers} de ${questions.length}. Pontuação: ${finalScore.toFixed(0)}%. Mínimo necessário: ${requiredScore}%`);
    }

    onQuizComplete({ score: finalScore, answers, passed });
  };

  const allAnswered = Object.keys(answers).length === questions.length;
  const isBlocked = passo.progress?.quiz_bloqueado || false;

  if (isBlocked) {
    return (
      <div className="text-center p-4 bg-red-100 border border-red-300 rounded-lg">
        <h3 className="text-xl font-bold text-red-800">Quiz Bloqueado</h3>
        <p className="text-red-700 mt-2">
          Você atingiu o número máximo de tentativas. Por favor, entre em contato com um líder da sua igreja para que ele possa revisar seu progresso e liberar um novo acesso.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-center">
        <p className="text-sm text-blue-800">
          Nota mínima para aprovação: <span className="font-bold">{requiredScore}%</span>
        </p>
        <p className="text-xs text-blue-700">
          Tentativas restantes: {Math.max(0, maxAttempts - attempts)}
        </p>
      </div>
      {questions.map((q, qIndex) => (
        <div key={q.id || qIndex} className="p-4 border rounded-lg">
          <p className="font-semibold mb-3">{qIndex + 1}. {q.pergunta_texto}</p>
          <RadioGroup onValueChange={(value) => handleAnswerChange(qIndex, parseInt(value))} disabled={submitted}>
            {q.opcoes.map((option, oIndex) => (
              <div key={oIndex} className={`flex items-center space-x-2 p-2 rounded-md ${submitted ? (q.resposta_correta === oIndex ? 'bg-green-100' : (answers[qIndex] === oIndex ? 'bg-red-100' : '')) : ''}`}>
                <RadioGroupItem value={oIndex.toString()} id={`q${qIndex}o${oIndex}`} />
                <Label htmlFor={`q${qIndex}o${oIndex}`} className="flex-1">{option}</Label>
                {submitted && q.resposta_correta === oIndex && <Check className="w-5 h-5 text-green-600" />}
                {submitted && q.resposta_correta !== oIndex && answers[qIndex] === oIndex && <X className="w-5 h-5 text-red-600" />}
              </div>
            ))}
          </RadioGroup>
        </div>
      ))}
      {!submitted && (
        <Button onClick={handleSubmit} disabled={!allAnswered} className="w-full">
          Enviar Respostas
        </Button>
      )}
      {submitted && (
        <div className="text-center p-4 bg-gray-100 rounded-lg">
          <h3 className="text-xl font-bold">Resultado do Quiz</h3>
          <p className={`text-2xl font-semibold ${score >= requiredScore ? 'text-green-600' : 'text-red-600'}`}>
            {score.toFixed(0)}%
          </p>
          <Progress 
            value={score} 
            className="mt-2" 
            indicatorClassName={score >= requiredScore ? 'bg-green-500' : 'bg-red-500'}
          />
          {score < requiredScore && <p className="text-sm text-red-600 mt-2">Você não atingiu a nota mínima.</p>}
        </div>
      )}
    </div>
  );
};

const SchoolConclusionContent = ({ passo }: { passo: PassoEtapa }) => {
  const navigate = useNavigate();
  const schoolId = passo.escola_pre_requisito_id;
  const schoolName = passo.escola_pre_requisito_nome;

  const { data: enrollments, isLoading: enrollmentsLoading } = useUserEnrollments();

  if (enrollmentsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin" />
        <p className="ml-2">Carregando informações de inscrição...</p>
      </div>
    );
  }

  const enrollment = enrollments?.find(e => e.escola_id === schoolId);

  if (!schoolName) {
    return <p className="text-red-500 text-center">Escola associada a este passo não foi encontrada.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg text-center flex items-center justify-center gap-2">
        <Info className="w-5 h-5 flex-shrink-0" />
        <div>
          <p className="font-semibold">Este passo é concluído automaticamente!</p>
          <p className="text-sm">Finalize a escola "{schoolName}" para que este passo seja marcado como completo.</p>
        </div>
      </div>

      {enrollment ? (
        <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="font-semibold text-green-800">Você está inscrito!</p>
          <p className="text-sm text-green-700">Seu progresso está pendente de conclusão da escola.</p>
          <Button className="mt-4" onClick={() => navigate(`/escolas/${schoolId}`)}>
            Acessar Aulas
          </Button>
        </div>
      ) : (
        <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="font-semibold text-yellow-800">Inscrição necessária</p>
          <p className="text-sm text-yellow-700">Você precisa se inscrever na escola para continuar.</p>
          <Button className="mt-4" onClick={() => navigate('/escolas')}>
            Ver Escolas
          </Button>
        </div>
      )}
    </div>
  );
};

const JourneyActionDialog: React.FC<JourneyActionDialogProps> = ({ isOpen, onClose, passo, onCompletePasso }) => {
  const [quizDetails, setQuizDetails] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) {
      setQuizDetails(null);
    }
  }, [isOpen]);

  if (!passo) return null;

  const hasSchoolPrerequisite = !!passo.escola_pre_requisito_id;
  const videoId = passo.tipo_passo === 'video' ? getYoutubeVideoId(passo.conteudo || '') : null;

  const renderContent = () => {
    switch (passo.tipo_passo) {
      case 'video':
        return (() => {
          const url = passo.conteudo || '';
          const videoId = getYoutubeVideoId(url);
          if (videoId) {
            return (
              <div className="aspect-video">
                <iframe
                  width="100%"
                  height="100%"
                  src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&iv_load_policy=3`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>
            );
          }
          if (isVideoFileUrl(url)) {
            return (
              <video
                src={url}
                controls
                className="w-full rounded-lg"
              />
            );
          }
          // Fallback: tentar embutir o link diretamente
          return url ? (
            <div className="aspect-video">
              <iframe
                width="100%"
                height="100%"
                src={url}
                title="Video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>
          ) : (
            <p>Link de vídeo inválido.</p>
          );
        })();
      
      case 'leitura':
        return <DescricaoFormatada texto={passo.conteudo || 'Nenhum conteúdo de leitura fornecido.'} />;

      case 'quiz':
        return <QuizComponent passo={passo} onQuizComplete={setQuizDetails} />;

      case 'link_externo':
        return (
          <div className="text-center">
            <p className="mb-4">Este passo requer que você acesse um link externo. Clique no botão abaixo para abrir.</p>
            <Button asChild>
              <a href={passo.conteudo} target="_blank" rel="noopener noreferrer">
                Acessar Link <ExternalLink className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </div>
        );

      case 'acao':
        return <p>{passo.conteudo || 'Complete a ação prática descrita.'}</p>;

      case 'conclusao_escola':
        return <SchoolConclusionContent passo={passo} />;

      default:
        return <p>Tipo de passo não reconhecido.</p>;
    }
  };

  const handleComplete = () => {
    onCompletePasso(passo.id, quizDetails);
  };

  const isQuiz = passo.tipo_passo === 'quiz';
  const isBlocked = passo.progress?.quiz_bloqueado || false;
  const canComplete = !isBlocked && (!isQuiz || (isQuiz && quizDetails !== null));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{passo.titulo}</DialogTitle>
          <DialogDescription>Complete a tarefa abaixo para avançar na sua jornada.</DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto p-1 pr-4">
          {hasSchoolPrerequisite && (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg mb-4 text-center flex items-center justify-center gap-2">
              <Info className="w-5 h-5" />
              <div>
                <p className="font-semibold">Este passo é concluído automaticamente!</p>
                <p className="text-sm">Finalize a escola "{passo.escola_pre_requisito_nome || 'associada'}" para que este passo seja marcado como completo.</p>
              </div>
            </div>
          )}
          {renderContent()}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          {!hasSchoolPrerequisite && (
            <Button onClick={handleComplete} disabled={!canComplete}>
              <Check className="w-4 h-4 mr-2" />
              Marcar como Concluído
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JourneyActionDialog;