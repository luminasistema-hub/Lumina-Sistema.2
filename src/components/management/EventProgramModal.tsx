import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";
import { PlusCircle, Trash2, Printer, Clock, User as UserIcon, MapPin, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";

type ProgramItem = {
  titulo: string;
  descricao: string;
  tempo_minutos: number;
  responsavel: string;
};

interface EventProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: {
    id: string;
    nome: string;
    descricao?: string | null;
    data_hora: string;
    local?: string | null;
    status?: string | null;
  } | null;
}

const EventProgramModal = ({ isOpen, onClose, event }: EventProgramModalProps) => {
  const { currentChurchId } = useAuthStore();
  const [items, setItems] = useState<ProgramItem[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [church, setChurch] = useState<any | null>(null);

  const eventDate = useMemo(() => {
    if (!event?.data_hora) return "";
    try {
      return format(new Date(event.data_hora), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch {
      return new Date(event.data_hora).toLocaleString("pt-BR");
    }
  }, [event]);

  useEffect(() => {
    const loadChurch = async () => {
      if (!currentChurchId) return;
      const { data } = await supabase
        .from("igrejas")
        .select("id, nome, endereco, telefone_contato, email")
        .eq("id", currentChurchId)
        .maybeSingle();
      setChurch(data || null);
    };
    loadChurch();
  }, [currentChurchId]);

  const loadProgram = async () => {
    if (!event || !currentChurchId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("programacoes_evento")
      .select("id, itens, avisos_observacoes")
      .eq("evento_id", event.id)
      .eq("id_igreja", currentChurchId)
      .maybeSingle();

    if (error) {
      console.error(error);
      toast.error("Erro ao carregar programação.");
    }

    if (data) {
      setRecordId(data.id);
      setItems(Array.isArray(data.itens) ? data.itens : []);
      setNotes(data.avisos_observacoes || "");
    } else {
      setRecordId(null);
      setItems([]);
      setNotes("");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen && event) {
      loadProgram();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, event?.id, currentChurchId]);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { titulo: "", descricao: "", tempo_minutos: 0, responsavel: "" },
    ]);
  };

  const updateItem = (index: number, patch: Partial<ProgramItem>) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const saveProgram = async () => {
    if (!event || !currentChurchId) return;
    setLoading(true);
    const payload = {
      id_igreja: currentChurchId,
      evento_id: event.id,
      itens: items,
      avisos_observacoes: notes || null,
      updated_at: new Date().toISOString(),
    };
    try {
      if (recordId) {
        const { error } = await supabase
          .from("programacoes_evento")
          .update(payload)
          .eq("id", recordId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("programacoes_evento")
          .insert(payload)
          .select("id")
          .maybeSingle();
        if (error) throw error;
        setRecordId(data?.id || null);
      }
      toast.success("Programação salva!");
    } catch (err: any) {
      console.error(err);
      toast.error("Não foi possível salvar.");
    } finally {
      setLoading(false);
    }
  };

  const printProgram = () => {
    if (!event) return;
    const win = window.open("", "PRINT", "height=800,width=900");
    if (!win) return;

    const churchHeader = `
      <div style="margin-bottom: 8px;">
        <h2 style="margin: 0;">${church?.nome || "Igreja"}</h2>
        ${church?.endereco ? `<div>${church.endereco}</div>` : ""}
        ${church?.telefone_contato ? `<div>Tel: ${church.telefone_contato}</div>` : ""}
        ${church?.email ? `<div>Email: ${church.email}</div>` : ""}
      </div>
    `;

    const itemsHtml = items
      .map(
        (it, idx) => `
        <tr>
          <td style="padding:6px;border:1px solid #ddd;">${idx + 1}</td>
          <td style="padding:6px;border:1px solid #ddd;">${it.titulo || "-"}</td>
          <td style="padding:6px;border:1px solid #ddd;">${it.descricao || "-"}</td>
          <td style="padding:6px;border:1px solid #ddd;text-align:center;">${it.tempo_minutos || 0} min</td>
          <td style="padding:6px;border:1px solid #ddd;">${it.responsavel || "-"}</td>
        </tr>
      `
      )
      .join("");

    const html = `
      <html>
      <head>
        <title>Roteiro de Culto/Eventos</title>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; color: #111; padding: 24px; }
          h1 { margin: 0 0 4px 0; }
          .muted { color: #666; }
          table { border-collapse: collapse; width: 100%; margin-top: 12px; }
          .section { margin-top: 16px; }
          .divider { height:1px;background:#eee;margin:12px 0; }
        </style>
      </head>
      <body>
        ${churchHeader}
        <h1>${event.nome}</h1>
        <div class="muted">
          ${eventDate ? `Data/Hora: ${eventDate}` : ""}
          ${event.local ? ` • Local: ${event.local}` : ""}
          ${event.status ? ` • Status: ${event.status}` : ""}
        </div>
        <div class="divider"></div>
        <div class="section">
          <h3>Programação</h3>
          <table>
            <thead>
              <tr>
                <th style="padding:6px;border:1px solid #ddd;text-align:left;">#</th>
                <th style="padding:6px;border:1px solid #ddd;text-align:left;">Título</th>
                <th style="padding:6px;border:1px solid #ddd;text-align:left;">Descrição</th>
                <th style="padding:6px;border:1px solid #ddd;text-align:center;">Tempo</th>
                <th style="padding:6px;border:1px solid #ddd;text-align:left;">Responsável</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </div>
        <div class="section">
          <h3>Avisos e Observações</h3>
          <div>${(notes || "").replace(/\n/g, "<br />")}</div>
        </div>
        <script>
          window.onload = () => { window.print(); setTimeout(() => window.close(), 300); };
        </script>
      </body>
      </html>
    `;

    win.document.open();
    win.document.write(html);
    win.document.close();
  };

  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {event.nome}
          </DialogTitle>
          <DialogDescription>Monte, salve e imprima o roteiro do culto/evento.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {eventDate}</div>
            <div className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {event.local || "—"}</div>
            <div className="flex items-center gap-2"><UserIcon className="w-4 h-4" /> {church?.nome || "Igreja"}</div>
          </div>

          <ScrollArea className="h-[60vh]">
            <div className="space-y-4 pr-2">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Programação do Evento</h3>
                <Button variant="outline" size="sm" onClick={addItem}>
                  <PlusCircle className="w-4 h-4 mr-1" /> Adicionar Item
                </Button>
              </div>

              <div className="space-y-2">
                {items.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum item. Clique em "Adicionar Item".</p>
                )}

                {items.map((it, idx) => (
                  <div key={idx} className="rounded-md border p-3 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Input
                        placeholder="Título (ex: Oração Inicial, Adoração, Mensagem)"
                        value={it.titulo}
                        onChange={(e) => updateItem(idx, { titulo: e.target.value })}
                      />
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          placeholder="Tempo (min)"
                          value={it.tempo_minutos}
                          onChange={(e) => updateItem(idx, { tempo_minutos: Number(e.target.value) })}
                          className="w-32"
                        />
                        <Clock className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                    <Textarea
                      placeholder="Descrição / Músicas / Observações desse item"
                      value={it.descricao}
                      onChange={(e) => updateItem(idx, { descricao: e.target.value })}
                      rows={3}
                      className="resize-none"
                    />
                    <Input
                      placeholder="Responsável (nome)"
                      value={it.responsavel}
                      onChange={(e) => updateItem(idx, { responsavel: e.target.value })}
                    />
                    <div className="flex justify-end">
                      <Button variant="ghost" size="sm" className="text-red-600" onClick={() => removeItem(idx)}>
                        <Trash2 className="w-4 h-4 mr-1" /> Remover
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Avisos e Observações</h3>
                <Textarea
                  placeholder="Ex: Anúncios, comunicados e observações gerais do culto/evento"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
            </div>
          </ScrollArea>

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={onClose}>Fechar</Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={printProgram}>
                <Printer className="w-4 h-4 mr-1" /> Imprimir
              </Button>
              <Button onClick={saveProgram} disabled={loading}>
                {loading ? "Salvando..." : "Salvar Programação"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventProgramModal;