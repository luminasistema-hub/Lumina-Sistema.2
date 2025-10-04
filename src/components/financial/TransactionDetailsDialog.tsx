import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'
import { Calendar, CreditCard, Building, FileText, ArrowUpRight, ArrowDownRight, CheckCircle, Clock } from 'lucide-react'

interface FinancialTransaction {
  id: string
  tipo: 'Entrada' | 'Saída'
  categoria: string
  subcategoria?: string
  valor: number
  data_transacao: string
  descricao: string
  metodo_pagamento: string
  responsavel: string
  status: 'Pendente' | 'Confirmado' | 'Cancelado'
  comprovante?: string
  observacoes?: string
  membro_id?: string
  membro_nome?: string
  recibo_emitido?: boolean
  numero_documento?: string
  centro_custo?: string
  aprovado_por?: string
  data_aprovacao?: string
  id_igreja: string
}

interface TransactionDetailsDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  transaction: FinancialTransaction | null
  onReceipt?: (transaction: FinancialTransaction) => void
}

const TransactionDetailsDialog: React.FC<TransactionDetailsDialogProps> = ({
  isOpen,
  onOpenChange,
  transaction,
  onReceipt,
}) => {
  if (!transaction) return null

  const statusBadgeClasses =
    transaction.status === 'Confirmado'
      ? 'bg-blue-100 text-blue-800'
      : transaction.status === 'Pendente'
      ? 'bg-yellow-100 text-yellow-800'
      : 'bg-red-100 text-red-800'

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {transaction.tipo === 'Entrada' ? (
              <ArrowUpRight className="w-5 h-5 text-green-600" />
            ) : (
              <ArrowDownRight className="w-5 h-5 text-red-600" />
            )}
            Detalhes da Transação
          </DialogTitle>
          <DialogDescription className="text-sm">
            Visualize os dados e emita o recibo quando aplicável
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className={`px-2 py-1 rounded ${transaction.tipo === 'Entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {transaction.tipo}
            </span>
            <span className="px-2 py-1 rounded border">{transaction.categoria}</span>
            {transaction.subcategoria && (
              <span className="px-2 py-1 rounded border text-xs">{transaction.subcategoria}</span>
            )}
            <span className={`px-2 py-1 rounded ${statusBadgeClasses} flex items-center gap-1`}>
              {transaction.status === 'Confirmado' && <CheckCircle className="w-3 h-3" />}
              {transaction.status === 'Pendente' && <Clock className="w-3 h-3" />}
              {transaction.status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date(transaction.data_transacao).toLocaleDateString('pt-BR')}
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              {transaction.metodo_pagamento}
            </div>
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              {transaction.responsavel}
            </div>
            {transaction.numero_documento && (
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {transaction.numero_documento}
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="font-medium text-gray-900">Descrição</p>
            <p className="text-gray-700">{transaction.descricao}</p>
          </div>

          {transaction.centro_custo && (
            <p className="text-sm text-blue-600">📊 Centro de Custo: {transaction.centro_custo}</p>
          )}
          {transaction.observacoes && (
            <p className="text-sm text-gray-700">💬 {transaction.observacoes}</p>
          )}
          {transaction.aprovado_por && transaction.data_aprovacao && (
            <p className="text-xs text-green-600">
              ✅ Aprovado por {transaction.aprovado_por} em {new Date(transaction.data_aprovacao).toLocaleDateString('pt-BR')}
            </p>
          )}

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
            <div className="flex items-center gap-2">
              {transaction.tipo === 'Entrada' && transaction.status === 'Confirmado' && onReceipt && (
                <Button variant="outline" onClick={() => onReceipt(transaction)}>
                  Emitir/Ver Recibo
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default TransactionDetailsDialog