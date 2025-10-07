import React from "react";
import { useMinistryDemands } from "@/hooks/useMinistryDemands";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DemandaMinisterio {
  id: string;
  ministerio_id: string;
  culto_id: string | null;
  responsavel_id: string | null;
  titulo: string;
  descricao: string | null;
  prazo: string | null;
  status: string;
  prioridade: string | null;
  created_at: string;
  culto?: {
    id: string;
    titulo: string;
    data: string;
  };
}

const MinistryDemands: React.FC<{ ministryId: string }> = ({ ministryId }) => {
  const { data: demandas = [], isLoading: loading } = useMinistryDemands(ministryId);

  if (loading) return <p>Carregando demandas...</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>📌 Demandas do Ministério</CardTitle>
      </CardHeader>
      <CardContent>
        {demandas.length === 0 ? (
          <p>Nenhuma demanda encontrada.</p>
        ) : (
          <ul className="space-y-2">
            {demandas.map((d) => (
              <li
                key={d.id}
                className="p-3 border rounded-lg flex flex-col bg-gray-50"
              >
                <strong>{d.titulo}</strong>
                <span>{d.descricao}</span>
                <span>Status: {d.status}</span>
                {d.prazo && (
                  <span>
                    Prazo: {new Date(d.prazo).toLocaleDateString("pt-BR")}
                  </span>
                )}
                {d.prioridade && <span>Prioridade: {d.prioridade}</span>}
                {d.culto && (
                  <span>
                    🎶 Culto: {d.culto.titulo} (
                    {new Date(d.culto.data).toLocaleDateString("pt-BR")})
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default MinistryDemands;