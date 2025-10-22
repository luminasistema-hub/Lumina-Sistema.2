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
import { X, CheckCircle } from 'lucide-react'

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
  if (!transaction) return null

  const handleDownloadPdf = () => {
    window.print()
  }

  const receiptData = {
    numero: transaction.numero_documento || transaction.id.substring(0, 8).toUpperCase(),
    data_emissao: new Date().toLocaleDateString('pt-BR'),
    valor: transaction.valor,
    descricao: transaction.descricao,
    categoria: transaction.categoria,
    metodo_pagamento: transaction.metodo_pagamento,
    igreja: {
      nome: church?.name ?? 'Igreja não identificada',
      endereco: church?.address ?? 'Endereço não informado',
      cnpj: church?.cnpj ?? 'CNPJ não informado',
      telefone: church?.contactPhone ?? 'Telefone não informado',
    },
    doador: transaction.membro_nome || 'Doador não identificado',
  }

  const handleMarkAsIssued = () => {
    if (onMarkAsIssued) {
      onMarkAsIssued(transaction.id)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="p-6 pb-4 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            Recibo de Doação
            {transaction.recibo_emitido && (
              <span className="inline-flex items-center gap-1 text-sm font-normal text-green-600 bg-green-50 px-2 py-1 rounded">
                <CheckCircle className="w-4 h-4" />
                Emitido
              </span>
            )}
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-2">
            {transaction.recibo_emitido 
              ? 'Este recibo já foi emitido anteriormente. Você pode visualizar e imprimir novamente.'
              : 'Visualize, imprima e marque a emissão do recibo.'
            }
          </p>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          <ReceiptGenerator data={receiptData} onDownload={handleDownloadPdf} />
        </div>
        
        <DialogFooter className="bg-slate-50 p-4 border-t print:hidden flex-shrink-0">
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              <X className="mr-2 h-4 w-4" /> Fechar
            </Button>
            {canManage && !transaction.recibo_emitido && onMarkAsIssued && (
              <Button
                onClick={handleMarkAsIssued}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Marcar como Emitido
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}