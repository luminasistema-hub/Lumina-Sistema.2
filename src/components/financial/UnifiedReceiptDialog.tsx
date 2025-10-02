import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Church } from '@/stores/churchStore'
import ReceiptGenerator from './ReceiptGenerator'
import { X } from 'lucide-react'

interface FinancialTransaction {
  id: string
  tipo: 'Entrada' | 'Saída'
  categoria: string
  valor: number
  data_transacao: string
  descricao: string
  metodo_pagamento: string
  membro_nome?: string
  numero_documento?: string
  recibo_emitido?: boolean
}

interface UnifiedReceiptDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  transaction: FinancialTransaction | null
  church: Church | null
  onMarkAsIssued?: (transactionId: string) => void
  canManage: boolean
}

export const UnifiedReceiptDialog = ({
  isOpen,
  onOpenChange,
  transaction,
  church,
  onMarkAsIssued,
  canManage,
}: UnifiedReceiptDialogProps) => {
  if (!transaction || !church) return null

  const receiptData = {
    numero: transaction.numero_documento || transaction.id.substring(0, 8).toUpperCase(),
    data_emissao: new Date().toLocaleDateString('pt-BR'),
    valor: transaction.valor,
    descricao: transaction.descricao,
    categoria: transaction.categoria,
    metodo_pagamento: transaction.metodo_pagamento,
    igreja: {
      nome: church.name,
      endereco: church.address || 'Endereço não informado',
      cnpj: church.cnpj || 'CNPJ não informado',
      telefone: church.contactPhone || 'Telefone não informado',
    },
    doador: transaction.membro_nome || 'Doador não identificado',
  }

  const handleMarkAsIssued = () => {
    if (onMarkAsIssued) {
      onMarkAsIssued(transaction.id)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Recibo de Doação</DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto px-6">
          <ReceiptGenerator data={receiptData} />
        </div>
        <DialogFooter className="bg-slate-50 p-4 border-t print:hidden">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" /> Fechar
          </Button>
          {canManage && !transaction.recibo_emitido && onMarkAsIssued && (
            <Button
              onClick={handleMarkAsIssued}
              className="bg-green-600 hover:bg-green-700"
            >
              Marcar como Emitido e Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}