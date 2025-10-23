"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useAddVoluntario, useMinistryVolunteers } from "@/hooks/useMinistryVolunteers";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

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
  const [selected, setSelected] = useState<string | null>(null);
  const { mutate: addVoluntario, isPending: isAdding } = useAddVoluntario();

  // 1. Buscar todos os membros da igreja (será cacheado)
  const { data: todosOsMembros, isLoading: isLoadingMembros } = useQuery({
    queryKey: ['members', idIgreja],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membros")
        .select("id, nome_completo, email")
        .eq("id_igreja", idIgreja)
        .eq("status", "ativo");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // 2. Buscar voluntários que já estão no ministério (será cacheado)
  const { data: voluntarios, isLoading: isLoadingVoluntarios } = useMinistryVolunteers(idMinisterio);

  // 3. Calcular membros disponíveis usando useMemo
  const membrosDisponiveis = useMemo(() => {
    if (!todosOsMembros || !voluntarios) return [];
    const idsVoluntarios = voluntarios.map(v => v.membro_id);
    return todosOsMembros.filter(m => !idsVoluntarios.includes(m.id));
  }, [todosOsMembros, voluntarios]);

  const isLoading = isLoadingMembros || isLoadingVoluntarios;

  // Adicionar voluntário
  const handleAdd = () => {
    if (!selected) {
      toast.error("Selecione um membro");
      return;
    }

    addVoluntario({
      ministerio_id: idMinisterio,
      membro_id: selected,
      id_igreja: idIgreja,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        setSelected(null);
        if (onAdded) onAdded();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Voluntário</DialogTitle>
          <DialogDescription>Selecione um membro da igreja para adicioná-lo ao ministério.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
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
                {membrosDisponiveis.length === 0 ? (
                  <SelectItem value="" disabled>
                    Nenhum membro disponível
                  </SelectItem>
                ) : (
                  membrosDisponiveis.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nome_completo} ({m.email})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <Button onClick={handleAdd} disabled={!selected || isAdding} className="w-full">
              {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Adicionar Voluntário'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}