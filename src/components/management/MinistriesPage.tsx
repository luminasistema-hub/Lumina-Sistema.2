import { useState, useEffect } from 'react'
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
  Filter
} from 'lucide-react'

interface Ministry {
  id: string
  nome: string
  descricao: string
  lider: {
    id: string
    nome: string
    email: string
  }
  voluntarios: Array<{
    id: string
    nome: string
    data_entrada: string
    ativo: boolean
  }>
  escalas_servico: Array<{
    id: string
    data_servico: string
    status: 'Pendente' | 'Confirmado' | 'Realizado'
    voluntarios_escalados: string[]
  }>
  metas: {
    voluntarios_meta: number
    eventos_mes_meta: number
  }
  created_at: string
  updated_at: string
}

const MinistriesPage = () => {
  const { user } = useAuthStore()
  const [ministries, setMinistries] = useState<Ministry[]>([])
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const canManageMinistries = user?.role === 'admin' || user?.role === 'pastor'
  const canViewDetails = user?.role === 'admin' || user?.role === 'pastor' || user?.role === 'lider_ministerio'

  const [newMinistry, setNewMinistry] = useState({
    nome: '',
    descricao: '',
    lider_id: '',
    voluntarios_meta: 10,
    eventos_mes_meta: 4
  })

  // Mock data
  useEffect(() => {
    console.log('MinistriesPage: Loading ministries data...')
    const mockMinistries: Ministry[] = [
      {
        id: '1',
        nome: 'Louvor e Adoração',
        descricao: 'Ministério responsável pelos momentos de louvor nos cultos e eventos especiais.',
        lider: {
          id: '1',
          nome: 'Maria Santos',
          email: 'maria@igreja.com'
        },
        voluntarios: [
          { id: '1', nome: 'João Silva', data_entrada: '2024-01-15', ativo: true },
          { id: '2', nome: 'Ana Costa', data_entrada: '2024-03-20', ativo: true },
          { id: '3', nome: 'Pedro Oliveira', data_entrada: '2024-06-10', ativo: false }
        ],
        escalas_servico: [
          {
            id: '1',
            data_servico: '2025-09-15',
            status: 'Confirmado',
            voluntarios_escalados: ['1', '2']
          },
          {
            id: '2',
            data_servico: '2025-09-22',
            status: 'Pendente',
            voluntarios_escalados: ['1']
          }
        ],
        metas: {
          voluntarios_meta: 8,
          eventos_mes_meta: 6
        },
        created_at: '2024-01-01',
        updated_at: '2025-09-11'
      },
      {
        id: '2',
        nome: 'Mídia e Tecnologia',
        descricao: 'Responsável pela operação de som, vídeo e transmissão dos cultos.',
        lider: {
          id: '2',
          nome: 'Carlos Tech',
          email: 'carlos@igreja.com'
        },
        voluntarios: [
          { id: '4', nome: 'Lucas Santos', data_entrada: '2024-02-01', ativo: true },
          { id: '5', nome: 'Rafael Lima', data_entrada: '2024-04-15', ativo: true }
        ],
        escalas_servico: [
          {
            id: '3',
            data_servico: '2025-09-15',
            status: 'Confirmado',
            voluntarios_escalados: ['4', '5']
          }
        ],
        metas: {
          voluntarios_meta: 6,
          eventos_mes_meta: 4
        },
        created_at: '2024-01-01',
        updated_at: '2025-09-10'
      },
      {
        id: '3',
        nome: 'Diaconato',
        descricao: 'Ministério de serviço e apoio às necessidades da igreja e membros.',
        lider: {
          id: '3',
          nome: 'José Servo',
          email: 'jose@igreja.com'
        },
        voluntarios: [
          { id: '6', nome: 'Márcia Silva', data_entrada: '2024-01-10', ativo: true },
          { id: '7', nome: 'Roberto Santos', data_entrada: '2024-05-20', ativo: true },
          { id: '8', nome: 'Fernanda Costa', data_entrada: '2024-07-30', ativo: true }
        ],
        escalas_servico: [],
        metas: {
          voluntarios_meta: 12,
          eventos_mes_meta: 8
        },
        created_at: '2024-01-01',
        updated_at: '2025-09-08'
      }
    ]
    setMinistries(mockMinistries)
  }, [])

  const handleCreateMinistry = () => {
    if (!newMinistry.nome || !newMinistry.descricao) {
      toast.error('Nome e descrição são obrigatórios')
      return
    }

    const ministry: Ministry = {
      id: Date.now().toString(),
      nome: newMinistry.nome,
      descricao: newMinistry.descricao,
      lider: {
        id: user?.id || '',
        nome: user?.name || '',
        email: user?.email || ''
      },
      voluntarios: [],
      escalas_servico: [],
      metas: {
        voluntarios_meta: newMinistry.voluntarios_meta,
        eventos_mes_meta: newMinistry.eventos_mes_meta
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    setMinistries([...ministries, ministry])
    setIsCreateDialogOpen(false)
    setNewMinistry({
      nome: '',
      descricao: '',
      lider_id: '',
      voluntarios_meta: 10,
      eventos_mes_meta: 4
    })
    toast.success('Ministério criado com sucesso!')
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
    return '⛪'
  }

  const getProgressPercentage = (current: number, target: number) => {
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
    ministry.lider.nome.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalVolunteers = ministries.reduce((sum, m) => sum + m.voluntarios.filter(v => v.ativo).length, 0)
  const totalMinistries = ministries.length
  const activeSchedules = ministries.reduce((sum, m) => sum + m.escalas_servico.filter(e => e.status === 'Confirmado').length, 0)

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
              <div className="text-sm text-gray-600">Voluntários</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-green-600">{activeSchedules}</div>
              <div className="text-sm text-gray-600">Escalas Ativas</div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-xl md:text-2xl font-bold text-orange-600">
                {Math.round((totalVolunteers / (ministries.reduce((sum, m) => sum + m.metas.voluntarios_meta, 0) || 1)) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Meta Geral</div>
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
          const activeVolunteers = ministry.voluntarios.filter(v => v.ativo).length
          const volunteerProgress = getProgressPercentage(activeVolunteers, ministry.metas.voluntarios_meta)
          const nextSchedule = ministry.escalas_servico
            .filter(e => new Date(e.data_servico) >= new Date())
            .sort((a, b) => new Date(a.data_servico).getTime() - new Date(b.data_servico).getTime())[0]

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
                        {ministry.lider.nome}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-purple-100 text-purple-800">
                    {activeVolunteers} voluntários
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
                      <span>{activeVolunteers}/{ministry.metas.voluntarios_meta}</span>
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
                      <span className="text-blue-800 font-medium">Próxima escala:</span>
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
                  {(canManageMinistries || ministry.lider.id === user?.id) && (
                    <Button variant="outline" size="sm">
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
                Liderado por {selectedMinistry.lider.nome}
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
                    <Label className="text-sm font-medium text-gray-500">Voluntários Ativos</Label>
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedMinistry.voluntarios.filter(v => v.ativo).length}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Escalas Confirmadas</Label>
                    <p className="text-2xl font-bold text-green-600">
                      {selectedMinistry.escalas_servico.filter(e => e.status === 'Confirmado').length}
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="volunteers" className="space-y-4">
                <div className="space-y-3">
                  {selectedMinistry.voluntarios.map(volunteer => (
                    <div key={volunteer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{volunteer.nome}</p>
                        <p className="text-sm text-gray-500">
                          Desde {new Date(volunteer.data_entrada).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Badge className={volunteer.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {volunteer.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="schedules" className="space-y-4">
                <div className="space-y-3">
                  {selectedMinistry.escalas_servico.map(schedule => (
                    <div key={schedule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">
                          {new Date(schedule.data_servico).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-sm text-gray-500">
                          {schedule.voluntarios_escalados.length} voluntários escalados
                        </p>
                      </div>
                      <Badge className={
                        schedule.status === 'Confirmado' ? 'bg-green-100 text-green-800' :
                        schedule.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {schedule.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default MinistriesPage