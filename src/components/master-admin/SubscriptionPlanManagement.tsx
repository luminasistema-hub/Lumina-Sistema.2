import React, { useState } from 'react';
import { useSubscriptionPlans, SubscriptionPlan } from '../../hooks/useSubscriptionPlans';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Plus, Edit, DollarSign, Users, Database, HardDrive, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../integrations/supabase/client';

const SubscriptionPlanManagement = () => {
  const { plans, isLoading, refetch } = useSubscriptionPlans();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [formData, setFormData] = useState<Partial<SubscriptionPlan>>({});

  const openDialog = (plan: SubscriptionPlan | null = null) => {
    setSelectedPlan(plan);
    setFormData(plan ? { ...plan } : {
      nome: '',
      preco_mensal: 0,
      limite_membros: 0,
      limite_quizes_por_etapa: 5,
      limite_armazenamento_mb: 1024,
      descricao: ''
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        nome: formData.nome,
        preco_mensal: formData.preco_mensal,
        limite_membros: formData.limite_membros,
        limite_quizes_por_etapa: formData.limite_quizes_por_etapa,
        limite_armazenamento_mb: formData.limite_armazenamento_mb,
        descricao: formData.descricao,
      };

      if (!payload.nome || payload.preco_mensal === undefined || payload.limite_membros === undefined) {
        toast.error('Nome, preço e limite de membros são obrigatórios.');
        return;
      }

      let error;
      if (selectedPlan?.id) {
        // Update
        const { error: updateError } = await supabase
          .from('planos_assinatura')
          .update(payload)
          .eq('id', selectedPlan.id);
        error = updateError;
      } else {
        // Create
        const { error: insertError } = await supabase
          .from('planos_assinatura')
          .insert(payload);
        error = insertError;
      }

      if (error) throw error;

      toast.success(`Plano "${payload.nome}" ${selectedPlan ? 'atualizado' : 'criado'} com sucesso!`);
      setIsDialogOpen(false);
      refetch();
    } catch (error: any) {
      console.error('Error saving plan:', error);
      toast.error('Erro ao salvar o plano: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gerenciamento de Planos</CardTitle>
          <CardDescription>Crie e edite os planos de assinatura do sistema.</CardDescription>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Plano
        </Button>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card key={plan.id} className="flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{plan.nome}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => openDialog(plan)}>
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                R$ {plan.preco_mensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                <span className="text-sm font-normal text-gray-500">/mês</span>
              </p>
            </CardHeader>
            <CardContent className="flex-grow space-y-3">
              <p className="text-sm text-gray-600">{plan.descricao}</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span>Até {plan.limite_membros} membros</span>
                </div>
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-gray-500" />
                  <span>{plan.limite_quizes_por_etapa} quizzes por etapa</span>
                </div>
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-gray-500" />
                  <span>{plan.limite_armazenamento_mb} MB de armazenamento</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedPlan ? 'Editar Plano' : 'Criar Novo Plano'}</DialogTitle>
            <DialogDescription>
              Preencha os detalhes do plano de assinatura.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Plano</Label>
              <Input id="nome" value={formData.nome || ''} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea id="descricao" value={formData.descricao || ''} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preco">Preço Mensal (R$)</Label>
                <Input id="preco" type="number" value={formData.preco_mensal || 0} onChange={(e) => setFormData({ ...formData, preco_mensal: parseFloat(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="membros">Limite de Membros</Label>
                <Input id="membros" type="number" value={formData.limite_membros || 0} onChange={(e) => setFormData({ ...formData, limite_membros: parseInt(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quizzes">Limite de Quizzes/Etapa</Label>
                <Input id="quizzes" type="number" value={formData.limite_quizes_por_etapa || 0} onChange={(e) => setFormData({ ...formData, limite_quizes_por_etapa: parseInt(e.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storage">Armazenamento (MB)</Label>
                <Input id="storage" type="number" value={formData.limite_armazenamento_mb || 0} onChange={(e) => setFormData({ ...formData, limite_armazenamento_mb: parseInt(e.target.value) })} />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSaving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SubscriptionPlanManagement;