import { useEffect, useMemo, useState, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar, MapPin, Pencil, Plus, Search, Eye, Users, DollarSign, ExternalLink } from "lucide-react";
import { CreateEventDialog } from "./CreateEventDialog";
import EditEventDialog, { EventItem } from "./EditEventDialog";
import EventParticipantsDialog from "./EventParticipantsDialog";

const EventsManagementPage = () => {
  const { currentChurchId, user } = useAuthStore();
  type ManagedEvent = EventItem & { participantes_count?: number };
  const [events, setEvents] = useState<ManagedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<EventItem | null>(null);
  const [participantsEvent, setParticipantsEvent] = useState<EventItem | null>(null);
  const isFetchingRef = useRef(false)
  const debounceTimerRef = useRef<number | null>(null)

  const canManage = user?.role === "admin" || user?.role === "pastor";

  const loadEvents = async () => {
    // Evita reentradas concorrentes
    if (isFetchingRef.current) return
    isFetchingRef.current = true
    
    if (!currentChurchId) {
      setLoading(false)
      isFetchingRef.current = false
      return;
    }
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from("eventos")
        .select("*, participantes:evento_participantes(count)")
        .eq("id_igreja", currentChurchId)
        .order("data_hora", { ascending: true });

      if (error) throw error;

      const mapped = (data || []).map((e: any) => ({
        ...e,
        participantes_count: e.participantes?.[0]?.count || 0,
      })) as ManagedEvent[];
      setEvents(mapped);
    } catch (error: any) {
      toast.error("Erro ao carregar eventos: " + error.message);
      setEvents([]);
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  };

  useEffect(() => {
    // Debounce para evitar múltiplas chamadas seguidas
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current)
    }
    debounceTimerRef.current = window.setTimeout(() => {
      loadEvents()
    }, 150)
    
    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current)
      }
    }
  }, [currentChurchId]);

  const filtered = useMemo(() => {
    return events.filter(e => {
      const matchesSearch =
        e.nome.toLowerCase().includes(search.toLowerCase()) ||
        e.local.toLowerCase().includes(search.toLowerCase());
      const matchesTipo = filterTipo === "all" || e.tipo === filterTipo;
      const matchesStatus = filterStatus === "all" || e.status === filterStatus;
      return matchesSearch && matchesTipo && matchesStatus;
    });
  }, [events, search, filterTipo, filterStatus]);

  const toggleInscricoes = async (event: EventItem, value: boolean) => {
    const { error } = await supabase.from("eventos").update({ inscricoes_abertas: value }).eq("id", event.id);
    if (error) {
      toast.error("Erro ao atualizar inscrições: " + error.message);
      return;
    }
    toast.success(value ? "Inscrições abertas." : "Inscrições fechadas.");
    loadEvents();
  };

  if (!canManage) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-700">Apenas administradores e pastores podem gerenciar eventos.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Eventos</h1>
          <p className="text-gray-500">Crie, edite e organize os eventos da sua igreja.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" /> Novo Evento
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:w-auto flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Pesquisar por nome ou local..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Culto">Culto</SelectItem>
              <SelectItem value="Conferência">Conferência</SelectItem>
              <SelectItem value="Retiro">Retiro</SelectItem>
              <SelectItem value="Evangelismo">Evangelismo</SelectItem>
              <SelectItem value="Casamento">Casamento</SelectItem>
              <SelectItem value="Funeral">Funeral</SelectItem>
              <SelectItem value="Outro">Outro</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="Planejado">Planejado</SelectItem>
              <SelectItem value="Confirmado">Confirmado</SelectItem>
              <SelectItem value="Em Andamento">Em Andamento</SelectItem>
              <SelectItem value="Finalizado">Finalizado</SelectItem>
              <SelectItem value="Cancelado">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {loading ? (
          <Card><CardContent className="p-6">Carregando eventos...</CardContent></Card>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="p-12 text-center"><Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" /><h3 className="text-xl font-semibold text-gray-800 mb-2">Nenhum evento encontrado</h3><p className="text-gray-500">Crie um novo evento para começar.</p></CardContent></Card>
        ) : (
          filtered.map((e) => (
            <Card key={e.id} className="shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
              <CardContent className="p-4 flex flex-col md:flex-row md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-lg font-bold text-gray-900">{e.nome}</h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">{e.tipo}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">{e.status}</span>
                    {e.valor_inscricao && Number(e.valor_inscricao) > 0 && e.link_externo ? (
                      <a
                        href={e.link_externo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs inline-flex items-center gap-1 text-blue-600 hover:underline"
                        title="Abrir link externo de inscrição/pagamento"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Link externo
                      </a>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mb-3">
                    <div className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /><span>{new Date(e.data_hora).toLocaleString("pt-BR")}</span></div>
                    <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /><span>{e.local}</span></div>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-700">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4" />
                      <span>
                        Inscritos {e.participantes_count ?? 0}
                        {typeof e.capacidade_maxima === "number" ? ` / ${e.capacidade_maxima}` : " / -"}
                      </span>
                    </div>
                    {e.valor_inscricao ? <div className="flex items-center gap-1.5 font-semibold text-green-600"><DollarSign className="w-4 h-4" /><span>{Number(e.valor_inscricao).toFixed(2)}</span></div> : null}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 self-end md:self-center">
                  <Button variant="outline" onClick={() => setEditEvent(e)}><Pencil className="w-4 h-4 mr-2" />Editar</Button>
                  <Button variant="outline" onClick={() => setParticipantsEvent(e)}>
                    <Eye className="w-4 h-4 mr-2" /> Inscritos
                  </Button>
                  <Button
                    variant={e.inscricoes_abertas ? "secondary" : "default"}
                    onClick={() => toggleInscricoes(e, !e.inscricoes_abertas)}
                  >
                    {e.inscricoes_abertas ? "Fechar inscrições" : "Abrir inscrições"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <CreateEventDialog
        igrejaId={currentChurchId || ""}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => loadEvents()}
      />

      {editEvent && (
        <EditEventDialog
          event={editEvent}
          open={!!editEvent}
          onClose={() => setEditEvent(null)}
          onUpdated={() => loadEvents()}
        />
      )}

      {participantsEvent && (
        <EventParticipantsDialog
          eventId={participantsEvent.id}
          churchId={participantsEvent.id_igreja || ""}
          eventName={participantsEvent.nome}
          open={!!participantsEvent}
          onClose={() => setParticipantsEvent(null)}
        />
      )}
    </div>
  );
};

export default EventsManagementPage;