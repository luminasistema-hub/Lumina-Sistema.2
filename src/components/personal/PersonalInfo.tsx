import { useState, useEffect } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Checkbox } from '../ui/checkbox'
import { Badge } from '../ui/badge'
import { toast } from 'sonner' 
import { supabase } from '../../integrations/supabase/client' 
import { 
  User, 
  MapPin, 
  Heart, 
  Users, 
  Church, 
  Calendar,
  Phone,
  Mail,
  Save,
  Edit,
  CheckCircle,
  Target,
  History,
  ArrowRight
} from 'lucide-react'
import { useNavigate } from 'react-router-dom' 

interface PersonalInfoData {
  // Dados Pessoais
  nomeCompleto: string
  dataNascimento: string
  estadoCivil: string
  profissao: string
  telefone: string
  email: string
  
  // Endereço
  endereco: string
  
  // Informações Familiares
  conjuge: string
  filhos: Array<{nome: string, idade: string}>
  paisCristaos: string
  familiarNaIgreja: string
  
  // Informações Ministeriais (mantidas no estado, mas não no formulário)
  tempoIgreja: string
  batizado: boolean
  dataBatismo: string
  participaMinisterio: boolean
  ministerioAtual: string
  experienciaAnterior: string
  dataConversao: string
  
  // Disponibilidade (mantidas no estado, mas não no formulário)
  diasDisponiveis: string[]
  horariosDisponiveis: string
}

interface VocationalTestResult {
  id: string;
  data_teste: string;
  ministerio_recomendado: string;
  is_ultimo: boolean;
}

const PersonalInfo = () => {
  const { user, currentChurchId, checkAuth } = useAuthStore()
  const navigate = useNavigate(); 
  const [isEditing, setIsEditing] = useState(false)
  const [isFirstAccess, setIsFirstAccess] = useState(true) 
  const [formData, setFormData] = useState<PersonalInfoData>({
    nomeCompleto: user?.name || '',
    dataNascimento: '',
    estadoCivil: '',
    profissao: '',
    telefone: '',
    email: user?.email || '',
    endereco: '',
    conjuge: '',
    filhos: [],
    paisCristaos: '',
    familiarNaIgreja: '',
    tempoIgreja: '',
    batizado: false,
    dataBatismo: '',
    participaMinisterio: false,
    ministerioAtual: '',
    experienciaAnterior: '',
    dataConversao: '',
    diasDisponiveis: [],
    horariosDisponiveis: ''
  })
  const [latestVocationalTest, setLatestVocationalTest] = useState<VocationalTestResult | null>(null);
  const [vocationalTestHistory, setVocationalTestHistory] = useState<VocationalTestResult[]>([]);

  useEffect(() => {
    console.log('PersonalInfo component mounted/updated for user:', user?.name, 'church:', currentChurchId, 'perfil_completo:', user?.perfil_completo)
    if (user && currentChurchId) {
      const loadProfileData = async () => {
        console.log('Attempting to load personal info for user ID:', user.id);
        // Buscar dados da tabela informacoes_pessoais
        const { data: personalInfoRecord, error: personalInfoError } = await supabase
          .from('informacoes_pessoais')
          .select('*')
          .eq('membro_id', user.id)
          .maybeSingle();

        if (personalInfoError) {
          console.error('Error loading personal info from Supabase:', personalInfoError);
          toast.error('Erro ao carregar informações pessoais.');
          return;
        }

        console.log('Personal info data received:', personalInfoRecord);

        if (personalInfoRecord) {
          setFormData({
            nomeCompleto: user.name, 
            dataNascimento: personalInfoRecord.data_nascimento || '',
            estadoCivil: personalInfoRecord.estado_civil || '',
            profissao: personalInfoRecord.profissao || '',
            telefone: personalInfoRecord.telefone || '',
            email: user.email, 
            endereco: personalInfoRecord.endereco || '',
            conjuge: personalInfoRecord.conjuge || '',
            filhos: personalInfoRecord.filhos || [],
            paisCristaos: personalInfoRecord.pais_cristaos || '',
            familiarNaIgreja: personalInfoRecord.familiar_na_igreja || '',
            tempoIgreja: personalInfoRecord.tempo_igreja || '',
            batizado: personalInfoRecord.batizado || false,
            dataBatismo: personalInfoRecord.data_batismo || '',
            participaMinisterio: personalInfoRecord.participa_ministerio || false,
            ministerioAtual: personalInfoRecord.ministerio_anterior || '',
            experienciaAnterior: personalInfoRecord.experiencia_anterior || '',
            dataConversao: personalInfoRecord.data_conversao || '',
            diasDisponiveis: personalInfoRecord.dias_disponiveis || [],
            horariosDisponiveis: personalInfoRecord.horarios_disponiveis || ''
          });
        } else {
          setFormData(prev => ({ ...prev, nomeCompleto: user.name, email: user.email }));
        }
      };
      loadProfileData();

      const loadVocationalTests = async () => {
        console.log('Attempting to load vocational tests for user ID:', user.id);
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const { data: tests, error: testsError } = await supabase
          .from('testes_vocacionais')
          .select('id, data_teste, ministerio_recomendado, is_ultimo')
          .eq('membro_id', user.id)
          .gte('data_teste', sixMonthsAgo.toISOString().split('T')[0]) 
          .order('data_teste', { ascending: false });

        if (testsError) {
          console.error('Error loading vocational tests:', testsError);
          toast.error('Erro ao carregar histórico de testes vocacionais.');
          return;
        }

        console.log('Vocational tests data received:', tests);
        if (tests && tests.length > 0) {
          const latest = tests.find(test => test.is_ultimo) || tests[0]; 
          setLatestVocationalTest(latest);
          setVocationalTestHistory(tests.filter(test => test.id !== latest.id));
        } else {
          setLatestVocationalTest(null);
          setVocationalTestHistory([]);
        }
      };
      loadVocationalTests();

      if (!user.perfil_completo) {
        setIsFirstAccess(true);
        setIsEditing(true);
      } else {
        setIsFirstAccess(false);
        setIsEditing(false);
      }
    }
  }, [user, currentChurchId, user?.perfil_completo]) 

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addFilho = () => {
    setFormData(prev => ({
      ...prev,
      filhos: [...prev.filhos, { nome: '', idade: '' }]
    }))
  }

  const removeFilho = (index: number) => {
    setFormData(prev => ({
      ...prev,
      filhos: prev.filhos.filter((_, i) => i !== index)
    }))
  }

  const handleFilhoChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      filhos: prev.filhos.map((filho, i) => 
        i === index ? { ...filho, [field]: value } : filho
      )
    }))
  }

  const handleCheckboxChange = (field: string, value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked 
        ? [...(prev[field as keyof PersonalInfoData] as string[]), value]
        : (prev[field as keyof PersonalInfoData] as string[]).filter(item => item !== value)
    }))
  }

  const formatPhoneNumber = (value: string) => {
    if (!value) return "";
    value = value.replace(/\D/g, ""); 
    if (value.length > 11) value = value.substring(0, 11); 

    if (value.length > 10) {
      return `(${value.substring(0, 2)}) ${value.substring(2, 3)} ${value.substring(3, 7)}-${value.substring(7, 11)}`;
    } else if (value.length > 6) {
      return `(${value.substring(0, 2)}) ${value.substring(2, 6)}-${value.substring(6, 10)}`;
    } else if (value.length > 2) {
      return `(${value.substring(0, 2)}) ${value.substring(2, 6)}`;
    } else if (value.length > 0) {
      return `(${value.substring(0, 2)}`;
    }
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPhoneNumber(e.target.value);
    handleInputChange('telefone', formattedValue);
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let cep = e.target.value.replace(/\D/g, '') 
    
    if (cep.length > 5) {
      cep = cep.substring(0, 5) + '-' + cep.substring(5, 8)
    } else if (cep.length > 8) {
      cep = cep.substring(0, 8)
    }
    
    if (cep.length === 9) { 
      const rawCep = cep.replace('-', '') 
      try {
        const response = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`)
        const data = await response.json()

        if (data.erro) {
          toast.error('CEP não encontrado.')
          handleInputChange('endereco', '')
        } else {
          handleInputChange('endereco', `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`)
          toast.success('Endereço preenchido automaticamente!')
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error)
        toast.error('Erro ao buscar CEP. Tente novamente.')
        handleInputChange('endereco', '')
      }
    }
  }

 const handleSave = async () => {
    if (!user || !currentChurchId) {
      toast.error('Erro: Usuário ou igreja não identificados.')
      return
    }
    
    console.log('--- INICIANDO PROCESSO DE SALVAR ---');
    console.log('Dados do formulário a serem salvos:', formData);

    if (!formData.nomeCompleto || !formData.telefone || !formData.endereco) {
      toast.error('Por favor, preencha nome, telefone e endereço.')
      return
    }

    // 1. Montar payload para a tabela 'informacoes_pessoais'
    const personalInfoPayload = {
      membro_id: user.id, 
      telefone: formData.telefone,
      endereco: formData.endereco,
      data_nascimento: formData.dataNascimento || null,
      estado_civil: formData.estadoCivil || null,
      profissao: formData.profissao || null,
      conjuge: formData.conjuge || null,
      filhos: formData.filhos.length > 0 ? formData.filhos : null,
      pais_cristaos: formData.paisCristaos || null,
      familiar_na_igreja: formData.familiarNaIgreja || null, 
      tempo_igreja: formData.tempoIgreja || null, 
      batizado: formData.batizado,
      data_batismo: formData.dataBatismo || null,
      participa_ministerio: formData.participaMinisterio,
      ministerio_anterior: formData.ministerioAtual || null, 
      experiencia_anterior: formData.experienciaAnterior || null,
      data_conversao: formData.dataConversao || null,
      dias_disponiveis: formData.diasDisponiveis.length > 0 ? formData.diasDisponiveis : null,
      horarios_disponiveis: formData.horariosDisponiveis || null, 
      updated_at: new Date().toISOString(),
    };
    console.log('Payload para "informacoes_pessoais":', personalInfoPayload);

    const { error: upsertError } = await supabase
      .from('informacoes_pessoais')
      .upsert(personalInfoPayload, { onConflict: 'membro_id' });

    if (upsertError) {
      console.error('!!! ERRO AO SALVAR EM "informacoes_pessoais":', upsertError);
      toast.error('Erro ao salvar informações: ' + upsertError.message);
      return;
    }
    console.log('Sucesso ao salvar em "informacoes_pessoais".');

    // 2. Montar payload e atualizar a tabela 'membros'
    const membrosUpdatePayload: { perfil_completo: boolean; nome_completo?: string } = {
        perfil_completo: true,
    };

    if (formData.nomeCompleto !== user.name) {
        membrosUpdatePayload.nome_completo = formData.nomeCompleto;
    }
    console.log('Payload para "membros":', membrosUpdatePayload);

    const { error: membrosUpdateError } = await supabase
      .from('membros') 
      .update(membrosUpdatePayload)
      .eq('id', user.id);

    if (membrosUpdateError) {
      console.error('!!! ERRO AO ATUALIZAR "membros":', membrosUpdateError);
      toast.error('Erro ao atualizar status do perfil: ' + membrosUpdateError.message);
      return;
    }
    console.log('Sucesso ao atualizar "membros".');

    // 3. Recarregar dados de autenticação para refletir as mudanças
    console.log('Atualizando o estado de autenticação...');
    await checkAuth();
    console.log('Estado de autenticação atualizado.');

    setIsFirstAccess(false);
    setIsEditing(false);
    toast.success('Informações salvas com sucesso!');
    console.log('--- PROCESSO DE SALVAR CONCLUÍDO ---');
  }

  const estadosBrasil = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
    'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ]

  const ministerios = [
    'Louvor e Adoração', 'Mídia e Tecnologia', 'Diaconato', 'Integração',
    'Ensino e Discipulado', 'Kids', 'Organização', 'Ação Social'
  ]

  const diasSemana = [
    'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 
    'Sexta-feira', 'Sábado', 'Domingo'
  ]

  if (!currentChurchId) {
    return (
      <div className="p-6 text-center text-gray-600">
        Selecione uma igreja para visualizar/editar suas informações pessoais.
      </div>
    )
  }

  if (isFirstAccess || isEditing) {
    return (
      <div className="p-6 space-y-6">
        {isFirstAccess && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">Bem-vindo(a), {user?.name}! 🙏</h1>
            <p className="text-blue-100 text-lg">
              Para começarmos, precisamos conhecer você melhor. Preencha suas informações pessoais.
            </p>
          </div>
        )}

        <form className="space-y-8">
          {/* Dados Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Dados Pessoais
              </CardTitle>
              <CardDescription>Informações básicas sobre você</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nomeCompleto">Nome Completo *</Label>
                <Input
                  id="nomeCompleto"
                  value={formData.nomeCompleto}
                  onChange={(e) => handleInputChange('nomeCompleto', e.target.value)}
                  placeholder="Seu nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                <Input
                  id="dataNascimento"
                  type="date"
                  value={formData.dataNascimento}
                  onChange={(e) => handleInputChange('dataNascimento', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estadoCivil">Estado Civil</Label>
                <Select value={formData.estadoCivil} onValueChange={(value) => handleInputChange('estadoCivil', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione seu estado civil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                    <SelectItem value="casado">Casado(a)</SelectItem>
                    <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                    <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profissao">Profissão</Label>
                <Input
                  id="profissao"
                  value={formData.profissao}
                  onChange={(e) => handleInputChange('profissao', e.target.value)}
                  placeholder="Sua profissão"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone *</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={handlePhoneChange}
                  placeholder="(00)9 0000-0000"
                  maxLength={15} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="seu@email.com"
                />
              </div>
            </CardContent>
          </Card>

          {/* Endereço */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Endereço
              </CardTitle>
              <CardDescription>Onde você mora</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <Input
                  id="cep"
                  onChange={handleCepChange}
                  placeholder="00000-000"
                  maxLength={9} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço Completo *</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => handleInputChange('endereco', e.target.value)}
                  placeholder="Rua, número, bairro, cidade - UF"
                />
              </div>
            </CardContent>
          </Card>

          {/* Informações Familiares */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Informações Familiares
              </CardTitle>
              <CardDescription>Sobre sua família</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.estadoCivil === 'casado' && (
                <div className="space-y-2">
                  <Label htmlFor="conjuge">Nome do Cônjuge</Label>
                  <Input
                    id="conjuge"
                    value={formData.conjuge}
                    onChange={(e) => handleInputChange('conjuge', e.target.value)}
                    placeholder="Nome do seu cônjuge"
            _message: ""
                />
                </div>
              )}
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Filhos</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addFilho}>
                    Adicionar Filho
                  </Button>
                </div>
                {formData.filhos.map((filho, index) => (
                  <div key={index} className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Nome do filho"
                      value={filho.nome}
                      onChange={(e) => handleFilhoChange(index, 'nome', e.target.value)}
              .