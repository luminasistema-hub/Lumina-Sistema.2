import React, { useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'
import { Printer, Download } from 'lucide-react'

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
  numero_documento?: string
}

interface FinancialReport {
  id: string
  tipo: 'Mensal' | 'Trimestral' | 'Anual' | 'Personalizado'
  periodo_inicio: string
  periodo_fim: string
  gerado_por: string
  data_geracao: string
  dados: {
    total_entradas: number
    total_saidas: number
    saldo_periodo: number
    categorias_entrada: Array<{categoria: string, valor: number}>
    categorias_saida: Array<{categoria: string, valor: number}>
    maior_entrada: FinancialTransaction | null
    maior_saida: FinancialTransaction | null
  }
}

interface ReportViewerDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  report: FinancialReport | null
}

const ReportViewerDialog: React.FC<ReportViewerDialogProps> = ({ isOpen, onOpenChange, report }) => {
  if (!report) return null

  const csvContent = useMemo(() => {
    const lines: string[] = []
    lines.push(`Relatório,${report.tipo}`)
    lines.push(`Período,${report.periodo_inicio},${report.periodo_fim}`)
    lines.push(`Gerado por,${report.gerado_por}`)
    lines.push(`Data de geração,${new Date(report.data_geracao).toLocaleString('pt-BR')}`)
    lines.push('')
    lines.push('Resumo')
    lines.push(`Total Entradas,${report.dados.total_entradas.toFixed(2)}`)
    lines.push(`Total Saídas,${report.dados.total_saidas.toFixed(2)}`)
    lines.push(`Saldo do Período,${report.dados.saldo_periodo.toFixed(2)}`)
    lines.push('')
    lines.push('Categorias de Entrada')
    lines.push('Categoria,Valor')
    report.dados.categorias_entrada.forEach(c => lines.push(`${c.categoria},${c.valor.toFixed(2)}`))
    lines.push('')
    lines.push('Categorias de Saída')
    lines.push('Categoria,Valor')
    report.dados.categorias_saida.forEach(c => lines.push(`${c.categoria},${c.valor.toFixed(2)}`))
    return lines.join('\n')
  }, [report])

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadCsv = () => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-${report.tipo}-${report.periodo_inicio}-${report.periodo_fim}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl p-0 print:hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Relatório {report.tipo}</DialogTitle>
            <DialogDescription className="text-sm">
              {new Date(report.periodo_inicio).toLocaleDateString('pt-BR')} até {new Date(report.periodo_fim).toLocaleDateString('pt-BR')}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[70vh] overflow-y-auto px-6">
            <div className="space-y-6 py-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    R$ {report.dados.total_entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-gray-600">Total Entradas</p>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">
                    R$ {report.dados.total_saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-gray-600">Total Saídas</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className={`text-2xl font-bold ${report.dados.saldo_periodo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                    R$ {report.dados.saldo_periodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-gray-600">Saldo do Período</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="font-semibold mb-2">Categorias de Entrada</p>
                  <div className="space-y-1">
                    {report.dados.categorias_entrada.length > 0 ? (
                      report.dados.categorias_entrada.map(c => (
                        <div key={`ent-${c.categoria}`} className="flex justify-between text-sm">
                          <span>{c.categoria}</span>
                          <span>R$ {c.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">Nenhuma entrada no período</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="font-semibold mb-2">Categorias de Saída</p>
                  <div className="space-y-1">
                    {report.dados.categorias_saida.length > 0 ? (
                      report.dados.categorias_saida.map(c => (
                        <div key={`sai-${c.categoria}`} className="flex justify-between text-sm">
                          <span>{c.categoria}</span>
                          <span>R$ {c.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">Nenhuma saída no período</p>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="font-semibold mb-2">Maior Entrada</p>
                  {report.dados.maior_entrada ? (
                    <div className="text-sm text-gray-700">
                      <p className="font-medium">{report.dados.maior_entrada.categoria}</p>
                      <p>R$ {report.dados.maior_entrada.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <p>{new Date(report.dados.maior_entrada.data_transacao).toLocaleDateString('pt-BR')}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">—</p>
                  )}
                </div>
                <div>
                  <p className="font-semibold mb-2">Maior Saída</p>
                  {report.dados.maior_saida ? (
                    <div className="text-sm text-gray-700">
                      <p className="font-medium">{report.dados.maior_saida.categoria}</p>
                      <p>R$ {report.dados.maior_saida.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <p>{new Date(report.dados.maior_saida.data_transacao).toLocaleDateString('pt-BR')}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">—</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-4 border-t flex justify-between">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
              <Button onClick={handleDownloadCsv}>
                <Download className="w-4 h-4 mr-2" />
                Download CSV
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Versão para impressão */}
      <div className="hidden print:block print-content">
        <div style={{ padding: '20mm', fontFamily: 'Arial, sans-serif' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #000', paddingBottom: '15px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0' }}>
              Relatório Financeiro {report.tipo}
            </h1>
            <p style={{ fontSize: '14px', margin: '5px 0', color: '#666' }}>
              Período: {new Date(report.periodo_inicio).toLocaleDateString('pt-BR')} até {new Date(report.periodo_fim).toLocaleDateString('pt-BR')}
            </p>
            <p style={{ fontSize: '12px', margin: '5px 0', color: '#666' }}>
              Gerado por: {report.gerado_por} em {new Date(report.data_geracao).toLocaleDateString('pt-BR')} às {new Date(report.data_geracao).toLocaleTimeString('pt-BR')}
            </p>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>
              Resumo Financeiro
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
              <tbody>
                <tr style={{ backgroundColor: '#e8f5e9' }}>
                  <td style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold' }}>Total de Entradas</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right', color: '#2e7d32', fontWeight: 'bold', fontSize: '16px' }}>
                    R$ {report.dados.total_entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr style={{ backgroundColor: '#ffebee' }}>
                  <td style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold' }}>Total de Saídas</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right', color: '#c62828', fontWeight: 'bold', fontSize: '16px' }}>
                    R$ {report.dados.total_saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
                <tr style={{ backgroundColor: report.dados.saldo_periodo >= 0 ? '#e3f2fd' : '#ffebee' }}>
                  <td style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold' }}>Saldo do Período</td>
                  <td style={{ 
                    padding: '12px', 
                    border: '1px solid #ddd', 
                    textAlign: 'right', 
                    color: report.dados.saldo_periodo >= 0 ? '#1565c0' : '#c62828', 
                    fontWeight: 'bold', 
                    fontSize: '18px' 
                  }}>
                    R$ {report.dados.saldo_periodo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>
              Categorias de Entrada
            </h2>
            {report.dados.categorias_entrada.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Categoria</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {report.dados.categorias_entrada.map((c, idx) => (
                    <tr key={`ent-${idx}`}>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{c.categoria}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>
                        R$ {c.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ fontSize: '14px', color: '#666', fontStyle: 'italic' }}>Nenhuma entrada no período</p>
            )}
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>
              Categorias de Saída
            </h2>
            {report.dados.categorias_saida.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f5f5f5' }}>
                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Categoria</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {report.dados.categorias_saida.map((c, idx) => (
                    <tr key={`sai-${idx}`}>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>{c.categoria}</td>
                      <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>
                        R$ {c.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ fontSize: '14px', color: '#666', fontStyle: 'italic' }}>Nenhuma saída no período</p>
            )}
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '15px', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>
              Destaques
            </h2>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '12px', border: '1px solid #ddd', width: '50%', verticalAlign: 'top' }}>
                    <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Maior Entrada</p>
                    {report.dados.maior_entrada ? (
                      <>
                        <p style={{ fontSize: '14px', margin: '4px 0' }}>{report.dados.maior_entrada.categoria}</p>
                        <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#2e7d32', margin: '4px 0' }}>
                          R$ {report.dados.maior_entrada.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p style={{ fontSize: '12px', color: '#666', margin: '4px 0' }}>
                          {new Date(report.dados.maior_entrada.data_transacao).toLocaleDateString('pt-BR')}
                        </p>
                      </>
                    ) : (
                      <p style={{ fontSize: '14px', color: '#666', fontStyle: 'italic' }}>—</p>
                    )}
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #ddd', width: '50%', verticalAlign: 'top' }}>
                    <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>Maior Saída</p>
                    {report.dados.maior_saida ? (
                      <>
                        <p style={{ fontSize: '14px', margin: '4px 0' }}>{report.dados.maior_saida.categoria}</p>
                        <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#c62828', margin: '4px 0' }}>
                          R$ {report.dados.maior_saida.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p style={{ fontSize: '12px', color: '#666', margin: '4px 0' }}>
                          {new Date(report.dados.maior_saida.data_transacao).toLocaleDateString('pt-BR')}
                        </p>
                      </>
                    ) : (
                      <p style={{ fontSize: '14px', color: '#666', fontStyle: 'italic' }}>—</p>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
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

export default ReportViewerDialog