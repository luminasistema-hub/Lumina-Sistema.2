import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Checkbox } from '../ui/checkbox'
import { toast } from 'sonner' 
import { supabase } from '../../integrations/supabase/client' 
import { 
  User, 
  MapPin, 
  Users, 
  Church, 
  Save,
  Edit,
  Target,
  Baby,
  Plus,
  Trash2,
  UserCheck
} from 'lucide-react'
import { Progress } from '../ui/progress'
import { useNavigate } from 'react-router-dom' 
import AddKidDialog from './AddKidDialog';
import PersonalStatusCards from './PersonalStatusCards';
import { Badge } from '../ui/badge'

// Interfaces para tipagem dos dados
interface PersonalInfoData {
  nomeCompleto: string; dataNascimento: string; estadoCivil: string;
  profissao: string; telefone: string; email: string; endereco: string;
  conjugeId: string | null; conjugeNome?: string; dataCasamento: string;
  paisCristaos: string; tempoIgreja: string; batizado: boolean;
  dataBatismo: string; participaMinisterio: boolean; ministerioAtual: string;
  experienciaAnterior: string; dataConversao: string; diasDisponiveis: string[];
  horariosDisponiveis: string;
}
interface VocationalTestResult {
  id: string; data_teste: string; ministerio_recomendado: string; is_ultimo: boolean;
}
interface Kid {
  id: string; nome_crianca: string; data_nascimento: string; idade: number;
  alergias?: string; medicamentos?: string; informacoes_especiais?: string;
}
interface MemberOption {
  id: string; nome_completo: string; email: string;
}
interface CheckinRecord {
  id: string;
  data_checkin: string;
  data_checkout?: string;
  criancas: { nome_crianca: string };
  responsavel_checkin: { nome_completo: string } | null;
  responsavel_checkout: { nome_completo: string } | null;
}

const PersonalInfo = () => {
  const { user, currentChurchId, checkAuth } = useAuthStore()
  const navigate = useNavigate(); 
  const [isEditing, setIsEditing] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [currentStep, setCurrentStep] = useState(1) // 1: Dados pessoais | 2: Endereço e Família | 3: Vida Espiritual
  const [formData, setFormData] = useState<PersonalInfoData>({
    nomeCompleto: user?.name || '', email: user?.email || '', dataNascimento: '',
    estadoCivil: '', profissao: '', telefone: '', endereco: '', conjugeId: null,
    dataCasamento: '', paisCristaos: '', tempoIgreja: '', batizado: false,
    dataBatismo: '', participaMinisterio: false, ministerioAtual: '',
    experienciaAnterior: '', dataConversao: '', diasDisponiveis: [],
    horariosDisponiveis: ''
  })
  const [latestVocationalTest, setLatestVocationalTest] = useState<VocationalTestResult | null>(null);
  const [userKids, setUserKids] = useState<Kid[]>([]);
  const [checkinHistory, setCheckinHistory] = useState<CheckinRecord[]>([]);
  const [isAddKidDialogOpen, setIsAddKidDialogOpen] = useState(false);
  const [memberOptions, setMemberOptions] = useState<MemberOption[]>([]);

  const isFirstAccess = !user?.perfil_completo;

  const loadData = useCallback(async () => {
    if (!user || !currentChurchId) return;

    // Carregar informações pessoais
    const { data: personalInfo, error: personalInfoError } = await supabase
      .from('informacoes_pessoais')
      .select('*')
      .eq('membro_id', user.id)
      .maybeSingle();
    if (personalInfoError) toast.error('Erro ao carregar informações pessoais.');
    
    if (personalInfo) {
      setFormData(prev => ({
        ...prev,
        nomeCompleto: user.name,
        email: user.email,
        telefone: personalInfo.telefone || '',
        endereco: personalInfo.endereco || '',
        profissao: personalInfo.profissao || '',
        dataNascimento: personalInfo.data_nascimento || '',
        estadoCivil: personalInfo.estado_civil || '',
        conjugeId: personalInfo.conjuge_id || null,
        dataCasamento: personalInfo.data_casamento || '',
        paisCristaos: personalInfo.pais_cristaos || '',
        tempoIgreja: personalInfo.tempo_igreja || '',
        batizado: personalInfo.batizado || false,
        dataBatismo: personalInfo.data_batismo || '',
        participaMinisterio: personalInfo.participa_ministerio || false,
        ministerioAtual: personalInfo.ministerio_anterior || '',
        dataConversao: personalInfo.data_conversao || '',
        diasDisponiveis: personalInfo.dias_disponiveis || [],
        horariosDisponiveis: personalInfo.horarios_disponiveis || '',
      }));

      if (personalInfo.conjuge_id) {
        const { data: spouse } = await supabase
          .from('membros')
          .select('nome_completo')
          .eq('id', personalInfo.conjuge_id)
          .maybeSingle();
        if (spouse?.nome_completo) {
          setFormData(prev => ({ ...prev, conjugeNome: spouse.nome_completo }));
        }
      }
    }

    // Carregar filhos
    const responsibleIds = [user.id];
    if (personalInfo?.conjuge_id) responsibleIds.push(personalInfo.conjuge_id);
    const { data: kidsData } = await supabase
      .from('criancas')
      .select('id, nome_crianca, data_nascimento')
      .eq('id_igreja', currentChurchId)
      .in('responsavel_id', responsibleIds)
      .order('nome_crianca');
    const formattedKids: Kid[] = (kidsData || []).map(k => ({
      ...k,
      idade: Math.floor((new Date().getTime() - new Date(k.data_nascimento).getTime()) / 31557600000)
    }));
    setUserKids(formattedKids);

    // Carregar teste vocacional
    const { data: tests } = await supabase
      .from('testes_vocacionais')
      .select('id, data_teste, ministerio_recomendado, is_ultimo')
      .eq('membro_id', user.id)
      .order('data_teste', { ascending: false });
    if (tests?.length) {
      setLatestVocationalTest(tests.find(t => t.is_ultimo) || tests[0]);
    }

    // Carregar membros para seleção de cônjuge
    const { data: members } = await supabase.from('membros').select('id, nome_completo, email')
      .eq('id_igreja', currentChurchId).eq('status', 'ativo').neq('id', user.id)
      .order('nome_completo');
    setMemberOptions(members as MemberOption[] || []);

  }, [user, currentChurchId]);

  const loadCheckinHistory = useCallback(async () => {
    if (userKids.length === 0) {
      setCheckinHistory([]);
      return;
    }
    const kidIds = userKids.map(k => k.id);
    const { data, error } = await supabase
      .from('kids_checkin')
      .select(`
        id, data_checkin, data_checkout,
        criancas ( nome_crianca ),
        responsavel_checkin:membros!kids_checkin_responsavel_checkin_id_fkey( nome_completo ),
        responsavel_checkout:membros!kids_checkin_responsavel_checkout_id_fkey( nome_completo )
      `)
      .in('crianca_id', kidIds)
      .order('data_checkin', { ascending: false })
      .limit(5);

    if (error) toast.error('Erro ao carregar histórico de check-in.');
    else setCheckinHistory(data as CheckinRecord[]);
  }, [userKids]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (userKids.length > 0) {
      loadCheckinHistory();
    }
  }, [userKids, loadCheckinHistory]);

  useEffect(() => {
    if (isFirstAccess) {
      setIsEditing(true);
    }
  }, [isFirstAccess]);

  const handleInputChange = (field: string, value: any) => {
    setIsDirty(true);
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!user || !currentChurchId) return toast.error('Usuário ou igreja não identificados.');
    if (!formData.nomeCompleto || !formData.telefone || !formData.endereco) return toast.error('Preencha os campos obrigatórios.');

    const personalInfoPayload = {
      membro_id: user.id, id_igreja: currentChurchId, telefone: formData.telefone,
      endereco: formData.endereco, data_nascimento: formData.dataNascimento || null,
      estado_civil: formData.estadoCivil || null, profissao: formData.profissao || null,
      conjuge_id: formData.conjugeId || null, data_casamento: formData.dataCasamento || null,
      pais_cristaos: formData.paisCristaos || null, tempo_igreja: formData.tempoIgreja || null,
      batizado: formData.batizado, data_batismo: formData.dataBatismo || null,
      participa_ministerio: formData.participaMinisterio, ministerio_anterior: formData.ministerioAtual || null,
      experiencia_anterior: formData.experienciaAnterior || null, data_conversao: formData.dataConversao || null,
      dias_disponiveis: formData.diasDisponiveis.length > 0 ? formData.diasDisponiveis : null,
      horarios_disponiveis: formData.horariosDisponiveis || null,
      updated_at: new Date().toISOString(),
    };

    const promise = async () => {
      const { error: upsertError } = await supabase.from('informacoes_pessoais').upsert(personalInfoPayload, { onConflict: 'membro_id' });
      if (upsertError) throw upsertError;
      const { error: membrosUpdateError } = await supabase.from('membros').update({ perfil_completo: true, nome_completo: formData.nomeCompleto }).eq('id', user.id);
      if (membrosUpdateError) throw membrosUpdateError;
    };
    
    toast.promise(promise(), {
      loading: 'Salvando informações...',
      success: () => {
        checkAuth(); // Força a atualização do perfil do usuário no estado global
        setIsDirty(false);
        setIsEditing(false);
        return 'Informações salvas com sucesso!';
      },
      error: (err) => `Erro ao salvar: ${err.message}`,
    });
  }

  const handleDeleteKid = async (kidId: string) => {
    const loadingId = toast.loading('Removendo criança...');
    const { error } = await supabase.from('criancas').delete().eq('id', kidId);
    if (error) {
      toast.dismiss(loadingId);
      toast.error(`Falha ao remover: ${error.message}`);
      return;
    }
    await loadData();
    toast.dismiss(loadingId);
    toast.success('Criança removida!');
  };

  // --- MODO DE EDIÇÃO (FORMULÁRIO) ---
  if (isEditing) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        {isFirstAccess && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
            <h1 className="text-3xl font-bold mb-2">Bem-vindo(a), {user?.name}! 🙏</h1>
            <p className="text-blue-100 text-lg">Para começarmos, preencha suas informações pessoais.</p>
          </div>
        )}
        <PersonalStatusCards />
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">Etapa {currentStep} de 3</p>
            <span className="text-xs text-gray-500 hidden sm:inline">
              {currentStep === 1 ? 'Dados Pessoais' : currentStep === 2 ? 'Endereço e Família' : 'Vida Espiritual'}
            </span>
          </div>
          <Progress value={currentStep * (100 / 3)} />
        </div>
        <form className="space-y-8">
          {currentStep === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3"><User className="text-blue-500"/>Dados Pessoais</CardTitle>
              <CardDescription>Informações básicas sobre você.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-2"><Label htmlFor="nomeCompleto">Nome Completo *</Label><Input id="nomeCompleto" value={formData.nomeCompleto ?? ''} onChange={(e) => handleInputChange('nomeCompleto', e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="dataNascimento">Data de Nascimento</Label><Input id="dataNascimento" type="date" value={formData.dataNascimento ?? ''} onChange={(e) => handleInputChange('dataNascimento', e.target.value)} /></div>
              <div className="space-y-2">
                <Label htmlFor="estadoCivil">Estado Civil</Label>
                <Select value={formData.estadoCivil || ''} onValueChange={(v) => handleInputChange('estadoCivil', v === 'null' ? null : v)}>
                  <SelectTrigger id="estadoCivil"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">Não informado</SelectItem>
                    <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                    <SelectItem value="casado">Casado(a)</SelectItem>
                    <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                    <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label htmlFor="profissao">Profissão</Label><Input id="profissao" value={formData.profissao ?? ''} onChange={(e) => handleInputChange('profissao', e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="telefone">Telefone *</Label><Input id="telefone" value={formData.telefone ?? ''} onChange={(e) => handleInputChange('telefone', e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={formData.email ?? ''} disabled /></div>
            </CardContent>
          </Card>
          )}

          {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3"><MapPin className="text-green-500"/>Endereço</CardTitle>
              <CardDescription>Onde você mora.</CardDescription>
            </CardHeader>
            <CardContent>
              <Label htmlFor="endereco">Endereço Completo *</Label>
              <Input id="endereco" value={formData.endereco ?? ''} onChange={(e) => handleInputChange('endereco', e.target.value)} />
            </CardContent>
          </Card>
          )}

          {currentStep === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3"><Users className="text-orange-500"/>Informações Familiares</CardTitle>
              <CardDescription>Sobre sua família.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {formData.estadoCivil === 'casado' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="conjugeId">Cônjuge</Label>
                    <Select value={formData.conjugeId || ''} onValueChange={(v) => handleInputChange('conjugeId', v === 'null' ? null : v)}>
                      <SelectTrigger id="conjugeId"><SelectValue placeholder="Selecione (membro da igreja)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="null">Nenhum</SelectItem>
                        {memberOptions.map(m => (<SelectItem key={m.id} value={m.id}>{m.nome_completo}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dataCasamento">Data do Casamento</Label>
                    <Input id="dataCasamento" type="date" value={formData.dataCasamento ?? ''} onChange={(e) => handleInputChange('dataCasamento', e.target.value)} />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="paisCristaos">Seus pais são cristãos?</Label>
                <Select value={formData.paisCristaos || ''} onValueChange={(v) => handleInputChange('paisCristaos', v === 'null' ? null : v)}>
                  <SelectTrigger id="paisCristaos"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">Não informado</SelectItem>
                    <SelectItem value="sim">Sim, ambos</SelectItem>
                    <SelectItem value="um">Apenas um</SelectItem>
                    <SelectItem value="nao">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Label className="flex items-center gap-2 font-medium text-base"><Baby className="text-pink-500"/>Filhos Cadastrados</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsAddKidDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Adicionar Filho</Button>
                </div>
                {userKids.length > 0 ? (
                  <div className="space-y-2">
                    {userKids.map(kid => (
                      <div key={kid.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                        <div>
                          <p className="font-medium">{kid.nome_crianca}</p>
                          <p className="text-sm text-gray-600">{kid.idade} anos</p>
                        </div>
                        <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:bg-red-100" onClick={() => handleDeleteKid(kid.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-center text-gray-500 italic py-4">Nenhum filho cadastrado.</p>}
              </div>
            </CardContent>
          </Card>
          )}

          {currentStep === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3"><Church className="text-yellow-500"/>Vida Espiritual</CardTitle>
              <CardDescription>Sua jornada com Cristo e na igreja.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-2">
                <Label htmlFor="dataConversao">Data da Conversão</Label>
                <Input id="dataConversao" type="date" value={formData.dataConversao ?? ''} onChange={(e) => handleInputChange('dataConversao', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tempoIgreja">Tempo na igreja?</Label>
                <Select value={formData.tempoIgreja || ''} onValueChange={(v) => handleInputChange('tempoIgreja', v === 'null' ? null : v)}>
                  <SelectTrigger id="tempoIgreja"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="null">Não informado</SelectItem>
                    <SelectItem value="menos-1-mes">Menos de 1 mês</SelectItem>
                    <SelectItem value="1-6-meses">1 a 6 meses</SelectItem>
                    <SelectItem value="6-12-meses">6 a 12 meses</SelectItem>
                    <SelectItem value="mais-1-ano">Mais de 1 ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox id="batizado" checked={formData.batizado} onCheckedChange={(c) => handleInputChange('batizado', !!c)} />
                <Label htmlFor="batizado">Sou batizado</Label>
              </div>
              {formData.batizado && (
                <div className="space-y-2">
                  <Label htmlFor="dataBatismo">Data do Batismo</Label>
                  <Input id="dataBatismo" type="date" value={formData.dataBatismo ?? ''} onChange={(e) => handleInputChange('dataBatismo', e.target.value)} />
                </div>
              )}
            </CardContent>
          </Card>
          )}

          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <div className="flex gap-2">
              {currentStep > 1 && (<Button type="button" variant="outline" onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}>Voltar</Button>)}
            </div>
            <div className="flex gap-2 justify-end">
              {!isFirstAccess && (<Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancelar</Button>)}
              {currentStep < 3 ? (
                <Button type="button" onClick={() => setCurrentStep((s) => Math.min(3, s + 1))} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 text-white font-semibold">Próximo</Button>
              ) : (
                <Button type="button" onClick={handleSave} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 text-white font-semibold"><Save className="w-4 h-4 mr-2" />Salvar Informações</Button>
              )}
            </div>
          </div>
        </form>
        {user && currentChurchId && (
          <AddKidDialog isOpen={isAddKidDialogOpen} onClose={() => setIsAddKidDialogOpen(false)} responsibleId={user.id} responsibleName={user.name} responsibleEmail={user.email} churchId={currentChurchId} onKidAdded={loadData} />
        )}
      </div>
    )
  }
  
  // --- MODO DE VISUALIZAÇÃO ---
  const InfoItem = ({ label, value }: { label: string, value: React.ReactNode }) => (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-0">
      <dt className="text-sm font-medium leading-6 text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm leading-6 text-gray-800 font-medium sm:col-span-2 sm:mt-0">{value || 'Não informado'}</dd>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-gray-800">Meu Perfil</h1><p className="text-gray-500 mt-1">Seus dados pessoais, familiares e ministeriais.</p></div>
        <Button variant="outline" onClick={() => setIsEditing(true)}><Edit className="w-4 h-4 mr-2" />Editar Perfil</Button>
      </div>
      <PersonalStatusCards />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            <CardHeader><CardTitle className="flex items-center gap-3 text-xl"><User className="text-blue-500"/>Dados Pessoais</CardTitle></CardHeader>
            <CardContent className="divide-y divide-gray-100 px-6 pb-6">
              <InfoItem label="Nome Completo" value={formData.nomeCompleto} />
              <InfoItem label="Email" value={formData.email} />
              <InfoItem label="Telefone" value={formData.telefone} />
              <InfoItem label="Endereço" value={formData.endereco} />
              <InfoItem label="Data de Nascimento" value={formData.dataNascimento ? new Date(formData.dataNascimento).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : ''} />
              <InfoItem label="Profissão" value={formData.profissao} />
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardHeader><CardTitle className="flex items-center gap-3 text-xl"><Users className="text-orange-500"/>Família</CardTitle></CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="divide-y divide-gray-100">
                <InfoItem label="Estado Civil" value={formData.estadoCivil} />
                {formData.estadoCivil === 'casado' && <InfoItem label="Cônjuge" value={formData.conjugeNome} />}
                {formData.estadoCivil === 'casado' && <InfoItem label="Data de Casamento" value={formData.dataCasamento ? new Date(formData.dataCasamento).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : ''} />}
              </div>
              <div className="mt-6">
                <h3 className="text-base font-semibold leading-7 text-gray-900 mb-2">Filhos</h3>
                {userKids.length > 0 ? (
                  <ul className="divide-y divide-gray-100">
                    {userKids.map(k => (
                      <li key={k.id} className="flex justify-between gap-x-6 py-3">
                        <div className="flex min-w-0 gap-x-4">
                          <Baby className="h-8 w-8 flex-none text-pink-400 mt-1" />
                          <div className="min-w-0 flex-auto">
                            <p className="text-sm font-semibold leading-6 text-gray-900">{k.nome_crianca}</p>
                            <p className="mt-1 truncate text-xs leading-5 text-gray-500">{k.idade} anos</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-gray-500">Nenhum filho cadastrado.</p>}
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardHeader><CardTitle className="flex items-center gap-3 text-xl"><Church className="text-yellow-500"/>Vida Espiritual</CardTitle></CardHeader>
            <CardContent className="divide-y divide-gray-100 px-6 pb-6">
              <InfoItem label="Data da Conversão" value={formData.dataConversao ? new Date(formData.dataConversao).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : ''} />
              <InfoItem label="Tempo na igreja" value={formData.tempoIgreja} />
              <InfoItem label="Batizado" value={<Badge variant={formData.batizado ? "default" : "outline"}>{formData.batizado ? 'Sim' : 'Não'}</Badge>} />
              {formData.batizado && <InfoItem label="Data do Batismo" value={formData.dataBatismo ? new Date(formData.dataBatismo).toLocaleDateString('pt-BR', {timeZone: 'UTC'}) : ''} />}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-xl"><Target className="text-purple-500"/>Teste Vocacional</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {latestVocationalTest ? (
                <>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <p className="text-sm font-semibold text-purple-800">Ministério Recomendado</p>
                    <p className="text-2xl font-bold text-purple-900">{latestVocationalTest.ministerio_recomendado}</p>
                    <p className="text-xs text-gray-500">Teste de {new Date(latestVocationalTest.data_teste).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <Button variant="outline" className="w-full" onClick={() => navigate('/dashboard', { state: { activeModule: 'vocational-test' } })}>Ver Detalhes / Refazer</Button>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-600 mb-3">Você ainda não realizou o teste vocacional.</p>
                  <Button onClick={() => navigate('/dashboard', { state: { activeModule: 'vocational-test' } })}>Fazer Teste Agora</Button>
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-3 text-xl"><UserCheck className="text-teal-500"/>Histórico de Check-in (Kids)</CardTitle></CardHeader>
            <CardContent className="px-6 pb-6">
              {checkinHistory.length > 0 ? (
                <ul className="divide-y divide-gray-100 -mx-6">
                  {checkinHistory.map(record => (
                    <li key={record.id} className="px-6 py-3">
                      <p className="font-semibold text-gray-800">{record.criancas?.nome_crianca || 'Criança'}</p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-green-600">Check-in:</span> {new Date(record.data_checkin).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        {record.responsavel_checkin?.nome_completo && ` por ${record.responsavel_checkin.nome_completo}`}
                      </p>
                      {record.data_checkout && (
                        <p className="text-sm text-gray-500">
                          <span className="font-medium text-red-600">Check-out:</span> {new Date(record.data_checkout).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          {record.responsavel_checkout?.nome_completo && ` por ${record.responsavel_checkout.nome_completo}`}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">Nenhum histórico de check-in recente encontrado.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
export default PersonalInfo