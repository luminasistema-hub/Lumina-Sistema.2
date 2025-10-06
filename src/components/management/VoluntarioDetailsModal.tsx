import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Voluntario } from "./VoluntarioCard";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  voluntario: Voluntario | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const VoluntarioDetailsModal = ({ voluntario, open, onOpenChange }: Props) => {
  if (!voluntario) return null;

  async function removerVoluntario() {
    if (!voluntario.id) return;
    await supabase.from("ministerio_voluntarios").delete().eq("id", voluntario.id);
    onOpenChange(false);
  }

  async function tornarLider() {
    if (!voluntario.id) return;
    await supabase.from("ministerio_voluntarios").update({ papel: "lider" }).eq("id", voluntario.id);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerenciar {voluntario.email}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Papel atual: {voluntario.papel}</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={tornarLider}>
              Definir como Líder
            </Button>
            <Button variant="destructive" onClick={removerVoluntario}>
              Remover
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};