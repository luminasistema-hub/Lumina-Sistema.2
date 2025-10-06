import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { Building, Mail, Lock, Eye, EyeOff, User, Loader2, Phone, Home, FileText, MapPin, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

const ProgressBar = ({ currentStep }: { currentStep: number }) => {
  const steps = ['Administrador', 'Dados da Igreja', 'Plano e Finalização'];
  return (
    <div className="flex items-center justify-between w-full mb-8">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = currentStep >= stepNumber;
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300',
                  isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                )}
              >
                {currentStep > stepNumber ? '✓' : stepNumber}
              </div>
              <p className={cn('mt-2 text-sm text-center', isActive ? 'text-gray-800 font-semibold' : 'text-gray-500')}>
                {step}
              </p>
            </div>
            {stepNumber < steps.length && (
              <div className={cn('flex-1 h-1 mx-2', currentStep > stepNumber ? 'bg-blue-600' : 'bg-gray-200')} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const CadastrarIgrejaPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(1);

  // Step 1: Admin data
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: Church data
  const [churchName, setChurchName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [cep, setCep] = useState('');
  const [endereco, setEndereco] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [telefoneContato, setTelefoneContato] = useState('');
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [isCnpjChecking, setIsCnpjChecking] = useState(false);


  // Step 3: Plan data
  const [selectedPlan, setSelectedPlan] = useState('');
  const [subscriptionPlans, setSubscriptionPlans] = useState<{ value: string; label: string; monthlyValue: number; memberLimit: number; link_pagamento?: string; }[]>([]);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      const { data, error } = await supabase
        .from('planos_assinatura')
        .select('id, nome, preco_mensal, limite_membros, link_pagamento');
      
      if (data) {
        const formattedPlans = data.map(plan => ({
          value: plan.id,
          label: plan.nome,
          monthlyValue: plan.preco_mensal,
          memberLimit: plan.limite_membros,
          link_pagamento: plan.link_pagamento,
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

  useEffect(() => {
    const fetchAddress = async () => {
      const cepDigits = cep.replace(/\D/g, '');
      if (cepDigits.length === 8) {
        setIsCepLoading(true);
        try {
          const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
          const data = await response.json();
          if (!data.erro) {
            setEndereco(data.logradouro);
            setBairro(data.bairro);
            setCidade(data.localidade);
            setEstado(data.uf);
            toast.success('Endereço encontrado!');
          } else {
            toast.error('CEP não encontrado.');
            setEndereco(''); setBairro(''); setCidade(''); setEstado('');
          }
        } catch (error) {
          toast.error('Erro ao buscar CEP. Verifique sua conexão.');
        } finally {
          setIsCepLoading(false);
        }
      }
    };
    fetchAddress();
  }, [cep]);

  const checkCnpjExists = async (cnpjValue: string) => {
    setIsCnpjChecking(true);
    const cleanedCnpj = cnpjValue.replace(/[^\d]+/g, '');
    if (cleanedCnpj.length !== 14) {
      setIsCnpjChecking(false);
      return false;
    }
    try {
      // Usa RPC segura para checar CNPJ
      const { data, error } = await supabase.rpc('is_cnpj_taken', { cnpj_input: cleanedCnpj });
      if (error) {
        console.error('Erro ao verificar CNPJ via RPC:', error.message);
        toast.error('Erro ao verificar CNPJ. Tente novamente.');
        return true; // evita duplicidade em caso de erro
      }
      return Boolean(data);
    } catch (error: any) {
      console.error('Erro inesperado ao verificar CNPJ:', error?.message || error);
      toast.error('Erro ao verificar CNPJ. Tente novamente.');
      return true;
    } finally {
      setIsCnpjChecking(false);
    }
  };

  const nextStep = async () => {
    if (step === 1) {
      if (!adminName || !adminEmail || !adminPassword) {
        return toast.error('Preencha todos os dados do administrador.');
      }
      if (adminPassword.length < 6) {
        return toast.error('A senha deve ter pelo menos 6 caracteres.');
      }
    }
    if (step === 2) {
      if (!churchName || !cnpj || !cep || !endereco || !numero || !cidade || !estado || !telefoneContato) {
        return toast.error('Preencha todos os dados da igreja.');
      }
      const cnpjExists = await checkCnpjExists(cnpj);
      if (cnpjExists) {
        return toast.error('O CNPJ informado já está em uso. Por favor, utilize um CNPJ diferente.');
      }
    }
    setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) {
      toast.error('Por favor, selecione um plano de assinatura.');
      return;
    }
    setIsLoading(true);

    const planDetails = subscriptionPlans.find(p => p.value === selectedPlan);
    if (!planDetails) {
        toast.error('Plano de assinatura inválido. Por favor, recarregue a página.');
        setIsLoading(false);
        return;
    }

    const fullAddress = `${endereco}, ${numero}${complemento ? ` - ${complemento}` : ''}, ${bairro}, ${cidade} - ${estado}`;
    let newChurchId: string | null = null;

    try {
      const { data: churchData, error: churchError } = await supabase
        .from('igrejas')
        .insert({
          nome: churchName,
          cnpj: cnpj.replace(/[^\d]+/g, ''),
          endereco: fullAddress,
          telefone_contato: telefoneContato.replace(/[^\d]+/g, ''),
          email: adminEmail,
          nome_responsavel: adminName,
          plano_id: selectedPlan,
          status: 'active', // Todas as igrejas entram como ativas
          valor_mensal_assinatura: planDetails.monthlyValue,
          limite_membros: planDetails.memberLimit,
          ultimo_pagamento_status: planDetails.monthlyValue === 0 ? 'Confirmado' : 'Pendente',
        })
        .select('id, nome')
        .single();

      if (churchError) throw churchError;
      newChurchId = churchData.id;

      const { error: authError } = await supabase.auth.signUp({
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

      toast.success('Conta criada! Verifique seu email para confirmar o cadastro.');
      
      if (planDetails.monthlyValue === 0) {
        toast.info('Seu plano é gratuito! Acesso liberado após a confirmação do e-mail.');
        navigate('/login');
        return;
      }

      if (newChurchId && planDetails.link_pagamento) {
        toast.loading('Redirecionando para o checkout de pagamento...');
        const finalPaymentLink = planDetails.link_pagamento.replace('{CHURCH_ID}', newChurchId);
        window.location.href = finalPaymentLink;
      } else {
        toast.info('Cadastro concluído. O link de pagamento não foi configurado. Faça login para gerenciar sua assinatura.');
        navigate('/login');
      }

    } catch (err: any) {
      console.error('FormularioCadastroIgreja: Erro no cadastro:', err);
      const mensagem = err.message.includes('User already registered')
        ? 'Este e-mail já está cadastrado.'
        : err.message.includes('duplicate key value')
        ? 'O CNPJ informado já está em uso.'
        : 'Ocorreu um erro ao realizar o cadastro. Tente novamente.';
      toast.error(mensagem);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <CardDescription className="text-center">Comece criando a conta do administrador principal.</CardDescription>
            <div className="space-y-2">
              <Label htmlFor="adminName">Seu Nome Completo *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input id="adminName" type="text" placeholder="Seu nome completo" value={adminName} onChange={(e) => setAdminName(e.target.value)} className="pl-10 h-12" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Seu Email *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input id="adminEmail" type="email" placeholder="seu@email.com" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className="pl-10 h-12" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminPassword">Sua Senha *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input id="adminPassword" type={showPassword ? 'text' : 'password'} placeholder="Mínimo 6 caracteres" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="pl-10 pr-10 h-12" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6">
            <CardDescription className="text-center">Agora, informe os dados da sua igreja.</CardDescription>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="churchName">Nome da Igreja *</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input id="churchName" type="text" placeholder="Nome da sua igreja" value={churchName} onChange={(e) => setChurchName(e.target.value)} className="pl-10 h-12" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ *</Label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  {isCnpjChecking && <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />}
                  <Input id="cnpj" type="text" placeholder="Apenas números" value={cnpj} onChange={(e) => setCnpj(e.target.value)} className="pl-10 h-12" required maxLength={18} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefoneContato">Telefone de Contato *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input id="telefoneContato" type="tel" placeholder="(DD) 9XXXX-XXXX" value={telefoneContato} onChange={(e) => setTelefoneContato(e.target.value)} className="pl-10 h-12" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cep">CEP *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  {isCepLoading && <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />}
                  <Input id="cep" type="text" placeholder="Apenas números" value={cep} onChange={(e) => setCep(e.target.value)} className="pl-10 h-12" required maxLength={9} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço *</Label>
                <Input id="endereco" type="text" placeholder="Rua, Avenida..." value={endereco} onChange={(e) => setEndereco(e.target.value)} className="h-12" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numero">Número *</Label>
                <Input id="numero" type="text" value={numero} onChange={(e) => setNumero(e.target.value)} className="h-12" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="complemento">Complemento</Label>
                <Input id="complemento" type="text" value={complemento} onChange={(e) => setComplemento(e.target.value)} className="h-12" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro *</Label>
                <Input id="bairro" type="text" value={bairro} onChange={(e) => setBairro(e.target.value)} className="h-12" required />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="cidade">Cidade *</Label>
                  <Input id="cidade" type="text" value={cidade} onChange={(e) => setCidade(e.target.value)} className="h-12" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">UF *</Label>
                  <Input id="estado" type="text" value={estado} onChange={(e) => setEstado(e.target.value)} className="h-12" required maxLength={2} />
                </div>
              </div>
            </div>
          </div>
        );
      case 3:
        const selectedPlanDetails = subscriptionPlans.find(p => p.value === selectedPlan);
        return (
          <div className="space-y-6">
            <CardDescription className="text-center">Escolha o plano que melhor se adapta à sua igreja.</CardDescription>
            <div className="space-y-2">
              <Label htmlFor="subscriptionPlan">Plano de Assinatura *</Label>
              <Select value={selectedPlan} onValueChange={setSelectedPlan} disabled={subscriptionPlans.length === 0}>
                <SelectTrigger id="subscriptionPlan" className="h-12">
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
            {selectedPlanDetails && selectedPlanDetails.monthlyValue > 0 && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                <p className="text-sm text-blue-800">
                  Após clicar em "Finalizar Cadastro", você será redirecionado para o nosso checkout de pagamento seguro para ativar sua assinatura.
                </p>
              </div>
            )}
            {selectedPlanDetails && selectedPlanDetails.monthlyValue === 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <p className="text-sm text-green-800">
                  Ótima escolha! O plano gratuito será ativado assim que você confirmar seu e-mail.
                </p>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Cadastre sua Igreja</CardTitle>
          <ProgressBar currentStep={step} />
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">
            {renderStepContent()}
            
            <div className="flex justify-between items-center pt-4">
              {step > 1 ? (
                <Button type="button" variant="outline" onClick={prevStep} disabled={isLoading} className="h-12 px-6">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
              ) : <div />}

              {step < 3 ? (
                <Button type="button" onClick={nextStep} className="h-12 px-6 bg-blue-600 hover:bg-blue-700" disabled={isCnpjChecking}>
                  Próximo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button type="submit" className="w-full md:w-auto h-12 text-lg font-semibold bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 transition-opacity" disabled={isLoading}>
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Finalizando...
                    </div>
                  ) : (
                    'Finalizar Cadastro'
                  )}
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CadastrarIgrejaPage;