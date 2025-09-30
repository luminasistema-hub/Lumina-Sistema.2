import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Edit, Trash2, GripVertical } from 'lucide-react';

interface EtapaTrilha {
  id: string;
  id_trilha: string;
  ordem: number;
  titulo: string;
  descricao: string;
  tipo_conteudo: string;
  conteudo: string;
  cor: string;
  created_at: string;
}

interface SortableEtapaItemProps {
  etapa: EtapaTrilha;
  onEdit: (etapa: EtapaTrilha) => void;
  onDelete: (etapaId: string) => void;
}

export const SortableEtapaItem: React.FC<SortableEtapaItemProps> = ({ etapa, onEdit, onDelete }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: etapa.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className="border-0 shadow-sm cursor-grab active:cursor-grabbing"
    >
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="cursor-grab"
            {...listeners} 
            {...attributes}
            aria-label="Arrastar etapa"
          >
            <GripVertical className="w-5 h-5 text-gray-500" />
          </Button>
          <div className="flex-1">
            <span className="font-bold text-lg">{etapa.ordem}. {etapa.titulo}</span>
            <p className="text-sm text-gray-600">{etapa.descricao}</p>
          </div>
        </div>
        <div className="space-x-2 flex-shrink-0">
          <Button variant="outline" size="sm" onClick={() => onEdit(etapa)}>
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(etapa.id)}>
            <Trash2 className="w-4 h-4 mr-2" />
            Apagar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};