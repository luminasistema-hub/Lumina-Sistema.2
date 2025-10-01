import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useChurchStore, SubscriptionPlanData } from '../../stores/churchStore';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

interface PlanFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  plan?: SubscriptionPlanData | null;
}

const PlanFormDialog: React.FC<PlanFormDialogProps> = ({ isOpen, onClose, plan }) => {
  const { addSubscriptionPlan, updateSubscriptionPlan } = useChurchStore();
  const [formData, setFormData] = useState({
    nome: '',
    preco_mensal: 0,
    limite_membros: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (plan) {
      setFormData({
        nome: plan.nome,
        preco_mensal: plan.preco_mensal,
        limite_membros: plan.limite_membros,
      });
    } else {
      setFormData({
        nome: '',
        preco_mensal: 0,
        limite_membros: 0,
      });
    }
  }, [plan, isOpen]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      if (plan) {
        // Atualizar plano existente
        const updatedPlan = await updateSubscriptionPlan(plan.id, formData);
        if (updatedPlan) {
          toast.success(`Plano "${updatedPlan.nome}" atualizado com sucesso!`);
        } else {
          throw new Error('Falha ao atualizar o plano.');
        }
      } else {
        // Criar novo plano
        const newPlan = await addSubscriptionPlan(formData);
        if (newPlan) {
          toast.success(`Plano "${newPlan.nome}" criado com sucesso!`);
        } else {
          throw new Error('Falha ao criar o plano.');
        }
      }
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{plan ? 'Editar Plano' : 'Criar Novo Plano'}</DialogTitle>
          <DialogDescription>
            {plan ? 'Altere os detalhes do plano de assinatura.' : 'Preencha os detalhes para o novo plano.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do Plano</Label>
            <Input id="nome" value={formData.nome} onChange={(e) => setFormData(p => ({ ...p, nome: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="preco_mensal">Preço Mensal (R$)</Label>
            <Input id="preco_mensal" type="number" value={formData.preco_mensal} onChange={(e) => setFormData(p => ({ ...p, preco_mensal: parseFloat(e.target.value) || 0 }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="limite_membros">Limite de Membros</Label>
            <Input id="limite_membros" type="number" value={formData.limite_membros} onChange={(e) => setFormData(p => ({ ...p, limite_membros: parseInt(e.target.value) || 0 }))} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PlanFormDialog;