import React, { useState } from 'react';
import { useChurchStore, SubscriptionPlanData } from '../../stores/churchStore';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Plus, Edit, Trash2, Package, Loader2 } from 'lucide-react';
import PlanFormDialog from './PlanFormDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { toast } from 'sonner';

const ManagePlansTab: React.FC = () => {
  const { subscriptionPlans, deleteSubscriptionPlan } = useChurchStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanData | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const handleOpenForm = (plan: SubscriptionPlanData | null = null) => {
    setSelectedPlan(plan);
    setIsFormOpen(true);
  };

  const handleDelete = async (planId: string) => {
    setIsDeleting(planId);
    const success = await deleteSubscriptionPlan(planId);
    if (success) {
      toast.success('Plano excluído com sucesso!');
    } else {
      toast.error('Erro ao excluir o plano. Verifique se ele não está em uso por alguma igreja.');
    }
    setIsDeleting(null);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-500" />
            Gerenciar Planos de Assinatura
          </CardTitle>
          <Button onClick={() => handleOpenForm()}>
            <Plus className="mr-2 h-4 w-4" /> Novo Plano
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Plano</TableHead>
                <TableHead>Preço Mensal</TableHead>
                <TableHead>Limite de Membros</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptionPlans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.nome}</TableCell>
                  <TableCell>R$ {plan.preco_mensal.toFixed(2)}</TableCell>
                  <TableCell>{plan.limite_membros}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenForm(plan)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={!!isDeleting}>
                          {isDeleting === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja excluir o plano "{plan.nome}"? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(plan.id)}>Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <PlanFormDialog isOpen={isFormOpen} onClose={() => setIsFormOpen(false)} plan={selectedPlan} />
    </>
  );
};

export default ManagePlansTab;