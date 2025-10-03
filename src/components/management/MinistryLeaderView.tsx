import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button"; 
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"; 
import { Users, Plus, Upload, ClipboardList, Loader2 } from "lucide-react"; 
import { useState } from 'react';

// Interfaces
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
interface Voluntario {
  id: string;
  nome_completo: string;
}
interface LeaderViewProps {
  ministry: Ministry;
  demands: Demanda[];
  volunteers: Voluntario[];
}

const columns = ["Pendente", "Em andamento", "Concluído"];

// --- Modal de Gestão Completa da Demanda ---
interface EventManagementModalProps {
  demand: Demanda;
  ministry: Ministry;
  volunteers: Voluntario[];
}

const EventManagementModal = ({ demand, ministry, volunteers }: EventManagementModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const ministryName = ministry.nome.toLowerCase();
  const isMidia = ministryName.includes("mídia") || ministryName.includes("comunicação");
  
  const handleUpdateStatus = (newStatus: string) => {
    console.log(`Atualizando demanda ${demand.id} para status: ${newStatus}`);
  };

  const handleSaveEscala = () => {
    setIsLoading(true);
    setTimeout(() => {
      console.log(`Escala salva para ${demand.titulo}! (Simulação)`); 
      setIsLoading(false);
    }, 1500);
  };

  return (
    <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5" /> 
          Gerenciar Demanda: {demand.titulo}
        </DialogTitle>
        <p className="text-sm text-gray-500 mt-1">Ministério: {ministry.nome}</p>
      </DialogHeader>

      <div className="grid md:grid-cols-2 gap-6 py-4">
        {/* COLUNA 1 */}
        <div className="space-y-4">
          <Card className="shadow-none">
            <CardHeader className="py-3 px-4 border-b">
              <CardTitle className="text-base">Detalhes do Evento</CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-sm space-y-2">
              <div><strong>Culto:</strong> {demand.culto?.titulo || "Demanda Geral"}</div>
              <div><strong>Prazo:</strong> {new Date(demand.prazo).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</div>
              <div className="flex items-center gap-1">
                <strong>Status:</strong> 
                <Badge variant="default">{demand.status}</Badge>
              </div>
            </CardContent>
          </Card>

          {isMidia && (
            <Card className="border-indigo-300">
              <CardHeader className="py-3 px-4 border-b">
                <CardTitle className="text-base flex items-center gap-2 text-indigo-700">
                  <Upload className="w-4 h-4"/> Arte para Divulgação
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Anexar Nova Arte:</label>
                <input type="file" className="w-full text-sm p-2 border rounded-lg bg-gray-50" />
                <p className="text-xs text-gray-500 mt-1">A arte será usada nas redes sociais da igreja.</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="py-3 px-4 border-b">
              <CardTitle className="text-base">Tarefas / Checklist</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">
                [Aqui seria implementada a gestão de tarefas para este evento.]
              </p>
            </CardContent>
          </Card>
        </div>

        {/* COLUNA 2 */}
        <Card className="md:col-span-1">
          <CardHeader className="py-3 px-4 border-b bg-green-50">
            <CardTitle className="text-base flex items-center gap-2 text-green-700">
              <Users className="w-4 h-4"/> Escala de Voluntários ({volunteers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <p className="text-sm text-gray-600">
              Atribua voluntários cadastrados para esta demanda específica.
            </p>
            
            <div className="max-h-48 overflow-y-auto border p-2 rounded-lg">
              <h4 className="font-semibold mb-1">Voluntários Disponíveis:</h4>
              <ul className="text-sm space-y-1">
                {volunteers.map(v => (
                  <li key={v.id} className="flex items-center justify-between">
                    {v.nome_completo}
                    <Button size="sm" variant="outline" className="h-6">Atribuir</Button>
                  </li>
                ))}
              </ul>
            </div>

            <Button className="w-full" onClick={handleSaveEscala} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Users className="w-4 h-4 mr-2" />}
              {isLoading ? 'Salvando Escala...' : 'Salvar Escala Atual'}
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex justify-end gap-3 pt-3 border-t">
        <Button variant="outline" onClick={() => handleUpdateStatus("Pendente")}>Marcar como Pendente</Button>
        <Button variant="secondary" onClick={() => handleUpdateStatus("Em andamento")}>Marcar em Andamento</Button>
        <Button variant="default" onClick={() => handleUpdateStatus("Concluído")}>Marcar como Concluído</Button>
      </div>
    </DialogContent>
  );
};

// --- Componente Principal ---
const LeaderView = ({ ministry, demands, volunteers }: LeaderViewProps) => {
  if (!ministry) {
    return <div className="text-center p-6 text-red-500">Erro: Dados do ministério não carregados corretamente.</div>;
  }

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    console.log("Mover demanda:", result.draggableId, "para", result.destination.droppableId);
  };

  return (
    <div className="p-4 space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold">{ministry.nome}</h1>
        <p className="text-blue-100 mt-1">{ministry.descricao}</p>
      </div>

      {/* Barra de Ações */}
      <div className="flex flex-wrap gap-3">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="default"><Plus className="w-4 h-4 mr-2" /> Criar Demanda</Button>
          </DialogTrigger>
          <EventManagementModal demand={{} as Demanda} ministry={ministry} volunteers={volunteers} />
        </Dialog>
      </div>

      {/* Kanban */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((col) => (
            <Droppable droppableId={col} key={col}>
              {(provided) => (
                <div
                  className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg shadow min-h-[300px] space-y-3"
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  <h2 className="font-semibold mb-3">{col}</h2>
                  {demands
                    .filter((d) => d.status === col)
                    .map((demand, index) => (
                      <Dialog key={demand.id}>
                        <Draggable draggableId={demand.id} index={index}>
                          {(prov) => (
                            <DialogTrigger asChild>
                              <Card
                                ref={prov.innerRef}
                                {...prov.draggableProps}
                                {...prov.dragHandleProps}
                                className="cursor-pointer hover:shadow-lg transition-shadow duration-150"
                              >
                                <CardContent className="p-3 space-y-1">
                                  <p className="font-semibold">{demand.titulo}</p>
                                  <p className="text-xs text-gray-500">
                                    {demand.culto?.titulo || "Demanda geral"} <br />
                                    Prazo:{" "}
                                    {new Date(demand.prazo).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                                  </p>
                                  <div>
                                    <Badge>{demand.status}</Badge>
                                  </div>
                                </CardContent>
                              </Card>
                            </DialogTrigger>
                          )}
                        </Draggable>
                        <EventManagementModal 
                          demand={demand} 
                          ministry={ministry} 
                          volunteers={volunteers}
                        />
                      </Dialog>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
};

export default LeaderView;
