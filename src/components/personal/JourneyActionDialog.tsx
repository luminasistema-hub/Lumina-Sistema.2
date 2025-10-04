import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Progress } from '../ui/progress';
import { toast } from 'sonner';
import { Check, ChevronsRight, ExternalLink, X } from 'lucide-react';
import DescricaoFormatada from '../utils/DescricaoFormatada';
import { PassoEtapa } from '../../hooks/useJourneyData';

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
    toast.success(`Você acertou ${correctAnswers} de ${questions.length}!`);
    onQuizComplete({ score: finalScore, answers });
  };

  const allAnswered = Object.keys(answers).length === questions.length;

  return (
    <div className="space-y-6">
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
          <p className="text-2xl font-semibold">{score.toFixed(0)}%</p>
          <Progress value={score} className="mt-2" />
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

      default:
        return <p>Tipo de passo não reconhecido.</p>;
    }
  };

  const handleComplete = () => {
    onCompletePasso(passo.id, quizDetails);
  };

  const isQuiz = passo.tipo_passo === 'quiz';
  const canComplete = !isQuiz || (isQuiz && quizDetails !== null);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{passo.titulo}</DialogTitle>
          <DialogDescription>Complete a tarefa abaixo para avançar na sua jornada.</DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto p-1 pr-4">
          {renderContent()}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Fechar</Button>
          <Button onClick={handleComplete} disabled={!canComplete}>
            <Check className="w-4 h-4 mr-2" />
            Marcar como Concluído
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JourneyActionDialog;