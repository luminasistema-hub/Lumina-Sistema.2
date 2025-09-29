import { useState, useEffect } from 'react'
import { useAuthStore, User as AuthUser } from '../../stores/authStore'
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
  Copy
} from 'lucide-react'

interface Member extends AuthUser {
  telefone?: string
  endereco?: string
  data_nascimento?: string
  papel: 'Comum' | 'Líder de Ministério' | 'Pastor' | 'Master'
  ministerio_atual?: {
    id: string
    nome: string
  }
  data_cadastro: string
  informacoes_pessoais?: {
    estado_civil?: string
    profissao?: string
    conjuge?: string
    filhos?: Array<{nome: string, idade: number}>
  }
  informacoes_espirituais?: {
    data_conversao?: string
    batizado: boolean
    data_batismo?: string
    tempo_igreja?: string
  }
  ultimo_teste_vocacional?: string
  ministerio_recomendado?: string
  observacoes?: string
}

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
  const [churchesLoaded, setChurchesLoaded] = useState(false); // Novo estado para rastrear o carregamento das igrejas

  const canManageMembers = user?.role === 'admin' || user?.role === 'pastor' || user?.role === 'lider_ministerio'
  const canEditRoles = user?.role === 'admin' || user?.role === 'pastor'

  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    telefone: '',
    endereco: '',
    data_nascimento: '',
    papel: 'Comum' as Member['papel'],
    status: 'ativo' as Member['status'],
    observacoes: ''
  })

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
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.telefone && member.telefone.includes(searchTerm))
      )
    }

    if (filterRole !== 'all') {
      filtered = filtered.filter(member => member.papel === filterRole)
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(member => member.status === filterStatus)
    }

    if (filterMinistry !== 'all') {
      filtered = filtered.filter(member => 
        member.ministerio_atual?.nome === filterMinistry
      )
    }

    setFilteredMembers(filtered)
  }, [members, searchTerm, filterRole, filterStatus, filterMinistry])

  const loadMembers = (churchId: string) => {
    const stored = localStorage.getItem('connect-vida-users')
    if (stored) {
      const usersData = JSON.parse(stored)
      const memberList = Object.values(usersData)
        .map((userData: any) => userData.user as Member)
        .filter(m => m.churchId === churchId)
      setMembers(memberList)
      setFilteredMembers(memberList)
    }
  }

  const saveMembers = (updatedMembers: Member[]) => {
    const stored = localStorage.getItem('connect-vida-users')
    if (stored) {
      const usersData = JSON.parse(stored)
      
      updatedMembers.forEach(memberToUpdate => {
        if (usersData[memberToUpdate.email]) {
          usersData[memberToUpdate.email].user = memberToUpdate
        }
      })
      
      localStorage.setItem('connect-vida-users', JSON.stringify(usersData))
      if (currentChurchId) {
        loadMembers(currentChurchId)
      }
    }
  }

  const handleAddMember = () => {
    if (!newMember.name || !newMember.email) {
      toast.error('Nome e email são obrigatórios')
      return
    }
    if (!currentChurchId) {
      toast.error('Nenhuma igreja ativa selecionada.')
      return
    }

    const currentChurch = getChurchById(currentChurchId)
    if (currentChurch && currentChurch.currentMembers >= currentChurch.memberLimit && currentChurch.memberLimit !== Infinity) {
      toast.error(`Limite de membros atingido para o plano atual (${currentChurch.memberLimit} membros). Atualize o plano da igreja.`)
      return
    }

    const member: Member = {
      id: `member-${Date.now()}`,
      name: newMember.name,
      email: newMember.email,
      telefone: newMember.telefone,
      endereco: newMember.endereco,
      data_nascimento: newMember.data_nascimento,
      role: 'membro',
      papel: newMember.papel,
      churchId: currentChurchId,
      churchName: currentChurch?.name,
      data_cadastro: new Date().toISOString(),
      status: 'pendente',
      observacoes: newMember.observacoes,
      informacoes_espirituais: {
        batizado: false
      }
    }

    const storedUsers = localStorage.getItem('connect-vida-users')
    const usersData = storedUsers ? JSON.parse(storedUsers) : {}
    usersData[member.email] = {
      password: 'senha_padrao_temporaria',
      user: member
    }
    localStorage.setItem('connect-vida-users', JSON.stringify(usersData))

    setMembers([...members, member])
    setIsAddMemberDialogOpen(false)
    setNewMember({
      name: '',
      email: '',
      telefone: '',
      endereco: '',
      data_nascimento: '',
      papel: 'Comum',
      status: 'ativo',
      observacoes: ''
    })
    toast.success('Membro cadastrado com sucesso! Aguardando aprovação.')
  }

  const handleGenerateRegistrationLink = () => {
    if (!currentChurchId) {
      toast.error('Selecione uma igreja para gerar o link de cadastro.')
      return
    }
    
    if (!churchesLoaded || churches.length === 0) { // Usa o novo estado
      toast.error('Os dados das igrejas ainda não foram carregados. Por favor, aguarde um momento e tente novamente.')
      return;
    }

    console.log('MemberManagementPage: Attempting to get church for ID:', currentChurchId);
    console.log('MemberManagementPage: Current churches in store (before getChurchById):', churches);
    const church = getChurchById(currentChurchId)
    console.log('MemberManagementPage: Church found by ID:', church);
    
    // Verificação explícita para garantir que church e church.name são válidos
    if (!church || !church.name) {
      toast.error('Não foi possível encontrar os dados da igreja ou o nome da igreja está ausente. Tente recarregar a página ou selecionar a igreja novamente.')
      return
    }

    const baseUrl = window.location.origin
    // Alterado para apontar para a nova RegisterPage
    const link = `${baseUrl}/register?churchId=${currentChurchId}&churchName=${encodeURIComponent(church.name)}&initialRole=membro`
    setGeneratedLink(link)
    setIsGenerateLinkDialogOpen(true)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink)
    toast.success('Link copiado para a área de transferência!')
  }

  const getRoleIcon = (role: Member['papel']) => {
    switch (role) {
      case 'Master': return <Shield className="w-4 h-4" />
      case 'Pastor': return <Crown className="w-4 h-4" />
      case 'Líder de Ministério': return <UserCheck className="w-4 h-4" />
      case 'Comum': return <UserIcon className="w-4 h-4" />
    }
  }

  const getRoleColor = (role: Member['papel']) => {
    switch (role) {
      case 'Master': return 'bg-red-100 text-red-800 border-red-200'
      case 'Pastor': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'Líder de Ministério': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Comum': return 'bg-green-100 text-green-800 border-green-200'
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

  const calculateAge = (birthDate: string) => {
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
    leaders: members.filter(m => m.papel === 'Líder de Ministério' || m.papel === 'Pastor').length,
    baptized: members.filter(m => m.informacoes_espirituais?.batizado).length
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
                <SelectItem value="Comum">Comum</SelectItem>
                <SelectItem value="Líder de Ministério">Líder de Ministério</SelectItem>
                <SelectItem value="Pastor">Pastor</SelectItem>
                <SelectItem value="Master">Master</SelectItem>
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
                <SelectItem value="Mídia">Mídia</SelectItem>
                <SelectItem value="Diaconato">Diaconato</SelectItem>
                <SelectItem value="Kids">Kids</SelectItem>
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
                      <Label htmlFor="papel">Papel</Label>
                      <Select value={newMember.papel} onValueChange={(value) => setNewMember({...newMember, papel: value as Member['papel']})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Comum">Comum</SelectItem>
                          {canEditRoles && (
                            <>
                              <SelectItem value="Líder de Ministério">Líder de Ministério</SelectItem>
                              <SelectItem value="Pastor">Pastor</SelectItem>
                              <SelectItem value="Master">Master</SelectItem>
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
              disabled={!currentChurchId || !churchesLoaded} // Desabilita se nenhuma igreja selecionada ou não carregada
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
                    <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                    <div className="flex gap-2">
                      <Badge className={getRoleColor(member.papel)}>
                        {getRoleIcon(member.papel)}
                        <span className="ml-1">{member.papel}</span>
                      </Badge>
                      <Badge className={getStatusColor(member.status)}>
                        {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                      </Badge>
                      {member.informacoes_espirituais?.batizado && (
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
                    {member.ministerio_atual && (
                      <div className="flex items-center gap-2">
                        <Church className="w-4 h-4" />
                        <span>{member.ministerio_atual.nome}</span>
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
                    Membro desde {new Date(member.data_cadastro).toLocaleDateString('pt-BR')}
                    {member.ultimo_teste_vocacional && (
                      <span className="ml-4">
                        • Último teste: {new Date(member.ultimo_teste_vocacional).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedMember(member)}
                  >
                    <Eye className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Ver Perfil</span>
                  </Button>
                  {canManageMembers && (
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-1 sm:mr-2" />
                      <span className="hidden sm:inline">Editar</span>
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
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
                {selectedMember.name}
                <Badge className={getRoleColor(selectedMember.papel)}>
                  {getRoleIcon(selectedMember.papel)}
                  <span className="ml-1">{selectedMember.papel}</span>
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
                  {selectedMember.informacoes_pessoais?.estado_civil && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Estado Civil</Label>
                      <p className="text-gray-900">{selectedMember.informacoes_pessoais.estado_civil}</p>
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
                      {selectedMember.informacoes_espirituais?.batizado ? 'Sim' : 'Não'}
                    </p>
                  </div>
                  {selectedMember.informacoes_espirituais?.data_batismo && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Data do Batismo</Label>
                      <p className="text-gray-900">
                        {new Date(selectedMember.informacoes_espirituais.data_batismo).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                  {selectedMember.informacoes_espirituais?.tempo_igreja && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Tempo na Igreja</Label>
                      <p className="text-gray-900">{selectedMember.informacoes_espirituais.tempo_igreja}</p>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="ministry" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedMember.ministerio_atual && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Ministério Atual</Label>
                      <p className="text-gray-900">{selectedMember.ministerio_atual.nome}</p>
                    </div>
                  )}
                  {selectedMember.ministerio_recomendado && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Ministério Recomendado</Label>
                      <p className="text-gray-900">{selectedMember.ministerio_recomendado}</p>
                    </div>
                  )}
                  {selectedMember.ultimo_teste_vocacional && (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Último Teste Vocacional</Label>
                      <p className="text-gray-900">
                        {new Date(selectedMember.ultimo_teste_vocacional).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
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