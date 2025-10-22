import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, FileText, Loader2 } from "lucide-react";
import EventProgramModal from "./EventProgramModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Evento = {
  id: string;
  nome: string;
  descricao?: string | null;
  data_hora: string;
  local?: string | null;
  status?: string | null;
  tipo?: string | null;
};

const fetchChurchEvents = async (churchId: string | null): Promise<Evento[]> => {
  if (!churchId) return [];
  const { data, error } = await supabase
    .from('eventos')
    .select('id, nome, descricao, data_hora, local, status, tipo')
    .eq('id_igreja', churchId)
    .order('data_hora', { ascending: true });

  if (error) {
    throw new Error('Erro ao carregar os eventos da igreja: ' + error.message);
  }
  return data as Evento[];
};

const OrderOfServiceEventsPage = () => {
  const { currentChurchId } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedEvent, setSelectedEvent] = useState<Evento | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const queryKey = ['orderOfServiceEvents', currentChurchId];

  const { data: events, isLoading, isFetching } = useQuery({
    queryKey,
    queryFn: () => fetchChurchEvents(currentChurchId),
    enabled: !!currentChurchId,
  });

  const refetch = () => {
    queryClient.invalidateQueries({ queryKey });
  };

  const openEvent = (ev: Evento) => {
    setSelectedEvent(ev);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const fmtDate = (iso: string) => {
    try {
      return format(new Date(iso), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch {
      return new Date(iso).toLocaleString("pt-BR");
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Ordem de Culto/Eventos</h1>
        <Button variant="outline" onClick={refetch} disabled={isFetching}>
          {isFetching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Atualizar'}
        </Button>
      </div>
      <p className="text-muted-foreground mb-6">Esta seção mostra apenas os eventos criados pela sua igreja, para facilitar a programação da ordem de serviço.</p>

      {isLoading && <div className="p-6 text-center text-muted-foreground">Carregando eventos...</div>}

      {!isLoading && events?.length === 0 && (
        <div className="p-6 text-center text-muted-foreground border-2 border-dashed rounded-lg">
          Nenhum evento encontrado para esta igreja.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(events ?? []).map((ev) => (
          <Card key={ev.id} className="hover:shadow-md transition cursor-pointer flex flex-col" onClick={() => openEvent(ev)}>
            <CardHeader>
              <CardTitle className="text-lg">{ev.nome}</CardTitle>
              <CardDescription className="line-clamp-2">{ev.descricao || "Sem descrição"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground flex-grow">
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {fmtDate(ev.data_hora)}</div>
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {ev.local || "—"}</div>
              <div className="flex items-center gap-2"><FileText className="w-4 h-4" /> {ev.status || "Planejado"}</div>
              <div className="flex items-center gap-2">{ev.tipo ? `Tipo: ${ev.tipo}` : ""}</div>
            </CardContent>
            <div className="p-4 pt-0">
              <Button variant="secondary" size="sm" className="w-full" onClick={(e) => { e.stopPropagation(); openEvent(ev); }}>Programar</Button>
            </div>
          </Card>
        ))}
      </div>

      {selectedEvent && (
        <EventProgramModal
          isOpen={isModalOpen}
          onClose={closeModal}
          event={selectedEvent}
        />
      )}
    </div>
  );
};

export default OrderOfServiceEventsPage;