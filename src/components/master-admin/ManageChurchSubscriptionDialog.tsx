import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { Church, SubscriptionPlan, useChurchStore, SubscriptionPlanData } from '../../stores/churchStore';
import { Edit, Save, Loader2 } from 'lucide-react';

interface ManageChurchSubscriptionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  church: Church | null;
  onSave: (churchId: string, updates: Partial<Church>) => Promise<void>;
}

const ManageChurchSubscriptionDialog: React.FC<ManageChurchSubscriptionDialogProps> = ({ isOpen, onClose, church, onSave }) => {
  const { subscriptionPlans, getPlanDetails } = useChurchStore();
  const [formData, setFormData] = useState<Partial<Church>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (church) {
      setFormData({
        name: church.name,
        subscriptionPlan: church.subscriptionPlan,
        status: church.status,
        adminUserId: church.adminUserId,
        valor_mensal_assinatura: church.valor_mensal_assinatura,
        data_proximo_pagamento: church.data_proximo_pagamento ? church.data_proximo_pagamento.split('T')[0] : '',
        ultimo_pagamento_status: church.ultimo_pagamento_status,
      });
    } else {
      setFormData({});
    }
  }, [church]);

  useEffect(() => {
    if (formData.subscriptionPlan) {
      const planDetails = getPlanDetails(formData.subscriptionPlan);
      if (planDetails) {
        setFormData(prev => ({ ...prev, valor_mensal_assinatura: planDetails.preco_mensal }));
      }
    }
  }, [formData.subscriptionPlan, getPlanDetails]);

  const handleInputChange = (field: keyof Church, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!church) return;
    setIsLoading(true);
    try {
      await onSave(church.id, formData);
      toast.success('Assinatura da igreja atualizada com sucesso!');
      onClose();
    } catch (error) {
      console.error('Failed to save church subscription:', error);
      toast.error('Erro ao salvar as alterações.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !church) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="w-5 h-5 text-purple-600" />
            Gerenciar Assinatura da Igreja
          </DialogTitle>
          <DialogDescription>
            Edite os detalhes da igreja e da sua assinatura.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="churchName">Nome da Igreja</Label>
            <Input
              id="churchName"
              value={formData.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subscriptionPlan">Plano de Assinatura</Label>
            <Select
              value={formData.subscriptionPlan || ''}
              onValueChange={(value) => handleInputChange('subscriptionPlan', value as SubscriptionPlan)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um plano" />
              </SelectTrigger>
              <SelectContent>
                {subscriptionPlans.map(plan => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.nome} (R$ {plan.preco_mensal.toFixed(2)})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="monthlyValue">Valor Mensal (R$)</Label>
            <Input
              id="monthlyValue"
              type="number"
              step="0.01"
              value={formData.valor_mensal_assinatura || ''}
              onChange={(e) => handleInputChange('valor_mensal_assinatura', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status da Igreja</Label>
            <Select
              value={formData.status || ''}
              onValueChange={(value) => handleInputChange('status', value as Church['status'])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Ativa</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="inactive">Inativa</SelectItem>
                <SelectItem value="trial">Teste</SelectItem>
                <SelectItem value="blocked">Bloqueada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nextPaymentDate">Próximo Pagamento</Label>
            <Input
              id="nextPaymentDate"
              type="date"
              value={formData.data_proximo_pagamento || ''}
              onChange={(e) => handleInputChange('data_proximo_pagamento', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastPaymentStatus">Status do Último Pagamento</Label>
            <Select
              value={formData.ultimo_pagamento_status || ''}
              onValueChange={(value) => handleInputChange('ultimo_pagamento_status', value as Church['ultimo_pagamento_status'])}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pago">Pago</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Atrasado">Atrasado</SelectItem>
                <SelectItem value="N/A">N/A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </div>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ManageChurchSubscriptionDialog;