import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Edit, Trash2, GripVertical, ChevronRight } from 'lucide-react';

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
  isExpanded: boolean; // Nova prop
  onToggleExpand: () => void; // Nova prop
  children?: React.ReactNode; // Nova prop para conteúdo aninhado (passos)
}

export const SortableEtapaItem: React.FC<SortableEtapaItemProps> = ({ 
  etapa, 
  onEdit, 
  onDelete, 
  isExpanded, 
  onToggleExpand, 
  children 
}) => {
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
      className="border-0 shadow-sm overflow-hidden" // Removido cursor-grab do Card, adicionado ao drag handle
    >
      {/* Header da Etapa (clicável para expandir) */}
      <div
        className="flex items-center justify-between p-4 bg-gray-50 cursor-pointer"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-4 flex-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="cursor-grab" // Drag handle
            {...listeners} 
            {...attributes}
            aria-label="Arrastar etapa"
            onClick={(e) => e.stopPropagation()} // Previne o toggle do acordeão ao arrastar
          >
            <GripVertical className="w-5 h-5 text-gray-500" />
          </Button>
          <div style={{ borderLeft: `4px solid ${etapa.cor || '#cccccc'}`, paddingLeft: '1rem' }} className="flex-1">
            <h3 className="font-bold text-lg text-gray-900">{etapa.ordem}. {etapa.titulo}</h3>
            <p className="text-sm text-gray-600 line-clamp-1">{etapa.descricao}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); onEdit(etapa); }}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="destructive" onClick={(e) => { e.stopPropagation(); onDelete(etapa.id); }}>
            <Trash2 className="w-4 h-4" />
          </Button>
          <span className={`transform transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
            <ChevronRight className="w-5 h-5 text-gray-500" />
          </span>
        </div>
      </div>

      {/* Corpo da Etapa (conteúdo aninhado, visível quando expandido) */}
      {isExpanded && (
        <div className="p-4 border-t bg-white">
          {children}
        </div>
      )}
    </Card>
  );
};