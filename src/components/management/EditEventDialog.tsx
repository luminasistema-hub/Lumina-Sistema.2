import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export interface EventItem {
  id: string;
  id_igreja: string | null;
  nome: string;
  data_hora: string;
  local: string;
  descricao?: string | null;
  tipo: 'Culto' | 'Conferência' | 'Retiro' | 'Evangelismo' | 'Casamento' | 'Funeral' | 'Outro';
  capacidade_maxima?: number | null;
  inscricoes_abertas: boolean;
  valor_inscricao?: number | null;
  status: 'Planejado' | 'Confirmado' | 'Em Andamento' | 'Finalizado' | 'Cancelado';
  link_externo?: string | null;
}

export function EditEventDialog({
  event,
  open,
  onClose,
  onUpdated,
}: {
  event: EventItem;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [nome, setNome] = useState(event.nome);
  const [dataHora, setDataHora] = useState("");
  const [local, setLocal] = useState(event.local);
  const [descricao, setDescricao] = useState(event.descricao || "");
  const [tipo, setTipo] = useState<EventItem["tipo"]>(event.tipo);
  const [status, setStatus] = useState<EventItem["status"]>(event.status);
  const [capacidadeMaxima, setCapacidadeMaxima] = useState<string>(event.capacidade_maxima ? String(event.capacidade_maxima) : "");
  const [valorInscricao, setValorInscricao] = useState<string>(event.valor_inscricao ? String(event.valor_inscricao) : "");
  const [linkExterno, setLinkExterno] = useState<string>(event.link_externo || "");
  const [inscricoesAbertas, setInscricoesAbertas] = useState(event.inscricoes_abertas);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Converter ISO para datetime-local exibível
    try {
      const d = new Date(event.data_hora);
      const pad = (n: number) => String(n).padStart(2, '0');
      const localStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      setDataHora(localStr);
    } catch {
      setDataHora("");
    }
  }, [event.data_hora]);

  const handleUpdate = async () => {
    if (!nome || !dataHora || !local) {
      toast.error("Preencha Nome, Data/Hora e Local.");
      return;
    }
    setSaving(true);
    const payload = {
      nome,
      data_hora: new Date(dataHora).toISOString(),
      local,
      descricao,
      tipo,
      status,
      capacidade_maxima: capacidadeMaxima ? Number(capacidadeMaxima) : null,
      valor_inscricao: valorInscricao ? Number(valorInscricao) : 0,
      inscricoes_abertas: inscricoesAbertas,
      link_externo: valorInscricao && Number(valorInscricao) > 0 ? (linkExterno || null) : null,
    };

    const { error } = await supabase.from("eventos").update(payload).eq("id", event.id);
    setSaving(false);

    if (error) {
      toast.error("Erro ao atualizar evento: " + error.message);
      return;
    }

    toast.success("Evento atualizado!");
    onUpdated();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Evento</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do evento</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataHora">Data e Hora</Label>
            <Input id="dataHora" type="datetime-local" value={dataHora} onChange={(e) => setDataHora(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="local">Local</Label>
            <Input id="local" value={local} onChange={(e) => setLocal(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input id="descricao" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as EventItem["tipo"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as EventItem["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planejado">Planejado</SelectItem>
                  <SelectItem value="Confirmado">Confirmado</SelectItem>
                  <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                  <SelectItem value="Finalizado">Finalizado</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="capacidade">Capacidade Máxima</Label>
              <Input id="capacidade" type="number" min={0} value={capacidadeMaxima} onChange={(e) => setCapacidadeMaxima(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor">Valor Inscrição (R$)</Label>
              <Input id="valor" type="number" min={0} step="0.01" value={valorInscricao} onChange={(e) => setValorInscricao(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Inscrições</Label>
              <Select value={inscricoesAbertas ? "true" : "false"} onValueChange={(v) => setInscricoesAbertas(v === "true")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Abertas</SelectItem>
                  <SelectItem value="false">Fechadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {Number(valorInscricao) > 0 && (
            <div className="space-y-2">
              <Label htmlFor="linkExterno">Link externo (pagamento/inscrição)</Label>
              <Input
                id="linkExterno"
                value={linkExterno}
                onChange={(e) => setLinkExterno(e.target.value)}
              />
            </div>
          )}

          <Button onClick={handleUpdate} className="w-full" disabled={saving}>
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EditEventDialog;