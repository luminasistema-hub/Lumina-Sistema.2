import { useState, useEffect, useCallback } from 'react'
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
  ArrowRight,
  Baby,
  Plus,
  Trash2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom' 
import AddKidDialog from './AddKidDialog'; // Importar o novo componente

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
  conjugeId: string | null // Alterado para ID do cônjuge
  conjugeNome?: string // Para exibição
  dataCasamento: string // Novo campo
  paisCristaos: string
  
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

interface Kid {
  id: string;
  nome_crianca: string;
  data_nascimento: string;
  idade: number;
  alergias?: string;
  medicamentos?: string;
  informacoes_especiais?: string;
}

interface MemberOption {
  id: string;
  nome_completo: string;
  email: string;
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
    conjugeId: null,
    dataCasamento: '', // Inicializa o novo campo
    paisCristaos: '',
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
  const [userKids, setUserKids] = useState<Kid[]>([]); // Estado para armazenar os filhos do usuário
  const [isAddKidDialogOpen, setIsAddKidDialogOpen] = useState(false); // Estado para controlar o diálogo de adicionar filho
  const [memberOptions, setMemberOptions] = useState<MemberOption[]>([]); // Para o seletor de cônjuge


  const loadProfileAndKidsData = useCallback(async () => {
    if (!user || !currentChurchId) {
      return;
    }

    console.log('PersonalInfo: Attempting to load personal info for user ID:', user.id);
    // Buscar dados da tabela informacoes_pessoais
    const { data: personalInfoRecord, error: personalInfoError } = await supabase
      .from('informacoes_pessoais')
      .select(`
        *,
        conjuge_profile:membros!informacoes_pessoais_conjuge_id_fkey(nome_completo, email)
      `)
      .eq('membro_id', user.id)
      .maybeSingle();

    if (personalInfoError) {
      console.error('Error loading personal info from Supabase:', personalInfoError);
      toast.error('Erro ao carregar informações pessoais.');
      return;
    }

    console.log('Personal info data received:', personalInfoRecord);

    if (personalInfoRecord) {
      setFormData(prev => ({
        ...prev,
        nomeCompleto: user.name, 
        dataNascimento: personalInfoRecord.data_nascimento || '',
        estadoCivil: personalInfoRecord.estado_civil || '',
        profissao: personalInfoRecord.profissao || '',
        telefone: personalInfoRecord.telefone || '',
        email: user.email, 
        endereco: personalInfoRecord.endereco || '',
        conjugeId: personalInfoRecord.conjuge_id || null,
        conjugeNome: personalInfoRecord.conjuge_profile?.nome_completo || '',
        dataCasamento: personalInfoRecord.data_casamento || '',
        paisCristaos: personalInfoRecord.pais_cristaos || '',
        tempoIgreja: personalInfoRecord.tempo_igreja || '',
        batizado: personalInfoRecord.batizado || false,
        dataBatismo: personalInfoRecord.data_batismo || '',
        participaMinisterio: personalInfoRecord.participa_ministerio || false,
        ministerioAtual: personalInfoRecord.ministerio_anterior || '', 
        experienciaAnterior: personalInfoRecord.experiencia_anterior || '',
        dataConversao: personalInfoRecord.data_conversao || '',
        diasDisponiveis: personalInfoRecord.dias_disponiveis || [],
        horariosDisponiveis: personalInfoRecord.horarios_disponiveis || ''
      }));
    } else {
      setFormData(prev => ({ ...prev, nomeCompleto: user.name, email: user.email }));
    }

    // Carregar filhos do usuário
    const { data: kidsData, error: kidsError } = await supabase
      .from('criancas')
      .select('id, nome_crianca, data_nascimento, alergias, medicamentos, informacoes_especiais')
      .eq('responsavel_id', user.id)
      .order('nome_crianca', { ascending: true });

    if (kidsError) {
      console.error('Error loading user kids:', kidsError);
      toast.error('Erro ao carregar informações dos filhos.');
      return;
    }

    const formattedKids: Kid[] = (kidsData || []).map(k => ({
      ...k,
      idade: Math.floor((new Date().getTime() - new Date(k.data_nascimento).getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
    }));
    setUserKids(formattedKids);

    // Carregar testes vocacionais
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
  }, [user, currentChurchId, user?.perfil_completo]);

  const loadMemberOptions = useCallback(async () => {
    if (!currentChurchId || !user?.id) {
      setMemberOptions([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('membros')
        .select('id, nome_completo, email')
        .eq('id_igreja', currentChurchId)
        .eq('status', 'ativo')
        .neq('id', user.id) // Não listar o próprio usuário como cônjuge
        .order('nome_completo', { ascending: true });

      if (error) throw error;
      setMemberOptions(data as MemberOption[]);
    } catch (error: any) {
      console.error('Error loading member options:', error.message);
      toast.error('Erro ao carregar opções de membros: ' + error.message);
    }
  }, [currentChurchId, user?.id]);

  useEffect(() => {
    loadProfileAndKidsData();
    loadMemberOptions();
  }, [loadProfileAndKidsData, loadMemberOptions]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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
    
    console.log('PersonalInfo: Attempting to save personal info:', formData)
    
    if (!formData.nomeCompleto || !formData.telefone || !formData.endereco) {
      toast.error('Por favor, preencha os campos obrigatórios')
      return
    }

    const personalInfoPayload = {
      membro_id: user.id, 
      telefone: formData.telefone,
      endereco: formData.endereco,
      data_nascimento: formData.dataNascimento || null,
      estado_civil: formData.estadoCivil || null,
      profissao: formData.profissao || null,
      conjuge_id: formData.conjugeId || null, // Salva o ID do cônjuge
      data_casamento: formData.dataCasamento || null, // Salva o novo campo
      pais_cristaos: formData.paisCristaos || null,
      tempo_igreja: formData.tempoIgreja || null, 
      batizado: formData.batizado,
      data_batismo: formData.dataBatismo || null,
      participa_ministerio: formData.participaMinisterio,
      ministerio_anterior: formData.ministerioAtual || null, 
      experiencia_anterior: formData.experienciaAnterior || null,
      data_conversao: formData.dataConversao || null,
      dias_disponiveis: formData.diasDisponiveis.length > 0 ? formData.diasDisponiveis : null,
      horariosDisponiveis: formData.horariosDisponiveis || null, 
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from('informacoes_pessoais')
      .upsert(personalInfoPayload, { onConflict: 'membro_id' });

    if (upsertError) {
      console.error('PersonalInfo: Error saving personal info to Supabase:', upsertError);
      toast.error('Erro ao salvar informações pessoais: ' + upsertError.message);
      return;
    }
    console.log('PersonalInfo: informacoes_pessoais upsert successful.');

    // Atualizar o campo perfil_completo na tabela membros
    const { error: membrosUpdateError } = await supabase
      .from('membros') 
      .update({ perfil_completo: true })
      .eq('id', user.id);

    if (membrosUpdateError) {
      console.error('PersonalInfo: Error updating perfil_completo in Supabase:', membrosUpdateError);
      toast.error('Erro ao atualizar status do perfil: ' + membrosUpdateError.message);
      return;
    }
    console.log('PersonalInfo: membros.perfil_completo update successful.');

    // Atualizar o nome do usuário no perfil (se alterado)
    if (formData.nomeCompleto !== user.name) {
      const { error: authUserUpdateError } = await supabase.auth.updateUser({
        data: { full_name: formData.nomeCompleto }
      });
      if (authUserUpdateError) {
        console.error('PersonalInfo: Error updating auth user name:', authUserUpdateError);
        toast.error('Erro ao atualizar nome do usuário: ' + authUserUpdateError.message);
        return;
      }
      console.log('PersonalInfo: auth.users name update successful.');
    }

    await new Promise(resolve => setTimeout(resolve, 500)); 
    
    await checkAuth();
    console.log('PersonalInfo: checkAuth completed after save.');

    setIsFirstAccess(false)
    setIsEditing(false)
    toast.success('Informações salvas com sucesso!')
  }

  const handleDeleteKid = async (kidId: string) => {
    if (!confirm('Tem certeza que deseja remover esta criança? Esta ação é irreversível.')) {
      return;
    }
    if (!user?.id || !currentChurchId) {
      toast.error('Erro: Usuário ou igreja não identificados.');
      return;
    }

    try {
      const { error } = await supabase
        .from('criancas')
        .delete()
        .eq('id', kidId)
        .eq('responsavel_id', user.id) // Garante que o usuário só pode deletar seus próprios filhos
        .eq('id_igreja', currentChurchId);

      if (error) throw error;

      toast.success('Criança removida com sucesso!');
      loadProfileAndKidsData(); // Recarrega a lista de filhos
    } catch (error: any) {
      console.error('Error deleting kid:', error.message);
      toast.error('Erro ao remover criança: ' + error.message);
    }
  };

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
                <Select 
                  value={formData.estadoCivil || ''} 
                  onValueChange={(value) => handleInputChange('estadoCivil', value === 'null' ? '' : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione seu estado civil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">Não informado</SelectItem>
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
                <>
                  <div className="space-y-2">
                    <Label htmlFor="conjugeId">Nome do Cônjuge</Label>
                    <Select
                      value={formData.conjugeId || ''}
                      onValueChange={(value) => handleInputChange('conjugeId', value === 'null' ? null : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o cônjuge (membro da igreja)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null">Nenhum</SelectItem> 
                        {memberOptions.map(member => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.nome_completo} ({member.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataCasamento">Data do Casamento</Label>
                    <Input
                      id="dataCasamento"
                      type="date"
                      value={formData.dataCasamento}
                      onChange={(e) => handleInputChange('dataCasamento', e.target.value)}
                    />
                  </div>
                </>
              )}
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Baby className="w-5 h-5 text-pink-500" />
                    Filhos Cadastrados
                  </Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsAddKidDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Filho
                  </Button>
                </div>
                {userKids.length > 0 ? (
                  <div className="space-y-2">
                    {userKids.map((kid, index) => (
                      <div key={kid.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{kid.nome_crianca}</p>
                          <p className="text-sm text-gray-600">{kid.idade} anos</p>
                          {(kid.alergias || kid.medicamentos) && (
                            <p className="text-xs text-red-500">
                              Atenção: {kid.alergias ? 'Alergias' : ''} {kid.medicamentos ? 'Medicamentos' : ''}
                            </p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteKid(kid.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">Nenhum filho cadastrado.</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paisCristaos">Seus pais são cristãos?</Label>
                  <Select 
                    value={formData.paisCristaos || ''} 
                    onValueChange={(value) => handleInputChange('paisCristaos', value === 'null' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="null">Não informado</SelectItem>
                      <SelectItem value="sim">Sim, ambos</SelectItem>
                      <SelectItem value="um">Apenas um</SelectItem>
                      <SelectItem value="nao">Não</SelectItem>
                      <SelectItem value="nao-sei">Não sei</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações Ministeriais e Espirituais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Church className="w-5 h-5" />
                Vida Espiritual e Ministerial
              </CardTitle>
              <CardDescription>Sua jornada com Cristo e na igreja</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataConversao">Data da Conversão</Label>
                  <Input
                    id="dataConversao"
                    type="date"
                    value={formData.dataConversao}
                    onChange={(e) => handleInputChange('dataConversao', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tempoIgreja">Há quanto tempo frequenta a igreja?</Label>
                  <Select 
                    value={formData.tempoIgreja || ''} 
                    onValueChange={(value) => handleInputChange('tempoIgreja', value === 'null' ? '' : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">Não informado</SelectItem>
                      <SelectItem value="primeiro-dia">É meu primeiro dia</SelectItem>
                      <SelectItem value="menos-1-mes">Menos de 1 mês</SelectItem>
                      <SelectItem value="1-3-meses">1 a 3 meses</SelectItem>
                      <SelectItem value="3-6-meses">3 a 6 meses</SelectItem>
                      <SelectItem value="6-12-meses">6 meses a 1 ano</SelectItem>
                      <SelectItem value="1-2-anos">1 a 2 anos</SelectItem>
                      <SelectItem value="mais-2-anos">Mais de 2 anos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="batizado"
                      checked={formData.batizado}
                      onCheckedChange={(checked) => handleInputChange('batizado', checked)}
                    />
                    <Label htmlFor="batizado">Sou batizado</Label>
                  </div>
                  {formData.batizado && (
                    <Input
                      type="date"
                      value={formData.dataBatismo}
                      onChange={(e) => handleInputChange('dataBatismo', e.target.value)}
                      placeholder="Data do batismo"
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botão de Salvar */}
          <div className="flex justify-end">
            <Button onClick={handleSave} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90">
              <Save className="w-4 h-4 mr-2" />
              Salvar Informações
            </Button>
          </div>
        </form>

        {user && currentChurchId && (
          <AddKidDialog
            isOpen={isAddKidDialogOpen}
            onClose={() => setIsAddKidDialogOpen(false)}
            responsibleId={user.id}
            responsibleName={user.name}
            responsibleEmail={user.email}
            churchId={currentChurchId}
            onKidAdded={loadProfileAndKidsData} // Recarrega os dados após adicionar um filho
          />
        )}
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Informações Pessoais</h1>
          <p className="text-gray-600">Seus dados pessoais e ministeriais</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Perfil Completo
          </Badge>
          <Button 
            variant="outline" 
            onClick={() => setIsEditing(true)}
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="w-5 h-5" />
              Dados Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-gray-500">Nome</p>
              <p className="font-medium">{formData.nomeCompleto}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Estado Civil</p>
              <p className="font-medium">{formData.estadoCivil || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Profissão</p>
              <p className="font-medium">{formData.profissao || 'Não informado'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Church className="w-5 h-5" />
              Vida Espiritual
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-gray-500">Tempo na Igreja</p>
              <p className="font-medium">{formData.tempoIgreja || 'Não informado'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Batizado</p>
              <p className="font-medium">{formData.batizado ? 'Sim' : 'Não'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Participa de Ministério</p>
              <p className="font-medium">{formData.participaMinisterio ? 'Sim' : 'Não'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Heart className="w-5 h-5" />
              Disponibilidade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-gray-500">Dias Disponíveis</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {formData.diasDisponiveis.length > 0 ? (
                  formData.diasDisponiveis.slice(0, 2).map(dia => (
                    <Badge key={dia} variant="outline" className="text-xs">
                      {dia}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">Nenhum informado</p>
                )}
                {formData.diasDisponiveis.length > 2 && (
                  <Badge variant="outline" className="text-xs">
                    +{formData.diasDisponiveis.length - 2}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção de Filhos Cadastrados */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Baby className="w-5 h-5 text-pink-500" />
            Meus Filhos
          </CardTitle>
          <CardDescription>Crianças vinculadas ao seu perfil</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {userKids.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userKids.map((kid) => (
                <div key={kid.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{kid.nome_crianca}</p>
                    <p className="text-sm text-gray-600">{kid.idade} anos</p>
                    {(kid.alergias || kid.medicamentos) && (
                      <p className="text-xs text-red-500">
                        Atenção: {kid.alergias ? 'Alergias' : ''} {kid.medicamentos ? 'Medicamentos' : ''}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteKid(kid.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <Baby className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-3">
                Nenhuma criança cadastrada em seu perfil.
              </p>
              <Button onClick={() => setIsAddKidDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Cadastrar Primeiro Filho
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-500" />
            Resultados do Teste Vocacional
          </CardTitle>
          <CardDescription>Seu ministério recomendado e histórico de testes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {latestVocationalTest ? (
            <>
              <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-purple-900">Último Teste Realizado</h3>
                  <Badge className="bg-purple-100 text-purple-800">
                    {new Date(latestVocationalTest.data_teste).toLocaleDateString('pt-BR')}
                  </Badge>
                </div>
                <p className="text-lg font-bold text-purple-800">
                  Ministério Recomendado: {latestVocationalTest.ministerio_recomendado}
                </p>
              </div>

              {vocationalTestHistory.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Histórico (últimos 6 meses)
                  </h4>
                  <div className="space-y-2">
                    {vocationalTestHistory.map(test => (
                      <div key={test.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">
                          {new Date(test.data_teste).toLocaleDateString('pt-BR')}
                        </span>
                        <Badge variant="outline">
                          {test.ministerio_recomendado}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/dashboard', { state: { activeModule: 'vocational-test' } })}
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Ver Detalhes do Teste / Refazer
              </Button>
            </>
          ) : (
            <div className="text-center py-4">
              <Target className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-3">
                Você ainda não realizou o teste vocacional.
              </p>
              <Button 
                onClick={() => navigate('/dashboard', { state: { activeModule: 'vocational-test' } })}
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Fazer Teste Vocacional
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {isEditing && (
        <div className="space-y-6">
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-blue-500 to-purple-600">
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </Button>
          </div>
        </div>
      )}

      {user && currentChurchId && (
        <AddKidDialog
          isOpen={isAddKidDialogOpen}
          onClose={() => setIsAddKidDialogOpen(false)}
          responsibleId={user.id}
          responsibleName={user.name}
          responsibleEmail={user.email}
          churchId={currentChurchId}
          onKidAdded={loadProfileAndKidsData} // Recarrega os dados após adicionar um filho
        />
      )}
    </div>
  )
}

export default PersonalInfo