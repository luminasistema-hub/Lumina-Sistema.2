import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { toast } from 'sonner'
import { User, UserRole, useAuthStore } from '../../stores/authStore' // Importar useAuthStore
import { useChurchStore } from '../../stores/churchStore' // Importar useChurchStore
import { 
  Users, 
  UserCheck, 
  UserX, 
  Crown,
  Shield,
  DollarSign,
  Headphones,
  Heart,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface UserManagementProps {}

const UserManagement = ({}: UserManagementProps) => {
  const { user, currentChurchId } = useAuthStore() // Obter user e currentChurchId
  const { updateChurch, getChurchById } = useChurchStore() // Obter updateChurch e getChurchById
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const [editUser, setEditUser] = useState<Partial<User>>({})

  useEffect(() => {
    if (currentChurchId) {
      loadUsers(currentChurchId)
    } else {
      setUsers([])
      setFilteredUsers([])
    }
  }, [currentChurchId]) // Recarregar usuários quando a igreja ativa mudar

  useEffect(() => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(user => user.status === filterStatus)
    }

    if (filterRole !== 'all') {
      filtered = filtered.filter(user => user.role === filterRole)
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm, filterStatus, filterRole])

  const loadUsers = (churchId: string) => {
    const stored = localStorage.getItem('connect-vida-users')
    if (stored) {
      const usersData = JSON.parse(stored)
      const userList = Object.values(usersData)
        .map((userData: any) => userData.user as User)
        .filter(u => u.churchId === churchId) // Filtrar por churchId
      setUsers(userList)
      setFilteredUsers(userList)
    }
  }

  const saveUsers = (updatedUsers: User[]) => {
    const stored = localStorage.getItem('connect-vida-users')
    if (stored) {
      const usersData = JSON.parse(stored)
      
      updatedUsers.forEach(userToUpdate => {
        if (usersData[userToUpdate.email]) {
          usersData[userToUpdate.email].user = userToUpdate
        }
      })
      
      localStorage.setItem('connect-vida-users', JSON.stringify(usersData))
      if (currentChurchId) {
        loadUsers(currentChurchId) // Recarregar usuários da igreja ativa
      }
    }
  }

  const approveUser = (userId: string) => {
    const updatedUsers = users.map(u => 
      u.id === userId 
        ? { 
            ...u, 
            status: 'ativo' as const,
            approved_by: user?.name || 'Administrador',
            approved_at: new Date().toISOString()
          }
        : u
    )
    
    saveUsers(updatedUsers)
    toast.success('Usuário aprovado com sucesso!')

    // Atualizar contagem de membros na igreja
    if (currentChurchId) {
      const currentChurch = getChurchById(currentChurchId)
      if (currentChurch) {
        const newMemberCount = currentChurch.currentMembers + 1
        updateChurch(currentChurchId, { currentMembers: newMemberCount })
      }
    }
  }

  const rejectUser = (userId: string) => {
    const updatedUsers = users.map(u => 
      u.id === userId 
        ? { ...u, status: 'inativo' as const }
        : u
    )
    
    saveUsers(updatedUsers)
    toast.success('Usuário rejeitado')
  }

  const handleEditUser = () => {
    if (!selectedUser || !editUser.role) return

    const updatedUsers = users.map(u => 
      u.id === selectedUser.id 
        ? { 
            ...u, 
            role: editUser.role as UserRole,
            ministry: editUser.ministry,
            status: editUser.status as User['status']
          }
        : u
    )
    
    saveUsers(updatedUsers)
    setIsEditDialogOpen(false)
    setSelectedUser(null)
    setEditUser({})
    toast.success('Usuário atualizado com sucesso!')
  }

  const deleteUser = (userId: string) => {
    const userToDelete = users.find(u => u.id === userId)
    if (!userToDelete) return

    const stored = localStorage.getItem('connect-vida-users')
    if (stored) {
      const usersData = JSON.parse(stored)
      delete usersData[userToDelete.email]
      localStorage.setItem('connect-vida-users', JSON.stringify(usersData))
      if (currentChurchId) {
        loadUsers(currentChurchId) // Recarregar usuários da igreja ativa
      }
      toast.success('Usuário removido do sistema')

      // Atualizar contagem de membros na igreja se o usuário estava ativo
      if (userToDelete.status === 'ativo' && currentChurchId) {
        const currentChurch = getChurchById(currentChurchId)
        if (currentChurch) {
          const newMemberCount = currentChurch.currentMembers - 1
          updateChurch(currentChurchId, { currentMembers: newMemberCount })
        }
      }
    }
  }

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4" />
      case 'pastor': return <Crown className="w-4 h-4" />
      case 'lider_ministerio': return <UserCheck className="w-4 h-4" />
      case 'financeiro': return <DollarSign className="w-4 h-4" />
      case 'voluntario': return <Users className="w-4 h-4" />
      case 'midia_tecnologia': return <Headphones className="w-4 h-4" />
      case 'integra': return <Heart className="w-4 h-4" />
      case 'membro': return <Users className="w-4 h-4" />
      case 'super_admin': return <Shield className="w-4 h-4" /> // Adicionado super_admin
    }
  }

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'pastor': return 'bg-purple-100 text-purple-800'
      case 'lider_ministerio': return 'bg-blue-100 text-blue-800'
      case 'financeiro': return 'bg-green-100 text-green-800'
      case 'voluntario': return 'bg-yellow-100 text-yellow-800'
      case 'midia_tecnologia': return 'bg-indigo-100 text-indigo-800'
      case 'integra': return 'bg-pink-100 text-pink-800'
      case 'membro': return 'bg-gray-100 text-gray-800'
      case 'super_admin': return 'bg-red-200 text-red-900' // Cor para super_admin
    }
  }

  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800'
      case 'pendente': return 'bg-yellow-100 text-yellow-800'
      case 'inativo': return 'bg-red-100 text-red-800'
    }
  }

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'Administrador'
      case 'pastor': return 'Pastor'
      case 'lider_ministerio': return 'Líder de Ministério'
      case 'financeiro': return 'Financeiro'
      case 'voluntario': return 'Voluntário'
      case 'midia_tecnologia': return 'Mídia e Tecnologia'
      case 'integra': return 'Integração'
      case 'membro': return 'Membro'
      case 'super_admin': return 'Super Administrador' // Label para super_admin
    }
  }

  const pendingUsers = users.filter(u => u.status === 'pendente')
  const activeUsers = users.filter(u => u.status === 'ativo')
  const inactiveUsers = users.filter(u => u.status === 'inativo')

  if (!currentChurchId && user?.role !== 'super_admin') {
    return (
      <div className="p-6 text-center text-gray-600">
        Selecione uma igreja para gerenciar os usuários.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-blue-600">{users.length}</div>
              <div className="text-sm text-gray-600">Total Usuários</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-green-600">{activeUsers.length}</div>
              <div className="text-sm text-gray-600">Ativos</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-yellow-600">{pendingUsers.length}</div>
              <div className="text-sm text-gray-600">Pendentes</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-red-600">{inactiveUsers.length}</div>
              <div className="text-sm text-gray-600">Inativos</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar usuários..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Papel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Papéis</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="pastor">Pastor</SelectItem>
              <SelectItem value="lider_ministerio">Líder de Ministério</SelectItem>
              <SelectItem value="financeiro">Financeiro</SelectItem>
              <SelectItem value="voluntario">Voluntário</SelectItem>
              <SelectItem value="midia_tecnologia">Mídia e Tecnologia</SelectItem>
              <SelectItem value="integra">Integração</SelectItem>
              <SelectItem value="membro">Membro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-4">
        {filteredUsers.map((u) => (
          <Card key={u.id} className="border-0 shadow-sm">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{u.name}</h3>
                    <div className="flex gap-2">
                      <Badge className={getRoleColor(u.role)}>
                        {getRoleIcon(u.role)}
                        <span className="ml-1">{getRoleLabel(u.role)}</span>
                      </Badge>
                      <Badge className={getStatusColor(u.status)}>
                        {u.status === 'ativo' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {u.status === 'pendente' && <Clock className="w-3 h-3 mr-1" />}
                        {u.status === 'inativo' && <XCircle className="w-3 h-3 mr-1" />}
                        {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 text-sm text-gray-600 mb-2">
                    <div>
                      <strong>Email:</strong> {u.email}
                    </div>
                    <div>
                      <strong>Cadastro:</strong> {new Date(u.created_at).toLocaleDateString('pt-BR')}
                    </div>
                    {u.ministry && (
                      <div>
                        <strong>Ministério:</strong> {u.ministry}
                      </div>
                    )}
                  </div>

                  {u.approved_by && u.approved_at && (
                    <div className="text-xs text-green-600">
                      ✅ Aprovado por {u.approved_by} em {new Date(u.approved_at).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {u.status === 'pendente' && (user?.role === 'admin' || user?.role === 'super_admin') && (
                    <>
                      <Button 
                        size="sm" 
                        className="bg-green-500 hover:bg-green-600"
                        onClick={() => approveUser(u.id)}
                      >
                        <UserCheck className="w-4 h-4 mr-2" />
                        Aprovar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-red-600"
                        onClick={() => rejectUser(u.id)}
                      >
                        <UserX className="w-4 h-4 mr-2" />
                        Rejeitar
                      </Button>
                    </>
                  )}
                  {(user?.role === 'admin' || user?.role === 'super_admin') && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedUser(u)
                        setEditUser({
                          role: u.role,
                          ministry: u.ministry,
                          status: u.status
                        })
                        setIsEditDialogOpen(true)
                      }}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  )}
                  {u.email !== 'diogoalbuquerque38@gmail.com' && (user?.role === 'admin' || user?.role === 'super_admin') && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600"
                      onClick={() => {
                        if (confirm('Tem certeza que deseja remover este usuário?')) {
                          deleteUser(u.id)
                        }
                      }}
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

      {filteredUsers.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 md:p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum usuário encontrado</h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all' || filterRole !== 'all' 
                ? 'Tente ajustar os filtros de busca' 
                : 'Não há usuários cadastrados no momento'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Alterar papel e status de {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Papel</Label>
              <Select value={editUser.role} onValueChange={(value) => setEditUser({...editUser, role: value as UserRole})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="membro">Membro</SelectItem>
                  <SelectItem value="voluntario">Voluntário</SelectItem>
                  <SelectItem value="integra">Integração</SelectItem>
                  <SelectItem value="midia_tecnologia">Mídia e Tecnologia</SelectItem>
                  <SelectItem value="financeiro">Financeiro</SelectItem>
                  <SelectItem value="lider_ministerio">Líder de Ministério</SelectItem>
                  <SelectItem value="pastor">Pastor</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  {user?.role === 'super_admin' && <SelectItem value="super_admin">Super Administrador</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editUser.status} onValueChange={(value) => setEditUser({...editUser, status: value as User['status']})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ministério (opcional)</Label>
              <Input
                value={editUser.ministry || ''}
                onChange={(e) => setEditUser({...editUser, ministry: e.target.value})}
                placeholder="Nome do ministério"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleEditUser}>
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default UserManagement