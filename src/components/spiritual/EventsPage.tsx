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
  Share2,
  Loader2,
  UserX
} from 'lucide-react'

// Interface atualizada para corresponder à tabela 'eventos'
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
  responsavel: string // Nome do responsável
  responsavel_id?: string // ID do responsável (membro)
  status: 'Planejado' | 'Confirmado' | 'Em Andamento' | 'Finalizado' | 'Cancelado'
  created_at: string
  updated_at: string
  id_igreja: string
  // Propriedades para detalhes que serão carregadas sob demanda ou via join
  participantes_count: number // Contagem de participantes
  is_registered?: boolean // Se o usuário logado está inscrito
}

// Interface para os participantes do evento (tabela evento_participantes)
interface EventParticipant {
  id: string
  evento_id: string
  membro_id: string
  presente: boolean
  data_inscricao: string
  membro_nome?: string // Para exibição
  membro_email?: string // Para exibição
}

const EventsPage = () => {
  const { user, currentChurchId } = useAuthStore()
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [eventParticipants, setEventParticipants] = useState<EventParticipant[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  const canManageEvents = user?.role === 'admin' || user?.role === 'pastor' || user?.role === 'lider_ministerio'

  const [newEvent, setNewEvent] = useState({
    nome: '',
    data_hora: '',
    local: '',
    descricao: '',
    tipo: 'Culto' as Event['tipo'],
    capacidade_maxima: undefined as number | undefined,
    inscricoes_abertas: true,
    valor_inscricao: undefined as number | undefined,
  })

  const [editEventData, setEditEventData] = useState({
    id: '',
    nome: '',
    data_hora: '',
    local: '',
    descricao: '',
    tipo: 'Culto' as Event['tipo'],
    capacidade_maxima: undefined as number | undefined,
    inscricoes_abertas: true,
    valor_inscricao: undefined as number | undefined,
    status: 'Planejado' as Event['status'],
  })

  const loadEvents = useCallback(async () => {
    if (!currentChurchId) {
      setEvents([])
      setFilteredEvents([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('eventos')
        .select(`
          *,
          participantes_count:evento_participantes(count)
        `)
        .eq('id_igreja', currentChurchId)
        .order('data_hora', { ascending: true })

      if (error) throw error

      const fetchedEvents: Event[] = data.map((event: any) => ({
        ...event,
        participantes_count: event.participantes_count[0]?.count || 0,
        is_registered: false, // Será atualizado na próxima etapa
      }))

      // Verificar se o usuário está inscrito em cada evento
      if (user?.id) {
        const { data: userRegistrations, error: regError } = await supabase
          .from('evento_participantes')
          .select('evento_id')
          .eq('membro_id', user.id)
          .in('evento_id', fetchedEvents.map(e => e.id));

        if (regError) console.error('Error fetching user registrations:', regError);

        const registeredEventIds = new Set(userRegistrations?.map(r => r.evento_id));
        fetchedEvents.forEach(event => {
          event.is_registered = registeredEventIds.has(event.id);
        });
      }

      setEvents(fetchedEvents)
    } catch (error: any) {
      console.error('Error loading events:', error.message)
      toast.error('Erro ao carregar eventos: ' + error.message)
    } finally {
      setLoading(false)
    }
  }, [currentChurchId, user?.id])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

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

  const handleCreateEvent = async () => {
    if (!newEvent.nome || !newEvent.data_hora || !newEvent.local || !currentChurchId) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('eventos')
        .insert({
          id_igreja: currentChurchId,
          nome: newEvent.nome,
          data_hora: newEvent.data_hora,
          local: newEvent.local,
          descricao: newEvent.descricao || null,
          tipo: newEvent.tipo,
          capacidade_maxima: newEvent.capacidade_maxima || null,
          inscricoes_abertas: newEvent.inscricoes_abertas,
          valor_inscricao: newEvent.valor_inscricao || null,
          responsavel: user?.name || 'Sistema', // Nome do usuário logado como responsável
          responsavel_id: user?.id || null, // ID do usuário logado como responsável
          status: 'Planejado',
        })

      if (error) throw error
      toast.success('Evento criado com sucesso!')
      setIsCreateDialogOpen(false)
      setNewEvent({
        nome: '', data_hora: '', local: '', descricao: '', tipo: 'Culto',
        capacidade_maxima: undefined, inscricoes_abertas: true, valor_inscricao: undefined
      })
      loadEvents()
    } catch (error: any) {
      console.error('Error creating event:', error.message)
      toast.error('Erro ao criar evento: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEditEvent = async () => {
    if (!editEventData.id || !editEventData.nome || !editEventData.data_hora || !editEventData.local || !currentChurchId) {
      toast.error('Preencha todos os campos obrigatórios para edição')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('eventos')
        .update({
          nome: editEventData.nome,
          data_hora: editEventData.data_hora,
          local: editEventData.local,
          descricao: editEventData.descricao || null,
          tipo: editEventData.tipo,
          capacidade_maxima: editEventData.capacidade_maxima || null,
          inscricoes_abertas: editEventData.inscricoes_abertas,
          valor_inscricao: editEventData.valor_inscricao || null,
          status: editEventData.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editEventData.id)
        .eq('id_igreja', currentChurchId)

      if (error) throw error
      toast.success('Evento atualizado com sucesso!')
      setIsEditDialogOpen(false)
      setSelectedEvent(null)
      loadEvents()
    } catch (error: any) {
      console.error('Error updating event:', error.message)
      toast.error('Erro ao atualizar evento: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Tem certeza que deseja excluir este evento? Esta ação é irreversível e removerá todos os participantes associados.')) {
      return
    }
    if (!currentChurchId) {
      toast.error('Nenhuma igreja ativa selecionada.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('eventos')
        .delete()
        .eq('id', eventId)
        .eq('id_igreja', currentChurchId)

      if (error) throw error
      toast.success('Evento excluído com sucesso!')
      loadEvents()
    } catch (error: any) {
      console.error('Error deleting event:', error.message)
      toast.error('Erro ao excluir evento: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterForEvent = async (event: Event) => {
    if (!user?.id || !currentChurchId) {
      toast.error('Você precisa estar logado para se inscrever em um evento.')
      return
    }
    if (event.participantes_count >= (event.capacidade_maxima || Infinity)) {
      toast.error('Capacidade máxima do evento atingida.')
      return;
    }
    if (event.valor_inscricao && event.valor_inscricao > 0) {
      toast.info('Este evento possui valor de inscrição. A funcionalidade de pagamento será implementada em breve.');
      // Implementar lógica de pagamento aqui
      // Por enquanto, vamos permitir a inscrição sem pagamento real
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('evento_participantes')
        .insert({
          evento_id: event.id,
          membro_id: user.id,
          data_inscricao: new Date().toISOString(),
          presente: false, // Inicialmente não presente
          id_igreja: currentChurchId, // Adicionar id_igreja para RLS
        })

      if (error) throw error
      toast.success('Inscrição realizada com sucesso!')
      loadEvents()
    } catch (error: any) {
      console.error('Error registering for event:', error.message)
      toast.error('Erro ao se inscrever no evento: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUnregisterForEvent = async (eventId: string) => {
    if (!user?.id || !currentChurchId) {
      toast.error('Você precisa estar logado para cancelar a inscrição.')
      return
    }

    if (!confirm('Tem certeza que deseja cancelar sua inscrição neste evento?')) {
      return;
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('evento_participantes')
        .delete()
        .eq('evento_id', eventId)
        .eq('membro_id', user.id)
        .eq('id_igreja', currentChurchId) // Adicionar id_igreja para RLS

      if (error) throw error
      toast.success('Inscrição cancelada com sucesso!')
      loadEvents()
    } catch (error: any) {
      console.error('Error unregistering for event:', error.message)
      toast.error('Erro ao cancelar inscrição: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const loadEventDetails = async (eventId: string) => {
    if (!currentChurchId) return;
    setLoading(true);
    try {
      const { data: eventData, error: eventError } = await supabase
        .from('eventos')
        .select(`
          *,
          participantes_count:evento_participantes(count)
        `)
        .eq('id', eventId)
        .eq('id_igreja', currentChurchId)
        .single();

      if (eventError) throw eventError;

      const eventWithCount: Event = {
        ...eventData,
        participantes_count: eventData.participantes_count[0]?.count || 0,
        is_registered: false, // Será atualizado abaixo
      };

      // Verificar se o usuário logado está inscrito
      if (user?.id) {
        const { data: userRegistration, error: regError } = await supabase
          .from('evento_participantes')
          .select('id')
          .eq('evento_id', eventId)
          .eq('membro_id', user.id)
          .eq('id_igreja', currentChurchId)
          .maybeSingle();
        if (regError) console.error('Error checking user registration:', regError);
        eventWithCount.is_registered = !!userRegistration;
      }

      // Carregar lista de participantes para o modal de detalhes
      const { data: participantsData, error: participantsError } = await supabase
        .from('evento_participantes')
        .select(`
          id,
          evento_id,
          membro_id,
          presente,
          data_inscricao,
          membros(nome_completo, email)
        `)
        .eq('evento_id', eventId)
        .eq('id_igreja', currentChurchId);

      if (participantsError) throw participantsError;

      const formattedParticipants: EventParticipant[] = participantsData.map((p: any) => ({
        id: p.id,
        evento_id: p.evento_id,
        membro_id: p.membro_id,
        presente: p.presente,
        data_inscricao: p.data_inscricao,
        membro_nome: p.membros?.nome_completo || 'Desconhecido',
        membro_email: p.membros?.email || 'N/A',
      }));

      setSelectedEvent(eventWithCount);
      setEventParticipants(formattedParticipants);
      setIsDetailDialogOpen(true);
    } catch (error: any) {
      console.error('Error loading event details:', error.message);
      toast.error('Erro ao carregar detalhes do evento: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

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

  if (!currentChurchId) {
    return (
      <div className="p-6 text-center text-gray-600">
        Selecione uma igreja para gerenciar os eventos.
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin">
        </Loader2>
        <p className="ml-4 text-lg text-gray-600">Carregando eventos...</p>
      </div>
    );
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
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="inscricoes_abertas"
                      checked={newEvent.inscricoes_abertas}
                      onChange={(e) => setNewEvent({...newEvent, inscricoes_abertas: e.target.checked})}
                      className="form-checkbox h-4 w-4 text-purple-600"
                    />
                    <Label htmlFor="inscricoes_abertas">Inscrições Abertas</Label>
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
                          <span>{event.participantes_count} participantes</span>
                          {event.capacidade_maxima && (
                            <span>/ {event.capacidade_maxima}</span>
                          )}
                        </div>
                        {event.valor_inscricao && event.valor_inscricao > 0 && (
                          <div className="font-medium text-green-600">
                            R$ {event.valor_inscricao.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => loadEventDetails(event.id)}>
                    <Eye className="w-4 h-4 mr-2" />
                    Ver Detalhes
                  </Button>
                  {event.inscricoes_abertas && !event.is_registered && (
                    <Button 
                      size="sm" 
                      className="bg-green-500 hover:bg-green-600"
                      onClick={() => handleRegisterForEvent(event)}
                      disabled={event.participantes_count >= (event.capacidade_maxima || Infinity)}
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      Inscrever-se
                    </Button>
                  )}
                  {event.inscricoes_abertas && event.is_registered && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => handleUnregisterForEvent(event.id)}
                    >
                      <UserX className="w-4 h-4 mr-2" />
                      Cancelar Inscrição
                    </Button>
                  )}
                  {canManageEvents && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedEvent(event);
                          setEditEventData({
                            id: event.id,
                            nome: event.nome,
                            data_hora: event.data_hora.slice(0, 16), // Formato para input datetime-local
                            local: event.local,
                            descricao: event.descricao,
                            tipo: event.tipo,
                            capacidade_maxima: event.capacidade_maxima,
                            inscricoes_abertas: event.inscricoes_abertas,
                            valor_inscricao: event.valor_inscricao,
                            status: event.status,
                          });
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
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

      {/* Edit Event Dialog */}
      {selectedEvent && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Evento: {selectedEvent.nome}</DialogTitle>
              <DialogDescription>
                Atualize as informações do evento
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-nome">Nome do Evento *</Label>
                  <Input
                    id="edit-nome"
                    value={editEventData.nome}
                    onChange={(e) => setEditEventData({...editEventData, nome: e.target.value})}
                    placeholder="Nome do evento"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-tipo">Tipo de Evento</Label>
                  <Select value={editEventData.tipo} onValueChange={(value) => setEditEventData({...editEventData, tipo: value as Event['tipo']})}>
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
                  <Label htmlFor="edit-data_hora">Data e Hora *</Label>
                  <Input
                    id="edit-data_hora"
                    type="datetime-local"
                    value={editEventData.data_hora}
                    onChange={(e) => setEditEventData({...editEventData, data_hora: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-local">Local *</Label>
                  <Input
                    id="edit-local"
                    value={editEventData.local}
                    onChange={(e) => setEditEventData({...editEventData, local: e.target.value})}
                    placeholder="Local do evento"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-descricao">Descrição</Label>
                <Textarea
                  id="edit-descricao"
                  value={editEventData.descricao}
                  onChange={(e) => setEditEventData({...editEventData, descricao: e.target.value})}
                  placeholder="Descrição do evento"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-capacidade">Capacidade Máxima</Label>
                  <Input
                    id="edit-capacidade"
                    type="number"
                    value={editEventData.capacidade_maxima || ''}
                    onChange={(e) => setEditEventData({...editEventData, capacidade_maxima: parseInt(e.target.value) || undefined})}
                    placeholder="Número máximo de participantes"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-valor">Valor da Inscrição (R$)</Label>
                  <Input
                    id="edit-valor"
                    type="number"
                    step="0.01"
                    value={editEventData.valor_inscricao || ''}
                    onChange={(e) => setEditEventData({...editEventData, valor_inscricao: parseFloat(e.target.value) || undefined})}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-inscricoes_abertas"
                  checked={editEventData.inscricoes_abertas}
                  onChange={(e) => setEditEventData({...editEventData, inscricoes_abertas: e.target.checked})}
                  className="form-checkbox h-4 w-4 text-purple-600"
                />
                <Label htmlFor="edit-inscricoes_abertas">Inscrições Abertas</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status do Evento</Label>
                <Select value={editEventData.status} onValueChange={(value) => setEditEventData({...editEventData, status: value as Event['status']})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planejado">Planejado</SelectItem>
                    <SelectItem value="Confirmado">Confirmado</SelectItem>
                    <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                    <SelectItem value="Finalizado">Finalizado</SelectItem>
                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleEditEvent}>
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <Dialog open={isDetailDialogOpen} onOpenChange={() => setIsDetailDialogOpen(false)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">{selectedEvent.nome}</DialogTitle>
              <DialogDescription>
                Detalhes do evento e lista de participantes
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-500">Data</Label>
                  <p className="text-gray-900">{formatDateTime(selectedEvent.data_hora).date}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Hora</Label>
                  <p className="text-gray-900">{formatDateTime(selectedEvent.data_hora).time}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Local</Label>
                  <p className="text-gray-900">{selectedEvent.local}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Tipo</Label>
                  <Badge className={getTypeColor(selectedEvent.tipo)}>{selectedEvent.tipo}</Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Status</Label>
                  <Badge className={getStatusColor(selectedEvent.status)}>{selectedEvent.status}</Badge>
                </div>
                {selectedEvent.capacidade_maxima && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Capacidade Máxima</Label>
                    <p className="text-gray-900">{selectedEvent.capacidade_maxima} pessoas</p>
                  </div>
                )}
                {selectedEvent.valor_inscricao && selectedEvent.valor_inscricao > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Valor da Inscrição</Label>
                    <p className="text-green-600 font-bold">R$ {selectedEvent.valor_inscricao.toFixed(2)}</p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-gray-500">Inscrições Abertas</Label>
                  <p className="text-gray-900">{selectedEvent.inscricoes_abertas ? 'Sim' : 'Não'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-500">Responsável</Label>
                  <p className="text-gray-900">{selectedEvent.responsavel}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">Descrição</Label>
                <p className="text-gray-700">{selectedEvent.descricao}</p>
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Participantes ({eventParticipants.length})
                </h3>
                {eventParticipants.length > 0 ? (
                  <div className="space-y-2">
                    {eventParticipants.map(participant => (
                      <div key={participant.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{participant.membro_nome}</p>
                          <p className="text-sm text-gray-600">{participant.membro_email}</p>
                        </div>
                        <Badge variant="outline">
                          Inscrito em {new Date(participant.data_inscricao).toLocaleDateString('pt-BR')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 italic">Nenhum participante inscrito ainda.</p>
                )}
              </div>
            </div>
            <DialogFooter className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default EventsPage