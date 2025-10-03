import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import AddVoluntarioDialog from "./AddVoluntarioDialog";
import { getVoluntarios, removeVoluntario } from "@/services/voluntariosService";

interface VoluntariosListProps {
  idMinisterio: string;
  idIgreja: string;
}

export default function VoluntariosList({ idMinisterio, idIgreja }: VoluntariosListProps) {
  const [voluntarios, setVoluntarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);

  // Buscar voluntários
  const fetchVoluntarios = async () => {
    setLoading(true);
    try {
      const data = await getVoluntarios(idMinisterio);
      setVoluntarios(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoluntarios();
  }, [idMinisterio]);

  // Remover voluntário
  const handleRemove = async (idVol: string) => {
    try {
      await removeVoluntario(idVol);
      fetchVoluntarios();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Voluntários do Ministério</h2>
        <Button onClick={() => setOpenAdd(true)}>+ Adicionar</Button>
      </div>

      {loading ? (
        <p>Carregando...</p>
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
              >
                Remover
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
        onAdded={fetchVoluntarios}
      />
    </div>
  );
}

