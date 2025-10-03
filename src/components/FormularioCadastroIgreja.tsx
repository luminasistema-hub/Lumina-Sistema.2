import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { Building, Mail, Lock, Eye, EyeOff, User, Loader2, Phone, Home, FileText, Globe, BookText } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';

// Funções de validação para padrões brasileiros
const validateCnpj = (cnpj: string) => {
  if (!cnpj) return true; // Opcional, se for obrigatório, remover esta linha
  cnpj = cnpj.replace(/[^\d]+/g, ''); // Remove caracteres não numéricos
  if (cnpj.length !== 14) return false;
  return true; // Simplificando para aceitar 14 dígitos
};

const validatePhone = (phone: string) => {
  if (!phone) return true; // Opcional, se for obrigatório, remover esta linha
  phone = phone.replace(/[^\d]+/g, ''); // Remove caracteres não numéricos
  return phone.length >= 10 && phone.length <= 11;
};

const FormularioCadastroIgreja = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [churchName, setChurchName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [telefoneContato, setTelefoneContato] = useState('');
  const [endereco, setEndereco] = useState('');
  const [site, setSite] = useState('');
  const [descricao, setDescricao] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [subscriptionPlans, setSubscriptionPlans] = useState<{ value: string; label: string; monthlyValue: number; memberLimit: number }[]>([]);

  useEffect(() => {
    const fetchPlans = async () => {
        const { data, error } = await supabase
            .from('planos_assinatura')
            .select('id, nome, preco_mensal, limite_membros');
        
        if (data) {
            const formattedPlans = data.map(plan => ({
                value: plan.id,
                label: plan.nome,
                monthlyValue: plan.preco_mensal,
                memberLimit: plan.limite_membros,
            }));
            setSubscriptionPlans(formattedPlans);
            
            const planFromUrl = searchParams.get('plano');
            if (planFromUrl && formattedPlans.some(p => p.value === planFromUrl)) {
              setSelectedPlan(planFromUrl);
            } else if (formattedPlans.length > 0) {
              setSelectedPlan(formattedPlans[0].value);
            }
        }
    };
    fetchPlans();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!churchName || !adminName || !adminEmail || !adminPassword || !selectedPlan || !cnpj || !telefoneContato || !endereco) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      setIsLoading(false);
      return;
    }
    if (adminPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      setIsLoading(false);
      return;
    }
    if (!validateCnpj(cnpj)) {
      toast.error('Por favor, insira um CNPJ válido com 14 dígitos.');
      setIsLoading(false);
      return;
    }
    if (!validatePhone(telefoneContato)) {
      toast.error('Por favor, insira um telefone de contato válido (ex: (DD) 9XXXX-XXXX).');
      setIsLoading(false);
      return;
    }

    const planDetails = subscriptionPlans.find(p => p.value === selectedPlan);
    if (!planDetails) {
        toast.error('Plano de assinatura inválido. Por favor, recarregue a página.');
        setIsLoading(false);
        return;
    }

    let newChurchId: string | null = null;

    try {
      const { data: churchData, error: churchError } = await supabase
        .from('igrejas')
        .insert({
          nome: churchName,
          cnpj: cnpj.replace(/[^\d]+/g, ''),
          endereco: endereco,
          telefone_contato: telefoneContato.replace(/[^\d]+/g, ''),
          email: adminEmail,
          nome_responsavel: adminName,
          plano_id: selectedPlan,
          status: 'pending',
          valor_mensal_assinatura: planDetails.monthlyValue,
          limite_membros: planDetails.memberLimit,
          ultimo_pagamento_status: 'Pendente',
          site: site,
          descricao: descricao,
        })
        .select('id, nome')
        .single();

      if (churchError) {
        if (churchError.message.includes('duplicate key value')) {
          toast.error('Erro ao criar igreja: O CNPJ informado já está cadastrado.');
        } else {
          toast.error(`Erro ao criar igreja: ${churchError.message}`);
        }
        throw churchError;
      }

      newChurchId = churchData.id;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
        options: {
          data: {
            full_name: adminName,
            church_id: churchData.id,
            church_name: churchData.nome,
            initial_role: 'admin',
          },
        },
      });

      if (authError) {
        if (newChurchId) {
          await supabase.from('igrejas').delete().eq('id', newChurchId);
        }
        throw authError;
      }

      toast.success('Igreja e conta de administrador criadas com sucesso! Verifique seu email para confirmar o cadastro.');
      navigate('/login');

    } catch (err: any) {
      console.error('FormularioCadastroIgreja: Erro no cadastro:', err);
      const mensagem = err.message.includes('User already registered')
        ? 'Este e-mail já está cadastrado.'
        : 'Ocorreu um erro ao realizar o cadastro. Tente novamente.';
      toast.error(mensagem);
    } finally {
      setIsLoading(false);
    }
  };

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
        <Label htmlFor="cnpj">CNPJ *</Label>
        <div className="relative">
          <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            id="cnpj"
            type="text"
            placeholder="Apenas números"
            value={cnpj}
            onChange={(e) => setCnpj(e.target.value)}
            className="pl-10 h-12"
            required
            maxLength={14}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="telefoneContato">Telefone de Contato *</Label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            id="telefoneContato"
            type="tel"
            placeholder="(DD) 9XXXX-XXXX"
            value={telefoneContato}
            onChange={(e) => setTelefoneContato(e.target.value)}
            className="pl-10 h-12"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="endereco">Endereço *</Label>
        <div className="relative">
          <Home className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            id="endereco"
            type="text"
            placeholder="Endereço completo da igreja"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            className="pl-10 h-12"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="site">Site da Igreja (Opcional)</Label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            id="site"
            type="url"
            placeholder="https://suaigreja.com"
            value={site}
            onChange={(e) => setSite(e.target.value)}
            className="pl-10 h-12"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição da Igreja (Opcional)</Label>
        <div className="relative">
          <BookText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <Textarea
            id="descricao"
            placeholder="Uma breve descrição sobre a visão e missão da sua igreja."
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="pl-10 pt-3"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subscriptionPlan">Plano de Assinatura *</Label>
        <Select value={selectedPlan} onValueChange={setSelectedPlan} disabled={subscriptionPlans.length === 0}>
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