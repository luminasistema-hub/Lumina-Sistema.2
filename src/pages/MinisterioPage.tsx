import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import MainLayout from "../components/layout/MainLayout"
import { Users, Calendar, User } from "lucide-react"
import { useState } from "react"

// 🔹 Tipos auxiliares
interface Ministry {
  id: string
  name: string
  description: string
  leader: string
  volunteersCount: number
  schedulesCount: number
}

// 🔹 Dados simulados (mock)
const mockMinistries: Ministry[] = [
  {
    id: "1",
    name: "Louvor e Adoração",
    description: "Responsável pela ministração musical nos cultos",
    leader: "Ana Oliveira",
    volunteersCount: 15,
    schedulesCount: 8,
  },
  {
    id: "2",
    name: "Recepção",
    description: "Acolhimento e orientação dos membros e visitantes",
    leader: "Maria Santos",
    volunteersCount: 12,
    schedulesCount: 6,
  },
  {
    id: "3",
    name: "Multimídia",
    description: "Som, imagem e transmissões dos cultos",
    leader: "João Silva",
    volunteersCount: 8,
    schedulesCount: 4,
  },
]

const MinisteriosPage = () => {
  const [ministries] = useState<Ministry[]>(mockMinistries)

  return (
    <MainLayout activeModule="ministries">
      <div className="p-3 md:p-6">
        {/* Título da Página */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">Ministérios</h1>
            <p className="text-gray-500 text-sm md:text-base">Gerencie os departamentos da igreja</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            + Novo Ministério
          </Button>
        </div>

        {/* Resumo geral */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="border border-blue-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <Users className="w-5 h-5" /> Total de Ministérios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{ministries.length}</p>
            </CardContent>
          </Card>

          <Card className="border border-blue-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <Users className="w-5 h-5" /> Total de Voluntários
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {ministries.reduce((acc, m) => acc + m.volunteersCount, 0)}
              </p>
            </CardContent>
          </Card>

          <Card className="border border-blue-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-600">
                <Calendar className="w-5 h-5" /> Escalas Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {ministries.reduce((acc, m) => acc + m.schedulesCount, 0)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Cards de Ministérios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ministries.map((ministry) => (
            <Card key={ministry.id} className="shadow-md border border-blue-200">
              <CardHeader>
                <CardTitle className="text-blue-600">{ministry.name}</CardTitle>
                <p className="text-gray-500 text-sm">{ministry.description}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm mb-2">
                  <span className="font-medium">Líder:</span> {ministry.leader}
                </p>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex flex-col items-center justify-center p-2 bg-blue-50 rounded">
                    <Users className="w-5 h-5 text-blue-600 mb-1" />
                    <p className="font-semibold">{ministry.volunteersCount}</p>
                    <p className="text-xs text-gray-500">Voluntários</p>
                  </div>
                  <div className="flex flex-col items-center justify-center p-2 bg-blue-50 rounded">
                    <Calendar className="w-5 h-5 text-blue-600 mb-1" />
                    <p className="font-semibold">{ministry.schedulesCount}</p>
                    <p className="text-xs text-gray-500">Escalas</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="w-1/2 text-blue-600 border-blue-600">
                    Ver Voluntários
                  </Button>
                  <Button variant="outline" className="w-1/2 text-blue-600 border-blue-600">
                    Ver Escalas
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </MainLayout>
  )
}

export default MinisteriosPage