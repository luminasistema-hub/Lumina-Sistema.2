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
    <div className="receipt-container">
      <Card className="receipt-card border-2 border-gray-300">
        <CardHeader className="text-center pb-4">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900">{data.igreja.nome}</h1>
            <p className="text-sm text-gray-600">{data.igreja.endereco}</p>
            <p className="text-sm text-gray-600">CNPJ: {data.igreja.cnpj} | Tel: {data.igreja.telefone}</p>
          </div>
          <Separator className="my-4" />
          <h2 className="text-xl font-semibold text-blue-600">RECIBO DE DOAÇÃO</h2>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-gray-500">Número do Recibo</p>
              <p className="text-base font-bold">{data.numero}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Data de Emissão</p>
              <p className="text-base font-bold">{data.data_emissao}</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-gray-500">Doador</p>
              <p className="text-base font-semibold">{data.doador}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500">Categoria</p>
                <p className="text-sm">{data.categoria}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500">Forma de Pagamento</p>
                <p className="text-sm">{data.metodo_pagamento}</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500">Descrição</p>
              <p className="text-sm">{data.descricao}</p>
            </div>
          </div>

          <Separator />

          <div className="text-center bg-blue-50 p-4 rounded-lg">
            <p className="text-xs font-medium text-gray-600 mb-1">Valor da Doação</p>
            <p className="text-2xl font-bold text-blue-600">
              R$ {data.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <Separator />

          <div className="text-center space-y-3">
            <p className="text-xs text-gray-600">
              Declaro que recebi do doador acima identificado a quantia especificada,
              destinada às atividades religiosas desta instituição.
            </p>
            
            <div className="pt-6">
              <div className="border-t border-gray-300 w-48 mx-auto">
                <p className="text-xs text-gray-600 mt-2">
                  Assinatura do Responsável Financeiro
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 pt-4 print:hidden no-print">
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

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 15mm;
          }
          
          body {
            margin: 0;
            padding: 0;
          }
          
          body * {
            visibility: hidden;
          }
          
          .receipt-container,
          .receipt-container * {
            visibility: visible;
          }
          
          .receipt-container {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0;
            margin: 0;
          }
          
          .receipt-card {
            box-shadow: none !important;
            border: 1px solid #000 !important;
            page-break-inside: avoid;
            max-width: 100%;
            margin: 0 auto;
          }
          
          .no-print {
            display: none !important;
          }
          
          /* Garantir que cores sejam impressas */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  )
}

export default ReceiptGenerator