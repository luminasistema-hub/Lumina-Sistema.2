import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, PlusCircle } from "lucide-react";

interface Escala {
  id: string;
  data: string;
  descricao: string;
  culto_id: string;
}

interface Voluntario {
  id: string;
  membro_id: string;
  funcao: string;
  membros?: { nome: string };
}

interface Props {
  ministerioId: string;
}

export default function MinistrySchedules({ ministerioId }: Props) {
  const [escalas, setEscalas] = useState<Escala[]>([]);
  const [voluntarios, setVoluntarios] = useState<{ [key: string]: Voluntario[] }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [ministerioId]);

  async function loadData() {
    setLoading(true);

    // Buscar escalas do ministério
    const { data: escalasData } = await supabase
      .from("escalas_servico")
      .select("id, data, descricao, culto_id")
      .eq("ministerio_id", ministerioId)
      .order("data", { ascending: true });

    if (escalasData) {
      setEscalas(escalasData);

      // Buscar voluntários vinculados
      let voluntariosObj: { [key: string]: Voluntario[] } = {};
      for (const escala of escalasData) {
        const { data: volData } = await supabase
          .from("escala_voluntarios")
          .select("id, membro_id, funcao, membros(nome)")
          .eq("escala_id", escala.id);

        voluntariosObj[escala.id] = volData || [];
      }
      setVoluntarios(voluntariosObj);
    }

    setLoading(false);
  }

  async function addEscala() {
    const { data, error } = await supabase
      .from("escalas_servico")
      .insert({
        ministerio_id: ministerioId,
        data: new Date().toISOString(),
        descricao: "Nova Escala",
      })
      .select()
      .single();

    if (data) {
      setEscalas((prev) => [...prev, data]);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-6">
        <Loader2 className="animate-spin w-6 h-6" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Escalas de Voluntários</h2>
        <Button onClick={addEscala}>
          <PlusCircle className="w-4 h-4 mr-2" /> Nova Escala
        </Button>
      </div>

      {escalas.map((escala) => (
        <Card key={escala.id}>
          <CardContent className="p-4">
            <h3 className="font-medium">
              {new Date(escala.data).toLocaleDateString()} - {escala.descricao}
            </h3>

            <ul className="mt-3 space-y-1">
              {voluntarios[escala.id]?.map((v) => (
                <li key={v.id} className="text-sm">
                  <strong>{v.membros?.nome}</strong> — {v.funcao}
                </li>
              ))}
            </ul>

            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => alert("Abrir modal para adicionar voluntário")}
            >
              + Adicionar voluntário
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
