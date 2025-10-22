import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useSubscriptionPlans } from '@/hooks/useSubscriptionPlans';
import { Loader2, Plus } from 'lucide-react';

const formSchema = z.object({
  churchName: z.string().min(3, 'O nome da igreja é obrigatório.'),
  cnpj: z.string().optional(),
  fullAddress: z.string().optional(),
  telefoneContato: z.string().optional(),
  adminName: z.string().min(3, 'O nome do administrador é obrigatório.'),
  adminEmail: z.string().email('Formato de e-mail inválido.'),
  adminPassword: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres.'),
  selectedPlan: z.string().uuid('Selecione um plano válido.'),
});

type AddChurchFormValues = z.infer<typeof formSchema>;

interface AddChurchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onChurchAdded: () => void;
}

const AddChurchDialog: React.FC<AddChurchDialogProps> = ({ isOpen, onClose, onChurchAdded }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { plans: subscriptionPlans, isLoading: isLoadingPlans } = useSubscriptionPlans();

  const form = useForm<AddChurchFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      churchName: '',
      cnpj: '',
      fullAddress: '',
      telefoneContato: '',
      adminName: '',
      adminEmail: '',
      adminPassword: '',
      selectedPlan: '',
    },
  });

  const onSubmit = async (values: AddChurchFormValues) => {
    setIsLoading(true);
    
    const planDetails = subscriptionPlans.find(p => p.id === values.selectedPlan);
    if (!planDetails) {
      toast.error('Plano selecionado não encontrado.');
      setIsLoading(false);
      return;
    }

    const registrationPromise = supabase.functions.invoke('register-church', {
      body: {
        ...values,
        planDetails: {
          monthlyValue: planDetails.preco_mensal,
          memberLimit: planDetails.limite_membros,
        },
      },
    });

    toast.promise(registrationPromise, {
      loading: 'Cadastrando nova igreja e administrador...',
      success: (result) => {
        if (result.error) {
          throw new Error(result.error.message || 'Erro desconhecido no servidor.');
        }
        onChurchAdded();
        onClose();
        form.reset();
        return 'Igreja cadastrada com sucesso!';
      },
      error: (err) => {
        console.error('Erro ao cadastrar igreja:', err);
        return `Falha no cadastro: ${err.message}`;
      },
      finally: () => {
        setIsLoading(false);
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar Nova Igreja</DialogTitle>
          <DialogDescription>
            Preencha os detalhes para cadastrar uma nova igreja e seu administrador principal.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="churchName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Igreja</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Igreja da Comunidade" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="adminName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Administrador</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: João da Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="adminEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail do Administrador</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@dominio.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="adminPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha Provisória do Administrador</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="selectedPlan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plano de Assinatura</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoadingPlans}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingPlans ? "Carregando..." : "Selecione um plano"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subscriptionPlans.map(plan => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.nome} (R$ {plan.preco_mensal.toFixed(2)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Cadastrando...</>
                ) : (
                  <><Plus className="w-4 h-4 mr-2" /> Adicionar Igreja</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddChurchDialog;