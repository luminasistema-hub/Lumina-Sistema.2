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
  Trash2,
  Briefcase,
  Clock,
  Sparkles
} from 'lucide-react'
import { useNavigate } from 'react-router-dom' 
import AddKidDialog from './AddKidDialog';

interface PersonalInfoData {
  nomeCompleto: string
  dataNascimento: string | null
  estadoCivil: string | null
  profissao: string | null
  telefone: string | null
  email: string
  endereco: string | null
  conjugeId: string | null
  conjugeNome?: string
  conjugeNomeExterno: string | null
  dataCasamento: string | null
  paisCristaos: string | null
  tempoIgreja: string | null
  batizado: boolean
  dataBatismo: string | null
  participaMinisterio: boolean
  ministerioAnterior: string | null
  experienciaAnterior: string | null
  dataConversao: string | null
  diasDisponiveis: string[]
  horariosDisponiveis: string | null
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
    dataNascimento: null,
    estadoCivil: null,
    profissao: null,
    telefone: null,
    email: user?.email || '',
    endereco: null,
    conjugeId: null,
    conjugeNomeExterno: null,
    dataCasamento: null,
    paisCristaos: null,
    tempoIgreja: null,
    batizado: false,
    dataBatismo: null,
    participaMinisterio: false,
    ministerioAnterior: null, 
    experienciaAnterior: null,
    dataConversao: null,
    diasDisponiveis: [],
    horariosDisponiveis: null
  })
  const [latestVocationalTest, setLatestVocationalTest] = useState<VocationalTestResult | null>(null);
  const [vocationalTestHistory, setVocationalTestHistory] = useState<VocationalTestResult[]>([]);
  const [userKids, setUserKids] = useState<Kid[]>([]);
  const [isAddKidDialogOpen, setIsAddKidDialogOpen] = useState(false);
  const [memberOptions, setMemberOptions] = useState<MemberOption[]>([]);
  const [conjugeSearchTerm, setConjugeSearchTerm] = useState('');
  const [filteredConjugeOptions, setFilteredConjugeOptions] = useState<MemberOption[]>([]);
  const [isConjugeMember, setIsConjugeMember] = useState(true);

  const loadProfileAndKidsData = useCallback(async () => {
    if (!user || !currentChurchId) return;

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

    if (personalInfoRecord) {
      let conjugeNome = '';
      if (personalInfoRecord.conjuge_id) {
        const { data: conjugeData } = await supabase
          .from('membros')
          .select('nome_completo')
          .eq('id', personalInfoRecord.conjuge_id)
          .single();
        if (conjugeData) conjugeNome = conjugeData.nome_completo;
        setIsConjugeMember(true);
      } else if (personalInfoRecord.conjuge_nome_externo) {
        setIsConjugeMember(false);
      }

      setFormData({
        nomeCompleto: user.name,
        email: user.email,
        dataNascimento: personalInfoRecord.data_nascimento,
        estadoCivil: personalInfoRecord.estado_civil,
        profissao: personalInfoRecord.profissao,
        telefone: personalInfoRecord.telefone,
        endereco: personalInfoRecord.endereco,
        conjugeId: personalInfoRecord.conjuge_id,
        conjugeNome: conjugeNome,
        conjugeNomeExterno: personalInfoRecord.conjuge_nome_externo,
        dataCasamento: personalInfoRecord.data_casamento,
        paisCristaos: personalInfoRecord.pais_cristaos,
        tempoIgreja: personalInfoRecord.tempo_igreja,
        batizado: personalInfoRecord.batizado,
        dataBatismo: personalInfoRecord.data_batismo,
        participaMinisterio: personalInfoRecord.participa_ministerio,
        ministerioAnterior: personalInfoRecord.ministerio_anterior,
        experienciaAnterior: personalInfoRecord.experiencia_anterior,
        dataConversao: personalInfoRecord.data_conversao,
        diasDisponiveis: personalInfoRecord.dias_disponiveis || [],
        horariosDisponiveis: personalInfoRecord.horarios_disponiveis,
      });
    } else {
      setFormData(prev => ({ ...prev, nomeCompleto: user.name, email: user.email }));
    }

    const { data: kidsData, error: kidsError } = await supabase
      .from('criancas')
      .select('id, nome_crianca, data_nascimento, alergias, medicamentos, informacoes_especiais')
      .eq('responsavel_id', user.id)
      .order('nome_crianca', { ascending: true });

    if (kidsError) {
      toast.error('Erro ao carregar informações dos filhos.');
    } else {
      const formattedKids: Kid[] = (kidsData || []).map(k => ({
        ...k,
        idade: Math.floor((new Date().getTime() - new Date(k.data_nascimento).getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
      }));
      setUserKids(formattedKids);
    }

    const { data: tests, error: testsError } = await supabase
      .from('testes_vocacionais')
      .select('id, data_teste, ministerio_recomendado, is_ultimo')
      .eq('membro_id', user.id)
      .order('data_teste', { ascending: false });

    if (testsError) {
      toast.error('Erro ao carregar histórico de testes vocacionais.');
    } else if (tests && tests.length > 0) {
      const latest = tests.find(test => test.is_ultimo) || tests[0];
      setLatestVocationalTest(latest);
      setVocationalTestHistory(tests.filter(test => test.id !== latest.id));
    } else {
      setLatestVocationalTest(null);
      setVocationalTestHistory([]);
    }

    if (!user.perfil_completo) {
      setIsFirstAccess(true);
      setIsEditing(true);
    } else {
      setIsFirstAccess(false);
      setIsEditing(false);
    }
  }, [user, currentChurchId]);

  const loadMemberOptions = useCallback(async () => {
    if (!currentChurchId || !user?.id) return;
    const { data, error } = await supabase
      .from('membros')
      .select('id, nome_completo, email')
      .eq('id_igreja', currentChurchId)
      .eq('status', 'ativo')
      .neq('id', user.id)
      .order('nome_completo', { ascending: true });

    if (error) {
      toast.error('Erro ao carregar opções de membros.');
    } else {
      setMemberOptions(data as MemberOption[]);
      setFilteredConjugeOptions(data as MemberOption[]);
    }
  }, [currentChurchId, user?.id]);

  useEffect(() => {
    loadProfileAndKidsData();
    loadMemberOptions();
  }, [loadProfileAndKidsData, loadMemberOptions]);

  useEffect(() => {
    setFilteredConjugeOptions(
      conjugeSearchTerm
        ? memberOptions.filter(member =>
            member.nome_completo.toLowerCase().includes(conjugeSearchTerm.toLowerCase()) ||
            member.email.toLowerCase().includes(conjugeSearchTerm.toLowerCase())
          )
        : memberOptions
    );
  }, [conjugeSearchTerm, memberOptions]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCheckboxChange = (field: string, value: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: checked
        ? [...prev.diasDisponiveis, value]
        : prev.diasDisponiveis.filter(item => item !== value)
    }))
  }

  const handleSave = async () => {
    if (!user || !currentChurchId) {
      toast.error('Erro: Usuário ou igreja não identificados.')
      return
    }
    
    if (!formData.nomeCompleto || !formData.telefone || !formData.endereco) {
      toast.error('Por favor, preencha os campos obrigatórios: Nome, Telefone e Endereço.')
      return
    }

    const personalInfoPayload = {
      membro_id: user.id,
      id_igreja: currentChurchId,
      telefone: formData.telefone,
      endereco: formData.endereco,
      data_nascimento: formData.dataNascimento || null,
      estado_civil: formData.estadoCivil || null,
      profissao: formData.profissao || null,
      conjuge_id: isConjugeMember ? formData.conjugeId || null : null,
      conjuge_nome_externo: !isConjugeMember ? formData.conjugeNomeExterno || null : null,
      data_casamento: formData.dataCasamento || null,
      pais_cristaos: formData.paisCristaos || null,
      tempo_igreja: formData.tempoIgreja || null,
      batizado: formData.batizado,
      data_batismo: formData.dataBatismo || null,
      participa_ministerio: formData.participaMinisterio,
      ministerio_anterior: formData.ministerioAnterior || null,
      experienciaAnterior: formData.experienciaAnterior || null,
      data_conversao: formData.dataConversao || null,
      dias_disponiveis: formData.diasDisponiveis.length > 0 ? formData.diasDisponiveis : null,
      horariosDisponiveis: formData.horariosDisponiveis || null,
      updated_at: new Date().toISOString(),
    };

    console.log('Payload sendo enviado para informacoes_pessoais:', personalInfoPayload);

    const { error: upsertError } = await supabase
      .from('informacoes_pessoais')
      .upsert(personalInfoPayload, { onConflict: 'membro_id' });

    if (upsertError) {
      toast.error('Erro ao salvar informações: ' + upsertError.message);
      console.error('Erro no upsert do Supabase:', upsertError);
      return;
    }

    const { error: membrosUpdateError } = await supabase
      .from('membros')
      .update({ perfil_completo: true, nome_completo: formData.nomeCompleto })
      .eq('id', user.id);

    if (membrosUpdateError) {
      toast.error('Erro ao atualizar status do perfil: ' + membrosUpdateError.message);
      return;
    }

    await checkAuth();
    setIsFirstAccess(false)
    setIsEditing(false)
    toast.success('Informações salvas com sucesso!')
  }

  const handleDeleteKid = async (kidId: string) => {
    if (!confirm('Tem certeza que deseja remover esta criança?')) return;
    const { error } = await supabase.from('criancas').delete().eq('id', kidId);
    if (error) {
      toast.error('Erro ao remover criança: ' + error.message);
    } else {
      toast.success('Criança removida com sucesso!');
      loadProfileAndKidsData();
    }
  };

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
        Selecione uma igreja para gerenciar suas informações.
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
              Para começarmos, precisamos conhecer você melhor. Preencha suas informações.
            </p>
          </div>
        )}

        <form className="space-y-8" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          {/* Cards de Formulário */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="w-5 h-5" />Dados Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nomeCompleto">Nome Completo *</Label>
                <Input id="nomeCompleto" value={formData.nomeCompleto || ''} onChange={(e) => handleInputChange('nomeCompleto', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                <Input id="dataNascimento" type="date" value={formData.dataNascimento || ''} onChange={(e) => handleInputChange('dataNascimento', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estadoCivil">Estado Civil</Label>
                <Select value={formData.estadoCivil || ''} onValueChange={(value) => handleInputChange('estadoCivil', value)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
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
                <Input id="profissao" value={formData.profissao || ''} onChange={(e) => handleInputChange('profissao', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone *</Label>
                <Input id="telefone" value={formData.telefone || ''} onChange={(e) => handleInputChange('telefone', e.target.value)} placeholder="(00) 90000-0000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={formData.email || ''} disabled />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MapPin className="w-5 h-5" />Endereço</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="endereco">Endereço Completo *</Label>
                <Input id="endereco" value={formData.endereco || ''} onChange={(e) => handleInputChange('endereco', e.target.value)} placeholder="Rua, número, bairro, cidade - UF" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" />Informações Familiares</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.estadoCivil === 'casado' && (
                <>
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="isConjugeMember"
                      checked={isConjugeMember}
                      onCheckedChange={(checked) => setIsConjugeMember(checked as boolean)}
                    />
                    <Label htmlFor="isConjugeMember">Cônjuge é membro da igreja?</Label>
                  </div>

                  {isConjugeMember ? (
                    <div className="space-y-2">
                      <Label htmlFor="conjugeId">Nome do Cônjuge</Label>
                      <Select value={formData.conjugeId || ''} onValueChange={(value) => handleInputChange('conjugeId', value)}>
                        <SelectTrigger><SelectValue placeholder="Selecione o cônjuge (membro da igreja)" /></SelectTrigger>
                        <SelectContent>
                          <Input placeholder="Buscar membro..." value={conjugeSearchTerm} onChange={(e) => setConjugeSearchTerm(e.target.value)} className="mb-2" />
                          <SelectItem value="nenhum">Nenhum</SelectItem>
                          {filteredConjugeOptions.map(member => (
                            <SelectItem key={member.id} value={member.id}>{member.nome_completo}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="conjugeNomeExterno">Nome do Cônjuge</Label>
                      <Input
                        id="conjugeNomeExterno"
                        value={formData.conjugeNomeExterno || ''}
                        onChange={(e) => handleInputChange('conjugeNomeExterno', e.target.value)}
                        placeholder="Digite o nome completo do cônjuge"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="dataCasamento">Data do Casamento</Label>
                    <Input id="dataCasamento" type="date" value={formData.dataCasamento || ''} onChange={(e) => handleInputChange('dataCasamento', e.target.value)} />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="paisCristaos">Seus pais são cristãos?</Label>
                <Select value={formData.paisCristaos || ''} onValueChange={(value) => handleInputChange('paisCristaos', value)}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sim">Sim, ambos</SelectItem>
                    <SelectItem value="um">Apenas um</SelectItem>
                    <SelectItem value="nao">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Church className="w-5 h-5" />Vida Espiritual e Ministerial</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataConversao">Data da Conversão</Label>
                  <Input id="dataConversao" type="date" value={formData.dataConversao || ''} onChange={(e) => handleInputChange('dataConversao', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tempoIgreja">Há quanto tempo na igreja?</Label>
                  <Select value={formData.tempoIgreja || ''} onValueChange={(value) => handleInputChange('tempoIgreja', value)}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="menos-1-mes">Menos de 1 mês</SelectItem>
                      <SelectItem value="1-6-meses">1 a 6 meses</SelectItem>
                      <SelectItem value="6-12-meses">6 meses a 1 ano</SelectItem>
                      <SelectItem value="mais-1-ano">Mais de 1 ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox id="batizado" checked={formData.batizado} onCheckedChange={(checked) => handleInputChange('batizado', !!checked)} />
                <Label htmlFor="batizado">Sou batizado</Label>
              </div>
              {formData.batizado && (
                <div className="space-y-2">
                  <Label htmlFor="dataBatismo">Data do Batismo</Label>
                  <Input id="dataBatismo" type="date" value={formData.dataBatismo || ''} onChange={(e) => handleInputChange('dataBatismo', e.target.value)} />
                </div>
              )}
              <div className="flex items-center space-x-2 pt-4">
                <Checkbox id="participaMinisterio" checked={formData.participaMinisterio} onCheckedChange={(checked) => handleInputChange('participaMinisterio', !!checked)} />
                <Label htmlFor="participaMinisterio">Já participa de algum ministério?</Label>
              </div>
              {formData.participaMinisterio && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="ministerioAnterior">Qual ministério?</Label>
                    <Select value={formData.ministerioAnterior || ''} onValueChange={(value) => handleInputChange('ministerioAnterior', value)}>
                      <SelectTrigger><SelectValue placeholder="Selecione o ministério" /></SelectTrigger>
                      <SelectContent>
                        {ministerios.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experienciaAnterior">Descreva sua experiência</Label>
                    <Textarea id="experienciaAnterior" value={formData.experienciaAnterior || ''} onChange={(e) => handleInputChange('experienciaAnterior', e.target.value)} />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5" />Disponibilidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Dias disponíveis para servir</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2">
                  {diasSemana.map(dia => (
                    <div key={dia} className="flex items-center space-x-2">
                      <Checkbox id={`dia-${dia}`} checked={formData.diasDisponiveis.includes(dia)} onCheckedChange={(checked) => handleCheckboxChange('diasDisponiveis', dia, !!checked)} />
                      <Label htmlFor={`dia-${dia}`}>{dia}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="horariosDisponiveis">Horários disponíveis</Label>
                <Input id="horariosDisponiveis" value={formData.horariosDisponiveis || ''} onChange={(e) => handleInputChange('horariosDisponiveis', e.target.value)} placeholder="Ex: Noites, Sábados à tarde" />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit">
              <Save className="w-4 h-4 mr-2" />
              Salvar Informações
            </Button>
          </div>
        </form>

        {user && currentChurchId && (
          <AddKidDialog isOpen={isAddKidDialogOpen} onClose={() => setIsAddKidDialogOpen(false)} responsibleId={user.id} responsibleName={user.name} responsibleEmail={user.email} churchId={currentChurchId} onKidAdded={loadProfileAndKidsData} />
        )}
      </div>
    )
  }

  // VIEW MODE
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
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      {/* Cards de Visualização */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-lg"><User className="w-5 h-5" />Dados Pessoais</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div><p className="text-sm text-gray-500">Nome</p><p className="font-medium">{formData.nomeCompleto}</p></div>
            <div><p className="text-sm text-gray-500">Estado Civil</p><p className="font-medium">{formData.estadoCivil || 'Não informado'}</p></div>
            <div><p className="text-sm text-gray-500">Profissão</p><p className="font-medium">{formData.profissao || 'Não informado'}</p></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-lg"><Church className="w-5 h-5" />Vida Espiritual</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div><p className="text-sm text-gray-500">Tempo na Igreja</p><p className="font-medium">{formData.tempoIgreja || 'Não informado'}</p></div>
            <div><p className="text-sm text-gray-500">Batizado</p><p className="font-medium">{formData.batizado ? 'Sim' : 'Não'}</p></div>
            <div><p className="text-sm text-gray-500">Participa de Ministério</p><p className="font-medium">{formData.participaMinisterio ? `Sim (${formData.ministerioAnterior || 'N/A'})` : 'Não'}</p></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-lg"><Clock className="w-5 h-5" />Disponibilidade</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-gray-500">Dias</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {formData.diasDisponiveis.length > 0 ? formData.diasDisponiveis.map(dia => <Badge key={dia} variant="outline">{dia}</Badge>) : <p className="text-sm text-gray-400">Nenhum</p>}
              </div>
            </div>
            <div><p className="text-sm text-gray-500">Horários</p><p className="font-medium">{formData.horariosDisponiveis || 'Não informado'}</p></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg"><Baby className="w-5 h-5 text-pink-500" />Meus Filhos</CardTitle>
          <CardDescription>Crianças vinculadas ao seu perfil</CardDescription>
        </CardHeader>
        <CardContent>
          {userKids.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userKids.map((kid) => (
                <div key={kid.id} className="p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="font-medium">{kid.nome_crianca}</p>
                    <p className="text-sm text-gray-600">{kid.idade} anos</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteKid(kid.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <Baby className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-3">Nenhuma criança cadastrada.</p>
            </div>
          )}
          <div className="mt-4 text-center"> {/* Always show the add kid button */}
            <Button onClick={() => setIsAddKidDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Adicionar Criança</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-purple-500" />Teste Vocacional</CardTitle>
        </CardHeader>
        <CardContent>
          {latestVocationalTest ? (
            <div className="space-y-4">
              <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
                <h3 className="font-semibold text-purple-900">Ministério Recomendado</h3>
                <p className="text-lg font-bold text-purple-800">{latestVocationalTest.ministerio_recomendado}</p>
              </div>
              <Button variant="outline" className="w-full" onClick={() => navigate('/dashboard', { state: { activeModule: 'vocational-test' } })}>
                <ArrowRight className="w-4 h-4 mr-2" />
                Ver Detalhes / Refazer Teste
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <Target className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-3">Você ainda não realizou o teste vocacional.</p>
              <Button onClick={() => navigate('/dashboard', { state: { activeModule: 'vocational-test' } })}>
                <ArrowRight className="w-4 h-4 mr-2" />
                Fazer Teste Vocacional
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {user && currentChurchId && (
        <AddKidDialog isOpen={isAddKidDialogOpen} onClose={() => setIsAddKidDialogOpen(false)} responsibleId={user.id} responsibleName={user.name} responsibleEmail={user.email} churchId={currentChurchId} onKidAdded={loadProfileAndKidsData} />
      )}
    </div>
  )
}

export default PersonalInfo