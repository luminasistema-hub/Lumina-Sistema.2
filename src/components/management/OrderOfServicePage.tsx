import { useState } from "react"
import EventDetailsModal from "@/components/management/EventDetailsModal"

const OrderOfServicePage = () => {
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null)

  // Exemplo de eventos mockados
  const events = [
    {
      id: 1,
      title: "Preparação para: Café com palavra",
      description: "Café com palavra",
      deadline: "2025-10-05",
      status: "Pendente",
    },
    {
      id: 2,
      title: "Culto de domingo",
      description: "Celebração principal",
      deadline: "2025-10-10",
      status: "Em andamento",
    },
  ]

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Ordem de Serviço</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <div
            key={event.id}
            className="border rounded-lg shadow-sm bg-white p-4 cursor-pointer hover:shadow-md transition"
            onClick={() => setSelectedEvent(event)}
          >
            <h2 className="text-lg font-semibold">{event.title}</h2>
            <p className="text-sm text-gray-600">{event.description}</p>
            <p className="text-xs text-gray-500">Prazo: {event.deadline}</p>
            <span
              className={`inline-block mt-2 px-3 py-1 text-xs rounded-full ${
                event.status === "Pendente"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {event.status}
            </span>
          </div>
        ))}
      </div>

      {/* Modal de detalhes */}
      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  )
}

export default OrderOfServicePage
