import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, FileText } from "lucide-react";
import EventProgramModal from "./EventProgramModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEvents } from "@/hooks/useEvents";

type Evento = {
  id: string;
  nome: string;
  descricao?: string | null;
  data_hora: string;
  local?: string | null;
  status?: string | null;
  tipo?: string | null;
};

const OrderOfServiceEventsPage = () => {
  const { currentChurchId } = useAuthStore();
  const [events, setEvents] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Evento | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: eventsData = [], isLoading, refetch } = useEvents(currentChurchId);
  useEffect(() => {
    setEvents(eventsData);
    setLoading(isLoading);
  }, [eventsData, isLoading]);

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
        <Button variant="outline" onClick={() => refetch()}>Atualizar</Button>
      </div>

      {loading && <div className="p-6 text-center text-muted-foreground">Carregando eventos...</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((ev) => (
          <Card key={ev.id} className="hover:shadow-md transition cursor-pointer" onClick={() => openEvent(ev)}>
            <CardHeader>
              <CardTitle className="text-lg">{ev.nome}</CardTitle>
              <CardDescription className="line-clamp-2">{ev.descricao || "Sem descrição"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {fmtDate(ev.data_hora)}</div>
              <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {ev.local || "—"}</div>
              <div className="flex items-center gap-2"><FileText className="w-4 h-4" /> {ev.status || "Planejado"}</div>
              <div className="flex items-center gap-2">{ev.tipo ? `Tipo: ${ev.tipo}` : ""}</div>
              <div className="pt-2">
                <Button variant="secondary" size="sm" onClick={() => openEvent(ev)}>Programar</Button>
              </div>
            </CardContent>
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