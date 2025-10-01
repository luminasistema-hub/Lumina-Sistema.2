import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { Building, Mail, Lock, Eye, EyeOff, User, Loader2, Phone, Home, FileText } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';

// Funções de validação para padrões brasileiros
const validateCnpj = (cnpj: string) => {
  if (!cnpj) return true; // Opcional, se for obrigatório, remover esta linha
  cnpj = cnpj.replace(/[^\d]+/g, ''); // Remove caracteres não numéricos
  if (cnpj.length !== 14) return false;
  // Validação básica de CNPJ (pode ser mais complexa)
  return /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(cnpj) || /^\d{14}$/.test(cnpj);
};

const validateCpf = (cpf: string) => {
  if (!cpf) return true; // Opcional, se for obrigatório, remover esta linha
  cpf = cpf.replace(/[^\d]+/g, ''); // Remove caracteres não numéricos
  if (cpf.length !== 11) return false;
  // Validação básica de CPF (pode ser mais complexa)
  return /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(cpf) || /^\d{11}$/.test(cpf);
};

const validatePhone = (phone: string) => {
  if (!phone) return true; // Opcional, se for obrigatório, remover esta linha
  phone = phone.replace(/[^\d]+/g, ''); // Remove caracteres não numéricos
  // Aceita 10 ou 11 dígitos (com ou sem DDD)
  return /^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(phone) || /^\d{10,11}$/.test(phone);
};

const FormularioCadastroIgreja = () => {
  const navigate = useNavigate();

  const [churchName, setChurchName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [cpfResponsavel, setCpfResponsavel] = useState('');
  const [telefoneContato, setTelefoneContato] = useState('');
  const [endereco, setEndereco] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [subscriptionPlans, setSubscriptionPlans] = useState<{ value: string; label: string; monthlyValue: number }[]>([]);

  useEffect(() => {
    const fetchPlans = async () => {
        const { data, error } = await supabase
            .from('planos_assinatura')
            .select('id, nome, preco_mensal');
        
        if (data) {
            const formattedPlans = data.map(plan => ({
                value: plan.id,
                label: plan.nome,
                monthlyValue: plan.preco_mensal
            }));
            setSubscriptionPlans(formattedPlans);
            if (formattedPlans.length > 0) {
              setSelectedPlan(formattedPlans[0].value);
            }
        }
    };
    fetchPlans();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validações de campos obrigatórios
    if (!churchName || !adminName || !adminEmail || !adminPassword || !selectedPlan || !cnpj || !cpfResponsavel || !telefoneContato || !endereco) {
      toast.error('Por favor, preencha todos os campos obrigatórios.');
      setIsLoading(false);
      return;
    }
    if (adminPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      setIsLoading(false);
      return;
    }

    // Validações de formato
    if (!validateCnpj(cnpj)) {
      toast.error('Por favor, insira um CNPJ válido.');
      setIsLoading(false);
      return;
    }
    if (!validateCpf(cpfResponsavel)) {
      toast.error('Por favor, insira um CPF válido para o responsável.');
      setIsLoading(false);
      return;
    }
    if (!validatePhone(telefoneContato)) {
      toast.error('Por favor, insira um telefone de contato válido (ex: (DD) 9XXXX-XXXX).');
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPassword,
        options: {
          data: {
            nome_igreja: churchName,
            nome_completo_responsavel: adminName,
            plano_id: selectedPlan,
            initial_role: 'admin',
            cnpj: cnpj,
            cpf_responsavel: cpfResponsavel,
            telefone_contato: telefoneContato,
            endereco: endereco,
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success('Igreja e conta de administrador criadas com sucesso! Verifique seu email para confirmar.');
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

      {/* Novos Campos */}
      <div className="space-y-2">
        <Label htmlFor="cnpj">CNPJ *</Label>
        <div className="relative">
          <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            id="cnpj"
            type="text"
            placeholder="XX.XXX.XXX/XXXX-XX"
            value={cnpj}
            onChange={(e) => setCnpj(e.target.value)}
            className="pl-10 h-12"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cpfResponsavel">CPF do Responsável *</Label>
        <div className="relative">
          <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            id="cpfResponsavel"
            type="text"
            placeholder="XXX.XXX.XXX-XX"
            value={cpfResponsavel}
            onChange={(e) => setCpfResponsavel(e.target.value)}
            className="pl-10 h-12"
            required
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
      {/* Fim dos Novos Campos */}

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