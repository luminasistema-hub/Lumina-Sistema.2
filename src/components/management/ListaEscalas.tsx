import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { getEscalas } from "@/services/escalaService"
import GerenciarDemanda from "./GerenciarDemanda"

export default function ListaEscalas() {
  const [escalas, setEscalas] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedEscala, setSelectedEscala] = useState<string | null>(null)

  const loadEscalas = async () => {
    setLoading(true)
    const data = await getEscalas()
    setEscalas(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadEscalas()
  }, [])

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Escalas de Serviços</h1>
        <Button onClick={loadEscalas}>Atualizar</Button>
      </div>

      {loading ? (
        <p>Carregando escalas...</p>
      ) : escalas.length === 0 ? (
        <p>Nenhuma escala cadastrada.</p>
      ) : (
        <ul className="divide-y border rounded-md">
          {escalas.map((escala) => (
            <li
              key={escala.id}
              className="p-4 flex justify-between items-center hover:bg-gray-50 cursor-pointer"
              onClick={() => setSelectedEscala(escala.id)}
            >
              <div>
                <p className="font-medium">Data: {escala.data_servico}</p>
                <p className="text-sm text-gray-500">
                  Status: {escala.status}
                </p>
              </div>
              <Button size="sm">Gerenciar</Button>
            </li>
          ))}
        </ul>
      )}

      {selectedEscala && (
        <GerenciarDemanda escalaId={selectedEscala} />
      )}
    </div>
  )
}
