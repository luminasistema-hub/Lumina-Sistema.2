import { useState, useEffect, useMemo, useRef } from 'react'
import { useAuthStore, UserRole } from '../../stores/authStore' 
import { useChurchStore } from '../../stores/churchStore'
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
  Users, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Eye,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  UserCheck,
  Crown,
  Shield,
  Church,
  Heart,
  Download,
  Upload,
  MoreHorizontal,
  User as UserIcon,
  Link as LinkIcon,
  Copy,
  Clock,
  XCircle,
  CheckCircle,
  DollarSign,
  Headphones,
  Target,
  Loader2
} from 'lucide-react'
import { trackEvent } from '../../lib/analytics';
import copy from 'copy-to-clipboard';
import { useMembers, MemberProfile } from '@/hooks/useMembers';
import { useQueryClient, useMutation } from '@tanstack/react-query'

type Member = MemberProfile;

const MemberManagementPage = () => {
  const { user, currentChurchId } = useAuthStore()
  const { updateChurch, getChurchById, loadChurches, churches } = useChurchStore()
  const queryClient = useQueryClient();

  const { data: members = [], isLoading, error } = useMembers();

  const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [isAddMemberDialogOpen, setIsAddMemberDialogOpen] = useState(false)
  const [isEditMemberDialogOpen, setIsEditMemberDialogOpen] = useState(false)
  const [isGenerateLinkDialogOpen, setIsGenerateLinkDialogOpen] = useState(false)
  const [generatedLink, setGeneratedLink] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterMinistry, setFilterMinistry] = useState('all')
  const [filterBirthday, setFilterBirthday] = useState('all')
  const [filterWedding, setFilterWedding] = useState('all')
  const [churchesLoaded, setChurchesLoaded] = useState(false); 

  const canManageMembers = user?.role === 'admin' || user?.role === 'pastor' || user?.role === 'lider_ministerio'
  const canEditRoles = user?.role === 'admin' || user?.role === 'pastor'

  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    telefone: '',
    endereco: '',
    data_nascimento: '',
    funcao: 'membro' as UserRole, 
    status: 'pendente' as Member['status'], 
    observacoes: ''
  })

  const [editMemberData, setEditMemberData] = useState<Partial<Member>>({});

  const [memberStats, setMemberStats] = useState<Record<string, {
    ministries: number;
    events: number;
    upcomingEvents: number;
    courses: number;
    progressPercent: number;
  }>>({});
  const [journeyTotalSteps, setJourneyTotalSteps] = useState<number>(0);

  useEffect(() => {
    const fetchChurches = async () => {
      await loadChurches();
      setChurchesLoaded(true); 
    };
    fetchChurches();
  }, [loadChurches]);

  useEffect(() => {
    let filtered = members

    if (searchTerm) {
      filtered = filtered.filter(member => 
        member.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) || 
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.telefone && member.telefone.includes(searchTerm))
      )
    }

    if (filterRole !== 'all') {
      filtered = filtered.filter(member => member.funcao === filterRole)
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(member => member.status === filterStatus)
    }

    if (filterMinistry !== 'all') {
      filtered = filtered.filter(member => 
        member.ministerio_recomendado?.toLowerCase().includes(filterMinistry.toLowerCase())
      )
    }

    if (filterBirthday === 'mes_atual') {
      filtered = filtered.filter(member => isSameMonth(member.data_nascimento))
    }

    if (filterWedding === 'mes_atual') {
      filtered = filtered.filter(member => isSameMonth(member.data_casamento))
    }

    setFilteredMembers(filtered)
  }, [members, searchTerm, filterRole, filterStatus, filterMinistry, filterBirthday, filterWedding])

  const isSameMonth = (dateStr?: string | null) => {
    if (!dateStr) return false;
    const d = new Date(`${dateStr}T00:00:00`);
    const now = new Date();
    return d.getMonth() === now.getMonth();
  };

  const computeJourneyTotalSteps = async (churchId: string) => {
    const { data: trilhas } = await supabase.from('trilhas_crescimento').select('id').eq('id_igreja', churchId).eq('is_ativa', true);
    const trilhaIds = (trilhas || []).map(t => t.id);
    if (trilhaIds.length === 0) { setJourneyTotalSteps(0); return; }
    const { data: etapas } = await supabase.from('etapas_trilha').select('id').in('id_trilha', trilhaIds);
    const etapaIds = (etapas || []).map(e => e.id);
    if (etapaIds.length === 0) { setJourneyTotalSteps(0); return; }
    const { count } = await supabase.from('passos_etapa').select('id', { count: 'exact' }).in('id_etapa', etapaIds);
    setJourneyTotalSteps(count || 0);
  };

  const loadMembersStats = async (churchId: string, membersList: Member[]) => {
    const nowIso = new Date().toISOString();
    const statsEntries = await Promise.all(
      membersList.map(async (m) => {
        const [mins, parts, cursosInscr, prog] = await Promise.all([
          supabase.from('ministerio_voluntarios').select('id', { count: 'exact' }).eq('membro_id', m.id).eq('id_igreja', churchId),
          supabase.from('evento_participantes').select('evento_id', { count: 'exact' }).eq('membro_id', m.id).eq('id_igreja', churchId),
          supabase.from('cursos_inscricoes').select('id', { count: 'exact' }).eq('id_membro', m.id).eq('id_igreja', churchId),
          journeyTotalSteps > 0 ? supabase.from('progresso_membros').select('id', { count: 'exact' }).eq('id_membro', m.id).or('status.neq.pendente,data_conclusao.not.is.null') : Promise.resolve({ count: 0 }),
        ]);
        
        const eventoIds = (parts.data || []).map(p => p.evento_id).filter(Boolean) as string[];
        const { count: upcomingEventsCount } = eventoIds.length > 0 ? await supabase.from('eventos').select('id', { count: 'exact' }).in('id', eventoIds).gt('data_hora', nowIso) : { count: 0 };

        const progressPercent = journeyTotalSteps > 0 ? Math.round(((prog.count || 0) / journeyTotalSteps) * 100) : 0;

        return [m.id, { ministries: mins.count || 0, events: parts.count || 0, upcomingEvents: upcomingEventsCount || 0, courses: cursosInscr.count || 0, progressPercent }] as const;
      })
    );
    setMemberStats(Object.fromEntries(statsEntries));
  };

  useEffect(() => {
    if (currentChurchId && members.length > 0) {
      computeJourneyTotalSteps(currentChurchId);
      loadMembersStats(currentChurchId, members);
    }
  }, [currentChurchId, members]);

  const addMemberMutation = useMutation({
    mutationFn: async (newMemberData: typeof newMember) => {
      if (!newMemberData.name || !newMemberData.email || !currentChurchId) {
        throw new Error('Nome, email e igreja são obrigatórios.');
      }
      const currentChurch = getChurchById(currentChurchId);
      if (currentChurch && currentChurch.membros_atuais >= currentChurch.limite_membros && currentChurch.limite_membros !== Infinity) {
        throw new Error(`Limite de membros atingido para o plano atual (${currentChurch.limite_membros} membros).`);
      }
      const { data, error } = await supabase.auth.signUp({
        email: newMemberData.email,
        password: 'password_temp_123',
        options: {
          data: {
            full_name: newMemberData.name,
            church_name: currentChurch?.nome,
            initial_role: newMemberData.funcao,
            church_id: currentChurchId,
          },
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Membro cadastrado com sucesso! Um email de confirmação foi enviado.');
      if (data.user) {
        trackEvent('add_member', { memberId: data.user.id, memberRole: newMember.funcao });
      }
      queryClient.invalidateQueries({ queryKey: ['members', currentChurchId] });
      setIsAddMemberDialogOpen(false);
      setNewMember({ name: '', email: '', telefone: '', endereco: '', data_nascimento: '', funcao: 'membro', status: 'pendente', observacoes: '' });
    },
    onError: (error: any) => {
      toast.error('Erro ao cadastrar membro: ' + error.message);
    }
  });

  const editMemberMutation = useMutation({
    mutationFn: async (updatedData: { memberId: string, data: Partial<Member> }) => {
      const { memberId, data } = updatedData;
      const { error: membrosError } = await supabase.from('membros').update({
        funcao: data.funcao, status: data.status, nome_completo: data.nome_completo,
        ministerio_recomendado: data.ministerio_recomendado, ultimo_teste_data: data.ultimo_teste_data,
      }).eq('id', memberId);
      if (membrosError) throw membrosError;

      const { error: personalInfoError } = await supabase.from('informacoes_pessoais').update({
        telefone: data.telefone, endereco: data.endereco, data_nascimento: data.data_nascimento,
        data_casamento: data.data_casamento, estado_civil: data.estado_civil, profissao: data.profissao,
        pais_cristaos: data.pais_cristaos, tempo_igreja: data.tempo_igreja, batizado: data.batizado,
        data_batismo: data.data_batismo, participa_ministerio: data.participa_ministerio,
        ministerio_anterior: data.ministerio_anterior, experiencia_anterior: data.experiencia_anterior,
        data_conversao: data.data_conversao, dias_disponiveis: data.dias_disponiveis,
        horarios_disponiveis: data.horarios_disponiveis,
      }).eq('membro_id', memberId);
      if (personalInfoError) throw personalInfoError;
    },
    onSuccess: (_, variables) => {
      toast.success('Membro atualizado com sucesso!');
      trackEvent('edit_member_profile', { memberId: variables.memberId, updatedFields: Object.keys(variables.data) });
      queryClient.invalidateQueries({ queryKey: ['members', currentChurchId] });
      setIsEditMemberDialogOpen(false);
      setSelectedMember(null);
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar membro: ' + error.message);
    }
  });

  const deleteMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      if (!currentChurchId) throw new Error('Nenhuma igreja ativa selecionada.');
      const { error } = await supabase.auth.admin.deleteUser(memberId);
      if (error) throw error;
    },
    onSuccess: (_, memberId) => {
      toast.success('Usuário removido do sistema com sucesso!');
      trackEvent('delete_member', { memberId });
      queryClient.invalidateQueries({ queryKey: ['members', currentChurchId] });
    },
    onError: (error: any) => {
      toast.error('Erro ao remover usuário: ' + error.message);
    }
  });

  const handleAddMember = () => addMemberMutation.mutate(newMember);
  const handleEditMember = () => {
    if (selectedMember) {
      editMemberMutation.mutate({ memberId: selectedMember.id, data: editMemberData });
    }
  };
  const handleDeleteMember = (memberId: string) => {
    if (confirm('Tem certeza que deseja remover este usuário? Esta ação é irreversível.')) {
      deleteMemberMutation.mutate(memberId);
    }
  };

  const handleOpenEditMemberDialog = (member: Member) => {
    setSelectedMember(member);
    setEditMemberData({ ...member });
    setIsEditMemberDialogOpen(true);
  };

  const handleGenerateRegistrationLink = () => {
    if (!currentChurchId) {
      toast.error('Nenhuma igreja selecionada.');
      return;
    }
    const church = getChurchById(currentChurchId);
    if (!church) {
      toast.error('Dados da igreja não encontrados.');
      return;
    }
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/register?churchId=${currentChurchId}&initialRole=membro`;
    setGeneratedLink(link);
    setIsGenerateLinkDialogOpen(true);
    trackEvent('generate_registration_link', { churchId: currentChurchId });
  };

  const handleCopyLink = () => {
    copy(generatedLink);
    toast.success('Link copiado para a área de transferência!');
    trackEvent('copy_registration_link', { churchId: currentChurchId });
  };

  const getRoleIcon = (role: UserRole) => {
    const icons: Record<UserRole, JSX.Element> = {
      super_admin: <Shield className="w-4 h-4" />, admin: <Shield className="w-4 h-4" />, pastor: <Crown className="w-4 h-4" />,
      lider_ministerio: <UserCheck className="w-4 h-4" />, financeiro: <DollarSign className="w-4 h-4" />, voluntario: <Users className="w-4 h-4" />,
      midia_tecnologia: <Headphones className="w-4 h-4" />, integra: <Heart className="w-4 h-4" />, membro: <UserIcon className="w-4 h-4" />
    };
    return icons[role] || <UserIcon className="w-4 h-4" />;
  };

  const getRoleColor = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
      super_admin: 'bg-red-100 text-red-800 border-red-200', admin: 'bg-red-100 text-red-800 border-red-200',
      pastor: 'bg-purple-100 text-purple-800 border-purple-200', lider_ministerio: 'bg-blue-100 text-blue-800 border-blue-200',
      financeiro: 'bg-green-100 text-green-800 border-green-200', voluntario: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      midia_tecnologia: 'bg-indigo-100 text-indigo-800 border-indigo-200', integra: 'bg-pink-100 text-pink-800 border-pink-200',
      membro: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusColor = (status: Member['status']) => {
    const colors: Record<Member['status'], string> = {
      ativo: 'bg-green-100 text-green-800', inativo: 'bg-gray-100 text-gray-800', pendente: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return 'N/A';
    const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
    return age > 0 ? age : 'N/A';
  };

  const statsData = {
    total: members.length,
    active: members.filter(m => m.status === 'ativo').length,
    leaders: members.filter(m => ['lider_ministerio', 'pastor', 'admin', 'super_admin'].includes(m.funcao)).length,
    baptized: members.filter(m => m.batizado).length
  };

  if (!currentChurchId) {
    return <div className="p-6 text-center text-gray-600">Selecione uma igreja para gerenciar os membros.</div>;
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (error) {
    return <div className="p-6 text-center text-red-500">Erro ao carregar membros: {error.message}</div>;
  }

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl md:rounded-2xl p-4 md:p-6 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Gestão de Membros 👥</h1>
        <p className="text-blue-100 text-base md:text-lg">Administre e acompanhe todos os membros da igreja</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><div className="text-xl md:text-2xl font-bold text-blue-600">{statsData.total}</div><div className="text-sm text-gray-600">Total Membros</div></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><div className="text-xl md:text-2xl font-bold text-green-600">{statsData.active}</div><div className="text-sm text-gray-600">Ativos</div></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><div className="text-xl md:text-2xl font-bold text-yellow-600">{statsData.leaders}</div><div className="text-sm text-gray-600">Líderes</div></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4 text-center"><div className="text-xl md:text-2xl font-bold text-orange-600">{statsData.baptized}</div><div className="text-sm text-gray-600">Batizados</div></CardContent></Card>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:flex-1">
          <div className="relative flex-1 lg:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Buscar membros..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <Select value={filterRole} onValueChange={setFilterRole}><SelectTrigger><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Papel" /></SelectTrigger><SelectContent>{/* Options */}</SelectContent></Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger><SelectContent>{/* Options */}</SelectContent></Select>
            <Select value={filterMinistry} onValueChange={setFilterMinistry}><SelectTrigger><SelectValue placeholder="Ministério" /></SelectTrigger><SelectContent>{/* Options */}</SelectContent></Select>
            <Select value={filterBirthday} onValueChange={setFilterBirthday}><SelectTrigger><SelectValue placeholder="Aniversariantes" /></SelectTrigger><SelectContent>{/* Options */}</SelectContent></Select>
            <Select value={filterWedding} onValueChange={setFilterWedding}><SelectTrigger><SelectValue placeholder="Casamento" /></SelectTrigger><SelectContent>{/* Options */}</SelectContent></Select>
          </div>
        </div>
        <div className="flex gap-2 w-full lg:w-auto">
          {canManageMembers && <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}><DialogTrigger asChild><Button className="bg-blue-500 hover:bg-blue-600 flex-1 lg:flex-none"><Plus className="w-4 h-4 mr-2" />Novo Membro</Button></DialogTrigger><DialogContent>{/* Add Member Form */}</DialogContent></Dialog>}
          {canManageMembers && <Button variant="outline" className="flex-1 lg:flex-none" onClick={handleGenerateRegistrationLink} disabled={!currentChurchId || !churchesLoaded}><LinkIcon className="w-4 h-4 mr-2" />Gerar Link</Button>}
          <Button variant="outline" className="hidden sm:flex"><Download className="w-4 h-4 mr-2" />Exportar</Button>
        </div>
      </div>

      <div className="space-y-4">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold">{member.nome_completo}</h3>
                    <Badge className={getRoleColor(member.funcao)}>{getRoleIcon(member.funcao)}<span className="ml-1">{member.funcao}</span></Badge>
                    <Badge className={getStatusColor(member.status)}>{member.status}</Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-2"><Mail className="w-4 h-4" /><span>{member.email}</span></div>
                    {member.telefone && <div className="flex items-center gap-2"><Phone className="w-4 h-4" /><span>{member.telefone}</span></div>}
                    {member.data_nascimento && <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /><span>{calculateAge(member.data_nascimento)} anos</span></div>}
                    {member.ministerio_recomendado && <div className="flex items-center gap-2"><Target className="w-4 h-4" /><span>{member.ministerio_recomendado}</span></div>}
                  </div>
                  <div className="text-xs text-gray-500">Membro desde {new Date(member.created_at).toLocaleDateString('pt-BR')}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedMember(member)}><Eye className="w-4 h-4 mr-2" />Ver Perfil</Button>
                  {(canManageMembers || member.id === user?.id) && <Button variant="outline" size="sm" onClick={() => handleOpenEditMemberDialog(member)}><Edit className="w-4 h-4 mr-2" />Editar</Button>}
                  {(user?.role === 'admin' || user?.role === 'super_admin') && <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDeleteMember(member.id)}><Trash2 className="w-4 h-4" /></Button>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMembers.length === 0 && !isLoading && (
        <Card className="border-0 shadow-sm"><CardContent className="p-12 text-center"><Users className="w-12 h-12 text-gray-400 mx-auto mb-4" /><h3 className="text-lg font-medium">Nenhum membro encontrado</h3><p className="text-gray-600">Tente ajustar os filtros ou cadastre um novo membro.</p></CardContent></Card>
      )}

      {selectedMember && <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}><DialogContent>{/* Member Detail Modal */}</DialogContent></Dialog>}
      {selectedMember && <Dialog open={isEditMemberDialogOpen} onOpenChange={setIsEditMemberDialogOpen}><DialogContent>{/* Edit Member Form */}</DialogContent></Dialog>}
      <Dialog open={isGenerateLinkDialogOpen} onOpenChange={setIsGenerateLinkDialogOpen}><DialogContent>{/* Generate Link Modal */}</DialogContent></Dialog>
    </div>
  )
}

export default MemberManagementPage