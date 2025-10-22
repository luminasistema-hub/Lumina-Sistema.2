import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "react-hot-toast"

// Serviços
import { fetchVoluntarios } from "@/services/voluntariosService"
import {
  getVoluntariosByEscala,
  addVoluntarioToEscala,
  removeVoluntarioFromEscala
} from "@/services/escalaVoluntariosService"
import { updateEscalaStatus, getEscalaById } from "@/services/escalaService"
import { sendEmailNotification, createInAppNotification } from "@/services/notificationService"
import { useAuthStore } from "@/stores/authStore"

interface GerenciarDemandaProps {
  escalaId: string
}

export default function GerenciarDemanda({ escalaId }: GerenciarDemandaProps) {
  const [escala, setEscala] = useState<any[]>([])
  const [voluntariosDisponiveis, setVoluntariosDisponiveis] = useState<any[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [status, setStatus] = useState("Pendente")
  const { user, currentChurchId, currentChurchName } = useAuthStore()

  // 🔄 Carregar dados
  const loadData = async () => {
    const vinculados = await getVoluntariosByEscala(escalaId)
    setEscala(vinculados || [])

    const disponiveis = await fetchVoluntarios()
    setVoluntariosDisponiveis(disponiveis || [])
  }

  useEffect(() => {
    loadData()
  }, [escalaId])

  // 📌 Atribuir voluntário
  const handleAddVoluntario = async (idVoluntario: string) => {
    const voluntario = voluntariosDisponiveis.find(v => v.id === idVoluntario);
    if (!voluntario) return;

    const addPromise = addVoluntarioToEscala(escalaId, idVoluntario);
    toast.promise(addPromise, {
      loading: `Atribuindo ${voluntario.nome_completo}...`,
      success: async () => {
        await loadData();
        
        // Enviar notificação após sucesso
        const escalaInfo = await getEscalaById(escalaId);
        if (escalaInfo && currentChurchId && currentChurchName) {
          const subject = `[${currentChurchName}] Você foi escalado para um serviço!`;
          const htmlContent = `
            <div style="font-family: sans-serif; line-height: 1.6;">
              <h2>Olá, ${voluntario.nome_completo}!</h2>
              <p>Você foi escalado(a) para servir no ministério <strong>${escalaInfo.ministerio?.nome || ''}</strong>.</p>
              <p><strong>Data do Serviço:</strong> ${new Date(escalaInfo.data_servico + 'T00:00:00').toLocaleDateString('pt-BR')}</p>
              <p>Por favor, acesse o aplicativo para confirmar sua participação e ver mais detalhes.</p>
              <a href="${window.location.origin}/dashboard?module=my-ministry" style="display: inline-block; padding: 10px 15px; background-color: #6d28d9; color: white; text-decoration: none; border-radius: 5px;">
                Acessar Meu Ministério
              </a>
              <p style="font-size: 0.9em; color: #666;">Se o botão não funcionar, copie e cole o seguinte link no seu navegador: ${window.location.origin}/dashboard?module=my-ministry</p>
            </div>
          `;

          sendEmailNotification({
            to: voluntario.email,
            subject,
            htmlContent,
          });

          createInAppNotification({
            id_igreja: currentChurchId,
            membro_id: idVoluntario,
            titulo: 'Você foi escalado para um serviço',
            descricao: `Ministério ${escalaInfo.ministerio?.nome} em ${new Date(escalaInfo.data_servico + 'T00:00:00').toLocaleDateString('pt-BR')}.`,
            link: '/dashboard?module=my-ministry',
            tipo: 'escala'
          });
        }
        
        return `${voluntario.nome_completo} foi atribuído com sucesso!`;
      },
      error: 'Falha ao atribuir voluntário.'
    });
  }

  // 📌 Remover voluntário
  const handleRemoveVoluntario = async (id: string) => {
    await removeVoluntarioFromEscala(id)
    loadData()
  }

  // 📌 Upload de arte
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0])
    }
  }

  // 📌 Atualizar status
  const handleUpdateStatus = async (novoStatus: string) => {
    await updateEscalaStatus(escalaId, novoStatus)
    setStatus(novoStatus)
  }

  return (
    <Card className="p-4 space-y-4">
      <h2 className="text-xl font-bold">Gerenciar Demanda</h2>

      {/* Upload de Arte */}
      <div>
        <h3 className="font-medium">Arte para Divulgação</h3>
        <Input type="file" onChange={handleFileChange} />
        {file && <p className="text-sm mt-2">Arquivo selecionado: {file.name}</p>}
      </div>

      {/* Checklist (placeholder) */}
      <div>
        <h3 className="font-medium">Tarefas / Checklist</h3>
        <p className="text-sm text-gray-500">
          [Aqui será implementada a gestão de tarefas para este evento.]
        </p>
      </div>

      {/* Escala de Voluntários */}
      <div>
        <h3 className="font-medium">Escala de Voluntários</h3>
        <ul className="space-y-2 mt-2">
          {escala.map((v) => (
            <li key={v.id} className="flex justify-between items-center border p-2 rounded">
              <span>{v.usuario?.nome_completo}</span>
              <Button variant="destructive" size="sm" onClick={() => handleRemoveVoluntario(v.id)}>
                Remover
              </Button>
            </li>
          ))}
        </ul>

        <h4 className="mt-4 font-medium">Voluntários Disponíveis</h4>
        <ul className="space-y-2 mt-2">
          {voluntariosDisponiveis.map((v) => (
            <li key={v.id} className="flex justify-between items-center border p-2 rounded">
              <span>{v.nome_completo}</span>
              <Button size="sm" onClick={() => handleAddVoluntario(v.id)}>
                Atribuir
              </Button>
            </li>
          ))}
        </ul>
      </div>

      {/* Controle de Status */}
      <div className="flex gap-2">
        <Button variant={status === "Pendente" ? "default" : "outline"} onClick={() => handleUpdateStatus("Pendente")}>
          Pendente
        </Button>
        <Button variant={status === "Em Andamento" ? "default" : "outline"} onClick={() => handleUpdateStatus("Em Andamento")}>
          Em Andamento
        </Button>
        <Button variant={status === "Concluído" ? "default" : "outline"} onClick={() => handleUpdateStatus("Concluído")}>
          Concluído
        </Button>
      </div>
    </Card>
  )
}