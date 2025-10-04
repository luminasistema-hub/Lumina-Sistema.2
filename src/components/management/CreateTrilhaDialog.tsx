import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CreateTrilhaDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentChurchId: string;
  onCreated: () => void;
}

const CreateTrilhaDialog = ({ isOpen, onOpenChange, currentChurchId, onCreated }: CreateTrilhaDialogProps) => {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!titulo.trim()) {
      toast.error('Informe um título para a trilha.');
      return;
    }
    setLoading(true);
    try {
      // Desativar trilha ativa anterior da igreja (garante apenas uma ativa)
      await supabase
        .from('trilhas_crescimento')
        .update({ is_ativa: false })
        .eq('id_igreja', currentChurchId)
        .eq('is_ativa', true);

      const { error } = await supabase
        .from('trilhas_crescimento')
        .insert({
          id_igreja: currentChurchId,
          titulo: titulo.trim(),
          descricao: descricao.trim(),
          is_ativa: true,
        });
      if (error) throw error;
      toast.success('Trilha criada com sucesso!');
      onOpenChange(false);
      onCreated();
    } catch (err: any) {
      console.error('Erro ao criar trilha:', err);
      toast.error('Não foi possível criar a trilha. Verifique suas permissões.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Criar Trilha de Crescimento</DialogTitle>
          <DialogDescription>Defina o título e a descrição da jornada do membro para sua igreja.</DialogDescription>
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
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? 'Criando...' : 'Criar Trilha'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTrilhaDialog;