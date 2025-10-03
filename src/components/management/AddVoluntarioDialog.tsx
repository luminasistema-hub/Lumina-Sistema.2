import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

      // 1. buscar membros da igreja
      const { data: todos, error: errMembros } = await supabase
        .from("membros")
        .select("id, nome_completo, email")
        .eq("id_igreja", idIgreja);

      if (errMembros) {
        console.error("Erro membros:", errMembros);
        setLoading(false);
        return;
      }

      // 2. buscar voluntários já no ministério
      const { data: voluntarios, error: errVol } = await supabase
        .from("ministerio_voluntarios")
        .select("id_usuario")
        .eq("id_ministerio", idMinisterio);

      if (errVol) {
        console.error("Erro voluntários:", errVol);
        setLoading(false);
        return;
      }

      const usados = voluntarios?.map(v => v.id_usuario) || [];
      const filtrados = todos?.filter(m => !usados.includes(m.id)) || [];

      setMembros(filtrados);
      setLoading(false);
    };

    fetchMembros();
  }, [open, idIgreja, idMinisterio]);

  // Adicionar voluntário
  const handleAdd = async () => {
    if (!selected) return;

    const { error } = await supabase.from("ministerio_voluntarios").insert({
      id_ministerio: idMinisterio,
      id_usuario: selected,
    });

    if (error) {
      console.error("Erro ao adicionar voluntário:", error);
      return;
    }

    if (onAdded) onAdded();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Voluntário</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p>Carregando membros...</p>
        ) : (
          <Select onValueChange={(val) => setSelected(val)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um membro" />
            </SelectTrigger>
            <SelectContent>
              {membros.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.nome_completo} ({m.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button onClick={handleAdd} disabled={!selected}>
          Adicionar
        </Button>
      </DialogContent>
    </Dialog>
  );
}
