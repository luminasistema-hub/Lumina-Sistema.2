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
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  Plus,
  Edit,
  Trash2,
  Eye,
  UserCheck,
  Filter,
  Search,
  Download,
  Share2
} from 'lucide-react'

interface Event {
  id: string
  nome: string
  data_hora: string
  local: string
  descricao: string
  tipo: 'Culto' | 'Conferência' | 'Retiro' | 'Evangelismo' | 'Casamento' | 'Funeral' | 'Outro'
  capacidade_maxima?: number
  inscricoes_abertas: boolean
  valor_inscricao?: number
  responsavel: string
  status: 'Planejado' | 'Confirmado' | 'Em Andamento' | 'Finalizado' | 'Cancelado'
  participantes: Array<{
    id: string
    nome: string
    email: string
    telefone?: string
    presente?: boolean
    data_inscricao: string
  }>
  ministerios_envolvidos: string[]
  recursos_necessarios: string[]
  observacoes?: string
}

const EventsPage = () => {
  const { user } = useAuthStore()
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('list')
  const [filterType, setFilterType] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const canManageEvents = user?.role === 'admin' || user?.role === 'pastor' || user?.role === 'lider_ministerio'

  const [newEvent, setNewEvent] = useState<Partial<Event>>({
    nome: '',
    data_hora: '',
    local: '',
    descricao: '',
    tipo: 'Culto',
    inscricoes_abertas: true,
    status: 'Planejado',
    participantes: [],
    ministerios_envolvidos: [],
    recursos_necessarios: []
  })

  // Mock data
  useEffect(() => {
    console.log('EventsPage: Loading events data...')
    const mockEvents: Event[] = [
      {
        id: '1',
        nome: 'Culto de Domingo',
        data_hora: '2025-09-15T19:00:00',
        local: 'Templo Principal',
        descricao: 'Culto dominical com louvor, palavra e oração',
        tipo: 'Culto',
        inscricoes_abertas: false,
        responsavel: 'Pastor João Silva',
        status: 'Confirmado',
        participantes: [
          { id: '1', nome: 'Maria Santos', email: 'maria@email.com', presente: true, data_inscricao: '2025-09-10' },
          { id: '2', nome: 'Carlos Silva', email: 'carlos@email.com', presente: false, data_inscricao: '2025-09-11' }
        ],
        ministerios_envolvidos: ['Louvor e Adoração', 'Mídia'],
        recursos_necessarios: ['Som', 'Projetor', 'Instrumentos']
      },
      {
        id: '2',
        nome: 'Conferência de Avivamento',
        data_hora: '2025-09-20T19:30:00',
        local: 'Auditório Central',
        descricao: 'Uma noite especial de avivamento com pregação poderosa',
        tipo: 'Conferência',
        capacidade_maxima: 500,
        inscricoes_abertas: true,
        valor_inscricao: 25.00,
        responsavel: 'Pastor Maria Oliveira',
        status: 'Planejado',
        participantes: [],
        ministerios_envolvidos: ['Organização', 'Diaconato'],
        recursos_necessarios: ['Som profissional', 'Iluminação especial', 'Decoração']
      },
      {
        id: '3',
        nome: 'Retiro de Jovens',
        data_hora: '2025-10-05T08:00:00',
        local: 'Chácara Bethel',
        descricao: 'Fim de semana de comunhão e crescimento espiritual para jovens',
        tipo: 'Retiro',
        capacidade_maxima: 80,
        inscricoes_abertas: true,
        valor_inscricao: 120.00,
        responsavel: 'Líder Pedro Costa',
        status: 'Confirmado',
        participantes: [],
        ministerios_envolvidos: ['Ministério Jovem', 'Cozinha'],
        recursos_necessarios: ['Transporte', 'Alimentação', 'Equipamentos']
      }
    ]
    setEvents(mockEvents)
    setFilteredEvents(mockEvents)
  }, [])

  useEffect(() => {
    let filtered = events

    if (filterType !== 'all') {
      filtered = filtered.filter(event => event.tipo === filterType)
    }

    if (searchTerm) {
      filtered = filtered.filter(event => 
        event.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.local.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.descricao.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredEvents(filtered)
  }, [events, filterType, searchTerm])

  const handleCreateEvent = () => {
    if (!newEvent.nome || !newEvent.data_hora || !newEvent.local) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    const event: Event = {
      id: Date.now().toString(),
      nome: newEvent.nome!,
      data_hora: newEvent.data_hora!,
      local: newEvent.local!,
      descricao: newEvent.descricao || '',
      tipo: newEvent.tipo as Event['tipo'] || 'Culto',
      capacidade_maxima: newEvent.capacidade_maxima,
      inscricoes_abertas: newEvent.inscricoes_abertas || false,
      valor_inscricao: newEvent.valor_inscricao,
      responsavel: user?.name || '',
      status: 'Planejado',
      participantes: [],
      ministerios_envolvidos: newEvent.ministerios_envolvidos || [],
      recursos_necessarios: newEvent.recursos_necessarios || []
    }

    setEvents([...events, event])
    setIsCreateDialogOpen(false)
    setNewEvent({
      nome: '',
      data_hora: '',
      local: '',
      descricao: '',
      tipo: 'Culto',
      inscricoes_abertas: true,
      status: 'Planejado',
      participantes: [],
      ministerios_envolvidos: [],
      recursos_necessarios: []
    })
    toast.success('Evento criado com sucesso!')
  }

  const getStatusColor = (status: Event['status']) => {
    switch (status) {
      case 'Planejado': return 'bg-yellow-100 text-yellow-800'
      case 'Confirmado': return 'bg-green-100 text-green-800'
      case 'Em Andamento': return 'bg-blue-100 text-blue-800'
      case 'Finalizado': return 'bg-gray-100 text-gray-800'
      case 'Cancelado': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeColor = (tipo: Event['tipo']) => {
    switch (tipo) {
      case 'Culto': return 'bg-purple-100 text-purple-800'
      case 'Conferência': return 'bg-blue-100 text-blue-800'
      case 'Retiro': return 'bg-green-100 text-green-800'
      case 'Evangelismo': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime)
    return {
      date: date.toLocaleDateString('pt-BR'),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-2xl p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Eventos da Igreja 📅</h1>
        <p className="text-purple-100 text-lg">
          Gerencie todos os eventos e atividades da igreja
        </p>
      </div>

      {/* Actions and Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Pesquisar eventos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              <SelectItem value="Culto">Culto</SelectItem>
              <SelectItem value="Conferência">Conferência</SelectItem>
              <SelectItem value="Retiro">Retiro</SelectItem>
              <SelectItem value="Evangelismo">Evangelismo</SelectItem>
              <SelectItem value="Outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          {canManageEvents && (
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-500 hover:bg-purple-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Evento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar Novo Evento</DialogTitle>
                  <DialogDescription>
                    Preencha as informações do evento
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome do Evento *</Label>
                      <Input
                        id="nome"
                        value={newEvent.nome}
                        onChange={(e) => setNewEvent({...newEvent, nome: e.target.value})}
                        placeholder="Nome do evento"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tipo">Tipo de Evento</Label>
                      <Select value={newEvent.tipo} onValueChange={(value) => setNewEvent({...newEvent, tipo: value as Event['tipo']})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Culto">Culto</SelectItem>
                          <SelectItem value="Conferência">Conferência</SelectItem>
                          <SelectItem value="Retiro">Retiro</SelectItem>
                          <SelectItem value="Evangelismo">Evangelismo</SelectItem>
                          <SelectItem value="Casamento">Casamento</SelectItem>
                          <SelectItem value="Funeral">Funeral</SelectItem>
                          <SelectItem value="Outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="data_hora">Data e Hora *</Label>
                      <Input
                        id="data_hora"
                        type="datetime-local"
                        value={newEvent.data_hora}
                        onChange={(e) => setNewEvent({...newEvent, data_hora: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="local">Local *</Label>
                      <Input
                        id="local"
                        value={newEvent.local}
                        onChange={(e) => setNewEvent({...newEvent, local: e.target.value})}
                        placeholder="Local do evento"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={newEvent.descricao}
                      onChange={(e) => setNewEvent({...newEvent, descricao: e.target.value})}
                      placeholder="Descrição do evento"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="capacidade">Capacidade Máxima</Label>
                      <Input
                        id="capacidade"
                        type="number"
                        value={newEvent.capacidade_maxima || ''}
                        onChange={(e) => setNewEvent({...newEvent, capacidade_maxima: parseInt(e.target.value) || undefined})}
                        placeholder="Número máximo de participantes"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="valor">Valor da Inscrição (R$)</Label>
                      <Input
                        id="valor"
                        type="number"
                        step="0.01"
                        value={newEvent.valor_inscricao || ''}
                        onChange={(e) => setNewEvent({...newEvent, valor_inscricao: parseFloat(e.target.value) || undefined})}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreateEvent}>
                      Criar Evento
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Events List */}
      <div className="grid gap-6">
        {filteredEvents.map((event) => (
          <Card key={event.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">{event.nome}</h3>
                        <Badge className={getTypeColor(event.tipo)}>
                          {event.tipo}
                        </Badge>
                        <Badge className={getStatusColor(event.status)}>
                          {event.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDateTime(event.data_hora).date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatDateTime(event.data_hora).time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{event.local}</span>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-3">{event.descricao}</p>

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{event.participantes.length} participantes</span>
                          {event.capacidade_maxima && (
                            <span>/ {event.capacidade_maxima}</span>
                          )}
                        </div>
                        {event.valor_inscricao && (
                          <div className="font-medium text-green-600">
                            R$ {event.valor_inscricao.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Detalhes
                  </Button>
                  {event.inscricoes_abertas && (
                    <Button size="sm" className="bg-green-500 hover:bg-green-600">
                      <UserCheck className="w-4 h-4 mr-2" />
                      Inscrever-se
                    </Button>
                  )}
                  {canManageEvents && (
                    <>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum evento encontrado</h3>
            <p className="text-gray-600">
              {searchTerm || filterType !== 'all' 
                ? 'Tente ajustar os filtros de busca'
                : 'Não há eventos cadastrados no momento'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default EventsPage