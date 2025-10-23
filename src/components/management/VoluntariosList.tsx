import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import AddVoluntarioDialog from "./AddVoluntarioDialog";
import { useMinistryVolunteers, useRemoveVoluntario } from "@/hooks/useMinistryVolunteers";
import { Loader2 } from "lucide-react";

interface VoluntariosListProps {
  idMinisterio: string;
  idIgreja: string;
}

export default function VoluntariosList({ idMinisterio, idIgreja }: VoluntariosListProps) {
  const [openAdd, setOpenAdd] = useState(false);
  const { data: voluntarios = [], isLoading } = useMinistryVolunteers(idMinisterio);
  const { mutate: remove, isPending: isRemoving } = useRemoveVoluntario(idMinisterio);

  const handleRemove = (idVol: string) => {
    remove(idVol);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Voluntários do Ministério</h2>
        <Button onClick={() => setOpenAdd(true)}>+ Adicionar</Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="ml-2">Carregando voluntários...</span>
        </div>
      ) : voluntarios.length === 0 ? (
        <p>Nenhum voluntário adicionado ainda.</p>
      ) : (
        <ul className="divide-y border rounded-md">
          {voluntarios.map((v) => (
            <li key={v.id} className="flex justify-between items-center p-2">
              <div>
                <p className="font-medium">{v.usuario?.nome_completo}</p>
                <p className="text-sm text-gray-500">{v.usuario?.email}</p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRemove(v.id)}
                disabled={isRemoving}
              >
                {isRemoving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Remover'}
              </Button>
            </li>
          ))}
        </ul>
      )}

      <AddVoluntarioDialog
        open={openAdd}
        onOpenChange={setOpenAdd}
        idMinisterio={idMinisterio}
        idIgreja={idIgreja}
        onAdded={() => {}} // O hook já cuida da atualização
      />
    </div>
  );
}