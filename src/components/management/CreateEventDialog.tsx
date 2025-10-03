import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabaseClient";

export function CreateEventDialog({
  igrejaId,
  open,
  onClose,
  onCreated,
}: {
  igrejaId: string;
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [nome, setNome] = useState("");
  const [data, setData] = useState("");

  const handleCreate = async () => {
    if (!nome || !data) return;

    const { error } = await supabase.from("eventos").insert({
      nome,
      data,
      igreja_id: igrejaId,
    });

    if (!error) {
      onCreated();
      onClose();
      setNome("");
      setData("");
    } else {
      console.error("Erro ao criar evento:", error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Novo Evento</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Nome do evento" value={nome} onChange={(e) => setNome(e.target.value)} />
          <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
          <Button onClick={handleCreate} className="w-full">
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
