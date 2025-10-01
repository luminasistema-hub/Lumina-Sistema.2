import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Lesson } from '@/types/course'
import { AspectRatio } from '@/components/ui/aspect-ratio'

interface LessonViewerDialogProps {
  lesson: Lesson | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getYouTubeEmbedUrl = (url: string) => {
  if (!url) return null;
  let videoId = '';
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'youtu.be') {
      videoId = urlObj.pathname.slice(1);
    } else if (urlObj.hostname.includes('youtube.com')) {
      videoId = urlObj.searchParams.get('v') || '';
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  } catch (error) {
    return null;
  }
};

export const LessonViewerDialog = ({ lesson, open, onOpenChange }: LessonViewerDialogProps) => {
  if (!lesson) return null;

  const videoUrl = lesson.tipo === 'Video' ? getYouTubeEmbedUrl(lesson.conteudo || '') : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{lesson.titulo}</DialogTitle>
          <DialogDescription>Tipo: {lesson.tipo}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {lesson.tipo === 'Video' && videoUrl && (
            <AspectRatio ratio={16 / 9}>
              <iframe
                className="w-full h-full rounded-lg"
                src={videoUrl}
                title={lesson.titulo}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </AspectRatio>
          )}
          {lesson.tipo === 'Texto' && (
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: lesson.conteudo || '' }} />
          )}
          {lesson.tipo === 'Quiz' && (
            <p className="text-center text-muted-foreground py-8">O recurso de Quiz estará disponível em breve!</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}