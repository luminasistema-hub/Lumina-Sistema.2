import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Church } from '@/stores/churchStore'
import { Printer, X } from 'lucide-react'

interface Contribution {
  id: string
  tipo: 'Entrada' | 'Saída'
  categoria: 'Dízimos' | 'Ofertas' | 'Doações Especiais' | 'Missões' | 'Obras'
  valor: number
  data_transacao: string
  descricao: string
  metodo_pagamento: 'PIX' | 'Cartão' | 'Dinheiro' | 'Transferência'
  status: 'Pendente' | 'Confirmado' | 'Cancelado'
  membro_id: string
  membro_nome?: string
  id_igreja: string
  recibo_emitido: boolean
}

interface ReceiptDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  contribution: Contribution | null
  church: Church | null
  onMarkAsIssued: (contributionId: string) => void
}

export const ReceiptDialog = ({
  isOpen,
  onOpenChange,
  contribution,
  church,
  onMarkAsIssued,
}: ReceiptDialogProps) => {
  if (!contribution || !church) return null

  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
        printWindow.document.write('<html><head><title>Recibo de Doação</title>');
        printWindow.document.write(`
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; }
                .receipt-content { max-width: 800px; margin: 20px auto; padding: 20px; }
                .header { text-align: center; margin-bottom: 2rem; }
                .header h1 { font-size: 1.5rem; margin: 0; }
                .header p { margin: 0; color: #555; }
                .title { text-align: center; margin: 2rem 0; }
                .title h2 { font-size: 1.25rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; }
                .details p { margin: 0.5rem 0; font-size: 1rem; }
                .details strong { font-weight: 600; }
                .thanks { text-align: center; margin: 2rem 0; }
                .signature { margin-top: 4rem; text-align: center; }
                .signature p { margin: 0; }
                hr { border: 0; border-top: 1px solid #eee; margin: 2rem 0; }
            </style>
        `);
        printWindow.document.write('</head><body>');
        const receiptContent = document.getElementById('receipt-content')?.innerHTML;
        if (receiptContent) {
            printWindow.document.write(receiptContent);
        }
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <div id="receipt-content" className="p-8">
          <div className="header">
            <h1 className="text-2xl font-bold">{church.name}</h1>
            <p className="text-muted-foreground">{church.address}</p>
            <p className="text-muted-foreground">CNPJ: {church.cnpj}</p>
          </div>

          <div className="title">
            <h2 className="text-xl font-semibold uppercase tracking-wider">
              Recibo de Doação
            </h2>
          </div>

          <Separator />

          <div className="my-6 space-y-4 text-base details">
            <p>
              Recebemos de <strong>{contribution.membro_nome}</strong>, a
              importância de{' '}
              <strong>
                R$ {contribution.valor.toLocaleString('pt-BR', {
                  minimumFractionDigits: 2,
                })}
              </strong>
              , referente a{' '}
              <strong>{contribution.categoria}</strong>.
            </p>
            <p>
              Data da Contribuição:{' '}
              <strong>
                {new Date(contribution.data_transacao).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
              </strong>
            </p>
            <p>
              Método de Pagamento:{' '}
              <strong>{contribution.metodo_pagamento}</strong>
            </p>
          </div>

          <Separator />

          <div className="my-6 text-center thanks">
            <p className="text-sm text-muted-foreground">
              Agradecemos sua generosidade e compromisso com a obra de Deus.
            </p>
            <p className="text-sm italic text-muted-foreground mt-2">
              "Cada um contribua segundo propôs no seu coração; não com tristeza, ou por necessidade; porque Deus ama ao que dá com alegria." (2 Coríntios 9:7)
            </p>
          </div>

          <div className="signature">
            <p className="border-t-2 border-dotted w-64 mx-auto pt-2">Assinatura do Tesoureiro</p>
            <p className="font-semibold mt-2">{church.name}</p>
          </div>
        </div>

        <DialogFooter className="bg-slate-50 p-4 border-t print:hidden">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            <X className="mr-2 h-4 w-4" /> Fechar
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Imprimir
          </Button>
          {!contribution.recibo_emitido && (
            <Button
              onClick={() => {
                onMarkAsIssued(contribution.id)
                onOpenChange(false)
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              Marcar como Emitido
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}