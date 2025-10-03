import { useState, useEffect, useCallback } from 'react'
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
  Trash2
} from 'lucide-react'
import { useNavigate } from 'react-router-dom' 
import AddKidDialog from './AddKidDialog';

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

const PersonalInfo = () => {
  const { user, currentChurchId, updateUserProfile } = useAuthStore()
  const navigate = useNavigate(); 
  const [isEditing, setIsEditing] = useState(false)
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
  const [isAddKidDialogOpen, setIsAddKidDialogOpen] = useState(false);
  const [memberOptions, setMemberOptions] = useState<MemberOption[]>([]);

  const loadProfileData = useCallback(async () => {
    if (!user || !currentChurchId) return;

    const { data: personalInfo, error: personalInfoError } = await supabase
      .from('informacoes_pessoais')
      .select('*')
      .eq('membro_id', user.id)
      .maybeSingle();
    if (personalInfoError) toast.error('Erro ao carregar informações pessoais.');
    if (personalInfo) {
      setFormData(prev => ({
        ...prev,
        ...personalInfo,
        nomeCompleto: user.name,
        email: user.email,
        dataNascimento: personalInfo.data_nascimento || '',
        estadoCivil: personalInfo.estado_civil || '',
        conjugeId: personalInfo.conjuge_id || null,
        conjugeNome: '', // será preenchido abaixo, se aplicável
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

      // Buscar nome do cônjuge separadamente se existir conjuge_id
      if (personalInfo.conjuge_id) {
        const { data: spouse, error: spouseError } = await supabase
          .from('membros')
          .select('nome_completo')
          .eq('id', personalInfo.conjuge_id)
          .maybeSingle();
        if (!spouseError && spouse?.nome_completo) {
          setFormData(prev => ({ ...prev, conjugeNome: spouse.nome_completo }));
        }
      }
    }

    const { data: kidsData, error: kidsError } = await supabase.from('criancas')
      .select('id, nome_crianca, data_nascimento, alergias, medicamentos, informacoes_especiais')
      .eq('responsavel_id', user.id).order('nome_crianca');
    if (kidsError) toast.error('Erro ao carregar informações dos filhos.');
    const formattedKids: Kid[] = (kidsData || []).map(k => ({...k, idade: Math.floor((new Date().getTime() - new Date(k.data_nascimento).getTime()) / 31557600000) }));
    setUserKids(formattedKids);

    const { data: tests, error: testsError } = await supabase.from('testes_vocacionais')
      .select('id, data_teste, ministerio_recomendado, is_ultimo').eq('membro_id', user.id)
      .order('data_teste', { ascending: false });
    if (testsError) toast.error('Erro ao carregar testes vocacionais.');
    if (tests?.length) {
      setLatestVocationalTest(tests.find(t => t.is_ultimo) || tests[0]);
    }

    setIsEditing(!user.perfil_completo);
  }, [user, currentChurchId]);

  const loadMemberOptions = useCallback(async () => {
    if (!currentChurchId || !user?.id) return;
    const { data, error } = await supabase.from('membros').select('id, nome_completo, email')
      .eq('id_igreja', currentChurchId).eq('status', 'ativo').neq('id', user.id)
      .order('nome_completo');
    if (error) toast.error('Erro ao carregar membros para seleção.');
    else setMemberOptions(data as MemberOption[]);
  }, [currentChurchId, user?.id]);

  useEffect(() => {
    loadProfileData();
    loadMemberOptions();
  }, [loadProfileData, loadMemberOptions]);

  const handleInputChange = (field: string, value: any) => setFormData(prev => ({ ...prev, [field]: value }));

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
        updateUserProfile({ ...formData });
        setIsEditing(false);
        return 'Informações salvas com sucesso!';
      },
      error: (err) => `Erro ao salvar: ${err.message}`,
    });
  }

  const handleDeleteKid = async (kidId: string) => {
    const promise = () => supabase.from('criancas').delete().eq('id', kidId);
    toast.promise(promise(), {
      loading: 'Removendo criança...',
      success: () => { loadProfileData(); return "Criança removida!"; },
      error: (err) => `Falha ao remover: ${err.message}`,
    });
  };

  const isFirstAccess = !user?.perfil_completo;

  // --- MODO DE EDIÇÃO (FORMULÁRIO) ---
  if (isFirstAccess || isEditing) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        {isFirstAccess && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
            <h1 className="text-3xl font-bold mb-2">Bem-vindo(a), {user?.name}! 🙏</h1>
            <p className="text-blue-100 text-lg">Para começarmos, preencha suas informações pessoais.</p>
          </div>
        )}
        <form className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3"><User className="text-blue-500"/>Dados Pessoais</CardTitle>
              <CardDescription>Informações básicas sobre você.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-2"><Label htmlFor="nomeCompleto">Nome Completo *</Label><Input id="nomeCompleto" value={formData.nomeCompleto} onChange={(e) => handleInputChange('nomeCompleto', e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="dataNascimento">Data de Nascimento</Label><Input id="dataNascimento" type="date" value={formData.dataNascimento} onChange={(e) => handleInputChange('dataNascimento', e.target.value)} /></div>
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
              <div className="space-y-2"><Label htmlFor="profissao">Profissão</Label><Input id="profissao" value={formData.profissao} onChange={(e) => handleInputChange('profissao', e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="telefone">Telefone *</Label><Input id="telefone" value={formData.telefone} onChange={(e) => handleInputChange('telefone', e.target.value)} /></div>
              <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={formData.email} disabled /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3"><MapPin className="text-green-500"/>Endereço</CardTitle>
              <CardDescription>Onde você mora.</CardDescription>
            </CardHeader>
            <CardContent>
              <Label htmlFor="endereco">Endereço Completo *</Label>
              <Input id="endereco" value={formData.endereco} onChange={(e) => handleInputChange('endereco', e.target.value)} />
            </CardContent>
          </Card>

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
                    <Input id="dataCasamento" type="date" value={formData.dataCasamento} onChange={(e) => handleInputChange('dataCasamento', e.target.value)} />
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
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3"><Church className="text-yellow-500"/>Vida Espiritual</CardTitle>
              <CardDescription>Sua jornada com Cristo e na igreja.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-2">
                <Label htmlFor="dataConversao">Data da Conversão</Label>
                <Input id="dataConversao" type="date" value={formData.dataConversao} onChange={(e) => handleInputChange('dataConversao', e.target.value)} />
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
                  <Input id="dataBatismo" type="date" value={formData.dataBatismo} onChange={(e) => handleInputChange('dataBatismo', e.target.value)} />
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="flex justify-end gap-4">
            <Button type="button" variant="ghost" onClick={() => { if(!isFirstAccess) setIsEditing(false) }}>Cancelar</Button>
            <Button type="button" onClick={handleSave} className="bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-90 text-white font-semibold">
              <Save className="w-4 h-4 mr-2" />
              Salvar Informações
            </Button>
          </div>
        </form>
        {user && currentChurchId && (<AddKidDialog isOpen={isAddKidDialogOpen} onClose={() => setIsAddKidDialogOpen(false)} responsibleId={user.id} responsibleName={user.name} responsibleEmail={user.email} churchId={currentChurchId} onKidAdded={loadProfileData}/>)}
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
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Coluna 1: Dados Pessoais e Família */}
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
        </div>
        {/* Coluna 2: Teste Vocacional */}
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
        </div>
      </div>
    </div>
  )
}
export default PersonalInfo