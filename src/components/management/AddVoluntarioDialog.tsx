"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface AddVoluntarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  idMinisterio: string;   // ministério atual
  idIgreja: string;       // igreja atual
  onAdded?: () => void;   // callback p/ recarregar lista
}

export default function AddVoluntarioDialog({
  open,
  onOpenChange,
  idMinisterio,
  idIgreja,
  onAdded
}: AddVoluntarioDialogProps) {
  const [membros, setMembros] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Buscar membros disponíveis
  useEffect(() => {
    if (!open) return;

    const fetchMembros = async () => {
      setLoading(true);

      try {
        // 1. buscar membros da igreja
        const { data: todos, error: errMembros } = await supabase
          .from("membros")
          .select("id, nome_completo, email")
          .eq("id_igreja", idIgreja)
          .eq("status", "ativo");

        if (errMembros) throw errMembros;

        // 2. buscar voluntários já no ministério
        const { data: voluntarios, error: errVol } = await supabase
          .from("ministerio_voluntarios")
          .select("membro_id")
          .eq("ministerio_id", idMinisterio);

        if (errVol) throw errVol;

        const usados = voluntarios?.map(v => v.membro_id) || [];
        const filtrados = todos?.filter(m => !usados.includes(m.id)) || [];

        setMembros(filtrados);
      } catch (err: any) {
        console.error("Erro ao carregar membros:", err);
        toast.error("Erro ao carregar lista de membros");
        setMembros([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMembros();
  }, [open, idIgreja, idMinisterio]);

  // Adicionar voluntário
  const handleAdd = async () => {
    if (!selected) {
      toast.error("Selecione um membro");
      return;
    }

    try {
      const { error } = await supabase.from("ministerio_voluntarios").insert({
        ministerio_id: idMinisterio,
        membro_id: selected,
        id_igreja: idIgreja,
      });

      if (error) throw error;

      toast.success("Voluntário adicionado com sucesso!");
      if (onAdded) onAdded();
      onOpenChange(false);
      setSelected(null);
    } catch (err: any) {
      console.error("Erro ao adicionar voluntário:", err);
      toast.error("Erro ao adicionar voluntário: " + err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Voluntário</DialogTitle>
          <DialogDescription>Selecione um membro da igreja para adicioná-lo ao ministério.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="ml-2">Carregando membros...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <Select value={selected || ""} onValueChange={setSelected}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um membro" />
              </SelectTrigger>
              <SelectContent>
                {membros.length === 0 ? (
                  <SelectItem value="" disabled>
                    Nenhum membro disponível
                  </SelectItem>
                ) : (
                  membros.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nome_completo} ({m.email})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <Button onClick={handleAdd} disabled={!selected} className="w-full">
              Adicionar Voluntário
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}