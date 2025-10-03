import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { getVoluntariosByEscala, addVoluntarioToEscala, removeVoluntarioFromEscala } from "@/services/escalaVoluntariosService"
import { fetchVoluntarios } from "@/services/voluntariosService"

interface EventDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  event: {
    id: string
    title: string
    description: string
    dueDate: string
    status: string
    escalaId: string // precisa receber isso
  } | null
}

export default function EventDetailsModal({ isOpen, onClose, event }: EventDetailsModalProps) {
  const [allVoluntarios, setAllVoluntarios] = useState<any[]>([])
  const [escalaVoluntarios, setEscalaVoluntarios] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  if (!event) return null

  const loadData = async () => {
    setLoading(true)
    const disponiveis = await fetchVoluntarios()
    setAllVoluntarios(disponiveis || [])
    const escala = await getVoluntariosByEscala(event.escalaId)
    setEscalaVoluntarios(escala || [])
    setLoading(false)
  }

  useEffect(() => {
    if (event) loadData()
  }, [event])

  const handleAdd = async (voluntarioId: string) => {
    await addVoluntarioToEscala(event.escalaId, voluntarioId)
    loadData()
  }

  const handleRemove = async (id: string) => {
    await removeVoluntarioFromEscala(id)
    loadData()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p>{event.description}</p>
          <p><strong>Prazo:</strong> {event.dueDate}</p>
          <p><strong>Status:</strong> {event.status}</p>

          <div className="border rounded-md p-3">
            <h3 className="font-semibold mb-2">Escala de Voluntários</h3>

            {loading ? (
              <p>Carregando...</p>
            ) : (
              <>
                <ul className="divide-y mb-2">
                  {escalaVoluntarios.map((ev) => (
                    <li key={ev.id} className="flex justify-between items-center py-1">
                      <span>{ev.voluntario?.nome_completo}</span>
                      <Button size="sm" variant="destructive" onClick={() => handleRemove(ev.id)}>
                        Remover
                      </Button>
                    </li>
                  ))}
                </ul>

                <select
                  className="border rounded p-2 w-full"
                  onChange={(e) => handleAdd(e.target.value)}
                  defaultValue=""
                >
                  <option value="" disabled>Adicionar voluntário...</option>
                  {allVoluntarios.map((v) => (
                    <option key={v.id} value={v.id}>{v.nome}</option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
