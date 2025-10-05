import { useState, useEffect } from 'react'
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
  Target
} from 'lucide-react'
import { trackEvent } from '../../lib/analytics'; // Importar trackEvent
import copy from 'copy-to-clipboard';

// Define a more accurate interface based on Supabase tables
interface MemberProfile {
  id: string; 
  id_igreja: string; 
  funcao: UserRole; 
  perfil_completo: boolean; 
  nome_completo: string; 
  status: 'ativo' | 'pendente' | 'inativo'; 
  created_at: string; 
  
  // Fields from informacoes_pessoais (joined)
  telefone?: string;
  endereco?: string;
  data_nascimento?: string;
  data_casamento?: string;
  estado_civil?: string;
  profissao?: string;
  conjuge_id?: string | null;
  conjuge_nome?: string; 
  filhos?: Array<{nome: string, idade: number}>; 
  pais_cristaos?: string;
  tempo_igreja?: string; 
  batizado?: boolean;
  data_batismo?: string;
  participa_ministerio?: boolean;
  ministerio_anterior?: string;
  experiencia_anterior?: string;
  data_conversao?: string;
  dias_disponiveis?: string[]; 
  horarios_disponiveis?: string; 

  // Fields from membros (agora a fonte primária)
  ultimo_teste_data?: string; 
  ministerio_recomendado?: string; 
  
  email: string; 
  churchName?: string; 
}

type Member = MemberProfile;

const MemberManagementPage = () => {
  const { user, currentChurchId } = useAuthStore()
  const { updateChurch, getChurchById, loadChurches, churches } = useChurchStore()
  const [members, setMembers] = useState<Member[]>([])
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
  const [filterBirthday, setFilterBirthday] = useState('all') // all | mes_atual
  const [filterWedding, setFilterWedding] = useState('all') // all | mes_atual
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

  // Estatísticas por membro
  const [memberStats, setMemberStats] = useState<Record<string, {
    ministries: number;
    events: number;
    upcomingEvents: number;
    courses: number;
    progressPercent: number; // 0-100
  }>>({});
  const [journeyTotalSteps, setJourneyTotalSteps] = useState<number>(0);

  useEffect(() => {
    console.log('MemberManagementPage: Initializing loadChurches on mount.');
    const fetchChurches = async () => {
      await loadChurches();
      setChurchesLoaded(true); 
    };
    fetchChurches();
  }, [loadChurches]);

  useEffect(() => {
    console.log('MemberManagementPage: Reacting to currentChurchId or churches change. currentChurchId:', currentChurchId, 'churches count:', churches.length);
    if (currentChurchId) {
      loadMembers(currentChurchId)
    } else {
      setMembers([])
      setFilteredMembers([])
    }
  }, [currentChurchId, churches]); 

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

  const loadMembers = async (churchId: string) => {
    console.log('MemberManagementPage: Loading members for churchId:', churchId);
    const { data, error } = await supabase
      .from('membros') 
      .select(`
        id,
        id_igreja,
        funcao,
        perfil_completo,
        nome_completo, 
        status,
        created_at,
        email,
        ultimo_teste_data, 
        ministerio_recomendado, 
        informacoes_pessoais!membro_id (
          telefone,
          endereco,
          data_nascimento,
          estado_civil,
          profissao,
          conjuge_id,
          data_casamento,
          pais_cristaos,
          tempo_igreja,
          batizado,
          data_batismo,
          participa_ministerio,
          ministerio_anterior,
          experiencia_anterior,
          data_conversao,
          dias_disponiveis,
          horarios_disponiveis
        )
      `)
      .eq('id_igreja', churchId);

    if (error) {
      console.error('Error loading members:', error);
      toast.error('Erro ao carregar membros: ' + error.message);
      return;
    }

    console.log('Loaded raw member data:', data);

    let membersData: Member[] = data.map((member: any) => ({
      id: member.id,
      id_igreja: member.id_igreja,
      funcao: member.funcao,
      perfil_completo: member.perfil_completo,
      nome_completo: member.nome_completo, 
      status: member.status,
      email: member.email, 
      created_at: member.created_at, 
      // churchName preenchido via store (todos são desta igreja)
      churchName: getChurchById(churchId)?.name,
      // Map informacoes_pessoais fields
      telefone: member.informacoes_pessoais?.telefone,
      endereco: member.informacoes_pessoais?.endereco,
      data_nascimento: member.informacoes_pessoais?.data_nascimento,
      data_casamento: member.informacoes_pessoais?.data_casamento,
      estado_civil: member.informacoes_pessoais?.estado_civil,
      profissao: member.informacoes_pessoais?.profissao,
      conjuge_id: member.informacoes_pessoais?.conjuge_id ?? null,
      pais_cristaos: member.informacoes_pessoais?.pais_cristaos,
      tempo_igreja: member.informacoes_pessoais?.tempo_igreja,
      batizado: member.informacoes_pessoais?.batizado,
      data_batismo: member.informacoes_pessoais?.data_batismo,
      participa_ministerio: member.informacoes_pessoais?.participa_ministerio,
      ministerio_anterior: member.informacoes_pessoais?.ministerio_anterior,
      experiencia_anterior: member.informacoes_pessoais?.experiencia_anterior,
      data_conversao: member.informacoes_pessoais?.data_conversao,
      dias_disponiveis: member.informacoes_pessoais?.dias_disponiveis,
      horarios_disponiveis: member.informacoes_pessoais?.horarios_disponiveis,
      // Map membros fields
      ultimo_teste_data: member.ultimo_teste_data, 
      ministerio_recomendado: member.ministerio_recomendado, 
    }));

    // Enriquecer com nome do cônjuge e filhos (tabelas corretas)
    const memberIds = membersData.map(m => m.id);
    // Cônjuges
    const spouseIds = Array.from(new Set(membersData.map(m => m.conjuge_id).filter(Boolean))) as string[];
    let spouseMap: Record<string, string> = {};
    if (spouseIds.length > 0) {
      const { data: spouses } = await supabase
        .from('membros')
        .select('id, nome_completo')
        .in('id', spouseIds);
      spouseMap = Object.fromEntries((spouses || []).map(s => [s.id, s.nome_completo]));
    }
    // Filhos
    const { data: kids } = await supabase
      .from('criancas')
      .select('responsavel_id, nome_crianca, data_nascimento')
      .in('responsavel_id', memberIds)
      .eq('id_igreja', churchId);
    const kidsByResponsible: Record<string, Array<{nome: string, idade: number}>> = {};
    (kids || []).forEach(k => {
      const idade = Math.floor((new Date().getTime() - new Date(k.data_nascimento).getTime()) / 31557600000);
      const entry = { nome: k.nome_crianca, idade };
      if (!kidsByResponsible[k.responsavel_id]) kidsByResponsible[k.responsavel_id] = [];
      kidsByResponsible[k.responsavel_id].push(entry);
    });
    membersData = membersData.map(m => {
      const ownKids = kidsByResponsible[m.id] || [];
      const spouseKids = m.conjuge_id ? (kidsByResponsible[m.conjuge_id] || []) : [];
      const combined = [...ownKids, ...spouseKids];
      // Remover possíveis duplicatas (por nome+idade)
      const unique = combined.reduce((acc, kid) => {
        if (!acc.some(k => k.nome === kid.nome && k.idade === kid.idade)) acc.push(kid);
        return acc;
      }, [] as Array<{nome: string, idade: number}>);
      return {
        ...m,
        conjuge_nome: m.conjuge_id ? spouseMap[m.conjuge_id] : undefined,
        filhos: unique
      };
    });

    setMembers(membersData);
    setFilteredMembers(membersData);
    // Carregar total de passos da jornada ativa da igreja e estatísticas por membro
    await computeJourneyTotalSteps(churchId);
    await loadMembersStats(churchId, membersData);
  }

  const computeJourneyTotalSteps = async (churchId: string) => {
    // Busca trilhas ativas da igreja
    const { data: trilhas, error: trilhasErr } = await supabase
      .from('trilhas_crescimento')
      .select('id')
      .eq('id_igreja', churchId)
      .eq('is_ativa', true);
    if (trilhasErr) {
      console.error('Erro ao buscar trilhas ativas:', trilhasErr);
      setJourneyTotalSteps(0);
      return;
    }
    const trilhaIds = (trilhas || []).map(t => t.id);
    if (trilhaIds.length === 0) {
      setJourneyTotalSteps(0);
      return;
    }
    const { data: etapas, error: etapasErr } = await supabase
      .from('etapas_trilha')
      .select('id')
      .in('id_trilha', trilhaIds);
    if (etapasErr) {
      console.error('Erro ao buscar etapas:', etapasErr);
      setJourneyTotalSteps(0);
      return;
    }
    const etapaIds = (etapas || []).map(e => e.id);
    if (etapaIds.length === 0) {
      setJourneyTotalSteps(0);
      return;
    }
    const { data: passos, error: passosErr } = await supabase
      .from('passos_etapa')
      .select('id')
      .in('id_etapa', etapaIds);
    if (passosErr) {
      console.error('Erro ao buscar passos:', passosErr);
      setJourneyTotalSteps(0);
      return;
    }
    setJourneyTotalSteps((passos || []).length);
  };

  const loadMembersStats = async (churchId: string, membersList: Member[]) => {
    const nowIso = new Date().toISOString();
    const statsEntries = await Promise.all(
      membersList.map(async (m) => {
        // Ministérios
        const { data: mins } = await supabase
          .from('ministerio_voluntarios')
          .select('id')
          .eq('membro_id', m.id)
          .eq('id_igreja', churchId);
        const ministries = (mins || []).length;
        // Eventos
        const { data: parts } = await supabase
          .from('evento_participantes')
          .select('id, evento_id')
          .eq('membro_id', m.id)
          .eq('id_igreja', churchId);
        const events = (parts || []).length;
        const eventoIds = (parts || []).map(p => p.evento_id).filter(Boolean) as string[];
        let upcomingEvents = 0;
        if (eventoIds.length > 0) {
          const { data: eventos } = await supabase
            .from('eventos')
            .select('id, data_hora')
            .in('id', eventoIds)
            .gt('data_hora', nowIso);
          upcomingEvents = (eventos || []).length;
        }
        // Cursos
        const { data: cursosInscr } = await supabase
          .from('cursos_inscricoes')
          .select('id')
          .eq('id_membro', m.id)
          .eq('id_igreja', churchId);
        const courses = (cursosInscr || []).length;
        // Progresso da jornada
        let progressPercent = 0;
        if (journeyTotalSteps > 0) {
          const { data: prog } = await supabase
            .from('progresso_membros')
            .select('id, status, data_conclusao')
            .eq('id_membro', m.id);
          const completed = (prog || []).filter(p => !!p.data_conclusao || (p.status && p.status !== 'pendente')).length;
          progressPercent = Math.round((completed / journeyTotalSteps) * 100);
        }
        return [m.id, { ministries, events, upcomingEvents, courses, progressPercent }] as const;
      })
    );
    setMemberStats(Object.fromEntries(statsEntries));
  };

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.email || !currentChurchId) {
      toast.error('Nome, email e igreja são obrigatórios.')
      return
    }

    const currentChurch = getChurchById(currentChurchId)
    if (currentChurch && currentChurch.currentMembers >= currentChurch.memberLimit && currentChurch.memberLimit !== Infinity) {
      toast.error(`Limite de membros atingido para o plano atual (${currentChurch.memberLimit} membros). Atualize o plano da igreja.`)
      return
    }

    setIsAddMemberDialogOpen(false); 

    // 1. Create auth.users entry
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: newMember.email,
      password: 'password_temp_123', 
      options: {
        data: {
          full_name: newMember.name, 
          church_name: currentChurch.name, // Pass church name for trigger
          initial_role: newMember.funcao,
          church_id: currentChurchId,
        },
      },
    });

    if (authError) {
      console.error('Error creating auth user:', authError.message);
      toast.error('Erro ao cadastrar membro: ' + authError.message);
      return;
    }

    if (authData.user) {
      toast.success('Membro cadastrado com sucesso! Um email de confirmação foi enviado.');
      trackEvent('add_member', { memberId: authData.user.id, memberRole: newMember.funcao }); // Rastrear evento
      loadMembers(currentChurchId); 
    } else {
      toast.error('Erro desconhecido ao cadastrar membro.');
    }

    setNewMember({
      name: '', email: '', telefone: '', endereco: '', data_nascimento: '',
      funcao: 'membro', status: 'pendente', observacoes: ''
    });
  }

  const handleOpenEditMemberDialog = (member: Member) => {
    setSelectedMember(member);
    setEditMemberData({
      nome_completo: member.nome_completo, 
      telefone: member.telefone,
      endereco: member.endereco,
      data_nascimento: member.data_nascimento,
      data_casamento: member.data_casamento,
      estado_civil: member.estado_civil,
      profissao: member.profissao,
      pais_cristaos: member.pais_cristaos,
      tempo_igreja: member.tempo_igreja, 
      batizado: member.batizado,
      data_batismo: member.data_batismo,
      participa_ministerio: member.participa_ministerio,
      ministerio_anterior: member.ministerio_anterior,
      experiencia_anterior: member.experiencia_anterior,
      data_conversao: member.data_conversao,
      dias_disponiveis: member.dias_disponiveis,
      horarios_disponiveis: member.horarios_disponiveis, 
      funcao: member.funcao,
      status: member.status,
      ultimo_teste_data: member.ultimo_teste_data, 
      ministerio_recomendado: member.ministerio_recomendado, 
    });
    setIsEditMemberDialogOpen(true);
  };

  const handleEditMember = async () => {
    if (!selectedMember || !currentChurchId) {
      toast.error('Nenhum membro selecionado ou igreja ativa.');
      return;
    }

    // Update membros table
    const { error: membrosError } = await supabase
      .from('membros') 
      .update({
        funcao: editMemberData.funcao,
        status: editMemberData.status,
        nome_completo: editMemberData.nome_completo, 
        ministerio_recomendado: editMemberData.ministerio_recomendado,
        ultimo_teste_data: editMemberData.ultimo_teste_data,
      })
      .eq('id', selectedMember.id);

    if (membrosError) {
      console.error('Error updating membros table:', membrosError);
      toast.error('Erro ao atualizar dados do membro: ' + membrosError.message);
      return;
    }

    // Update informacoes_pessoais table
    const { error: personalInfoError } = await supabase
      .from('informacoes_pessoais')
      .update({
        telefone: editMemberData.telefone,
        endereco: editMemberData.endereco,
        data_nascimento: editMemberData.data_nascimento,
        data_casamento: editMemberData.data_casamento,
        estado_civil: editMemberData.estado_civil,
        profissao: editMemberData.profissao,
        pais_cristaos: editMemberData.pais_cristaos,
        tempo_igreja: editMemberData.tempo_igreja,
        batizado: editMemberData.batizado,
        data_batismo: editMemberData.data_batismo,
        participa_ministerio: editMemberData.participa_ministerio,
        ministerio_anterior: editMemberData.ministerio_anterior,
        experiencia_anterior: editMemberData.experiencia_anterior,
        data_conversao: editMemberData.data_conversao,
        dias_disponiveis: editMemberData.dias_disponiveis,
        horarios_disponiveis: editMemberData.horarios_disponiveis,
      })
      .eq('membro_id', selectedMember.id);

    if (personalInfoError) {
      console.error('Error updating personal info:', personalInfoError);
      toast.error('Erro ao atualizar informações pessoais: ' + personalInfoError.message);
      return;
    }

    setIsEditMemberDialogOpen(false);
    setSelectedMember(null);
    setEditMemberData({});
    toast.success('Membro atualizado com sucesso!');
    trackEvent('edit_member_profile', { memberId: selectedMember.id, updatedFields: Object.keys(editMemberData) }); // Rastrear evento
    loadMembers(currentChurchId); 
  };

  const deleteUser = async (memberId: string) => {
    if (!currentChurchId) {
      toast.error('Nenhuma igreja ativa selecionada.');
      return;
    }

    if (!confirm('Tem certeza que deseja remover este usuário? Esta ação é irreversível.')) {
      return;
    }

    const { error: authError } = await supabase.auth.admin.deleteUser(memberId);

    if (authError) {
      console.error('Error deleting user from auth:', authError.message);
      toast.error('Erro ao remover usuário: ' + authError.message);
      return;
    }

    const memberToDelete = members.find(m => m.id === memberId);
    if (memberToDelete && memberToDelete.status === 'ativo') {
      const currentChurch = getChurchById(currentChurchId);
      if (currentChurch) {
        await updateChurch(currentChurchId, { currentMembers: currentChurch.currentMembers - 1 });
      }
    }

    toast.success('Usuário removido do sistema com sucesso!');
    trackEvent('delete_member', { memberId: memberId }); // Rastrear evento
    loadMembers(currentChurchId); 
  };

  // Funções approveUser e rejectUser removidas

  const handleGenerateRegistrationLink = () => {
    console.log('--- handleGenerateRegistrationLink called ---');
    console.log('  currentChurchId from authStore:', currentChurchId);
    console.log('   churchesLoaded status:', churchesLoaded);
    console.log('  churches array from useChurchStore (raw):', churches); 

    if (!currentChurchId) {
      toast.error('Nenhuma  igreja selecionada. Por favor, selecione uma igreja no menu lateral.');
      return;
    }

    if (!churchesLoaded || churches.length === 0) {
      toast.error('Os dados das igrejas  ainda não foram carregados ou não há igrejas cadastradas. Por favor, aguarde um momento e tente novamente.');
      return;
    }

    const church = getChurchById(currentChurchId);
    console.log('  Result  of getChurchById:', church);

    if (!church) {
      toast.error('Erro: Não foi possível encontrar os dados da igreja para o ID selecionado. Verifique se a igreja existe no sistema.');
      return;
    }
    if (!church.name) {
      toast.error('Erro: A igreja encontrada não possui um nome válido. Por favor, verifique as configurações da igreja.');
      return;
    }

    const baseUrl =  window.location.origin;
    // Link único por igreja: o próprio churchId garante unicidade
    const link = `${baseUrl}/register?churchId=${currentChurchId}&initialRole=membro`;
    setGeneratedLink(link);
    setIsGenerateLinkDialogOpen(true);
    trackEvent('generate_registration_link', { churchId: currentChurchId }); // Rastrear evento
    console.log('--- Generated Link:', link);
  };

  const handleCopyLink = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(generatedLink);
        toast.success('Link copiado para a área de transferência!');
      } else {
        const ok = copy(generatedLink);
        if (ok) {
          toast.success('Link copiado para a área de transferência!');
        } else {
          toast.error('Não foi possível copiar o link automaticamente.');
        }
      }
      trackEvent('copy_registration_link', { churchId: currentChurchId });
    } catch {
      const ok = copy(generatedLink);
      if (ok) {
        toast.success('Link copiado para a área de transferência!');
      } else {
        toast.error('Não foi possível copiar o link automaticamente.');
      }
      trackEvent('copy_registration_link', { churchId: currentChurchId });
    }
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'super_admin': return <Shield className="w-4 h-4" />
      case 'admin': return <Shield className="w-4 h-4" />
      case 'pastor': return <Crown className="w-4 h-4" />
      case 'lider_ministerio': return <UserCheck className="w-4 h-4" />
      case 'financeiro': return <DollarSign className="w-4 h-4" />
      case 'voluntario': return <Users className="w-4 h-4" />
      case 'midia_tecnologia': return <Headphones className="w-4 h-4" />
      case 'integra': return <Heart className="w-4 h-4" />
      case 'membro': return <UserIcon className="w-4 h-4" />
      default: return <UserIcon className="w-4 h-4" />
    }
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800 border-red-200'
      case 'admin': return 'bg-red-100 text-red-800 border-red-200'
      case 'pastor': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'lider_ministerio': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'financeiro': return 'bg-green-100 text-green-800 border-green-200'
      case 'voluntario': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'midia_tecnologia': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
      case 'integra': return 'bg-pink-100 text-pink-800 border-pink-200'
      case 'membro': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: Member['status']) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800'
      case 'inativo': return 'bg-gray-100 text-gray-800'
      case 'pendente': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return 'N/A';
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const statsData = {
    total: members.length,
    active: members.filter(m => m.status === 'ativo').length,
    leaders: members.filter(m => m.funcao === 'lider_ministerio' || m.funcao === 'pastor' || m.funcao === 'admin' || m.funcao === 'super_admin').length,
    baptized: members.filter(m => m.batizado).length
  }

  if (!currentChurchId) {
    return (
      <div className="p-6 text-center text-gray-600">
        Selecione uma igreja para gerenciar os membros.
      </div>
    )
  }

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl md:rounded-2xl p-4 md:p-6 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Gestão de Membros 👥</h1>
        <p className="text-blue-100 text-base md:text-lg">
          Administre e acompanhe todos os membros da igreja
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-blue-600">{statsData.total}</div>
              <div className="text-sm text-gray-600">Total Membros</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-green-600">{statsData.active}</div>
              <div className="text-sm text-gray-600">Ativos</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-yellow-600">{statsData.leaders}</div>
              <div className="text-sm text-gray-600">Líderes</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-orange-600">{statsData.baptized}</div>
              <div className="text-sm text-gray-600">Batizados</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats - Aniversários */}
      <div className="grid grid-cols-2 gap-4 md:gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-pink-600">
                {members.filter(m => isSameMonth(m.data_nascimento)).length}
              </div>
              <div className="text-sm text-gray-600">Aniversariantes do mês</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-rose-600">
                {members.filter(m => isSameMonth(m.data_casamento)).length}
              </div>
              <div className="text-sm text-gray-600">Aniversário de casamento do mês</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:flex-1">
          <div className="relative flex-1 lg:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar membros..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Papel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Papéis</SelectItem>
                <SelectItem value="membro">Membro</SelectItem>
                <SelectItem value="voluntario">Voluntário</SelectItem>
                <SelectItem value="lider_ministerio">Líder de Ministério</SelectItem>
                <SelectItem value="pastor">Pastor</SelectItem>
                <SelectItem value="financeiro">Financeiro</SelectItem>
                <SelectItem value="midia_tecnologia">Mídia e Tecnologia</SelectItem>
                <SelectItem value="integra">Integração</SelectItem>
                {user?.role === 'admin' && <SelectItem value="admin">Administrador</SelectItem>}
                {user?.role === 'super_admin' && <SelectItem value="super_admin">Super Administrador</SelectItem>}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterMinistry} onValueChange={setFilterMinistry}>
              <SelectTrigger>
                <SelectValue placeholder="Ministério" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Ministérios</SelectItem>
                <SelectItem value="Mídia e Tecnologia">Mídia e Tecnologia</SelectItem>
                <SelectItem value="Louvor e Adoração">Louvor e Adoração</SelectItem>
                <SelectItem value="Diaconato">Diaconato</SelectItem>
                <SelectItem value="Integração">Integração</SelectItem>
                <SelectItem value="Ensino e Discipulado">Ensino e Discipulado</SelectItem>
                <SelectItem value="Kids">Kids</SelectItem>
                <SelectItem value="Organização e Administração">Organização e Administração</SelectItem>
                <SelectItem value="Ação Social">Ação Social</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro Aniversário (nascimento) */}
            <Select value={filterBirthday} onValueChange={setFilterBirthday}>
              <SelectTrigger>
                <SelectValue placeholder="Aniversariantes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="mes_atual">Aniversariantes do mês</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro Aniversário de casamento */}
            <Select value={filterWedding} onValueChange={setFilterWedding}>
              <SelectTrigger>
                <SelectValue placeholder="Casamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="mes_atual">Casamento no mês</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 w-full lg:w-auto">
          {canManageMembers && (
            <Dialog open={isAddMemberDialogOpen} onOpenChange={(open) => {
              setIsAddMemberDialogOpen(open);
              if (open) trackEvent('open_add_member_dialog'); // Rastrear abertura do diálogo
            }}>
              <DialogTrigger asChild>
                <Button className="bg-blue-500 hover:bg-blue-600 flex-1 lg:flex-none">
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Novo Membro</span>
                  <span className="sm:hidden">Adicionar</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Cadastrar Novo Membro</DialogTitle>
                  <DialogDescription>
                    Preencha as informações básicas do membro
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo *</Label>
                      <Input
                        id="name"
                        value={newMember.name}
                        onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                        placeholder="Nome completo"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newMember.email}
                        onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input
                        id="telefone"
                        value={newMember.telefone}
                        onChange={(e) => setNewMember({...newMember, telefone: e.target.value})}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                      <Input
                        id="data_nascimento"
                        type="date"
                        value={newMember.data_nascimento}
                        onChange={(e) => setNewMember({...newMember, data_nascimento: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input
                      id="endereco"
                      value={newMember.endereco}
                      onChange={(e) => setNewMember({...newMember, endereco: e.target.value})}
                      placeholder="Endereço completo"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="funcao">Função</Label>
                      <Select value={newMember.funcao} onValueChange={(value) => setNewMember({...newMember, funcao: value as UserRole})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="membro">Membro</SelectItem>
                          {canEditRoles && (
                            <>
                              <SelectItem value="voluntario">Voluntário</SelectItem>
                              <SelectItem value="lider_ministerio">Líder de Ministério</SelectItem>
                              <SelectItem value="pastor">Pastor</SelectItem>
                              <SelectItem value="financeiro">Financeiro</SelectItem>
                              <SelectItem value="midia_tecnologia">Mídia e Tecnologia</SelectItem>
                              <SelectItem value="integra">Integração</SelectItem>
                              {user?.role === 'admin' && <SelectItem value="admin">Administrador</SelectItem>}
                              {user?.role === 'super_admin' && <SelectItem value="super_admin">Super Administrador</SelectItem>}
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={newMember.status} onValueChange={(value) => setNewMember({...newMember, status: value as Member['status']})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ativo">Ativo</SelectItem>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="inativo">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={newMember.observacoes}
                      onChange={(e) => setNewMember({...newMember, observacoes: e.target.value})}
                      placeholder="Observações sobre o membro"
                      rows={2}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsAddMemberDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleAddMember}>
                      Cadastrar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {canManageMembers && (
            <Button 
              variant="outline" 
              className="flex-1 lg:flex-none"
              onClick={handleGenerateRegistrationLink}
              disabled={!currentChurchId || !churchesLoaded || churches.length === 0} 
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Gerar Link de Cadastro</span>
              <span className="sm:hidden">Link</span>
            </Button>
          )}

          <Button variant="outline" className="hidden sm:flex">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Members List */}
      <div className="space-y-4">
        {filteredMembers.map((member) => (
          <Card key={member.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{member.nome_completo}</h3>
                    <div className="flex gap-2">
                      <Badge className={getRoleColor(member.funcao)}>
                        {getRoleIcon(member.funcao)}
                        <span className="ml-1">{member.funcao.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}</span>
                      </Badge>
                      <Badge className={getStatusColor(member.status)}>
                        {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                      </Badge>
                      {member.batizado && (
                        <Badge className="bg-blue-100 text-blue-800">
                          Batizado
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{member.email}</span>
                    </div>
                    {member.telefone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{member.telefone}</span>
                      </div>
                    )}
                    {member.data_nascimento && (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{calculateAge(member.data_nascimento)} anos</span>
                      </div>
                    )}
                    {member.ministerio_recomendado && (
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        <span>{member.ministerio_recomendado}</span>
                      </div>
                    )}
                  </div>

                  {/* Indicadores de atividade */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                    <div className="text-xs bg-gray-50 rounded-md px-2 py-1">
                      <span className="text-gray-500">Jornada</span>
                      <div className="font-semibold">
                        {memberStats[member.id]?.progressPercent ?? 0}%
                      </div>
                    </div>
                    <div className="text-xs bg-gray-50 rounded-md px-2 py-1">
                      <span className="text-gray-500">Ministérios</span>
                      <div className="font-semibold">
                        {memberStats[member.id]?.ministries ?? 0}
                      </div>
                    </div>
                    <div className="text-xs bg-gray-50 rounded-md px-2 py-1">
                      <span className="text-gray-500">Eventos</span>
                      <div className="font-semibold">
                        {memberStats[member.id]?.events ?? 0}
                      </div>
                    </div>
                    <div className="text-xs bg-gray-50 rounded-md px-2 py-1">
                      <span className="text-gray-500">Cursos</span>
                      <div className="font-semibold">
                        {memberStats[member.id]?.courses ?? 0}
                      </div>
                    </div>
                  </div>

                  {member.endereco && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span>{member.endereco}</span>
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    Membro desde {new Date(member.created_at).toLocaleDateString('pt-BR')}
                    {member.ultimo_teste_data && (
                      <span className="ml-4">
                        • Último teste: {new Date(member.ultimo_teste_data).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {/* Botões de aprovar/rejeitar removidos */}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedMember(member);
                      trackEvent('view_member_profile', { memberId: member.id }); // Rastrear evento
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Ver Perfil</span>
                  </Button>
                  {(canManageMembers || member.id === user?.id) && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleOpenEditMemberDialog(member)}
                    >
                      <Edit className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Editar</span>
                    </Button>
                  )}
                  {(user?.role === 'admin' || user?.role === 'super_admin') && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600"
                      onClick={() => deleteUser(member.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredMembers.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 md:p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum membro encontrado</h3>
            <p className="text-gray-600">
              {searchTerm || filterRole !== 'all' || filterStatus !== 'all' 
                ? 'Tente ajustar os filtros de busca' 
                : 'Cadastre o primeiro membro da igreja'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Member Detail Modal */}
      {selectedMember && (
        <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                {selectedMember.nome_completo}
                <Badge className={getRoleColor(selectedMember.funcao)}>
                  {getRoleIcon(selectedMember.funcao)}
                  <span className="ml-1">{selectedMember.funcao.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}</span>
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Perfil completo do membro
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="personal" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="personal">Pessoal</TabsTrigger>
                <TabsTrigger value="spiritual">Espiritual</TabsTrigger>
                <TabsTrigger value="ministry">Ministério</TabsTrigger>
              </TabsList>
              
              {/* Aba de atividade */}
              <TabsList className="grid w-full grid-cols-1 mt-2">
                <TabsTrigger value="activity">Atividade</TabsTrigger>
              </TabsList>
              
              <TabsContent value="personal" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Email</Label>
                    <p className="text-gray-900">{selectedMember.email}</p>
                  </div>
                  {selectedMember.telefone && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Telefone</Label>
                      <p className="text-gray-900">{selectedMember.telefone}</p>
                    </div>
                  )}
                  {selectedMember.data_nascimento && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Idade</Label>
                      <p className="text-gray-900">
                        {calculateAge(selectedMember.data_nascimento)} anos
                      </p>
                    </div>
                  )}
                  {selectedMember.estado_civil && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Estado Civil</Label>
                      <p className="text-gray-900">{selectedMember.estado_civil}</p>
                    </div>
                  )}
                  {selectedMember.profissao && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Profissão</Label>
                      <p className="text-gray-900">{selectedMember.profissao}</p>
                    </div>
                  )}
                  {selectedMember.conjuge_nome && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Cônjuge</Label>
                      <p className="text-gray-900">{selectedMember.conjuge_nome}</p>
                    </div>
                  )}
                  {selectedMember.filhos && selectedMember.filhos.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Filhos</Label>
                      <ul className="list-disc list-inside text-gray-900">
                        {selectedMember.filhos.map((filho, index) => (
                          <li key={index}>{filho.nome} ({filho.idade} anos)</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedMember.pais_cristaos && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Pais Cristãos</Label>
                      <p className="text-gray-900">{selectedMember.pais_cristaos}</p>
                    </div>
                  )}
                </div>
                
                {selectedMember.endereco && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Endereço</Label>
                    <p className="text-gray-900">{selectedMember.endereco}</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="spiritual" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Batizado</Label>
                    <p className="text-gray-900">
                      {selectedMember.batizado ? 'Sim' : 'Não'}
                    </p>
                  </div>
                  {selectedMember.data_batismo && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Data do Batismo</Label>
                      <p className="text-gray-900">
                        {new Date(selectedMember.data_batismo).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                  {selectedMember.tempo_igreja && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Tempo na Igreja</Label>
                      <p className="text-gray-900">{selectedMember.tempo_igreja}</p>
                    </div>
                  )}
                  {selectedMember.data_conversao && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Data da Conversão</Label>
                      <p className="text-gray-900">
                        {new Date(selectedMember.data_conversao).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="ministry" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Participa de Ministério</Label>
                    <p className="text-gray-900">
                      {selectedMember.participa_ministerio ? 'Sim' : 'Não'}
                    </p>
                  </div>
                  {selectedMember.ministerio_anterior && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Ministério Anterior</Label>
                      <p className="text-gray-900">{selectedMember.ministerio_anterior}</p>
                    </div>
                  )}
                  {selectedMember.experiencia_anterior && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Experiência Anterior</Label>
                      <p className="text-gray-900">{selectedMember.experiencia_anterior}</p>
                    </div>
                  )}
                  {selectedMember.ministerio_recomendado && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Ministério Recomendado</Label>
                      <p className="text-gray-900 font-bold text-purple-700">{selectedMember.ministerio_recomendado}</p>
                    </div>
                  )}
                  {selectedMember.ultimo_teste_data && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Último Teste Vocacional</Label>
                      <p className="text-gray-900">
                        {new Date(selectedMember.ultimo_teste_data).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                  {selectedMember.dias_disponiveis && selectedMember.dias_disponiveis.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Dias Disponíveis</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedMember.dias_disponiveis.map((dia, index) => (
                          <Badge key={index} variant="outline">{dia}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedMember.horarios_disponiveis && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Horários Disponíveis</Label>
                      <p className="text-gray-900">{selectedMember.horarios_disponiveis}</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="activity" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <Label className="text-sm font-medium text-gray-500">Progresso na Jornada</Label>
                    <p className="text-gray-900 text-lg font-bold">
                      {memberStats[selectedMember.id]?.progressPercent ?? 0}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Total de passos: {journeyTotalSteps}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <Label className="text-sm font-medium text-gray-500">Participação em Ministérios</Label>
                    <p className="text-gray-900 text-lg font-bold">
                      {memberStats[selectedMember.id]?.ministries ?? 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <Label className="text-sm font-medium text-gray-500">Eventos Participados</Label>
                    <p className="text-gray-900 text-lg font-bold">
                      {memberStats[selectedMember.id]?.events ?? 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Próximos: {memberStats[selectedMember.id]?.upcomingEvents ?? 0}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <Label className="text-sm font-medium text-gray-500">Cursos</Label>
                    <p className="text-gray-900 text-lg font-bold">
                      {memberStats[selectedMember.id]?.courses ?? 0}
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Member Dialog */}
      {selectedMember && (
        <Dialog open={isEditMemberDialogOpen} onOpenChange={setIsEditMemberDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Membro: {selectedMember.nome_completo}</DialogTitle>
              <DialogDescription>
                Atualize as informações do membro
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-nome_completo">Nome Completo</Label>
                  <Input
                    id="edit-nome_completo"
                    value={editMemberData.nome_completo || ''}
                    onChange={(e) => setEditMemberData({...editMemberData, nome_completo: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={selectedMember.email} 
                    disabled
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-telefone">Telefone</Label>
                  <Input
                    id="edit-telefone"
                    value={editMemberData.telefone || ''}
                    onChange={(e) => setEditMemberData({...editMemberData, telefone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-data_nascimento">Data de Nascimento</Label>
                  <Input
                    id="edit-data_nascimento"
                    type="date"
                    value={editMemberData.data_nascimento || ''}
                    onChange={(e) => setEditMemberData({...editMemberData, data_nascimento: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-endereco">Endereço</Label>
                <Input
                  id="edit-endereco"
                  value={editMemberData.endereco || ''}
                  onChange={(e) => setEditMemberData({...editMemberData, endereco: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-funcao">Função</Label>
                  <Select value={editMemberData.funcao} onValueChange={(value) => setEditMemberData({...editMemberData, funcao: value as UserRole})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="membro">Membro</SelectItem>
                      <SelectItem value="voluntario">Voluntário</SelectItem>
                      <SelectItem value="lider_ministerio">Líder de Ministério</SelectItem>
                      <SelectItem value="pastor">Pastor</SelectItem>
                      <SelectItem value="financeiro">Financeiro</SelectItem>
                      <SelectItem value="midia_tecnologia">Mídia e Tecnologia</SelectItem>
                      <SelectItem value="integra">Integração</SelectItem>
                      {user?.role === 'admin' && <SelectItem value="admin">Administrador</SelectItem>}
                      {user?.role === 'super_admin' && <SelectItem value="super_admin">Super Administrador</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={editMemberData.status} onValueChange={(value) => setEditMemberData({...editMemberData, status: value as Member['status']})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Additional Personal Info Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-estado_civil">Estado Civil</Label>
                  <Select value={editMemberData.estado_civil} onValueChange={(value) => setEditMemberData({...editMemberData, estado_civil: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
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
                  <Label htmlFor="edit-profissao">Profissão</Label>
                  <Input
                    id="edit-profissao"
                    value={editMemberData.profissao || ''}
                    onChange={(e) => setEditMemberData({...editMemberData, profissao: e.target.value})}
                  />
                </div>
                {editMemberData.estado_civil === 'casado' && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-data_casamento">Data de Casamento</Label>
                    <Input
                      id="edit-data_casamento"
                      type="date"
                      value={editMemberData.data_casamento || ''}
                      onChange={(e) => setEditMemberData({...editMemberData, data_casamento: e.target.value})}
                    />
                  </div>
                )}
              </div>

              {/* Spiritual Info Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-batizado">Batizado</Label>
                  <Select value={editMemberData.batizado?.toString()} onValueChange={(value) => setEditMemberData({...editMemberData, batizado: value === 'true'})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Sim</SelectItem>
                      <SelectItem value="false">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editMemberData.batizado && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-data_batismo">Data do Batismo</Label>
                    <Input
                      id="edit-data_batismo"
                      type="date"
                      value={editMemberData.data_batismo || ''}
                      onChange={(e) => setEditMemberData({...editMemberData, data_batismo: e.target.value})}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="edit-tempo_igreja">Tempo na Igreja</Label>
                  <Input
                    id="edit-tempo_igreja"
                    value={editMemberData.tempo_igreja || ''}
                    onChange={(e) => setEditMemberData({...editMemberData, tempo_igreja: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-data_conversao">Data da Conversão</Label>
                  <Input
                    id="edit-data_conversao"
                    type="date"
                    value={editMemberData.data_conversao || ''}
                    onChange={(e) => setEditMemberData({...editMemberData, data_conversao: e.target.value})}
                  />
                </div>
              </div>

              {/* Ministry Info Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-participa_ministerio">Participa de Ministério</Label>
                  <Select value={editMemberData.participa_ministerio?.toString()} onValueChange={(value) => setEditMemberData({...editMemberData, participa_ministerio: value === 'true'})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Sim</SelectItem>
                      <SelectItem value="false">Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editMemberData.participa_ministerio && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="edit-ministerio_anterior">Ministério Anterior</Label>
                      <Input
                        id="edit-ministerio_anterior"
                        value={editMemberData.ministerio_anterior || ''}
                        onChange={(e) => setEditMemberData({...editMemberData, ministerio_anterior: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="edit-experiencia_anterior">Experiência Anterior</Label>
                      <Textarea
                        id="edit-experiencia_anterior"
                        value={editMemberData.experiencia_anterior || ''}
                        onChange={(e) => setEditMemberData({...editMemberData, experiencia_anterior: e.target.value})}
                        rows={2}
                      />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label htmlFor="edit-dias_disponiveis">Dias Disponíveis (JSON)</Label>
                  <Textarea
                    id="edit-dias_disponiveis"
                    value={JSON.stringify(editMemberData.dias_disponiveis || [], null, 2)}
                    onChange={(e) => {
                      try {
                        setEditMemberData({...editMemberData, dias_disponiveis: JSON.parse(e.target.value)});
                      } catch (err) {
                        console.error("Invalid JSON for dias_disponiveis", err);
                        toast.error("Formato JSON inválido para dias disponíveis.");
                      }
                    }}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-horarios_disponiveis">Horários Disponíveis</Label>
                  <Input
                    id="edit-horarios_disponiveis"
                    value={editMemberData.horarios_disponiveis || ''}
                    onChange={(e) => setEditMemberData({...editMemberData, horarios_disponiveis: e.target.value})}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-ministerio_recomendado">Ministério Recomendado</Label>
                  <Input
                    id="edit-ministerio_recomendado"
                    value={editMemberData.ministerio_recomendado || ''}
                    onChange={(e) => setEditMemberData({...editMemberData, ministerio_recomendado: e.target.value})}
                    disabled 
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-ultimo_teste_data">Data Último Teste Vocacional</Label>
                  <Input
                    id="edit-ultimo_teste_data"
                    type="date"
                    value={editMemberData.ultimo_teste_data || ''}
                    onChange={(e) => setEditMemberData({...editMemberData, ultimo_teste_data: e.target.value})}
                    disabled 
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditMemberDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleEditMember}>
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Generate Registration Link Dialog */}
      <Dialog open={isGenerateLinkDialogOpen} onOpenChange={setIsGenerateLinkDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Link de Cadastro para Membros</DialogTitle>
            <DialogDescription>
              Compartilhe este link com novos membros para que se cadastrem diretamente na sua igreja. Este link é único para a sua igreja.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="registration-link">Link de Cadastro</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="registration-link"
                  value={generatedLink}
                  readOnly
                  className="flex-1"
                />
                <Button variant="outline" size="icon" onClick={handleCopyLink}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Novos usuários que se cadastrarem por este link serão automaticamente associados à sua igreja como "Membros". O identificador único (churchId) no link garante que o cadastro seja vinculado corretamente.
            </p>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setIsGenerateLinkDialogOpen(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MemberManagementPage