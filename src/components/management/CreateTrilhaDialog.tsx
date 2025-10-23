import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useChurchStore } from '@/stores/churchStore';
import { useChildChurches } from '@/hooks/useChildChurches';
import { useSaveTrilha } from '@/hooks/useJourneyAdminData';

interface Trilha {
  id: string;
  titulo: string;
  descricao: string;
  compartilhar_com_filhas: boolean;
}

interface CreateTrilhaDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentChurchId: string;
  onCreated: () => void;
  trilhaParaEditar?: Trilha | null;
}

const CreateTrilhaDialog = ({ isOpen, onOpenChange, currentChurchId, onCreated, trilhaParaEditar }: CreateTrilhaDialogProps) => {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const { parentInfo } = useChildChurches();
  const [shareWithChildren, setShareWithChildren] = useState(true);
  const { mutate: saveTrilha, isPending: loading } = useSaveTrilha();

  useEffect(() => {
    if (isOpen) {
      if (trilhaParaEditar) {
        setTitulo(trilhaParaEditar.titulo);
        setDescricao(trilhaParaEditar.descricao);
        setShareWithChildren(trilhaParaEditar.compartilhar_com_filhas);
      } else {
        setTitulo('');
        setDescricao('');
        setShareWithChildren(true);
      }
    }
  }, [isOpen, trilhaParaEditar]);

  const handleSave = async () => {
    if (!titulo.trim()) {
      toast.error('Informe um título para a trilha.');
      return;
    }
    
    const trilhaData = {
      id: trilhaParaEditar?.id,
      titulo: titulo.trim(),
      descricao: descricao.trim(),
      compartilhar_com_filhas: shareWithChildren,
    };

    saveTrilha({ trilha: trilhaData, currentChurchId }, {
      onSuccess: () => {
        onOpenChange(false);
        onCreated(); // Mantido para garantir que a lista principal seja atualizada
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{trilhaParaEditar ? 'Editar Trilha' : 'Criar Nova Trilha'}</DialogTitle>
          <DialogDescription>
            {trilhaParaEditar ? 'Edite o título, descrição e opções de compartilhamento.' : 'Defina o título e a descrição da jornada do membro para sua igreja.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="trilha-titulo">Título *</Label>
            <Input
              id="trilha-titulo"
              placeholder="Ex.: Jornada do Membro"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trilha-descricao">Descrição</Label>
            <Textarea
              id="trilha-descricao"
              placeholder="Descreva os objetivos e etapas da jornada."
              rows={4}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>
          {!parentInfo?.isChild && (
            <div className="p-3 border rounded-md flex items-center justify-between">
              <div className="space-y-1">
                <Label>Compartilhar com igrejas filhas</Label>
                <p className="text-xs text-gray-600">Se ativado, a trilha ficará visível para igrejas filhas.</p>
              </div>
              <Switch checked={shareWithChildren} onCheckedChange={setShareWithChildren} aria-label="Compartilhar trilha com igrejas filhas" />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Salvando...' : (trilhaParaEditar ? 'Salvar Alterações' : 'Criar Trilha')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTrilhaDialog;