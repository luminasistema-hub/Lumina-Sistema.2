import { Calendar } from "lucide-react";

export interface Event {
  id: string;
  nome: string;
  data_hora: string;
  id_igreja: string;
}

export function EventCard({ event, onClick }: { event: Event; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="cursor-pointer rounded-2xl border p-4 shadow hover:shadow-md transition h-full"
    >
      <div className="flex items-center gap-2">
        <Calendar className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-lg">{event.nome}</h3>
      </div>
      <p className="text-sm text-gray-600 mt-1">
        {new Date(event.data_hora).toLocaleString("pt-BR", {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </p>
    </div>
  );
}