import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useCultos } from "@/hooks/useCultos";
import { useMinistryKanbanDemandas } from "@/hooks/useMinistryKanbanDemandas";

interface Demand {
  id: string;
  titulo: string;
  descricao: string;
  status: "pendente" | "em_andamento" | "concluido";
  culto_id: string;
}

interface Culto {
  id: string;
  titulo: string;
  data: string;
}

interface Props {
  ministerioId: string;
}

export default function MinistryKanban({ ministerioId }: Props) {
  const { data: cultosData = [], isLoading: cultosLoading } = useCultos();
  const { data: demandasData = [], isLoading: demandasLoading, refetch } = useMinistryKanbanDemandas(ministerioId);
  const [demandas, setDemandas] = useState<Demand[]>([]);
  const cultos = cultosData;
  const loading = cultosLoading || demandasLoading;

  useEffect(() => {
    setDemandas(demandasData as any);
  }, [demandasData]);

  async function updateDemandStatus(id: string, status: string) {
    await supabase
      .from("demandas_ministerios")
      .update({ status })
      .eq("id", id);
    
    // Atualiza local e revalida server
    setDemandas((prev) => prev.map((d) => d.id === id ? { ...d, status: status as any } : d));
    refetch();
  }

  function onDragEnd(result: any) {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    // Se mudou de coluna
    if (source.droppableId !== destination.droppableId) {
      setDemandas((prev) =>
        prev.map((d) =>
          d.id === draggableId ? { ...d, status: destination.droppableId as any } : d
        )
      );
      updateDemandStatus(draggableId, destination.droppableId);
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
    <div className="space-y-8">
      {cultos.map((culto) => (
        <div key={culto.id}>
          <h2 className="text-lg font-semibold mb-4">
            {culto.titulo} - {new Date(culto.data).toLocaleDateString()}
          </h2>
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-3 gap-4">
              {["pendente", "em_andamento", "concluido"].map((status) => (
                <Droppable key={status} droppableId={status}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="bg-gray-100 rounded-lg p-3 min-h-[200px]"
                    >
                      <h3 className="text-sm font-medium mb-2 capitalize">{status.replace("_", " ")}</h3>
                      {demandas
                        .filter((d) => d.culto_id === culto.id && d.status === status)
                        .map((d, index) => (
                          <Draggable key={d.id} draggableId={d.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="mb-2"
                              >
                                <Card className="shadow-sm">
                                  <CardContent className="p-3">
                                    <p className="font-medium">{d.titulo}</p>
                                    <p className="text-xs text-gray-500">{d.descricao}</p>
                                  </CardContent>
                                </Card>
                              </div>
                            )}
                          </Draggable>
                        ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        </div>
      ))}
    </div>
  );
}