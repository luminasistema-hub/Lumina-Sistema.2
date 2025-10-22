import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'
import { Badge } from '../ui/badge'
import { 
  Calendar, 
  CreditCard, 
  Building, 
  FileText, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle, 
  Clock,
  User,
  Receipt,
  DollarSign,
  MessageSquare
} from 'lucide-react'

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

  const statusConfig = {
    'Confirmado': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    'Pendente': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    'Cancelado': { color: 'bg-red-100 text-red-800', icon: Clock }
  }

  const statusInfo = statusConfig[transaction.status]
  const StatusIcon = statusInfo.icon

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {transaction.tipo === 'Entrada' ? (
              <ArrowUpRight className="w-5 h-5 text-green-600" />
            ) : (
              <ArrowDownRight className="w-5 h-5 text-red-600" />
            )}
            Detalhes da Transação
          </DialogTitle>
          <DialogDescription>
            Informações completas sobre esta transação financeira
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Badges de Status */}
          <div className="flex flex-wrap gap-2">
            <Badge className={transaction.tipo === 'Entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {transaction.tipo}
            </Badge>
            <Badge variant="outline">{transaction.categoria}</Badge>
            {transaction.subcategoria && (
              <Badge variant="outline" className="text-xs">{transaction.subcategoria}</Badge>
            )}
            <Badge className={`${statusInfo.color} flex items-center gap-1`}>
              <StatusIcon className="w-3 h-3" />
              {transaction.status}
            </Badge>
            {transaction.recibo_emitido && (
              <Badge className="bg-blue-100 text-blue-800 flex items-center gap-1">
                <Receipt className="w-3 h-3" />
                Recibo Emitido
              </Badge>
            )}
          </div>

          <Separator />

          {/* Valor em Destaque */}
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Valor da Transação</p>
            <p className={`text-4xl font-bold ${transaction.tipo === 'Entrada' ? 'text-green-600' : 'text-red-600'}`}>
              {transaction.tipo === 'Entrada' ? '+' : '-'} R$ {transaction.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <Separator />

          {/* Informações Principais */}
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Descrição</p>
              <p className="text-base font-semibold">{transaction.descricao}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Data da Transação</p>
                  <p className="text-base">{new Date(transaction.data_transacao).toLocaleDateString('pt-BR', { 
                    day: '2-digit', 
                    month: 'long', 
                    year: 'numeric' 
                  })}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Método de Pagamento</p>
                  <p className="text-base">{transaction.metodo_pagamento}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-500">Responsável</p>
                  <p className="text-base">{transaction.responsavel}</p>
                </div>
              </div>

              {transaction.membro_nome && (
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Membro</p>
                    <p className="text-base">{transaction.membro_nome}</p>
                  </div>
                </div>
              )}

              {transaction.numero_documento && (
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Número do Documento</p>
                    <p className="text-base">{transaction.numero_documento}</p>
                  </div>
                </div>
              )}

              {transaction.centro_custo && (
                <div className="flex items-start gap-3">
                  <Building className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Centro de Custo</p>
                    <p className="text-base">{transaction.centro_custo}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Observações */}
          {transaction.observacoes && (
            <>
              <Separator />
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-gray-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-1">Observações</p>
                  <p className="text-base text-gray-700 whitespace-pre-wrap">{transaction.observacoes}</p>
                </div>
              </div>
            </>
          )}

          {/* Informações de Aprovação */}
          {transaction.aprovado_por && transaction.data_aprovacao && (
            <>
              <Separator />
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-green-800 mb-1">Aprovação</p>
                <p className="text-sm text-green-700">
                  Aprovado por <span className="font-semibold">{transaction.aprovado_por}</span> em{' '}
                  {new Date(transaction.data_aprovacao).toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </>
          )}

          {/* Ações */}
          <Separator />
          <div className="flex justify-between items-center pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            {transaction.tipo === 'Entrada' && onReceipt && (
              <Button onClick={() => onReceipt(transaction)} className="bg-blue-600 hover:bg-blue-700">
                <Receipt className="w-4 h-4 mr-2" />
                {transaction.recibo_emitido ? 'Ver Recibo' : 'Emitir Recibo'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default TransactionDetailsDialog