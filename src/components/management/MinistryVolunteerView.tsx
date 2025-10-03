import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";

interface Ministry {
  id: string;
  nome: string;
  descricao: string;
}

interface Demanda {
  id: string;
  titulo: string;
  status: string;
  prazo: string;
  culto: { titulo: string } | null;
}

interface VolunteerViewProps {
  ministry: Ministry;
  demands: Demanda[];
}

const VolunteerView = ({ ministry, demands }: VolunteerViewProps) => {
  const handleConfirm = (id: string, confirm: boolean) => {
    console.log("Voluntário confirmou?", confirm, "para demanda", id);
    // 👉 aqui você atualizaria no Supabase (ex: tabela confirmacoes)
  };

  return (
    <div className="p-4 space-y-6">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold">{ministry.nome}</h1>
        <p className="text-green-100 mt-1">{ministry.descricao}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Minhas Escalas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {demands.length > 0 ? (
            demands.map((d) => (
              <div key={d.id} className="border rounded-lg p-3 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{d.titulo}</p>
                  <p className="text-xs text-gray-500">
                    {d.culto?.titulo || "Demanda geral"} <br />
                    Prazo:{" "}
                    {new Date(d.prazo).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleConfirm(d.id, false)}>
                    Não posso
                  </Button>
                  <Button size="sm" onClick={() => handleConfirm(d.id, true)}>
                    Confirmar
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">Nenhuma escala atribuída a você ainda.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VolunteerView;
