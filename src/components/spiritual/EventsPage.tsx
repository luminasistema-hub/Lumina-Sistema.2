import { useState, useEffect, useCallback } from 'react'
import { useAuthStore } from '../../stores/authStore'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { toast } from 'sonner'
import { supabase } from '../../integrations/supabase/client'
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Users, 
  UserCheck,
  Filter,
  Search,
  Loader2,
  UserX,
  DollarSign
} from 'lucide-react'

// Interfaces
interface Event {
  id: string; nome: string; data_hora: string; local: string;
  descricao: string; tipo: 'Culto' | 'Conferência' | 'Retiro' | 'Evangelismo' | 'Casamento' | 'Funeral' | 'Outro';
  capacidade_maxima?: number; inscricoes_abertas: boolean; valor_inscricao?: number;
  status: 'Planejado' | 'Confirmado' | 'Em Andamento' | 'Finalizado' | 'Cancelado';
  participantes_count: number; is_registered?: boolean;
}

const EventsPage = () => {
  const { user, currentChurchId } = useAuthStore()
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [loading, setLoading] = useState(true)

  const loadEvents = useCallback(async () => {
    if (!currentChurchId) {
        setLoading(false);
        return;
    }
    setLoading(true)
    try {
      const { data, error } = await supabase.from('eventos')
        .select(`*, participantes:evento_participantes(count)`)
        .eq('id_igreja', currentChurchId)
        .order('data_hora', { ascending: true })

      if (error) throw error

      let fetchedEvents: Event[] = data.map((event: any) => ({
        ...event,
        participantes_count: event.participantes?.[0]?.count || 0,
        is_registered: false,
      }))

      if (user?.id) {
        const { data: userRegistrations } = await supabase.from('evento_participantes')
          .select('evento_id').eq('membro_id', user.id)
          .in('evento_id', fetchedEvents.map(e => e.id));
        
        const registeredEventIds = new Set(userRegistrations?.map(r => r.evento_id));
        fetchedEvents = fetchedEvents.map(event => ({...event, is_registered: registeredEventIds.has(event.id)}));
      }
      setEvents(fetchedEvents)
    } catch (error: any) {
      toast.error('Erro ao carregar eventos: ' + error.message)
    } finally {
      setLoading(false)
    }
  }, [currentChurchId, user?.id])

  useEffect(() => { loadEvents() }, [loadEvents])
  // Atualização automática via Supabase Realtime ao criar/editar/remover eventos da igreja atual
  useEffect(() => {
    if (!currentChurchId) return;
    const channelEventos = supabase
      .channel(`events-${currentChurchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'eventos', filter: `id_igreja=eq.${currentChurchId}` },
        () => { loadEvents(); }
      )
      .subscribe();
    const channelInscricoes = supabase
      .channel(`event-registrations-${currentChurchId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'evento_participantes', filter: `id_igreja=eq.${currentChurchId}` },
        () => { loadEvents(); }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channelEventos);
      supabase.removeChannel(channelInscricoes);
    };
  }, [currentChurchId, loadEvents])

  useEffect(() => {
    let filtered = events.filter(event => 
        (filterType === 'all' || event.tipo === filterType) &&
        (event.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
         event.local.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredEvents(filtered)
  }, [events, filterType, searchTerm])

  const handleRegister = (event: Event) => {
    if (!user?.id) return toast.error('Você precisa estar logado para se inscrever.');
    if (event.participantes_count >= (event.capacidade_maxima || Infinity)) return toast.error('Capacidade máxima atingida.');
    
    const promise = async () => {
        const { error } = await supabase.from('evento_participantes').insert({
            evento_id: event.id, membro_id: user.id, id_igreja: currentChurchId
        });
        if (error) throw error;
    };

    toast.promise(promise(), {
        loading: 'Realizando inscrição...',
        success: () => { loadEvents(); return 'Inscrição realizada com sucesso!'; },
        error: (err: any) => `Erro na inscrição: ${err.message}`,
    });
  }

  const handleUnregister = (eventId: string) => {
    if (!user?.id) return;
    const promise = async () => {
        const { error } = await supabase.from('evento_participantes').delete()
            .eq('evento_id', eventId).eq('membro_id', user.id);
        if (error) throw error;
    };
    
    toast.promise(promise(), {
      loading: 'Cancelando inscrição...',
      success: () => { loadEvents(); return 'Inscrição cancelada!'; },
      error: (err: any) => `Erro ao cancelar: ${err.message}`,
    });
  }
  
  const getStatusColor = (status: Event['status']) => ({
    'Planejado': 'bg-yellow-100 text-yellow-800', 'Confirmado': 'bg-green-100 text-green-800',
    'Em Andamento': 'bg-blue-100 text-blue-800', 'Finalizado': 'bg-gray-200 text-gray-800',
    'Cancelado': 'bg-red-100 text-red-800'
  }[status] || 'bg-gray-100 text-gray-800');

  const getTypeColor = (tipo: Event['tipo']) => ({
    'Culto': 'bg-purple-100 text-purple-800', 'Conferência': 'bg-indigo-100 text-indigo-800',
    'Retiro': 'bg-teal-100 text-teal-800', 'Evangelismo': 'bg-orange-100 text-orange-800',
  }[tipo] || 'bg-gray-100 text-gray-800');

  const formatDateTime = (dateTime: string) => {
    if(!dateTime) return { day: '', month: '', time: ''};
    const d = new Date(dateTime);
    return { 
      day: d.toLocaleDateString('pt-BR', { day: '2-digit' }),
      month: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) 
    };
  }

  if (loading && events.length === 0) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-purple-600 animate-spin" />
        <p className="ml-4 text-lg text-gray-600">Carregando eventos...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 md:p-8 text-white shadow-lg">
        <div>
          <h1 className="text-3xl font-bold">Agenda de Eventos</h1>
          <p className="text-purple-100 mt-1">Veja e participe das atividades da sua igreja.</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
            <div className="relative w-full md:w-auto flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input placeholder="Pesquisar por nome ou local..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-[200px]">
                    <div className="flex items-center gap-2"><Filter className="w-4 h-4" /><span>Filtrar por tipo</span></div>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos os Tipos</SelectItem>
                    <SelectItem value="Culto">Culto</SelectItem>
                    <SelectItem value="Conferência">Conferência</SelectItem>
                    <SelectItem value="Retiro">Retiro</SelectItem>
                </SelectContent>
            </Select>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {filteredEvents.map((event) => {
          const { day, month, time } = formatDateTime(event.data_hora);
          return (
            <Card key={event.id} className="shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
              <CardContent className="p-0 flex">
                <div className="bg-gray-50 p-4 flex flex-col items-center justify-center border-r text-center w-24">
                  <span className="text-xs font-semibold uppercase text-purple-600">{month}</span>
                  <span className="text-3xl font-bold text-gray-800">{day}</span>
                </div>
                <div className="p-4 flex-1 flex flex-col md:flex-row md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-bold text-gray-900">{event.nome}</h3>
                      <Badge className={getTypeColor(event.tipo)} variant="outline">{event.tipo}</Badge>
                      <Badge className={getStatusColor(event.status)} variant="outline">{event.status}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mb-3">
                      <div className="flex items-center gap-1.5"><Clock className="w-4 h-4" /><span>{time}</span></div>
                      <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /><span>{event.local}</span></div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-700">
                      <div className="flex items-center gap-1.5"><Users className="w-4 h-4" /><span>{event.participantes_count} {event.capacidade_maxima ? `/ ${event.capacidade_maxima}` : ''}</span></div>
                      {event.valor_inscricao && <div className="flex items-center gap-1.5 font-semibold text-green-600"><DollarSign className="w-4 h-4" /><span>{event.valor_inscricao.toFixed(2)}</span></div>}
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 self-end md:self-center">
                    {event.is_registered ? 
                      (<Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => handleUnregister(event.id)}><UserX className="w-4 h-4 mr-2" />Cancelar Inscrição</Button>) :
                      (<Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleRegister(event)} disabled={!event.inscricoes_abertas || event.participantes_count >= (event.capacidade_maxima || Infinity)}><UserCheck className="w-4 h-4 mr-2" />Inscrever-se</Button>)
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
          )})}
      </div>

      {filteredEvents.length === 0 && !loading && (
        <Card className="border-dashed"><CardContent className="p-12 text-center"><Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" /><h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhum evento encontrado</h3><p className="text-gray-500">{searchTerm || filterType !== 'all' ? 'Tente ajustar os filtros de busca.' : 'Não há eventos agendados no momento.'}</p></CardContent></Card>
      )}
    </div>
  )
}
export default EventsPage