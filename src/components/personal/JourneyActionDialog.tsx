import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Video, BookOpen, Link, CheckCircle, X, HelpCircle, ArrowRight, ArrowLeft, Star } from 'lucide-react';
import { toast } from 'sonner';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Progress } from '../ui/progress';
import { Card, CardContent } from '../ui/card';

interface QuizPergunta {
  id?: string;
  ordem: number;
  pergunta_texto: string;
  opcoes: string[];
  resposta_correta: number; // Índice da opção correta (0-based)
  pontuacao: number;
}

interface PassoEtapa {
  id: string;
  id_etapa: string;
  ordem: number;
  titulo: string;
  tipo_passo: 'video' | 'quiz' | 'leitura' | 'acao' | 'link_externo';
  conteudo?: string;
  quiz_perguntas?: QuizPergunta[];
}

interface JourneyActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  passo: PassoEtapa | null;
  onCompletePasso: (passoId: string) => void;
}

const JourneyActionDialog: React.FC<JourneyActionDialogProps> = ({ isOpen, onClose, passo, onCompletePasso }) => {
  const [currentQuizQuestionIndex, setCurrentQuizQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number | null>>({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [showQuizResults, setShowQuizResults] = useState(false);

  useEffect(() => {
    if (isOpen && passo?.tipo_passo === 'quiz') {
      // Reset quiz state when dialog opens for a quiz
      setCurrentQuizQuestionIndex(0);
      setSelectedAnswers({});
      setQuizCompleted(false);
      setQuizScore(0);
      setShowQuizResults(false);
    }
  }, [isOpen, passo]);

  if (!passo) return null;

  const getYouTubeVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    const match = url.match(regex)
    return match ? match[1] : null
  }

  const handleAnswerSelection = (questionIndex: number, optionIndex: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  };

  const handleNextQuestion = () => {
    if (passo.quiz_perguntas && currentQuizQuestionIndex < passo.quiz_perguntas.length - 1) {
      setCurrentQuizQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuizQuestionIndex > 0) {
      setCurrentQuizQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitQuiz = () => {
    if (!passo.quiz_perguntas) return;

    let score = 0;
    passo.quiz_perguntas.forEach((q, index) => {
      if (selectedAnswers[index] === q.resposta_correta) {
        score += q.pontuacao;
      }
    });

    setQuizScore(score);
    setQuizCompleted(true);
    setShowQuizResults(true);
    toast.success('Quiz concluído! Veja seus resultados.');
  };

  const handleRetakeQuiz = () => {
    setCurrentQuizQuestionIndex(0);
    setSelectedAnswers({});
    setQuizCompleted(false);
    setQuizScore(0);
    setShowQuizResults(false);
  };

  const renderQuizContent = () => {
    if (!passo.quiz_perguntas || passo.quiz_perguntas.length === 0) {
      return (
        <div className="text-center py-4">
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Quiz: {passo.titulo}</h3>
          <p className="text-gray-600 mb-4">
            Este quiz ainda não possui perguntas cadastradas.
          </p>
        </div>
      );
    }

    const currentQuestion = passo.quiz_perguntas[currentQuizQuestionIndex];
    const totalQuestions = passo.quiz_perguntas.length;
    const progress = ((currentQuizQuestionIndex + 1) / totalQuestions) * 100;
    const canProceed = selectedAnswers[currentQuizQuestionIndex] !== undefined && selectedAnswers[currentQuizQuestionIndex] !== null;

    if (showQuizResults) {
      const maxPossibleScore = passo.quiz_perguntas.reduce((sum, q) => sum + q.pontuacao, 0);
      const percentageScore = (quizScore / maxPossibleScore) * 100;

      return (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Resultados do Quiz: {passo.titulo}</h3>
            <p className="text-lg text-gray-700">Sua pontuação: <span className="font-bold text-blue-600">{quizScore} de {maxPossibleScore}</span></p>
            <p className={`text-xl font-bold ${percentageScore >= 70 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.round(percentageScore)}% de acerto
            </p>
          </div>

          <div className="space-y-4">
            {passo.quiz_perguntas.map((q, qIndex) => {
              const userAnswer = selectedAnswers[qIndex];
              const isCorrect = userAnswer === q.resposta_correta;
              return (
                <Card key={qIndex} className={`border-l-4 ${isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                  <CardContent className="p-4">
                    <p className="font-semibold text-gray-900 mb-2">{qIndex + 1}. {q.pergunta_texto}</p>
                    <ul className="space-y-1">
                      {q.opcoes.map((option, oIndex) => (
                        <li key={oIndex} className={`text-sm ${oIndex === q.resposta_correta ? 'font-bold text-green-700' : ''} ${userAnswer === oIndex && !isCorrect ? 'text-red-700 line-through' : ''}`}>
                          {oIndex === userAnswer && <Star className="inline-block w-3 h-3 mr-1 text-yellow-500 fill-current" />}
                          {option}
                          {oIndex === q.resposta_correta && <span className="ml-2 text-xs text-green-600">(Correta)</span>}
                        </li>
                      ))}
                    </ul>
                    {!isCorrect && userAnswer !== null && (
                      <p className="text-xs text-red-600 mt-2">Sua resposta: {q.opcoes[userAnswer!]}</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex justify-center gap-4 mt-6">
            <Button variant="outline" onClick={handleRetakeQuiz}>
              Refazer Quiz
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Quiz: {passo.titulo}</h3>
            <p className="text-gray-600">Pergunta {currentQuizQuestionIndex + 1} de {totalQuestions}</p>
          </div>
          <Progress value={progress} className="w-32 h-2" />
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6">
            <h4 className="text-lg font-semibold mb-4">{currentQuestion.pergunta_texto}</h4>
            <RadioGroup
              value={selectedAnswers[currentQuizQuestionIndex]?.toString() || ""}
              onValueChange={(value) => handleAnswerSelection(currentQuizQuestionIndex, parseInt(value))}
              className="space-y-3"
            >
              {currentQuestion.opcoes.map((option, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-base">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePreviousQuestion}
            disabled={currentQuizQuestionIndex === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
          <Button
            onClick={currentQuizQuestionIndex === totalQuestions - 1 ? handleSubmitQuiz : handleNextQuestion}
            disabled={!canProceed}
            className="bg-purple-500 hover:bg-purple-600"
          >
            {currentQuizQuestionIndex === totalQuestions - 1 ? 'Finalizar Quiz' : 'Próxima'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (passo.tipo_passo) {
      case 'video':
        const videoId = passo.conteudo ? getYouTubeVideoId(passo.conteudo) : null;
        if (videoId) {
          return (
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}`}
                title={passo.titulo}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          );
        }
        return <p className="text-red-500">URL de vídeo inválida ou não fornecida.</p>;
      case 'leitura':
      case 'acao':
        return (
          <div className="prose prose-lg max-w-none">
            <p>{passo.conteudo || 'Nenhum conteúdo de leitura/ação fornecido para este passo.'}</p>
          </div>
        );
      case 'link_externo':
        return (
          <div className="text-center">
            <p className="mb-4">Clique no botão abaixo para acessar o recurso externo:</p>
            <Button asChild>
              <a href={passo.conteudo} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                <Link className="w-4 h-4 mr-2" />
                Acessar Link Externo
              </a>
            </Button>
          </div>
        );
      case 'quiz':
        return renderQuizContent();
      default:
        return <p>Tipo de conteúdo não suportado.</p>;
    }
  };

  const handleCompleteClick = () => {
    onCompletePasso(passo.id);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {passo.tipo_passo === 'video' && <Video className="w-5 h-5 text-red-500" />}
            {passo.tipo_passo === 'leitura' && <BookOpen className="w-5 h-5 text-blue-500" />}
            {passo.tipo_passo === 'acao' && <CheckCircle className="w-5 h-5 text-green-500" />}
            {passo.tipo_passo === 'link_externo' && <Link className="w-5 h-5 text-indigo-500" />}
            {passo.tipo_passo === 'quiz' && <HelpCircle className="w-5 h-5 text-purple-500" />}
            {passo.titulo}
          </DialogTitle>
          <DialogDescription>
            Conteúdo para o passo da sua jornada espiritual.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {renderContent()}
        </div>

        <DialogFooter className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button 
            onClick={handleCompleteClick} 
            className="bg-green-500 hover:bg-green-600"
            disabled={passo.tipo_passo === 'quiz' && !quizCompleted} // Disable if quiz not completed
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Marcar como Concluído
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JourneyActionDialog;