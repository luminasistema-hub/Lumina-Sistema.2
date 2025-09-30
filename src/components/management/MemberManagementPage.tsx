import { useState, useEffect } from 'react'
import { useAuthStore, UserRole } from '../../stores/authStore' // Import UserRole
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
import { supabase } from '../../integrations/supabase/client' // Import supabase client
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
  Headphones
} from 'lucide-react'

// Define a more accurate interface based on Supabase tables
interface MemberProfile {
  id: string; // Corresponds to auth.users.id and perfis.id
  id_igreja: string; // Corresponds to perfis.id_igreja
  funcao: UserRole; // Corresponds to perfis.funcao
  perfil_completo: boolean; // Corresponds to perfis.perfil_completo
  full_name: string; // Corresponds to perfis.full_name
  status: 'ativo' | 'pendente' | 'inativo'; // Corresponds to perfis.status
  created_at: string; // From auth.users or perfis
  approved_by?: string; // From perfis
  approved_at?: string; // From perfis
  
  // Fields from informacoes_pessoais (joined)
  telefone?: string;
  endereco?: string;
  data_nascimento?: string;
  estado_civil?: string;
  profissao?: string;
  conjuge?: string;
  filhos?: Array<{nome: string, idade: string}>; // JSONB
  pais_cristaos?: string;
  familiar_na_igreja?: string;
  tempo_igreja?: string;
  batizado?: boolean;
  data_batismo?: string;
  participa_ministerio?: boolean;
  ministerio_anterior?: string;
  experiencia_anterior?: string;
  decisao_cristo?: string;
  data_conversao?: string;
  testemunho?: string;
  dias_disponiveis?: string[]; // ARRAY
  horarios_disponiveis?: string;
  interesse_ministerio?: string[]; // ARRAY

  // Fields from membros (joined)
  ultimo_teste_data?: string; // from public.membros.ultimo_teste_data
  ministerio_recomendado?: string; // from public.membros.ministerio_recomendado
  
  // Other fields from auth.users or derived
  email: string; // From auth.users
  churchName?: string; // Joined from public.igrejas
}

// The 'Member' type used in the component should be MemberProfile
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
  const [churchesLoaded, setChurchesLoaded] = useState(false); 

  const canManageMembers = user?.role === 'admin' || user?.role === 'pastor' || user?.role === 'lider_ministerio'
  const canEditRoles = user?.role === 'admin' || user?.role === 'pastor'

  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    telefone: '',
    endereco: '',
    data_nascimento: '',
    funcao: 'membro' as UserRole, // Changed from 'papel' to 'funcao' to match DB
    status: 'pendente' as Member['status'], // Default to pending
    observacoes: ''
  })

  const [editMemberData, setEditMemberData] = useState<Partial<Member>>({});


  // Effect para garantir que as igrejas sejam carregadas quando o componente é montado
  useEffect(() => {
    console.log('MemberManagementPage: Initializing loadChurches on mount.');
    const fetchChurches = async () => {
      await loadChurches();
      setChurchesLoaded(true); // Marca como carregado após a busca
    };
    fetchChurches();
  }, [loadChurches]);

  // Effect para reagir a mudanças em currentChurchId ou na lista de igrejas carregadas
  useEffect(() => {
    console.log('MemberManagementPage: Reacting to currentChurchId or churches change. currentChurchId:', currentChurchId, 'churches count:', churches.length);
    if (currentChurchId) {
      loadMembers(currentChurchId)
    } else {
      setMembers([])
      setFilteredMembers([])
    }
  }, [currentChurchId, churches]); // Depende de 'churches' para garantir que esteja atualizado

  useEffect(() => {
    let filtered = members

    if (searchTerm) {
      filtered = filtered.filter(member => 
        member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      // This part needs to be adjusted if ministry is not directly on MemberProfile
      // For now, assuming ministerio_recomendado or similar
      filtered = filtered.filter(member => 
        member.ministerio_recomendado?.toLowerCase().includes(filterMinistry.toLowerCase())
      )
    }

    setFilteredMembers(filtered)
  }, [members, searchTerm, filterRole, filterStatus, filterMinistry])

  const loadMembers = async (churchId: string) => {
    console.log('MemberManagementPage: Loading members for churchId:', churchId);
    const { data, error } = await supabase
      .from('perfis')
      .select(`
        id,
        id_igreja,
        funcao,
        perfil_completo,
        full_name,
        status,
        created_at,
        approved_by,
        approved_at,
        informacoes_pessoais (
          telefone,
          endereco,
          data_nascimento,
          estado_civil,
          profissao,
          conjuge,
          filhos,
          pais_cristaos,
          familiar_na_igreja,
          tempo_igreja,
          batizado,
          data_batismo,
          participa_ministerio,
          ministerio_anterior,
          experiencia_anterior,
          decisao_cristo,
          data_conversao,
          testemunho,
          dias_disponiveis,
          horarios_disponiveis,
          interesse_ministerio
        ),
        membros (
          ultimo_teste_data,
          ministerio_recomendado
        ),
        igrejas (
          nome
        )
      `)
      .eq('id_igreja', churchId);

    if (error) {
      console.error('Error loading members:', error);
      toast.error('Erro ao carregar membros: ' + error.message);
      return;
    }

    console.log('Loaded raw member data:', data);

    const membersData: Member[] = data.map((profile: any) => ({
      id: profile.id,
      id_igreja: profile.id_igreja,
      funcao: profile.funcao,
      perfil_completo: profile.perfil_completo,
      full_name: profile.full_name,
      status: profile.status,
      email: profile.email || 'N/A', // Email is not directly in perfis, but in auth.users. We'll need to fetch it or assume it's available. For now, mock.
      created_at: profile.created_at, // Not directly in perfis, but in auth.users. For now, mock.
      approved_by: profile.approved_by,
      approved_at: profile.approved_at,
      churchName: profile.igrejas?.nome,
      // Map informacoes_pessoais fields
      telefone: profile.informacoes_pessoais?.telefone,
      endereco: profile.informacoes_pessoais?.endereco,
      data_nascimento: profile.informacoes_pessoais?.data_nascimento,
      estado_civil: profile.informacoes_pessoais?.estado_civil,
      profissao: profile.informacoes_pessoais?.profissao,
      conjuge: profile.informacoes_pessoais?.conjuge,
      filhos: profile.informacoes_pessoais?.filhos,
      pais_cristaos: profile.informacoes_pessoais?.pais_cristaos,
      familiar_na_igreja: profile.informacoes_pessoais?.familiar_na_igreja,
      tempo_igreja: profile.informacoes_pessoais?.tempo_igreja,
      batizado: profile.informacoes_pessoais?.batizado,
      data_batismo: profile.informacoes_pessoais?.data_batismo,
      participa_ministerio: profile.informacoes_pessoais?.participa_ministerio,
      ministerio_anterior: profile.informacoes_pessoais?.ministerio_anterior,
      experiencia_anterior: profile.informacoes_pessoais?.experiencia_anterior,
      decisao_cristo: profile.informacoes_pessoais?.decisao_cristo,
      data_conversao: profile.informacoes_pessoais?.data_conversao,
      testemunho: profile.informacoes_pessoais?.testemunho,
      dias_disponiveis: profile.informacoes_pessoais?.dias_disponiveis,
      horarios_disponiveis: profile.informacoes_pessoais?.horarios_disponiveis,
      interesse_ministerio: profile.informacoes_pessoais?.interesse_ministerio,
      // Map membros fields
      ultimo_teste_data: profile.membros?.ultimo_teste_data, 
      ministerio_recomendado: profile.membros?.ministerio_recomendado,
    }));

    // Fetch emails and created_at from auth.users for each profile
    const userIds = membersData.map(m => m.id);
    if (userIds.length > 0) {
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers(); // Use admin client to list users
      if (authError) {
        console.warn('Could not fetch auth user details:', authError.message);
      } else if (authUsers) {
        authUsers.users.forEach(authUser => {
          const memberIndex = membersData.findIndex(m => m.id === authUser.id);
          if (memberIndex !== -1) {
            membersData[memberIndex].email = authUser.email || membersData[memberIndex].email;
            membersData[memberIndex].created_at = authUser.created_at || membersData[memberIndex].created_at;
          }
        });
      }
    }


    setMembers(membersData);
    setFilteredMembers(membersData);
  }

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

    setIsAddMemberDialogOpen(false); // Close dialog immediately

    // 1. Create auth.users entry
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: newMember.email,
      password: 'password_temp_123', // Temporary password, user will reset via email
      options: {
        data: {
          full_name: newMember.name,
          church_id: currentChurchId,
          initial_role: newMember.funcao,
          // Other fields for informacoes_pessoais can be passed here if trigger is updated
        },
      },
    });

    if (authError) {
      console.error('Error creating auth user:', authError.message);
      toast.error('Erro ao cadastrar membro: ' + authError.message);
      return;
    }

    if (authData.user) {
      // The handle_new_user trigger should handle inserting into 'perfis' and 'informacoes_pessoais'
      // We just need to update the church's member count if the status is 'ativo'
      // For now, new members from this form will also be 'pendente'
      // The trigger now sets status to 'pendente' and does not increment member count.
      // The member count will be incremented upon approval.
      toast.success('Membro cadastrado com sucesso! Um email de confirmação foi enviado.');
      loadMembers(currentChurchId); // Reload members to show the new one
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
      full_name: member.full_name,
      telefone: member.telefone,
      endereco: member.endereco,
      data_nascimento: member.data_nascimento,
      estado_civil: member.estado_civil,
      profissao: member.profissao,
      conjuge: member.conjuge,
      filhos: member.filhos,
      pais_cristaos: member.pais_cristaos,
      familiar_na_igreja: member.familiar_na_igreja,
      tempo_igreja: member.tempo_igreja,
      batizado: member.batizado,
      data_batismo: member.data_batismo,
      participa_ministerio: member.participa_ministerio,
      ministerio_anterior: member.ministerio_anterior,
      experiencia_anterior: member.experiencia_anterior,
      decisao_cristo: member.decisao_cristo,
      data_conversao: member.data_conversao,
      testemunho: member.testemunho,
      dias_disponiveis: member.dias_disponiveis,
      horarios_disponiveis: member.horarios_disponiveis,
      interesse_ministerio: member.interesse_ministerio,
      funcao: member.funcao,
      status: member.status,
      ultimo_teste_data: member.ultimo_teste_data, // Include these fields
      ministerio_recomendado: member.ministerio_recomendado, // Include these fields
    });
    setIsEditMemberDialogOpen(true);
  };

  const handleEditMember = async () => {
    if (!selectedMember || !currentChurchId) {
      toast.error('Nenhum membro selecionado ou igreja ativa.');
      return;
    }

    // Update perfis table
    const { error: profileError } = await supabase
      .from('perfis')
      .update({
        funcao: editMemberData.funcao,
        status: editMemberData.status,
        full_name: editMemberData.full_name,
        // Add approved_by and approved_at if these fields are added to perfis
      })
      .eq('id', selectedMember.id);

    if (profileError) {
      console.error('Error updating profile:', profileError);
      toast.error('Erro ao atualizar perfil: ' + profileError.message);
      return;
    }

    // Update informacoes_pessoais table
    const { error: personalInfoError } = await supabase
      .from('informacoes_pessoais')
      .update({
        telefone: editMemberData.telefone,
        endereco: editMemberData.endereco,
        data_nascimento: editMemberData.data_nascimento,
        estado_civil: editMemberData.estado_civil,
        profissao: editMemberData.profissao,
        conjuge: editMemberData.conjuge,
        filhos: editMemberData.filhos,
        pais_cristaos: editMemberData.pais_cristaos,
        familiar_na_igreja: editMemberData.familiar_na_igreja,
        tempo_igreja: editMemberData.tempo_igreja,
        batizado: editMemberData.batizado,
        data_batismo: editMemberData.data_batismo,
        participa_ministerio: editMemberData.participa_ministerio,
        ministerio_anterior: editMemberData.ministerio_anterior,
        experiencia_anterior: editMemberData.experiencia_anterior,
        decisao_cristo: editMemberData.decisao_cristo,
        data_conversao: editMemberData.data_conversao,
        testemunho: editMemberData.testemunho,
        dias_disponiveis: editMemberData.dias_disponiveis,
        horarios_disponiveis: editMemberData.horarios_disponiveis,
        interesse_ministerio: editMemberData.interesse_ministerio,
      })
      .eq('membro_id', selectedMember.id);

    if (personalInfoError) {
      console.error('Error updating personal info:', personalInfoError);
      toast.error('Erro ao atualizar informações pessoais: ' + personalInfoError.message);
      return;
    }

    // Update membros table for vocational test related fields
    const { error: membrosError } = await supabase
      .from('membros')
      .update({
        ministerio_recomendado: editMemberData.ministerio_recomendado,
        ultimo_teste_data: editMemberData.ultimo_teste_data,
        // Also update other fields that might be duplicated in 'membros' if they are editable here
        nome_completo: editMemberData.full_name,
        funcao: editMemberData.funcao,
        status: editMemberData.status,
        // telefone: editMemberData.telefone, // Telefone is in informacoes_pessoais
        // data_nascimento: editMemberData.data_nascimento, // Data_nascimento is in informacoes_pessoais
        // email is from auth.users, not directly editable here
      })
      .eq('id', selectedMember.id);

    if (membrosError) {
      console.error('Error updating membros table:', membrosError);
      toast.error('Erro ao atualizar dados do membro: ' + membrosError.message);
      return;
    }


    setIsEditMemberDialogOpen(false);
    setSelectedMember(null);
    setEditMemberData({});
    toast.success('Membro atualizado com sucesso!');
    loadMembers(currentChurchId); // Reload members to show changes
  };

  const deleteUser = async (memberId: string) => {
    if (!currentChurchId) {
      toast.error('Nenhuma igreja ativa selecionada.');
      return;
    }

    if (!confirm('Tem certeza que deseja remover este usuário? Esta ação é irreversível.')) {
      return;
    }

    // Supabase handles cascade delete from auth.users -> perfis -> informacoes_pessoais -> membros
    const { error: authError } = await supabase.auth.admin.deleteUser(memberId);

    if (authError) {
      console.error('Error deleting user from auth:', authError.message);
      toast.error('Erro ao remover usuário: ' + authError.message);
      return;
    }

    // Update church member count if the user was active
    const memberToDelete = members.find(m => m.id === memberId);
    if (memberToDelete && memberToDelete.status === 'ativo') {
      const currentChurch = getChurchById(currentChurchId);
      if (currentChurch) {
        await updateChurch(currentChurchId, { currentMembers: currentChurch.currentMembers - 1 });
      }
    }

    toast.success('Usuário removido do sistema com sucesso!');
    loadMembers(currentChurchId); // Reload members
  };

  const approveUser = async (memberId: string) => {
    if (!currentChurchId) {
      toast.error('Nenhuma igreja ativa selecionada.');
      return;
    }

    // Update perfis table
    const { error: profileError } = await supabase
      .from('perfis')
      .update({
        status: 'ativo',
        approved_by: user?.name || 'Administrador', // Assuming these fields exist in perfis
        approved_at: new Date().toISOString(),
      })
      .eq('id', memberId);

    if (profileError) {
      console.error('Error approving user profile:', profileError.message);
      toast.error('Erro ao aprovar perfil do usuário: ' + profileError.message);
      return;
    }

    // Update membros table
    const { error: membrosError } = await supabase
      .from('membros')
      .update({
        status: 'ativo',
      })
      .eq('id', memberId);

    if (membrosError) {
      console.error('Error approving user in membros table:', membrosError.message);
      toast.error('Erro ao aprovar usuário na tabela de membros: ' + membrosError.message);
      return;
    }

    // Update church member count
    const currentChurch = getChurchById(currentChurchId);
    if (currentChurch) {
      await updateChurch(currentChurchId, { currentMembers: currentChurch.currentMembers + 1 });
    }

    toast.success('Usuário aprovado com sucesso!');
    loadMembers(currentChurchId);
  };

  const rejectUser = async (memberId: string) => {
    if (!currentChurchId) {
      toast.error('Nenhuma igreja ativa selecionada.');
      return;
    }

    // Update perfis table
    const { error: profileError } = await supabase
      .from('perfis')
      .update({
        status: 'inativo',
      })
      .eq('id', memberId);

    if (profileError) {
      console.error('Error rejecting user profile:', profileError.message);
      toast.error('Erro ao rejeitar perfil do usuário: ' + profileError.message);
      return;
    }

    // Update membros table
    const { error: membrosError } = await supabase
      .from('membros')
      .update({
        status: 'inativo',
      })
      .eq('id', memberId);

    if (membrosError) {
      console.error('Error rejecting user in membros table:', membrosError.message);
      toast.error('Erro ao rejeitar usuário na tabela de membros: ' + membrosError.message);
      return;
    }

    // If the user was active, decrement member count
    const memberToReject = members.find(m => m.id === memberId);
    if (memberToReject && memberToReject.status === 'ativo') {
      const currentChurch = getChurchById(currentChurchId);
      if (currentChurch) {
        await updateChurch(currentChurchId, { currentMembers: currentChurch.currentMembers - 1 });
      }
    }

    toast.success('Usuário rejeitado com sucesso!');
    loadMembers(currentChurchId);
  };

  const handleGenerateRegistrationLink = () => {
    console.log('--- handleGenerateRegistrationLink called ---');
    console.log('  currentChurchId from authStore:', currentChurchId);
    console.log('   churchesLoaded status:', churchesLoaded);
    console.log('  churches array from useChurchStore (raw):', churches); // Log the actual array

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
    const link = `${baseUrl}/register?churchId=${currentChurchId}&churchName=${encodeURIComponent(church.name)}&initialRole=membro`;
    setGeneratedLink(link);
    setIsGenerateLinkDialogOpen(true);
    console.log('--- Generated Link:', link);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink)
    toast.success('Link copiado para a área de transferência!')
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
              <div className="text-xl md:text-2xl font-bold text-purple-600">{statsData.leaders}</div>
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
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                <SelectItem value="Louvor e Adoração">Louvor e Adoração</SelectItem>
                <SelectItem value="Mídia e Tecnologia">Mídia e Tecnologia</SelectItem>
                <SelectItem value="Diaconato">Diaconato</SelectItem>
                <SelectItem value="Kids">Kids</SelectItem>
                <SelectItem value="Ensino e Discipulado">Ensino e Discipulado</SelectItem>
                <SelectItem value="Integração">Integração</SelectItem>
                <SelectItem value="Organização">Organização</SelectItem>
                <SelectItem value="Ação Social">Ação Social</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 w-full lg:w-auto">
          {canManageMembers && (
            <Dialog open={isAddMemberDialogOpen} onOpenChange={setIsAddMemberDialogOpen}>
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
              disabled={!currentChurchId || !churchesLoaded || churches.length === 0} // Desabilita se nenhuma igreja selecionada, não carregada ou lista vazia
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
                    <h3 className="text-lg font-semibold text-gray-900">{member.full_name}</h3>
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
                        <Church className="w-4 h-4" />
                        <span>{member.ministerio_recomendado}</span>
                      </div>
                    )}
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
                  {member.status === 'pendente' && (user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'pastor') && (
                    <>
                      <Button 
                        size="sm" 
                        className="bg-green-500 hover:bg-green-600"
                        onClick={() => approveUser(member.id)}
                      >
                        <UserCheck className="w-4 h-4 mr-2" />
                        Aprovar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-red-600"
                        onClick={() => rejectUser(member.id)}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Rejeitar
                      </Button>
                    </>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedMember(member)}
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
                {selectedMember.full_name}
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
                  {selectedMember.conjuge && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Cônjuge</Label>
                      <p className="text-gray-900">{selectedMember.conjuge}</p>
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
                  {selectedMember.familiar_na_igreja && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Familiar na Igreja</Label>
                      <p className="text-gray-900">{selectedMember.familiar_na_igreja}</p>
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
                  {selectedMember.decisao_cristo && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Decisão por Cristo</Label>
                      <p className="text-gray-900">{selectedMember.decisao_cristo}</p>
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
                  {selectedMember.testemunho && (
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium text-gray-500">Testemunho</Label>
                      <p className="text-gray-900 whitespace-pre-wrap">{selectedMember.testemunho}</p>
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
                      <p className="text-gray-900">{selectedMember.ministerio_recomendado}</p>
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
                  {selectedMember.interesse_ministerio && selectedMember.interesse_ministerio.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Interesse em Ministérios</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedMember.interesse_ministerio.map((min, index) => (
                          <Badge key={index} variant="outline">{min}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
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
              <DialogTitle>Editar Membro: {selectedMember.full_name}</DialogTitle>
              <DialogDescription>
                Atualize as informações do membro
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-full_name">Nome Completo</Label>
                  <Input
                    id="edit-full_name"
                    value={editMemberData.full_name || ''}
                    onChange={(e) => setEditMemberData({...editMemberData, full_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={selectedMember.email} // Email cannot be changed directly here
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
                    <Label htmlFor="edit-conjuge">Cônjuge</Label>
                    <Input
                      id="edit-conjuge"
                      value={editMemberData.conjuge || ''}
                      onChange={(e) => setEditMemberData({...editMemberData, conjuge: e.target.value})}
                    />
                  </div>
                )}
                {/* Filhos - simplified for now, full implementation would need dynamic fields */}
                <div className="space-y-2">
                  <Label htmlFor="edit-filhos">Filhos (JSON)</Label>
                  <Textarea
                    id="edit-filhos"
                    value={JSON.stringify(editMemberData.filhos || [], null, 2)}
                    onChange={(e) => {
                      try {
                        setEditMemberData({...editMemberData, filhos: JSON.parse(e.target.value)});
                      } catch (err) {
                        console.error("Invalid JSON for filhos", err);
                        toast.error("Formato JSON inválido para filhos.");
                      }
                    }}
                    rows={3}
                  />
                </div>
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
                  <Label htmlFor="edit-decisao_cristo">Decisão por Cristo</Label>
                  <Input
                    id="edit-decisao_cristo"
                    value={editMemberData.decisao_cristo || ''}
                    onChange={(e) => setEditMemberData({...editMemberData, decisao_cristo: e.target.value})}
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
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="edit-testemunho">Testemunho</Label>
                  <Textarea
                    id="edit-testemunho"
                    value={editMemberData.testemunho || ''}
                    onChange={(e) => setEditMemberData({...editMemberData, testemunho: e.target.value})}
                    rows={3}
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
                  <Label htmlFor="edit-interesse_ministerio">Interesse em Ministérios (JSON)</Label>
                  <Textarea
                    id="edit-interesse_ministerio"
                    value={JSON.stringify(editMemberData.interesse_ministerio || [], null, 2)}
                    onChange={(e) => {
                      try {
                        setEditMemberData({...editMemberData, interesse_ministerio: JSON.parse(e.target.value)});
                      } catch (err) {
                        console.error("Invalid JSON for interesse_ministerio", err);
                        toast.error("Formato JSON inválido para interesse em ministérios.");
                      }
                    }}
                    rows={2}
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
              Compartilhe este link com novos membros para que se cadastrem diretamente na sua igreja.
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
              Novos usuários que se cadastrarem por este link serão automaticamente associados à sua igreja como "Membros".
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