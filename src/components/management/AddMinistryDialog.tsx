"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  churchId: string | null | undefined;
  onCreated?: () => void;
};

const AddMinistryDialog = ({ open, onOpenChange, churchId, onCreated }: Props) => {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!churchId) {
      toast.error("Selecione uma igreja antes de criar o ministério.");
      return;
    }
    if (!nome.trim()) {
      toast.error("Informe o nome do ministério.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("ministerios")
      .insert({ nome: nome.trim(), descricao: descricao.trim() || null, id_igreja: churchId });
    setSaving(false);
    if (error) {
      toast.error("Erro ao criar ministério: " + error.message);
      return;
    }
    toast.success("Ministério criado com sucesso!");
    setNome("");
    setDescricao("");
    onOpenChange(false);
    onCreated?.();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Ministério</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="nome-ministerio">Nome</Label>
            <Input
              id="nome-ministerio"
              placeholder="Ex.: Ministério de Comunicação"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="descricao-ministerio">Descrição</Label>
            <Textarea
              id="descricao-ministerio"
              placeholder="Descreva a missão e responsabilidades do ministério"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>
          <Button onClick={handleSave} className="w-full" disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Criar Ministério
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddMinistryDialog;