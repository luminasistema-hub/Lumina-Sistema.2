import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Checkbox } from '../ui/checkbox'
import { toast } from 'sonner'
import { supabase } from '../../integrations/supabase/client'
import { 
  Baby, 
  Plus, 
  Users, 
  Clock, 
  Shield,
  Heart,
  AlertTriangle,
  CheckCircle,
  UserCheck,
  UserX,
  Search,
  Filter,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Edit,
  Eye,
  QrCode,
  Loader2,
  Trash2
} from 'lucide-react'

interface Kid {
  id: string
  id_igreja: string
  nome_crianca: string
  idade: number
  data_nascimento: string
  responsavel_id: string // ID do membro responsável
  responsavel_nome?: string // Nome do responsável (para exibição, via join)
  email_responsavel?: string // Email do responsável (para exibição, via join)
  informacoes_especiais?: string
  alergias?: string
  medicamentos?: string
  autorizacao_fotos: boolean
  contato_emergencia?: {
    nome: string
    telefone: string
    parentesco: string
  }
  status_checkin?: 'Presente' | 'Ausente'
  ultimo_checkin?: string
  codigo_seguranca?: string
  created_at: string
  updated_at: string
}

interface CheckinRecord {
  id: string
  id_igreja: string
  crianca_id: string
  data_checkin: string
  data_checkout?: string
  responsavel_checkin_id: string
  responsavel_checkin_nome?: string // Para exibição
  responsavel_checkout_id?: string
  responsavel_checkout_nome?: string // Para exibição
  codigo_seguranca: string
  observacoes?: string
  created_at: string
}

interface MemberOption {
  id: string
  nome_completo: string
  email: string
}

const KidsPage = () => {
  const { user, currentChurchId } = useAuthStore()
  const [kids, setKids] = useState<Kid[]>([])
  const [checkinRecords, setCheckinRecords] = useState<CheckinRecord[]>([])
  const [isEditKidDialogOpen, setIsEditKidDialogOpen] = useState(false)
  const [kidToEdit, setKidToEdit] = useState<Kid | null>(null)
  const [selectedKidDetails, setSelectedKidDetails] = useState<Kid | null>(null) // Para o modal de detalhes
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAge, setFilterAge] = useState('all')
  const [viewMode, setViewMode] = useState<'kids' | 'checkin' | 'reports'>('kids')
  const [loading, setLoading] = useState(true)
  const [memberOptions, setMemberOptions] = useState<MemberOption[]>([]) // Para o seletor de responsável

  const canManageKids = user?.role === 'admin' || user?.role === 'pastor' || user?.role === 'lider_ministerio'
  const canDeleteKids = user?.role === 'admin' || user?.role === 'pastor'

  const [editKidForm, setEditKidForm] = useState({
    nome_crianca: '',
    data_nascimento: '',
    responsavel_id: '',
    informacoes_especiais: '',
    alergias: '',
    medicamentos: '',
    autorizacao_fotos: true,
    contato_emergencia_nome: '',
    contato_emergencia_telefone: '',
    contato_emergencia_parentesco: ''
  })

  const loadKidsData = useCallback(async () => {
    if (!currentChurchId || !user?.id) {
      setKids([])
      setCheckinRecords([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      // Descobrir cônjuge do usuário (se houver)
      const { data: ipData } = await supabase
        .from('informacoes_pessoais')
        .select('conjuge_id')
        .eq('membro_id', user.id)
        .maybeSingle();
      const spouseId: string | null = ipData?.conjuge_id || null;

      // Fetch children
      let kidsQuery = supabase
        .from('criancas')
        .select(`
          *,
          membros!criancas_responsavel_id_fkey(nome_completo, email)
        `)
        .eq('id_igreja', currentChurchId)
        .order('nome_crianca', { ascending: true });

      // Membros só podem ver seus próprios filhos (e do cônjuge, se houver vínculo)
      if (!canManageKids) {
        kidsQuery = spouseId
          ? kidsQuery.in('responsavel_id', [user.id, spouseId])
          : kidsQuery.eq('responsavel_id', user.id);
      }

      const { data: kidsData, error: kidsError } = await kidsQuery;

      if (kidsError) throw kidsError;

      const formattedKids: Kid[] = kidsData.map(k => ({
        ...k,
        responsavel_nome: k.membros?.nome_completo || 'Desconhecido',
        email_responsavel: k.membros?.email || '',
        idade: Math.floor((new Date().getTime() - new Date(k.data_nascimento).getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
      }));
      setKids(formattedKids);

      // Fetch check-in records
      let checkinQuery = supabase
        .from('kids_checkin')
        .select(`
          *,
          responsavel_checkin:membros!kids_checkin_responsavel_checkin_id_fkey(nome_completo),
          responsavel_checkout:membros!kids_checkin_responsavel_checkout_id_fkey(nome_completo)
        `)
        .eq('id_igreja', currentChurchId)
        .order('created_at', { ascending: false });

      // Membros só podem ver check-ins de seus próprios filhos (lista já inclui filhos do cônjuge)
      if (!canManageKids) {
        const userKidsIds = formattedKids.map(k => k.id);
        checkinQuery = checkinQuery.in('crianca_id', userKidsIds);
      }

      const { data: checkinData, error: checkinError } = await checkinQuery;

      if (checkinError) throw checkinError;

      const formattedCheckinRecords: CheckinRecord[] = checkinData.map(c => ({
        ...c,
        responsavel_checkin_nome: c.responsavel_checkin?.nome_completo || 'Desconhecido',
        responsavel_checkout_nome: c.responsavel_checkout?.nome_completo || 'Desconhecido',
      }));
      setCheckinRecords(formattedCheckinRecords);

    } catch (error: any) {
      console.error('Error loading Kids data:', error.message);
      toast.error('Erro ao carregar dados do ministério Kids: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [currentChurchId, user?.id, canManageKids]);

  const loadMemberOptions = useCallback(async () => {
    if (!currentChurchId) {
      setMemberOptions([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('membros')
        .select('id, nome_completo, email')
        .eq('id_igreja', currentChurchId)
        .eq('status', 'ativo')
        .order('nome_completo', { ascending: true });

      if (error) throw error;
      setMemberOptions(data as MemberOption[]);
    } catch (error: any) {
      console.error('Error loading member options:', error.message);
      toast.error('Erro ao carregar opções de membros: ' + error.message);
    }
  }, [currentChurchId]);

  useEffect(() => {
    loadKidsData();
    loadMemberOptions();
  }, [loadKidsData, loadMemberOptions]);

  const handleEditKid = async () => {
    if (!kidToEdit?.id || !editKidForm.nome_crianca || !editKidForm.data_nascimento || !editKidForm.responsavel_id || !currentChurchId) {
      toast.error('Nome, data de nascimento e responsável são obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      const responsibleMember = memberOptions.find(m => m.id === editKidForm.responsavel_id);
      if (!responsibleMember) {
        toast.error('Responsável não encontrado.');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('criancas')
        .update({
          nome_crianca: editKidForm.nome_crianca,
          data_nascimento: editKidForm.data_nascimento,
          responsavel_id: editKidForm.responsavel_id,
          email_responsavel: responsibleMember.email,
          informacoes_especiais: editKidForm.informacoes_especiais || null,
          alergias: editKidForm.alergias || null,
          medicamentos: editKidForm.medicamentos || null,
          autorizacao_fotos: editKidForm.autorizacao_fotos,
          contato_emergencia: editKidForm.contato_emergencia_nome ? {
            nome: editKidForm.contato_emergencia_nome,
            telefone: editKidForm.contato_emergencia_telefone,
            parentesco: editKidForm.contato_emergencia_parentesco
          } : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', kidToEdit.id)
        .eq('id_igreja', currentChurchId);

      if (error) throw error;

      toast.success('Informações da criança atualizadas com sucesso!');
      setIsEditKidDialogOpen(false);
      setKidToEdit(null);
      loadKidsData();
    } catch (error: any) {
      console.error('Error updating kid:', error.message);
      toast.error('Erro ao atualizar informações da criança: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKid = async (kidId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta criança e todos os seus registros de check-in? Esta ação é irreversível.')) {
      return;
    }
    if (!currentChurchId) {
      toast.error('Nenhuma igreja ativa selecionada.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('criancas')
        .delete()
        .eq('id', kidId)
        .eq('id_igreja', currentChurchId);

      if (error) throw error;

      toast.success('Criança excluída com sucesso!');
      loadKidsData();
    } catch (error: any) {
      console.error('Error deleting kid:', error.message);
      toast.error('Erro ao excluir criança: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckin = async (kid: Kid) => {
    if (!currentChurchId || !user?.id) {
      toast.error('Nenhuma igreja ativa ou usuário selecionado.');
      return;
    }

    setLoading(true);
    try {
      const codigo = Math.random().toString(36).substr(2, 4).toUpperCase(); // Código de 4 caracteres

      // Atualiza o status da criança
      const { error: updateKidError } = await supabase
        .from('criancas')
        .update({
          status_checkin: 'Presente',
          ultimo_checkin: new Date().toISOString(),
          codigo_seguranca: codigo,
        })
        .eq('id', kid.id)
        .eq('id_igreja', currentChurchId);

      if (updateKidError) throw updateKidError;

      // Cria o registro de check-in
      const { error: insertCheckinError } = await supabase
        .from('kids_checkin')
        .insert({
          id_igreja: currentChurchId,
          crianca_id: kid.id,
          data_checkin: new Date().toISOString(),
          responsavel_checkin_id: user.id,
          codigo_seguranca: codigo,
        });

      if (insertCheckinError) throw insertCheckinError;

      toast.success(`Check-in realizado! Código: ${codigo}`);
      loadKidsData();
    } catch (error: any) {
      console.error('Error during check-in:', error.message);
      toast.error('Erro ao realizar check-in: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async (kid: Kid) => {
    if (!currentChurchId || !user?.id) {
      toast.error('Nenhuma igreja ativa ou usuário selecionado.');
      return;
    }

    setLoading(true);
    try {
      // Atualiza o status da criança
      const { error: updateKidError } = await supabase
        .from('criancas')
        .update({
          status_checkin: 'Ausente',
          codigo_seguranca: null, // Limpa o código de segurança
        })
        .eq('id', kid.id)
        .eq('id_igreja', currentChurchId);

      if (updateKidError) throw updateKidError;

      // Atualiza o registro de check-in mais recente que ainda não tem checkout
      const { error: updateCheckinError } = await supabase
        .from('kids_checkin')
        .update({
          data_checkout: new Date().toISOString(),
          responsavel_checkout_id: user.id,
        })
        .eq('crianca_id', kid.id)
        .is('data_checkout', null) // Apenas o check-in ativo
        .eq('id_igreja', currentChurchId);

      if (updateCheckinError) throw updateCheckinError;

      toast.success('Check-out realizado com sucesso!');
      loadKidsData();
    } catch (error: any) {
      console.error('Error during check-out:', error.message);
      toast.error('Erro ao realizar check-out: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getAgeGroup = (idade: number) => {
    if (idade <= 3) return 'Berçário';
    if (idade <= 6) return 'Infantil';
    if (idade <= 10) return 'Juniores';
    return 'Pré-adolescentes';
  };

  const getAgeGroupColor = (idade: number) => {
    if (idade <= 3) return 'bg-pink-100 text-pink-800';
    if (idade <= 6) return 'bg-blue-100 text-blue-800';
    if (idade <= 10) return 'bg-green-100 text-green-800';
    return 'bg-purple-100 text-purple-800';
  };

  const filteredKids = kids.filter(kid => {
    const matchesSearch = kid.nome_crianca.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (kid.responsavel_nome && kid.responsavel_nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (kid.email_responsavel && kid.email_responsavel.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesAge = filterAge === 'all' || 
                      (filterAge === 'bercario' && kid.idade <= 3) ||
                      (filterAge === 'infantil' && kid.idade > 3 && kid.idade <= 6) ||
                      (filterAge === 'juniores' && kid.idade > 6 && kid.idade <= 10) ||
                      (filterAge === 'pre-adolescentes' && kid.idade > 10);

    return matchesSearch && matchesAge;
  });

  const presentKids = kids.filter(kid => kid.status_checkin === 'Presente');
  const totalKids = kids.length;
  const activeCheckins = checkinRecords.filter(r => !r.data_checkout).length;

  if (!currentChurchId) {
    return (
      <div className="p-6 text-center text-gray-600">
        Selecione uma igreja para gerenciar o ministério Kids.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        <p className="ml-4 text-lg text-gray-600">Carregando dados do ministério Kids...</p>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl md:rounded-2xl p-4 md:p-6 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Kids 👶</h1>
        <p className="text-pink-100 text-base md:text-lg">
          Cuidando das crianças com amor e segurança
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-pink-600">{totalKids}</div>
              <div className="text-sm text-gray-600">Total Kids</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-green-600">{presentKids.length}</div>
              <div className="text-sm text-gray-600">Presentes</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-yellow-600">
                {kids.filter(k => k.alergias || k.medicamentos).length}
              </div>
              <div className="text-sm text-gray-600">Com Restrições</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-blue-600">
                {activeCheckins}
              </div>
              <div className="text-sm text-gray-600">Check-ins Ativos</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as typeof viewMode)}>
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <TabsList className="grid w-full lg:w-auto grid-cols-3">
            <TabsTrigger value="kids">Crianças</TabsTrigger>
            <TabsTrigger value="checkin">Check-in</TabsTrigger>
            {canManageKids && <TabsTrigger value="reports">Relatórios</TabsTrigger>}
          </TabsList>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar criança..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterAge} onValueChange={setFilterAge}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Faixa etária" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as idades</SelectItem>
                <SelectItem value="bercario">Berçário (0-3)</SelectItem>
                <SelectItem value="infantil">Infantil (4-6)</SelectItem>
                <SelectItem value="juniores">Juniores (7-10)</SelectItem>
                <SelectItem value="pre-adolescentes">Pré-adolescentes (11+)</SelectItem>
              </SelectContent>
            </Select>

            {canManageKids && (
              <Dialog> {/* Removido isAddKidDialogOpen e Trigger */}
                <DialogTrigger asChild>
                  <Button className="bg-pink-500 hover:bg-pink-600">
                    <Plus className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Adicionar Kid</span>
                    <span className="sm:hidden">Adicionar</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Cadastrar Nova Criança</DialogTitle>
                    <DialogDescription>
                      Preencha as informações da criança
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      O cadastro de novas crianças agora é feito através da área pessoal do responsável.
                    </p>
                    <Button variant="outline" onClick={() => toast.info('Acesse a área pessoal do membro para cadastrar um filho.')}>
                      Entendi
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <TabsContent value="kids" className="space-y-4">
          <div className="grid gap-4">
            {filteredKids.map((kid) => (
              <Card key={kid.id} className="border-0 shadow-sm">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{kid.nome_crianca}</h3>
                        <div className="flex gap-2">
                          <Badge className={getAgeGroupColor(kid.idade)}>
                            {getAgeGroup(kid.idade)} • {kid.idade} anos
                          </Badge>
                          {kid.status_checkin === 'Presente' && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Presente
                            </Badge>
                          )}
                          {kid.codigo_seguranca && (
                            <Badge variant="outline">
                              <QrCode className="w-3 h-3 mr-1" />
                              {kid.codigo_seguranca}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>{kid.responsavel_nome}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span>{kid.email_responsavel}</span>
                        </div>
                        {kid.ultimo_checkin && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{new Date(kid.ultimo_checkin).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        )}
                      </div>

                      {(kid.alergias || kid.medicamentos || kid.informacoes_especiais) && (
                        <div className="space-y-2">
                          {kid.alergias && (
                            <div className="flex items-start gap-2 p-2 bg-red-50 rounded-lg">
                              <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="text-sm font-medium text-red-800">Alergias:</span>
                                <span className="text-sm text-red-700 ml-1">{kid.alergias}</span>
                              </div>
                            </div>
                          )}
                          {kid.medicamentos && (
                            <div className="flex items-start gap-2 p-2 bg-yellow-50 rounded-lg">
                              <Shield className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="text-sm font-medium text-yellow-800">Medicamentos:</span>
                                <span className="text-sm text-yellow-700 ml-1">{kid.medicamentos}</span>
                              </div>
                            </div>
                          )}
                          {kid.informacoes_especiais && (
                            <div className="flex items-start gap-2 p-2 bg-blue-50 rounded-lg">
                              <Heart className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="text-sm font-medium text-blue-800">Informações:</span>
                                <span className="text-sm text-blue-700 ml-1">{kid.informacoes_especiais}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {kid.status_checkin === 'Ausente' && canManageKids && (
                        <Button 
                          size="sm" 
                          className="bg-green-500 hover:bg-green-600"
                          onClick={() => handleCheckin(kid)}
                        >
                          <UserCheck className="w-4 h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Check-in</span>
                        </Button>
                      )}
                      {kid.status_checkin === 'Presente' && canManageKids && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleCheckout(kid)}
                        >
                          <UserX className="w-4 h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Check-out</span>
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => setSelectedKidDetails(kid)}>
                        <Eye className="w-4 h-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Ver</span>
                      </Button>
                      {canManageKids && (
                        <Button variant="outline" size="sm" onClick={() => { setKidToEdit(kid); setEditKidForm({
                          nome_crianca: kid.nome_crianca,
                          data_nascimento: kid.data_nascimento,
                          responsavel_id: kid.responsavel_id,
                          informacoes_especiais: kid.informacoes_especiais || '',
                          alergias: kid.alergias || '',
                          medicamentos: kid.medicamentos || '',
                          autorizacao_fotos: kid.autorizacao_fotos,
                          contato_emergencia_nome: kid.contato_emergencia?.nome || '',
                          contato_emergencia_telefone: kid.contato_emergencia?.telefone || '',
                          contato_emergencia_parentesco: kid.contato_emergencia?.parentesco || ''
                        }); setIsEditKidDialogOpen(true); }}>
                          <Edit className="w-4 h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Editar</span>
                        </Button>
                      )}
                      {canDeleteKids && (
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteKid(kid.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredKids.length === 0 && (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-8 md:p-12 text-center">
                <Baby className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma criança encontrada</h3>
                <p className="text-gray-600">
                  {searchTerm || filterAge !== 'all' 
                    ? 'Tente ajustar os filtros de busca' 
                    : 'Cadastre a primeira criança do ministério kids'
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="checkin" className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Histórico de Check-ins</h2>
          <div className="space-y-3">
            {checkinRecords.length > 0 ? (
              checkinRecords.map(record => {
                const kid = kids.find(k => k.id === record.crianca_id);
                return (
                  <Card key={record.id} className="border-0 shadow-sm">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{kid?.nome_crianca || 'Criança Desconhecida'}</p>
                        <p className="text-sm text-gray-600">
                          Check-in por {record.responsavel_checkin_nome} em {new Date(record.data_checkin).toLocaleString('pt-BR')}
                        </p>
                        {record.data_checkout && (
                          <p className="text-sm text-gray-600">
                            Check-out por {record.responsavel_checkout_nome} em {new Date(record.data_checkout).toLocaleString('pt-BR')}
                          </p>
                        )}
                        {record.codigo_seguranca && (
                          <Badge variant="outline" className="mt-1">Código: {record.codigo_seguranca}</Badge>
                        )}
                      </div>
                      {!record.data_checkout && (
                        <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8 md:p-12 text-center">
                  <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum registro de check-in</h3>
                  <p className="text-gray-600">
                    Realize o primeiro check-in de uma criança para ver o histórico.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {canManageKids && (
          <TabsContent value="reports" className="space-y-4">
            <div className="text-center py-8">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Relatórios Kids</h3>
              <p className="text-gray-600">
                Relatórios e estatísticas em desenvolvimento
              </p>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {/* Kid Details Dialog */}
      {selectedKidDetails && (
        <Dialog open={!!selectedKidDetails} onOpenChange={() => setSelectedKidDetails(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <Baby className="w-6 h-6 text-pink-500" />
                {selectedKidDetails.nome_crianca}
              </DialogTitle>
              <DialogDescription>
                Detalhes completos da criança
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Idade</Label>
                  <p className="text-gray-900">{selectedKidDetails.idade} anos</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Data de Nascimento</Label>
                  <p className="text-gray-900">{new Date(selectedKidDetails.data_nascimento).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Responsável</Label>
                  <p className="text-gray-900">{selectedKidDetails.responsavel_nome}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Email do Responsável</Label>
                  <p className="text-gray-900">{selectedKidDetails.email_responsavel}</p>
                </div>
              </div>

              {selectedKidDetails.alergias && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Alergias</Label>
                  <p className="text-red-700 font-medium">{selectedKidDetails.alergias}</p>
                </div>
              )}
              {selectedKidDetails.medicamentos && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Medicamentos</Label>
                  <p className="text-yellow-700 font-medium">{selectedKidDetails.medicamentos}</p>
                </div>
              )}
              {selectedKidDetails.informacoes_especiais && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Informações Especiais</Label>
                  <p className="text-blue-700">{selectedKidDetails.informacoes_especiais}</p>
                </div>
              )}
              {selectedKidDetails.contato_emergencia && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Contato de Emergência</Label>
                  <p className="text-gray-900">
                    {selectedKidDetails.contato_emergencia.nome} ({selectedKidDetails.contato_emergencia.parentesco}) - {selectedKidDetails.contato_emergencia.telefone}
                  </p>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium text-gray-500">Autorização de Fotos</Label>
                <p className="text-gray-900">{selectedKidDetails.autorizacao_fotos ? 'Sim' : 'Não'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-500">Status Check-in</Label>
                <Badge className={selectedKidDetails.status_checkin === 'Presente' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {selectedKidDetails.status_checkin}
                </Badge>
              </div>
              {selectedKidDetails.ultimo_checkin && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Último Check-in</Label>
                  <p className="text-gray-900">{new Date(selectedKidDetails.ultimo_checkin).toLocaleString('pt-BR')}</p>
                </div>
              )}
              {selectedKidDetails.codigo_seguranca && (
                <div>
                  <Label className="text-sm font-medium text-gray-500">Código de Segurança</Label>
                  <p className="text-lg font-bold text-purple-600">{selectedKidDetails.codigo_seguranca}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setSelectedKidDetails(null)}>
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Kid Dialog */}
      {kidToEdit && (
        <Dialog open={isEditKidDialogOpen} onOpenChange={setIsEditKidDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Criança: {kidToEdit.nome_crianca}</DialogTitle>
              <DialogDescription>
                Atualize as informações da criança
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-nome_crianca">Nome da Criança *</Label>
                  <Input
                    id="edit-nome_crianca"
                    value={editKidForm.nome_crianca}
                    onChange={(e) => setEditKidForm({...editKidForm, nome_crianca: e.target.value})}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-data_nascimento">Data de Nascimento *</Label>
                  <Input
                    id="edit-data_nascimento"
                    type="date"
                    value={editKidForm.data_nascimento}
                    onChange={(e) => setEditKidForm({...editKidForm, data_nascimento: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-responsavel_id">Responsável *</Label>
                <Select
                  value={editKidForm.responsavel_id}
                  onValueChange={(value) => setEditKidForm({...editKidForm, responsavel_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem> {/* Adicionado para permitir valor vazio */}
                    {memberOptions.map(member => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.nome_completo} ({member.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-alergias">Alergias</Label>
                <Textarea
                  id="edit-alergias"
                  value={editKidForm.alergias}
                  onChange={(e) => setEditKidForm({...editKidForm, alergias: e.target.value})}
                  placeholder="Descreva alergias alimentares ou medicamentosas"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-medicamentos">Medicamentos</Label>
                <Textarea
                  id="edit-medicamentos"
                  value={editKidForm.medicamentos}
                  onChange={(e) => setEditKidForm({...editKidForm, medicamentos: e.target.value})}
                  placeholder="Medicamentos de uso contínuo ou de emergência"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-informacoes_especiais">Informações Especiais</Label>
                <Textarea
                  id="edit-informacoes_especiais"
                  value={editKidForm.informacoes_especiais}
                  onChange={(e) => setEditKidForm({...editKidForm, informacoes_especiais: e.target.value})}
                  placeholder="Comportamento, necessidades especiais, etc."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Contato de Emergência (Opcional)</Label>
                <Input
                  placeholder="Nome do contato"
                  value={editKidForm.contato_emergencia_nome}
                  onChange={(e) => setEditKidForm({...editKidForm, contato_emergencia_nome: e.target.value})}
                />
                <Input
                  placeholder="Telefone do contato"
                  value={editKidForm.contato_emergencia_telefone}
                  onChange={(e) => setEditKidForm({...editKidForm, contato_emergencia_telefone: e.target.value})}
                />
                <Input
                  placeholder="Parentesco"
                  value={editKidForm.contato_emergencia_parentesco}
                  onChange={(e) => setEditKidForm({...editKidForm, contato_emergencia_parentesco: e.target.value})}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="edit-autorizacao_fotos"
                  checked={editKidForm.autorizacao_fotos}
                  onCheckedChange={(checked) => setEditKidForm({...editKidForm, autorizacao_fotos: checked as boolean})}
                />
                <Label htmlFor="edit-autorizacao_fotos">Autorizo fotos e vídeos para divulgação</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditKidDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleEditKid}>
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default KidsPage