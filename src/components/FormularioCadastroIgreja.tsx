import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { Building, Mail, Lock, Eye, EyeOff, User, Loader2 } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { useChurchStore } from '../stores/churchStore';

const FormularioCadastroIgreja = () => {
  const navigate = useNavigate();
  const { addChurch, getSubscriptionPlans } = useChurchStore();

  const [churchName, setChurchName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('0-100 membros');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!churchName || !adminName || !adminEmail || !adminPassword || !selectedPlan) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      setIsLoading(false);
      return;
    }

    if (adminPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
        options: {
          data: {
            full_name: adminName,
            church_name: churchName,
            initial_role: 'admin', // The first user is always an admin
          },
        },
      });

      if (authError) {
        console.error('FormularioCadastroIgreja: Supabase signUp error:', authError.message);
        toast.error(authError.message);
        setIsLoading(false);
        return;
      }

      if (!authData.user) {
        toast.error('Erro desconhecido ao criar usuário administrador.');
        setIsLoading(false);
        return;
      }

      const newAdminUserId = authData.user.id;

      // 2. Add the church to the store (which also saves to Supabase)
      const newChurch = await addChurch({
        name: churchName,
        subscriptionPlan: selectedPlan as any, // Cast to SubscriptionPlan
        status: 'active',
        adminUserId: newAdminUserId,
      });

      if (!newChurch) {
        // If church creation fails, attempt to delete the auth user
        await supabase.auth.admin.deleteUser(newAdminUserId);
        toast.error('Falha ao cadastrar a igreja. Tente novamente.');
        setIsLoading(false);
        return;
      }

      // 3. Insert the corresponding profile into public.membros
      // This step is now handled by the `handle_new_user` trigger in Supabase
      // However, we need to ensure the `perfil_completo` is set to true for the admin
      const { error: updateMemberError } = await supabase
        .from('membros')
        .update({ perfil_completo: true })
        .eq('id', newAdminUserId);

      if (updateMemberError) {
        console.error('FormularioCadastroIgreja: Error updating member profile:', updateMemberError.message);
        // This is a non-critical error for the user, but log it
      }

      toast.success('Igreja e conta de administrador criadas com sucesso! Você já pode fazer login.');
      navigate('/login');

    } catch (err) {
      console.error('FormularioCadastroIgreja: Unexpected error during registration:', err);
      toast.error('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const subscriptionPlans = getSubscriptionPlans();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="churchName">Nome da Igreja *</Label>
        <div className="relative">
          <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            id="churchName"
            type="text"
            placeholder="Nome da sua igreja"
            value={churchName}
            onChange={(e) => setChurchName(e.target.value)}
            className="pl-10 h-12"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="adminName">Seu Nome Completo (Administrador) *</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            id="adminName"
            type="text"
            placeholder="Seu nome completo"
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
            className="pl-10 h-12"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="adminEmail">Seu Email (Administrador) *</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            id="adminEmail"
            type="email"
            placeholder="seu@email.com"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            className="pl-10 h-12"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="adminPassword">Sua Senha (Administrador) *</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            id="adminPassword"
            type={showPassword ? 'text' : 'password'}
            placeholder="Mínimo 6 caracteres"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            className="pl-10 pr-10 h-12"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subscriptionPlan">Plano de Assinatura *</Label>
        <Select value={selectedPlan} onValueChange={setSelectedPlan}>
          <SelectTrigger id="subscriptionPlan">
            <SelectValue placeholder="Selecione um plano" />
          </SelectTrigger>
          <SelectContent>
            {subscriptionPlans.map(plan => (
              <SelectItem key={plan.value} value={plan.value}>
                {plan.label} (R$ {plan.monthlyValue.toFixed(2)}/mês)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Button 
        type="submit" 
        className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 transition-opacity"
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Cadastrando Igreja...
          </div>
        ) : (
          'Cadastrar Igreja e Administrador'
        )}
      </Button>
    </form>
  );
};

export default FormularioCadastroIgreja;