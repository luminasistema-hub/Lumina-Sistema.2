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
    <>
      <div className="receipt-preview print:hidden">
        <Card className="border-2 border-gray-300 max-w-2xl mx-auto">
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

            <div className="flex justify-center gap-4 pt-4">
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
      </div>

      {/* Versão para impressão */}
      <div className="hidden print:block print-content">
        <div style={{ padding: '20mm', fontFamily: 'Arial, sans-serif' }}>
          <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px solid #000', paddingBottom: '15px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0' }}>{data.igreja.nome}</h1>
            <p style={{ fontSize: '12px', margin: '5px 0' }}>{data.igreja.endereco}</p>
            <p style={{ fontSize: '12px', margin: '5px 0' }}>CNPJ: {data.igreja.cnpj} | Tel: {data.igreja.telefone}</p>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#2563eb', marginTop: '15px' }}>RECIBO DE DOAÇÃO</h2>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <table style={{ width: '100%', marginBottom: '15px', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ width: '50%', paddingRight: '10px' }}>
                    <p style={{ fontSize: '10px', color: '#666', margin: '0' }}>Número do Recibo</p>
                    <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '5px 0' }}>{data.numero}</p>
                  </td>
                  <td style={{ width: '50%', paddingLeft: '10px' }}>
                    <p style={{ fontSize: '10px', color: '#666', margin: '0' }}>Data de Emissão</p>
                    <p style={{ fontSize: '14px', fontWeight: 'bold', margin: '5px 0' }}>{data.data_emissao}</p>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ borderTop: '1px solid #ddd', paddingTop: '15px', marginBottom: '15px' }}>
            <div style={{ marginBottom: '15px' }}>
              <p style={{ fontSize: '10px', color: '#666', margin: '0' }}>Doador</p>
              <p style={{ fontSize: '14px', fontWeight: '600', margin: '5px 0' }}>{data.doador}</p>
            </div>

            <table style={{ width: '100%', marginBottom: '15px', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ width: '50%', paddingRight: '10px' }}>
                    <p style={{ fontSize: '10px', color: '#666', margin: '0' }}>Categoria</p>
                    <p style={{ fontSize: '12px', margin: '5px 0' }}>{data.categoria}</p>
                  </td>
                  <td style={{ width: '50%', paddingLeft: '10px' }}>
                    <p style={{ fontSize: '10px', color: '#666', margin: '0' }}>Forma de Pagamento</p>
                    <p style={{ fontSize: '12px', margin: '5px 0' }}>{data.metodo_pagamento}</p>
                  </td>
                </tr>
              </tbody>
            </table>

            <div style={{ marginBottom: '15px' }}>
              <p style={{ fontSize: '10px', color: '#666', margin: '0' }}>Descrição</p>
              <p style={{ fontSize: '12px', margin: '5px 0' }}>{data.descricao}</p>
            </div>
          </div>

          <div style={{ textAlign: 'center', backgroundColor: '#eff6ff', padding: '20px', borderRadius: '8px', margin: '20px 0' }}>
            <p style={{ fontSize: '10px', color: '#666', margin: '0 0 5px 0' }}>Valor da Doação</p>
            <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#2563eb', margin: '0' }}>
              R$ {data.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div style={{ borderTop: '1px solid #ddd', paddingTop: '15px', marginTop: '20px' }}>
            <p style={{ fontSize: '10px', textAlign: 'center', color: '#666', lineHeight: '1.5', margin: '0 0 40px 0' }}>
              Declaro que recebi do doador acima identificado a quantia especificada,
              destinada às atividades religiosas desta instituição.
            </p>
            
            <div style={{ textAlign: 'center', marginTop: '60px' }}>
              <div style={{ borderTop: '1px solid #000', width: '200px', margin: '0 auto' }}>
                <p style={{ fontSize: '10px', color: '#666', marginTop: '5px' }}>
                  Assinatura do Responsável Financeiro
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          
          body * {
            visibility: hidden;
          }
          
          .print-content,
          .print-content * {
            visibility: visible;
          }
          
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>
    </>
  )
}

export default ReceiptGenerator