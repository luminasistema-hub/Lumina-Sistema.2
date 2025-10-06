import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { EventCard } from './EventCard';
import { CreateEventDialog } from './CreateEventDialog';
import EditEventDialog, { EventItem } from './EditEventDialog';
import EventParticipantsDialog from './EventParticipantsDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Search, Users, Loader2, Trash2 } from 'lucide-react';

const EventsManagementPage = () => {
  const { currentChurchId, user } = useAuthStore();
  const queryClient = useQueryClient();

  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isEditOpen, setEditOpen] = useState(false);
  const [isParticipantsOpen, setParticipantsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('upcoming');

  const queryKey = useMemo(() => ['eventsManagement', currentChurchId, filter, searchTerm], [currentChurchId, filter, searchTerm]);

  const { data: events, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!currentChurchId) return [];
      let query = supabase.from('eventos').select('*').eq('id_igreja', currentChurchId);

      if (filter === 'upcoming') {
        query = query.gt('data_hora', new Date().toISOString());
      } else if (filter === 'past') {
        query = query.lt('data_hora', new Date().toISOString());
      }

      if (searchTerm) {
        query = query.ilike('nome', `%${searchTerm}%`);
      }

      const { data, error } = await query.order('data_hora', { ascending: filter === 'upcoming' });
      if (error) throw new Error(error.message);
      return data as EventItem[];
    },
    enabled: !!currentChurchId,
  });

  const handleSuccess = () => {
    // invalida e refetch com a mesma queryKey ativa, garantindo atualização imediata
    queryClient.invalidateQueries({ queryKey });
    queryClient.refetchQueries({ queryKey });
    setCreateOpen(false);
    setEditOpen(false);
  };

  const deleteMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase.from('eventos').delete().eq('id', eventId);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success('Evento removido com sucesso!');
      handleSuccess();
    },
    onError: (err: any) => {
      toast.error(`Erro ao remover evento: ${err.message}`);
    },
  });

  const handleEdit = (event: EventItem) => {
    setSelectedEvent(event);
    setEditOpen(true);
  };

  const handleViewParticipants = (event: EventItem) => {
    setSelectedEvent(event);
    setParticipantsOpen(true);
  };

  if (!currentChurchId) {
    return <div className="p-6 text-center">Por favor, selecione uma igreja para gerenciar os eventos.</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Gestão de Eventos</h1>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
          <div className="relative w-full sm:w-auto flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar evento..."
              className="pl-9 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar eventos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="upcoming">Próximos</SelectItem>
              <SelectItem value="past">Passados</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setCreateOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" /> Criar Evento
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando eventos...</span>
        </div>
      )}
      {error && <div className="text-red-500 p-4 bg-red-50 rounded-md">Erro ao carregar eventos: {error.message}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events?.map((event) => (
          <div key={event.id} className="flex flex-col">
            <EventCard event={event as any} onClick={() => handleEdit(event)} />
            <div className="mt-2 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => handleViewParticipants(event)}>
                <Users className="mr-2 h-4 w-4" /> Ver Inscritos
              </Button>
              <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(event.id)} disabled={deleteMutation.isPending}>
                <Trash2 className="mr-2 h-4 w-4" /> Remover
              </Button>
            </div>
          </div>
        ))}
      </div>

      {events?.length === 0 && !isLoading && (
        <div className="text-center py-12 text-gray-500">
          <p>Nenhum evento encontrado para os filtros selecionados.</p>
        </div>
      )}

      {currentChurchId && (
        <CreateEventDialog
          open={isCreateOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={handleSuccess}
          igrejaId={currentChurchId}
        />
      )}
      {selectedEvent && (
        <>
          <EditEventDialog open={isEditOpen} onClose={() => setEditOpen(false)} event={selectedEvent} onUpdated={handleSuccess} />
          <EventParticipantsDialog open={isParticipantsOpen} onClose={() => setParticipantsOpen(false)} eventId={selectedEvent.id} churchId={currentChurchId} eventName={selectedEvent.nome} />
        </>
      )}
    </div>
  );
};

export default EventsManagementPage;