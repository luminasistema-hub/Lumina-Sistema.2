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
import { Baby, Plus, Loader2, Trash2, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';

interface KidFormData {
  nome_crianca: string;
  data_nascimento: string;
  informacoes_especiais: string;
  alergias: string;
  medicamentos: string;
  autorizacao_fotos: boolean;
  contato_emergencia_nome: string;
  contato_emergencia_telefone: string;
  contato_emergencia_parentesco: string;
}

interface AddKidDialogProps {
  isOpen: boolean;
  onClose: () => void;
  responsibleId: string;
  responsibleName: string;
  responsibleEmail: string;
  churchId: string;
  onKidAdded: () => void;
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
  const [kidsForms, setKidsForms] = useState<KidFormData[]>([{
    nome_crianca: '',
    data_nascimento: '',
    informacoes_especiais: '',
    alergias: '',
    medicamentos: '',
    autorizacao_fotos: true,
    contato_emergencia_nome: '',
    contato_emergencia_telefone: '',
    contato_emergencia_parentesco: ''
  }]);
  const [isLoading, setIsLoading] = useState(false);

  // Reset forms when dialog opens or closes
  useEffect(() => {
    if (isOpen) {
      setKidsForms([{
        nome_crianca: '',
        data_nascimento: '',
        informacoes_especiais: '',
        alergias: '',
        medicamentos: '',
        autorizacao_fotos: true,
        contato_emergencia_nome: '',
        contato_emergencia_telefone: '',
        contato_emergencia_parentesco: ''
      }]);
    }
  }, [isOpen]);

  const addNewKidForm = () => {
    setKidsForms(prev => [...prev, {
      nome_crianca: '',
      data_nascimento: '',
      informacoes_especiais: '',
      alergias: '',
      medicamentos: '',
      autorizacao_fotos: true,
      contato_emergencia_nome: '',
      contato_emergencia_telefone: '',
      contato_emergencia_parentesco: ''
    }]);
  };

  const removeKidForm = (index: number) => {
    if (kidsForms.length > 1) {
      setKidsForms(prev => prev.filter((_, i) => i !== index));
    } else {
      toast.error('Você deve ter pelo menos uma criança para cadastrar.');
    }
  };

  const updateKidForm = (index: number, field: keyof KidFormData, value: any) => {
    setKidsForms(prev => prev.map((form, i) => 
      i === index ? { ...form, [field]: value } : form
    ));
  };

  const validateForms = (): boolean => {
    for (let i = 0; i < kidsForms.length; i++) {
      const form = kidsForms[i];
      if (!form.nome_crianca || !form.data_nascimento) {
        toast.error(`Preencha o nome e data de nascimento da criança ${i + 1}.`);
        return false;
      }
    }
    return true;
  };

  const handleAddKids = async () => {
    if (!validateForms()) return;

    setIsLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Process each kid form
      for (let i = 0; i < kidsForms.length; i++) {
        const form = kidsForms[i];
        
        const { error } = await supabase
          .from('criancas')
          .insert({
            id_igreja: churchId,
            nome_crianca: form.nome_crianca,
            data_nascimento: form.data_nascimento,
            responsavel_id: responsibleId,
            email_responsavel: responsibleEmail,
            informacoes_especiais: form.informacoes_especiais || null,
            alergias: form.alergias || null,
            medicamentos: form.medicamentos || null,
            autorizacao_fotos: form.autorizacao_fotos,
            contato_emergencia: form.contato_emergencia_nome ? {
              nome: form.contato_emergencia_nome,
              telefone: form.contato_emergencia_telefone,
              parentesco: form.contato_emergencia_parentesco
            } : null,
            status_checkin: 'Ausente',
          });

        if (error) {
          console.error(`Error adding kid ${i + 1}:`, error.message);
          errorCount++;
        } else {
          successCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} criança(s) cadastrada(s) com sucesso!`);
        onKidAdded();
        onClose();
      }

      if (errorCount > 0) {
        toast.error(`Erro ao cadastrar ${errorCount} criança(s).`);
      }
    } catch (error: any) {
      console.error('Error adding kids:', error.message);
      toast.error('Erro ao cadastrar crianças: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Baby className="w-6 h-6 text-pink-500" />
            Cadastrar Crianças
          </DialogTitle>
          <DialogDescription>
            Preencha as informações das crianças para vincular ao seu perfil. Você pode adicionar várias crianças de uma vez.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {kidsForms.map((form, index) => (
            <Card key={index} className="p-4 border-2 border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Baby className="w-5 h-5 text-pink-500" />
                  Criança {index + 1}
                </h3>
                {kidsForms.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeKidForm(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`nome_crianca_${index}`}>Nome da Criança *</Label>
                  <Input
                    id={`nome_crianca_${index}`}
                    value={form.nome_crianca}
                    onChange={(e) => updateKidForm(index, 'nome_crianca', e.target.value)}
                    placeholder="Nome completo"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`data_nascimento_${index}`}>Data de Nascimento *</Label>
                  <Input
                    id={`data_nascimento_${index}`}
                    type="date"
                    value={form.data_nascimento}
                    onChange={(e) => updateKidForm(index, 'data_nascimento', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`alergias_${index}`}>Alergias</Label>
                <Textarea
                  id={`alergias_${index}`}
                  value={form.alergias}
                  onChange={(e) => updateKidForm(index, 'alergias', e.target.value)}
                  placeholder="Descreva alergias alimentares ou medicamentosas"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`medicamentos_${index}`}>Medicamentos</Label>
                <Textarea
                  id={`medicamentos_${index}`}
                  value={form.medicamentos}
                  onChange={(e) => updateKidForm(index, 'medicamentos', e.target.value)}
                  placeholder="Medicamentos de uso contínuo ou de emergência"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`informacoes_especiais_${index}`}>Informações Especiais</Label>
                <Textarea
                  id={`informacoes_especiais_${index}`}
                  value={form.informacoes_especiais}
                  onChange={(e) => updateKidForm(index, 'informacoes_especiais', e.target.value)}
                  placeholder="Comportamento, necessidades especiais, etc."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Contato de Emergência (Opcional)</Label>
                <Input
                  placeholder="Nome do contato"
                  value={form.contato_emergencia_nome}
                  onChange={(e) => updateKidForm(index, 'contato_emergencia_nome', e.target.value)}
                />
                <Input
                  placeholder="Telefone do contato"
                  value={form.contato_emergencia_telefone}
                  onChange={(e) => updateKidForm(index, 'contato_emergencia_telefone', e.target.value)}
                />
                <Input
                  placeholder="Parentesco"
                  value={form.contato_emergencia_parentesco}
                  onChange={(e) => updateKidForm(index, 'contato_emergencia_parentesco', e.target.value)}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`autorizacao_fotos_${index}`}
                  checked={form.autorizacao_fotos}
                  onCheckedChange={(checked) => updateKidForm(index, 'autorizacao_fotos', checked as boolean)}
                />
                <Label htmlFor={`autorizacao_fotos_${index}`}>Autorizo fotos e vídeos para divulgação</Label>
              </div>
            </Card>
          ))}

          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={addNewKidForm}
              className="flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Adicionar Outra Criança
            </Button>
          </div>
        </div>

        <DialogFooter className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleAddKids} disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Cadastrando...
              </div>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar {kidsForms.length} Criança(s)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddKidDialog;