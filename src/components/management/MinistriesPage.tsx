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
import { toast } from 'sonner'
import { supabase } from '../../integrations/supabase/client'
import { 
  Church, 
  Plus, 
  Users, 
  Crown,
  Calendar,
  Edit,
  Eye,
  UserPlus,
  Settings,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Loader2,
  Trash2
} from 'lucide-react'

interface Ministry {
  id: string
  nome: string
  descricao: string
  lider_id: string | null // Agora é apenas o ID do líder
  lider_nome?: string // Para exibição
  lider_email?: string // Para exibição
  voluntarios_meta: number
  eventos_mes_meta: number
  created_at: string
  updated_at: string
  id_igreja: string
  // Propriedades para detalhes que serão carregadas sob demanda
  voluntarios?: Array<{
    id: string
    nome: string
    data_entrada: string
    ativo: boolean
  }>
  escalas_servico?: Array<{
    id: string
    data_servico: string
    status: 'Pendente' | 'Confirmado' | 'Realizado'
    voluntarios_escalados: string[]
  }>
}

interface MemberOption {
  id: string
  nome_completo: string
  email: string
}

const MinistriesPage = () => {
  const { user, currentChurchId } = useAuthStore()
  const [ministries, setMinistries] = useState<Ministry[]>([])
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [memberOptions, setMemberOptions] = useState<MemberOption[]>([]) // Para o seletor de líder

  const canManageMinistries = user?.role === 'admin' || user?.role === 'pastor' || user?.role === 'lider_ministerio'
  const canDeleteMinistries = user?.role === 'admin' || user?.role === 'pastor' // Mais restritivo para exclusão

  const [newMinistry, setNewMinistry] = useState({
    nome: '',
    descricao: '',
    lider_id: '',
    voluntarios_meta: 10,
    eventos_mes_meta: 4
  })

  const [editMinistryData, setEditMinistryData] = useState<Partial<Ministry>>({})

  const loadMinistries = useCallback(async () => {
    if (!currentChurchId) {
      setMinistries([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('ministerios')
        .select(`
          id,
          nome,
          descricao,
          lider_id,
          voluntarios_meta,
          eventos_mes_meta,
          created_at,
          updated_at,
          id_igreja,
          membros!ministerios_lider_id_fkey(nome_completo, email)
        `)
        .eq('id_igreja', currentChurchId)
        .order('nome', { ascending: true })

      if (error) throw error

      const fetchedMinistries: Ministry[] = data.map(m => ({
        id: m.id,
        nome: m.nome,
        descricao: m.descricao,
        lider_id: m.lider_id,
        lider_nome: m.membros?.nome_completo || 'Não Atribuído',
        lider_email: m.membros?.email || '',
        voluntarios_meta: m.voluntarios_meta,
        eventos_mes_meta: m.eventos_mes_meta,
        created_at: m.created_at,
        updated_at: m.updated_at,
        id_igreja: m.id_igreja,
      }))

      setMinistries(fetchedMinistries)
    } catch (error: any) {
      console.error('Error loading ministries:', error.message)
      toast.error('Erro ao carregar ministérios: ' + error.message)
    } finally {
      setLoading(false)
    }
  }, [currentChurchId])

  const loadMemberOptions = useCallback(async () => {
    if (!currentChurchId) {
      setMemberOptions([])
      return
    }
    try {
      const { data, error } = await supabase
        .from('membros')
        .select('id, nome_completo, email')
        .eq('id_igreja', currentChurchId)
        .eq('status', 'ativo')
        .order('nome_completo', { ascending: true })

      if (error) throw error
      setMemberOptions(data as MemberOption[])
    } catch (error: any) {
      console.error('Error loading member options:', error.message)
      toast.error('Erro ao carregar opções de membros: ' + error.message)
    }
  }, [currentChurchId])

  useEffect(() => {
    loadMinistries()
    loadMemberOptions()
  }, [loadMinistries, loadMemberOptions])

  const handleCreateMinistry = async () => {
    if (!newMinistry.nome || !newMinistry.descricao || !currentChurchId) {
      toast.error('Nome, descrição e igreja são obrigatórios')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('ministerios')
        .insert({
          id_igreja: currentChurchId,
          nome: newMinistry.nome,
          descricao: newMinistry.descricao,
          lider_id: newMinistry.lider_id || null,
          voluntarios_meta: newMinistry.voluntarios_meta,
          eventos_mes_meta: newMinistry.eventos_mes_meta,
        })

      if (error) throw error
      toast.success('Ministério criado com sucesso!')
      setIsCreateDialogOpen(false)
      setNewMinistry({
        nome: '',
        descricao: '',
        lider_id: '',
        voluntarios_meta: 10,
        eventos_mes_meta: 4
      })
      loadMinistries()
    } catch (error: any) {
      console.error('Error creating ministry:', error.message)
      toast.error('Erro ao criar ministério: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEditMinistry = async () => {
    if (!selectedMinistry?.id || !editMinistryData.nome || !editMinistryData.descricao || !currentChurchId) {
      toast.error('Nome, descrição e igreja são obrigatórios para edição')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('ministerios')
        .update({
          nome: editMinistryData.nome,
          descricao: editMinistryData.descricao,
          lider_id: editMinistryData.lider_id || null,
          voluntarios_meta: editMinistryData.voluntarios_meta,
          eventos_mes_meta: editMinistryData.eventos_mes_meta,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedMinistry.id)
        .eq('id_igreja', currentChurchId)

      if (error) throw error
      toast.success('Ministério atualizado com sucesso!')
      setIsEditDialogOpen(false)
      setSelectedMinistry(null)
      setEditMinistryData({})
      loadMinistries()
    } catch (error: any) {
      console.error('Error updating ministry:', error.message)
      toast.error('Erro ao atualizar ministério: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMinistry = async (ministryId: string) => {
    if (!confirm('Tem certeza que deseja excluir este ministério? Esta ação é irreversível e removerá todos os dados associados (voluntários, escalas).')) {
      return
    }
    if (!currentChurchId) {
      toast.error('Nenhuma igreja ativa selecionada.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('ministerios')
        .delete()
        .eq('id', ministryId)
        .eq('id_igreja', currentChurchId)

      if (error) throw error
      toast.success('Ministério excluído com sucesso!')
      loadMinistries()
    } catch (error: any) {
      console.error('Error deleting ministry:', error.message)
      toast.error('Erro ao excluir ministério: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const getMinistryIcon = (nome: string) => {
    const lowerName = nome.toLowerCase()
    if (lowerName.includes('louvor') || lowerName.includes('música')) {
      return '🎵'
    }
    if (lowerName.includes('mídia') || lowerName.includes('tecnologia')) {
      return '📹'
    }
    if (lowerName.includes('diacono') || lowerName.includes('servo')) {
      return '🤝'
    }
    if (lowerName.includes('kids') || lowerName.includes('criança')) {
      return '👶'
    }
    if (lowerName.includes('jovens') || lowerName.includes('juventude')) {
      return '🎯'
    }
    if (lowerName.includes('ensino') || lowerName.includes('discipulado')) {
      return '📚'
    }
    if (lowerName.includes('integração')) {
      return '🫂'
    }
    if (lowerName.includes('organização') || lowerName.includes('administração')) {
      return '⚙️'
    }
    if (lowerName.includes('ação social')) {
      return '🤲'
    }
    return '⛪'
  }

  const getProgressPercentage = (current: number, target: number) => {
    if (target === 0) return 0; // Evita divisão por zero
    return Math.min((current / target) * 100, 100)
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500'
    if (percentage >= 70) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const filteredMinistries = ministries.filter(ministry => 
    ministry.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ministry.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ministry.lider_nome && ministry.lider_nome.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  // Mock de dados para voluntários e escalas para o dashboard, pois não estamos carregando todos os detalhes para cada ministério na lista principal
  const totalVolunteers = 120; // Exemplo
  const totalMinistries = ministries.length;
  const activeSchedules = 15; // Exemplo

  if (!currentChurchId) {
    return (
      <div className="p-6 text-center text-gray-600">
        Selecione uma igreja para gerenciar os ministérios.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <p className="ml-4 text-lg text-gray-600">Carregando ministérios...</p>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl md:rounded-2xl p-4 md:p-6 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Ministérios ⛪</h1>
        <p className="text-purple-100 text-base md:text-lg">
          Gerencie todos os ministérios e seus voluntários
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-purple-600">{totalMinistries}</div>
              <div className="text-sm text-gray-600">Ministérios</div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-blue-600">{totalVolunteers}</div>
              <div className="text-sm text-gray-600">Voluntários (Estimado)</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-green-600">{activeSchedules}</div>
              <div className="text-sm text-gray-600">Escalas Ativas (Estimado)</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-orange-600">
                {/* A meta geral precisaria de mais dados para ser precisa, usando um mock por enquanto */}
                {Math.round((totalVolunteers / (ministries.reduce((sum, m) => sum + m.voluntarios_meta, 0) || 1)) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Meta Geral (Estimado)</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions and Filters */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="relative flex-1 lg:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar ministérios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 w-full lg:w-auto">
          {canManageMinistries && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-500 hover:bg-purple-600 flex-1 lg:flex-none">
                  <Plus className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Novo Ministério</span>
                  <span className="sm:hidden">Criar</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Novo Ministério</DialogTitle>
                  <DialogDescription>
                    Configure as informações básicas do ministério
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome do Ministério *</Label>
                    <Input
                      id="nome"
                      value={newMinistry.nome}
                      onChange={(e) => setNewMinistry({...newMinistry, nome: e.target.value})}
                      placeholder="Ex: Louvor e Adoração"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição *</Label>
                    <Textarea
                      id="descricao"
                      value={newMinistry.descricao}
                      onChange={(e) => setNewMinistry({...newMinistry, descricao: e.target.value})}
                      placeholder="Descreva o propósito e atividades do ministério"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lider_id">Líder do Ministério</Label>
                    <Select
                      value={newMinistry.lider_id || ''}
                      onValueChange={(value) => setNewMinistry({...newMinistry, lider_id: value === 'null' ? '' : value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um líder (opcional)" />
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="voluntarios_meta">Meta de Voluntários</Label>
                      <Input
                        id="voluntarios_meta"
                        type="number"
                        value={newMinistry.voluntarios_meta}
                        onChange={(e) => setNewMinistry({...newMinistry, voluntarios_meta: parseInt(e.target.value) || 0})}
                        placeholder="10"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="eventos_mes_meta">Meta Eventos/Mês</Label>
                      <Input
                        id="eventos_mes_meta"
                        type="number"
                        value={newMinistry.eventos_mes_meta}
                        onChange={(e) => setNewMinistry({...newMinistry, eventos_mes_meta: parseInt(e.target.value) || 0})}
                        placeholder="4"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateMinistry}>
                      Criar Ministério
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Ministries Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        {filteredMinistries.map((ministry) => {
          // Estes dados (activeVolunteers, nextSchedule) precisariam de mais queries para serem precisos
          // Por enquanto, usando valores mockados ou simplificados para a lista
          const activeVolunteers = 5; // Mock
          const volunteerProgress = getProgressPercentage(activeVolunteers, ministry.voluntarios_meta);
          const nextSchedule = { // Mock
            id: 'mock-schedule',
            data_servico: '2025-10-01',
            status: 'Pendente',
            voluntarios_escalados: []
          };

          return (
            <Card key={ministry.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{getMinistryIcon(ministry.nome)}</div>
                    <div>
                      <CardTitle className="text-lg">{ministry.nome}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        {ministry.lider_nome}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800">
                    {/* Este valor precisaria de uma query para ser preciso */}
                    {activeVolunteers} voluntários (Est.)
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-sm line-clamp-2">{ministry.descricao}</p>

                {/* Progress Bars */}
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span>Voluntários</span>
                      <span>{activeVolunteers}/{ministry.voluntarios_meta} (Est.)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getProgressColor(volunteerProgress)}`}
                        style={{ width: `${volunteerProgress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Next Schedule */}
                {nextSchedule && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-blue-500" />
                      <span className="text-blue-800 font-medium">Próxima escala (Est.):</span>
                      <span className="text-blue-700">
                        {new Date(nextSchedule.data_servico).toLocaleDateString('pt-BR')}
                      </span>
                      <Badge className={
                        nextSchedule.status === 'Confirmado' ? 'bg-green-100 text-green-800' :
                        nextSchedule.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {nextSchedule.status}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setSelectedMinistry(ministry)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Detalhes
                  </Button>
                  {(canManageMinistries || ministry.lider_id === user?.id) && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedMinistry(ministry)
                        setEditMinistryData({
                          nome: ministry.nome,
                          descricao: ministry.descricao,
                          lider_id: ministry.lider_id,
                          voluntarios_meta: ministry.voluntarios_meta,
                          eventos_mes_meta: ministry.eventos_mes_meta,
                        })
                        setIsEditDialogOpen(true)
                      }}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredMinistries.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 md:p-12 text-center">
            <Church className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum ministério encontrado</h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'Tente ajustar o termo de busca' 
                : 'Crie o primeiro ministério da igreja'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Ministry Detail Modal */}
      {selectedMinistry && (
        <Dialog open={!!selectedMinistry} onOpenChange={() => setSelectedMinistry(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <span className="text-2xl">{getMinistryIcon(selectedMinistry.nome)}</span>
                {selectedMinistry.nome}
              </DialogTitle>
              <DialogDescription>
                Liderado por {selectedMinistry.lider_nome}
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="overview" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="volunteers">Voluntários</TabsTrigger>
                <TabsTrigger value="schedules">Escalas</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Descrição</Label>
                  <p className="text-gray-900 mt-1">{selectedMinistry.descricao}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Voluntários Ativos (Est.)</Label>
                    <p className="text-2xl font-bold text-blue-600">
                      {/* Este valor precisaria de uma query para ser preciso */}
                      5
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Escalas Confirmadas (Est.)</Label>
                    <p className="text-2xl font-bold text-green-600">
                      {/* Este valor precisaria de uma query para ser preciso */}
                      2
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="volunteers" className="space-y-4">
                <div className="text-center py-4 text-gray-600">
                  <Users className="w-10 h-10 mx-auto mb-3" />
                  <p>Gestão de voluntários em desenvolvimento.</p>
                </div>
              </TabsContent>
              
              <TabsContent value="schedules" className="space-y-4">
                <div className="text-center py-4 text-gray-600">
                  <Calendar className="w-10 h-10 mx-auto mb-3" />
                  <p>Gestão de escalas de serviço em desenvolvimento.</p>
                </div>
              </TabsContent>
            </Tabs>
            {canDeleteMinistries && (
              <div className="flex justify-end mt-4">
                <Button 
                  variant="destructive" 
                  onClick={() => handleDeleteMinistry(selectedMinistry.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir Ministério
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Ministry Dialog */}
      {selectedMinistry && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Ministério: {selectedMinistry.nome}</DialogTitle>
              <DialogDescription>
                Atualize as informações do ministério
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nome">Nome do Ministério *</Label>
                <Input
                  id="edit-nome"
                  value={editMinistryData.nome || ''}
                  onChange={(e) => setEditMinistryData({...editMinistryData, nome: e.target.value})}
                  placeholder="Ex: Louvor e Adoração"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-descricao">Descrição *</Label>
                <Textarea
                  id="edit-descricao"
                  value={editMinistryData.descricao || ''}
                  onChange={(e) => setEditMinistryData({...editMinistryData, descricao: e.target.value})}
                  placeholder="Descreva o propósito e atividades do ministério"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-lider_id">Líder do Ministério</Label>
                <Select
                  value={editMinistryData.lider_id || ''}
                  onValueChange={(value) => setEditMinistryData({...editMinistryData, lider_id: value === 'null' ? '' : value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um líder (opcional)" />
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-voluntarios_meta">Meta de Voluntários</Label>
                  <Input
                    id="edit-voluntarios_meta"
                    type="number"
                    value={editMinistryData.voluntarios_meta || 0}
                    onChange={(e) => setEditMinistryData({...editMinistryData, voluntarios_meta: parseInt(e.target.value) || 0})}
                    placeholder="10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-eventos_mes_meta">Meta Eventos/Mês</Label>
                  <Input
                    id="edit-eventos_mes_meta"
                    type="number"
                    value={editMinistryData.eventos_mes_meta || 0}
                    onChange={(e) => setEditMinistryData({...editMinistryData, eventos_mes_meta: parseInt(e.target.value) || 0})}
                    placeholder="4"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleEditMinistry}>
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default MinistriesPage