import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EventItem } from "./EditEventDialog";

export function CreateEventDialog({
  open,
  onClose,
  onCreated,
  igrejaId,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  igrejaId: string;
}) {
  const [nome, setNome] = useState("");
  const [dataHora, setDataHora] = useState("");
  const [local, setLocal] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState<EventItem["tipo"]>("Culto");
  const [status, setStatus] = useState<EventItem["status"]>("Planejado");
  const [capacidadeMaxima, setCapacidadeMaxima] = useState("");
  const [valorInscricao, setValorInscricao] = useState("");
  const [linkExterno, setLinkExterno] = useState("");
  const [inscricoesAbertas, setInscricoesAbertas] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!nome || !dataHora || !local) {
      toast.error("Preencha Nome, Data/Hora e Local.");
      return;
    }
    setSaving(true);
    const payload = {
      id_igreja: igrejaId,
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

    const { error } = await supabase.from("eventos").insert(payload);

    if (error) {
      setSaving(false);
      toast.error("Erro ao criar evento: " + error.message);
      return;
    }

    // Criar notificação para a igreja
    const { error: notificationError } = await supabase.from('notificacoes').insert({
      id_igreja: igrejaId,
      user_id: null, // Para todos na igreja
      tipo: 'NOVO_EVENTO',
      titulo: `Novo Evento: ${nome}`,
      descricao: `Não perca! O evento "${nome}" acontecerá em ${new Date(dataHora).toLocaleDateString('pt-BR')}.`,
      link: '/dashboard?module=events'
    });

    if (notificationError) {
      toast.warning("Evento criado, mas houve um erro ao enviar a notificação.");
    }

    setSaving(false);
    toast.success("Evento criado e notificação enviada!");
    onCreated();
    onClose();
    resetForm();
  };

  const resetForm = () => {
    setNome("");
    setDataHora("");
    setLocal("");
    setDescricao("");
    setTipo("Culto");
    setStatus("Planejado");
    setCapacidadeMaxima("");
    setValorInscricao("");
    setLinkExterno("");
    setInscricoesAbertas(true);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Novo Evento</DialogTitle>
          <DialogDescription>Preencha os campos para cadastrar um novo evento na igreja.</DialogDescription>
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

          <Button onClick={handleCreate} className="w-full" disabled={saving}>
            {saving ? "Criando..." : "Criar Evento"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}