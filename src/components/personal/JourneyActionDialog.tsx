import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Video, BookOpen, Link, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';

interface QuizPergunta {
  id?: string;
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
  quiz_perguntas?: QuizPergunta[];
}

interface JourneyActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  passo: PassoEtapa | null;
  onCompletePasso: (passoId: string) => void;
}

const JourneyActionDialog: React.FC<JourneyActionDialogProps> = ({ isOpen, onClose, passo, onCompletePasso }) => {
  if (!passo) return null;

  const getYouTubeVideoId = (url: string) => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    const match = url.match(regex)
    return match ? match[1] : null
  }

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
        return (
          <div className="text-center py-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Quiz: {passo.titulo}</h3>
            <p className="text-gray-600 mb-4">
              A funcionalidade de realização de quizzes está em desenvolvimento.
              Em breve você poderá responder às perguntas diretamente aqui!
            </p>
            {passo.quiz_perguntas && passo.quiz_perguntas.length > 0 && (
              <div className="mt-4 text-left border p-4 rounded-lg bg-gray-50">
                <p className="font-medium mb-2">Perguntas cadastradas (apenas visualização):</p>
                {passo.quiz_perguntas.map((q, index) => (
                  <div key={index} className="mb-3">
                    <p className="font-semibold text-sm">{index + 1}. {q.pergunta_texto}</p>
                    <ul className="list-disc list-inside text-xs text-gray-700">
                      {q.opcoes.map((opt, optIndex) => (
                        <li key={optIndex} className={optIndex === q.resposta_correta ? 'font-bold text-green-700' : ''}>
                          {opt} {optIndex === q.resposta_correta && '(Correta)'}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
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
            {passo.tipo_passo === 'quiz' && <X className="w-5 h-5 text-purple-500" />}
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
          <Button onClick={handleCompleteClick} className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="w-4 h-4 mr-2" />
            Marcar como Concluído
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default JourneyActionDialog;