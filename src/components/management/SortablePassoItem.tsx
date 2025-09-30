import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Edit, Trash2, GripVertical, Video, FileText, HelpCircle, Link, CheckCircle, BookOpen } from 'lucide-react';

interface PassoEtapa {
  id: string;
  id_etapa: string;
  ordem: number;
  titulo: string;
  tipo_passo: 'video' | 'quiz' | 'leitura' | 'acao' | 'link_externo';
  conteudo?: string;
  created_at: string;
}

interface SortablePassoItemProps {
  passo: PassoEtapa;
  onEdit: (passo: PassoEtapa) => void;
  onDelete: (passoId: string) => void;
}

export const SortablePassoItem: React.FC<SortablePassoItemProps> = ({ passo, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: passo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    opacity: isDragging ? 0.8 : 1,
  };

  const getPassoIcon = (tipo: PassoEtapa['tipo_passo']) => {
    switch (tipo) {
      case 'video': return <Video className="w-4 h-4 text-red-500" />;
      case 'quiz': return <HelpCircle className="w-4 h-4 text-purple-500" />;
      case 'leitura': return <BookOpen className="w-4 h-4 text-blue-500" />;
      case 'acao': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'link_externo': return <Link className="w-4 h-4 text-indigo-500" />;
      default: return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className="border-0 shadow-sm bg-gray-50 cursor-grab active:cursor-grabbing"
    >
      <CardContent className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="cursor-grab"
            {...listeners} 
            {...attributes}
            aria-label="Arrastar passo"
          >
            <GripVertical className="w-4 h-4 text-gray-400" />
          </Button>
          {getPassoIcon(passo.tipo_passo)}
          <div className="flex-1">
            <span className="font-medium text-gray-800">{passo.ordem}. {passo.titulo}</span>
            {passo.conteudo && <p className="text-xs text-gray-500 line-clamp-1">{passo.conteudo}</p>}
          </div>
        </div>
        <div className="space-x-1 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={() => onEdit(passo)}>
            <Edit className="w-3 h-3" />
          </Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(passo.id)}>
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};