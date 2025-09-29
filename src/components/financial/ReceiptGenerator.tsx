import React from 'react'
import { Card, CardContent, CardHeader } from '../ui/card'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'
import { Printer, Download } from 'lucide-react'

interface ReceiptData {
  numero: string
  data_emissao: string
  valor: number
  descricao: string
  categoria: string
  metodo_pagamento: string
  igreja: {
    nome: string
    endereco: string
    cnpj: string
    telefone: string
  }
  doador: string
}

interface ReceiptGeneratorProps {
  data: ReceiptData
  onPrint?: () => void
  onDownload?: () => void
}

const ReceiptGenerator: React.FC<ReceiptGeneratorProps> = ({ data, onPrint, onDownload }) => {
  const handlePrint = () => {
    window.print()
    onPrint?.()
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white">
      <Card className="border-2 border-gray-300">
        <CardHeader className="text-center pb-6">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">{data.igreja.nome}</h1>
            <p className="text-gray-600">{data.igreja.endereco}</p>
            <p className="text-gray-600">CNPJ: {data.igreja.cnpj} | Tel: {data.igreja.telefone}</p>
          </div>
          <Separator className="my-4" />
          <h2 className="text-xl font-semibold text-blue-600">RECIBO DE DOAÇÃO</h2>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Número do Recibo</p>
              <p className="text-lg font-bold">{data.numero}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Data de Emissão</p>
              <p className="text-lg font-bold">{data.data_emissao}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Doador</p>
              <p className="text-lg font-semibold">{data.doador}</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Categoria</p>
                <p className="text-base">{data.categoria}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Forma de Pagamento</p>
                <p className="text-base">{data.metodo_pagamento}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-500">Descrição</p>
              <p className="text-base">{data.descricao}</p>
            </div>
          </div>

          <Separator />

          <div className="text-center bg-blue-50 p-6 rounded-lg">
            <p className="text-sm font-medium text-gray-600 mb-2">Valor da Doação</p>
            <p className="text-3xl font-bold text-blue-600">
              R$ {data.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {new Intl.NumberFormat('pt-BR', { 
                style: 'currency', 
                currency: 'BRL' 
              }).format(data.valor).replace('R$', '').trim()} reais
            </p>
          </div>

          <Separator />

          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              Declaro que recebi do doador acima identificado a quantia especificada,
              destinada às atividades religiosas desta instituição.
            </p>
            
            <div className="pt-8">
              <div className="border-t border-gray-300 w-64 mx-auto">
                <p className="text-sm text-gray-600 mt-2">
                  Assinatura do Responsável Financeiro
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 pt-6 print:hidden">
            <Button onClick={handlePrint} className="bg-blue-500 hover:bg-blue-600">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir
            </Button>
            <Button variant="outline" onClick={onDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}

export default ReceiptGenerator