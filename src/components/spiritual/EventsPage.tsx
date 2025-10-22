import { useState, useEffect, useMemo } from 'react'
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
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'

// Interfaces
interface Event {
  id: string; nome: string; data_hora: string; local: string;
  descricao: string; tipo: 'Culto' | 'Conferência' | 'Retiro' | 'Evangelismo' | 'Casamento' | 'Funeral' | 'Outro';
  capacidade_maxima?: number; inscricoes_abertas: boolean; valor_inscricao?: number;
  status: 'Planejado' | 'Confirmado' | 'Em Andamento' | 'Finalizado' | 'Cancelado';
  participantes_count: number; is_registered?: boolean;
  link_externo?: string;
}

const fetchEvents = async (churchId: string | null) => {
  if (!churchId) return [];
  try {
    const { data, error } = await supabase.rpc('get_eventos_para_igreja_com_participacao', {
      id_igreja_atual: churchId,
    });
    if (error) throw error;
    const items: Event[] = (data || []).map((e: any) => ({
      id: e.evento_id,                // usa a coluna não ambígua
      nome: e.nome,
      data_hora: e.data_hora,
      local: e.local ?? '',
      descricao: e.descricao ?? '',
      tipo: (e.tipo || 'Outro') as Event['tipo'],
      capacidade_maxima: e.capacidade_maxima ?? undefined,
      inscricoes_abertas: Boolean(e.inscricoes_abertas),
      valor_inscricao: e.valor_inscricao != null ? Number(e.valor_inscricao) : undefined,
      status: (e.status || 'Planejado') as Event['status'],
      participantes_count: Number(e.participantes_count || 0),
      is_registered: Boolean(e.is_registered),
      link_externo: e.link_externo ?? undefined,
    }));
    items.sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());
    return items;
  } catch (rpcErr: any) {
    toast.error(`Falha ao carregar eventos compartilhados: ${rpcErr?.message || 'erro RPC'}. Exibindo apenas eventos da sua igreja.`);
    const { data: ownEvents, error: ownErr } = await supabase
      .from('eventos')
      .select('*')
      .eq('id_igreja', churchId)
      .order('data_hora', { ascending: true });
    if (ownErr) throw ownErr;
    const items: Event[] = (ownEvents || []).map((e: any) => ({
      id: e.id,
      nome: e.nome,
      data_hora: e.data_hora,
      local: e.local ?? '',
      descricao: e.descricao ?? '',
      tipo: (e.tipo || 'Outro') as Event['tipo'],
      capacidade_maxima: e.capacidade_maxima ?? undefined,
      inscricoes_abertas: Boolean(e.inscricoes_abertas),
      valor_inscricao: e.valor_inscricao != null ? Number(e.valor_inscricao) : undefined,
      status: (e.status || 'Planejado') as Event['status'],
      participantes_count: 0,
      is_registered: false,
      link_externo: e.link_externo ?? undefined,
    }));
    return items;
  }
};

const EventsPage = () => {
  const { user, currentChurchId } = useAuthStore()
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [parentChurchId, setParentChurchId] = useState<string | null>(null)

  const queryKey = useMemo(() => ['events', currentChurchId, user?.id], [currentChurchId, user?.id]);

  const { data: events = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchEvents(currentChurchId),
    enabled: !!currentChurchId,
  });

  useEffect(() => {
    if (!currentChurchId) return;

    let channel: ReturnType<typeof supabase.channel> | null = null;
    let parentIdLocal: string | null = null;

    const setupRealtime = async () => {
      // Descobrir mãe
      const { data: churchRow } = await supabase
        .from('igrejas')
        .select('parent_church_id')
        .eq('id', currentChurchId)
        .maybeSingle();
      parentIdLocal = churchRow?.parent_church_id ?? null;
      setParentChurchId(parentIdLocal);

      // Canal único com múltiplos listeners
      channel = supabase
        .channel(`public-events-page-${currentChurchId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'eventos', filter: `id_igreja=eq.${currentChurchId}` },
          () => queryClient.invalidateQueries({ queryKey })
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'evento_participantes', filter: `id_igreja=eq.${currentChurchId}` },
          () => queryClient.invalidateQueries({ queryKey })
        );

      // Assinar também a igreja-mãe (eventos e participações)
      if (parentIdLocal) {
        channel = channel
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'eventos', filter: `id_igreja=eq.${parentIdLocal}` },
            () => queryClient.invalidateQueries({ queryKey })
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'evento_participantes', filter: `id_igreja=eq.${parentIdLocal}` },
            () => queryClient.invalidateQueries({ queryKey })
          );
      }

      channel.subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) {
        try { supabase.removeChannel(channel); } catch {}
      }
    };
  }, [currentChurchId, queryClient, queryKey]);

  const filteredEvents = useMemo(() => {
    return events.filter(event => 
        (filterType === 'all' || event.tipo === filterType) &&
        ((event.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
         (event.local || '').toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [events, filterType, searchTerm]);

  const registerMutation = useMutation({
    mutationFn: async (event: Event) => {
      if (!user?.id || !currentChurchId) throw new Error('Você precisa estar logado para se inscrever.');
      if (event.participantes_count >= (event.capacidade_maxima || Infinity)) throw new Error('Capacidade máxima atingida.');
      
      const { error } = await supabase.from('evento_participantes').insert({
          evento_id: event.id, membro_id: user.id, id_igreja: currentChurchId
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Inscrição realizada com sucesso!');
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: any) => {
      toast.error(`Erro na inscrição: ${err.message}`);
    },
  });

  const unregisterMutation = useMutation({
    mutationFn: async (eventId: string) => {
      if (!user?.id) throw new Error('Usuário não encontrado.');
      const { error } = await supabase.from('evento_participantes').delete()
          .eq('evento_id', eventId).eq('membro_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Inscrição cancelada!');
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: any) => {
      toast.error(`Erro ao cancelar: ${err.message}`);
    },
  });
  
  // Novo handler: abre link externo se evento for pago; caso contrário, realiza inscrição interna
  const handleInscricaoClick = (event: Event) => {
    const price = Number(event.valor_inscricao || 0);
    if (price > 0) {
      if (event.link_externo) {
        window.open(event.link_externo, '_blank', 'noopener,noreferrer');
      } else {
        toast.error('Link de inscrição não configurado para este evento.');
      }
      return;
    }
    registerMutation.mutate(event);
  };
  
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

  if (isLoading && events.length === 0) {
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
                      (<Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-600 hover:bg-red-50" 
                          onClick={() => unregisterMutation.mutate(event.id)}
                          disabled={unregisterMutation.isPending}
                        >
                          {unregisterMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserX className="w-4 h-4 mr-2" />}
                          {unregisterMutation.isPending ? 'Cancelando...' : 'Cancelar Inscrição'}
                        </Button>) :
                      (<Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700" 
                          onClick={() => handleInscricaoClick(event)} 
                          disabled={!event.inscricoes_abertas || event.participantes_count >= (event.capacidade_maxima || Infinity) || registerMutation.isPending}
                        >
                          {registerMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserCheck className="w-4 h-4 mr-2" />}
                          {registerMutation.isPending ? 'Inscrevendo...' : 'Inscrever-se'}
                        </Button>)
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
          )})}
      </div>

      {filteredEvents.length === 0 && !isLoading && (
        <Card className="border-dashed"><CardContent className="p-12 text-center"><Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" /><h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhum evento encontrado</h3><p className="text-gray-500">{searchTerm || filterType !== 'all' ? 'Tente ajustar os filtros de busca.' : 'Não há eventos agendados no momento.'}</p></CardContent></Card>
      )}
    </div>
  )
}
export default EventsPage