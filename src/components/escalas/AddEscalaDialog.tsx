// src/components/escalas/AddEscalaDialog.tsx
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { addEscala } from "@/services/escalaService"

interface AddEscalaDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdded: () => void
}

export default function AddEscalaDialog({ open, onOpenChange, onAdded }: AddEscalaDialogProps) {
  const [dataServico, setDataServico] = useState("")
  const [observacoes, setObservacoes] = useState("")
  const [status, setStatus] = useState("Pendente")
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    await addEscala({
      data_servico: dataServico,
      observacoes,
      status,
      ministerio_id: "TODO", // 🔹 depois podemos pegar dinamicamente
      id_igreja: "TODO"      // 🔹 idem
    })
    setLoading(false)
    onOpenChange(false)
    onAdded()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>➕ Nova Escala</DialogTitle>
          <DialogDescription>Defina a data, observações e status para criar a escala de serviço.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm">Data do Serviço</label>
            <Input type="date" value={dataServico} onChange={(e) => setDataServico(e.target.value)} />
          </div>

          <div>
            <label className="text-sm">Observações</label>
            <Input value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
          </div>

          <div>
            <label className="text-sm">Status inicial</label>
            <Input value={status} onChange={(e) => setStatus(e.target.value)} />
          </div>

          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}