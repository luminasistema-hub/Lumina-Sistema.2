import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { toast } from 'sonner';
import { supabase } from '../../integrations/supabase/client';
import { Baby, Plus, Loader2 } from 'lucide-react'; // Adicionado Loader2 aqui

interface AddKidDialogProps {
  isOpen: boolean;
  onClose: () => void;
  responsibleId: string;
  responsibleName: string;
  responsibleEmail: string;
  churchId: string;
  onKidAdded: () => void; // Callback para atualizar a lista de crianças no componente pai
}

const AddKidDialog: React.FC<AddKidDialogProps> = ({
  isOpen,
  onClose,
  responsibleId,
  responsibleName,
  responsibleEmail,
  churchId,
  onKidAdded,
}) => {
  const [newKidForm, setNewKidForm] = useState({
    nome_crianca: '',
    data_nascimento: '',
    informacoes_especiais: '',
    alergias: '',
    medicamentos: '',
    autorizacao_fotos: true,
    contato_emergencia_nome: '',
    contato_emergencia_telefone: '',
    contato_emergencia_parentesco: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when dialog opens or responsibleId/churchId changes
  useEffect(() => {
    if (isOpen) {
      setNewKidForm({
        nome_crianca: '',
        data_nascimento: '',
        informacoes_especiais: '',
        alergias: '',
        medicamentos: '',
        autorizacao_fotos: true,
        contato_emergencia_nome: '',
        contato_emergencia_telefone: '',
        contato_emergencia_parentesco: ''
      });
    }
  }, [isOpen, responsibleId, churchId]);

  const handleAddKid = async () => {
    if (!newKidForm.nome_crianca || !newKidForm.data_nascimento || !responsibleId || !churchId) {
      toast.error('Nome, data de nascimento e responsável são obrigatórios.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('criancas')
        .insert({
          id_igreja: churchId,
          nome_crianca: newKidForm.nome_crianca,
          data_nascimento: newKidForm.data_nascimento,
          responsavel_id: responsibleId,
          email_responsavel: responsibleEmail,
          informacoes_especiais: newKidForm.informacoes_especiais || null,
          alergias: newKidForm.alergias || null,
          medicamentos: newKidForm.medicamentos || null,
          autorizacao_fotos: newKidForm.autorizacao_fotos,
          contato_emergencia: newKidForm.contato_emergencia_nome ? {
            nome: newKidForm.contato_emergencia_nome,
            telefone: newKidForm.contato_emergencia_telefone,
            parentesco: newKidForm.contato_emergencia_parentesco
          } : null,
          status_checkin: 'Ausente',
        });

      if (error) throw error;

      toast.success('Criança cadastrada com sucesso!');
      onKidAdded(); // Notifica o componente pai para recarregar a lista
      onClose();
    } catch (error: any) {
      console.error('Error adding kid:', error.message);
      toast.error('Erro ao cadastrar criança: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Baby className="w-6 h-6 text-pink-500" />
            Cadastrar Nova Criança
          </DialogTitle>
          <DialogDescription>
            Preencha as informações da criança para vincular ao seu perfil.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nome_crianca">Nome da Criança *</Label>
              <Input
                id="nome_crianca"
                value={newKidForm.nome_crianca}
                onChange={(e) => setNewKidForm({...newKidForm, nome_crianca: e.target.value})}
                placeholder="Nome completo"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="data_nascimento">Data de Nascimento *</Label>
              <Input
                id="data_nascimento"
                type="date"
                value={newKidForm.data_nascimento}
                onChange={(e) => setNewKidForm({...newKidForm, data_nascimento: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="responsavel_display">Responsável</Label>
            <Input
              id="responsavel_display"
              value={`${responsibleName} (${responsibleEmail})`}
              disabled
              className="bg-gray-100"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="alergias">Alergias</Label>
            <Textarea
              id="alergias"
              value={newKidForm.alergias}
              onChange={(e) => setNewKidForm({...newKidForm, alergias: e.target.value})}
              placeholder="Descreva alergias alimentares ou medicamentosas"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="medicamentos">Medicamentos</Label>
            <Textarea
              id="medicamentos"
              value={newKidForm.medicamentos}
              onChange={(e) => setNewKidForm({...newKidForm, medicamentos: e.target.value})}
              placeholder="Medicamentos de uso contínuo ou de emergência"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="informacoes_especiais">Informações Especiais</Label>
            <Textarea
              id="informacoes_especiais"
              value={newKidForm.informacoes_especiais}
              onChange={(e) => setNewKidForm({...newKidForm, informacoes_especiais: e.target.value})}
              placeholder="Comportamento, necessidades especiais, etc."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Contato de Emergência (Opcional)</Label>
            <Input
              placeholder="Nome do contato"
              value={newKidForm.contato_emergencia_nome}
              onChange={(e) => setNewKidForm({...newKidForm, contato_emergencia_nome: e.target.value})}
            />
            <Input
              placeholder="Telefone do contato"
              value={newKidForm.contato_emergencia_telefone}
              onChange={(e) => setNewKidForm({...newKidForm, contato_emergencia_telefone: e.target.value})}
            />
            <Input
              placeholder="Parentesco"
              value={newKidForm.contato_emergencia_parentesco}
              onChange={(e) => setNewKidForm({...newKidForm, contato_emergencia_parentesco: e.target.value})}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="autorizacao_fotos"
              checked={newKidForm.autorizacao_fotos}
              onCheckedChange={(checked) => setNewKidForm({...newKidForm, autorizacao_fotos: checked as boolean})}
            />
            <Label htmlFor="autorizacao_fotos">Autorizo fotos e vídeos para divulgação</Label>
          </div>
        </div>
        <DialogFooter className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleAddKid} disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cadastrando...
              </div>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar Criança
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddKidDialog;