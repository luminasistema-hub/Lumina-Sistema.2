import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { toast } from 'sonner';
import { supabase } from '../../integrations/supabase/client';
import { useChurchStore, Church } from '../../stores/churchStore';
import { FileText, Download, BarChart3, RefreshCw, Loader2, Calendar, Users, DollarSign, TrendingUp, Clock, History as HistoryIcon } from 'lucide-react';

interface SaaSReportData {
  id: string;
  tipo: 'Mensal' | 'Trimestral' | 'Anual' | 'Personalizado';
  periodo_inicio: string;
  periodo_fim: string;
  data_geracao: string;
  total_igrejas: number;
  igrejas_ativas: number;
  igrejas_bloqueadas: number;
  total_membros: number;
  total_receita_estimada: number;
  pagamentos_pendentes: number;
  detalhes_igrejas?: Church[]; // Opcional, para relatórios detalhados
}

const SaaSReportsTab: React.FC = () => {
  const { churches, loadChurches } = useChurchStore();
  const [reports, setReports] = useState<SaaSReportData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [reportParams, setReportParams] = useState({
    tipo: 'Mensal' as SaaSReportData['tipo'],
    periodo_inicio: new Date().toISOString().split('T')[0],
    periodo_fim: new Date().toISOString().split('T')[0],
    incluir_detalhes_igrejas: false,
  });

  useEffect(() => {
    loadChurches(); // Ensure churches are loaded for reports
  }, [loadChurches]);

  const formatDisplayDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // Return original if invalid
      return date.toLocaleDateString('pt-BR');
    } catch {
      return dateString;
    }
  };

  const formatDisplayDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString; // Return original if invalid
      return date.toLocaleString('pt-BR');
    } catch {
      return dateString;
    }
  };

  const generateSaaSReport = useCallback(async () => {
    setIsLoading(true);
    try {
      const startDate = new Date(reportParams.periodo_inicio);
      const endDate = new Date(reportParams.periodo_fim);

      // Ensure churches is an array before filtering
      const validChurches = Array.isArray(churches) ? churches : [];

      const filteredChurches = validChurches.filter(church => {
        // Add null/undefined check for created_at
        if (!church.created_at) return false;
        const churchCreatedAt = new Date(church.created_at);
        return !isNaN(churchCreatedAt.getTime()) && churchCreatedAt >= startDate && churchCreatedAt <= endDate;
      });

      const totalIgrejas = filteredChurches.length;
      const igrejasAtivas = filteredChurches.filter(c => c.status === 'active').length;
      const igrejasBloqueadas = filteredChurches.filter(c => c.status === 'blocked').length;
      const totalMembros = filteredChurches.reduce((sum, c) => sum + c.currentMembers, 0);
      const totalReceitaEstimada = filteredChurches.filter(c => c.status === 'active' && c.ultimo_pagamento_status === 'Pago')
                                                  .reduce((sum, c) => sum + c.valor_mensal_assinatura, 0);
      const pagamentosPendentes = filteredChurches.filter(c => c.ultimo_pagamento_status === 'Pendente' || c.ultimo_pagamento_status === 'Atrasado').length;

      const newReport: SaaSReportData = {
        id: Date.now().toString(),
        tipo: reportParams.tipo,
        periodo_inicio: reportParams.periodo_inicio,
        periodo_fim: reportParams.periodo_fim,
        data_geracao: new Date().toISOString(),
        total_igrejas: totalIgrejas,
        igrejas_ativas: igrejasAtivas,
        igrejas_bloqueadas: igrejasBloqueadas,
        total_membros: totalMembros,
        total_receita_estimada: totalReceitaEstimada,
        pagamentos_pendentes: pagamentosPendentes,
        detalhes_igrejas: reportParams.incluir_detalhes_igrejas ? filteredChurches : undefined,
      };

      setReports(prev => [newReport, ...prev]);
      toast.success('Relatório SaaS gerado com sucesso!');
    } catch (error: any) {
      console.error('Error generating SaaS report:', error.message);
      toast.error('Erro ao gerar relatório SaaS: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [churches, reportParams]);

  const handleDownloadReport = (report: SaaSReportData) => {
    const filename = `relatorio_saas_${report.tipo}_${report.periodo_inicio}_${report.periodo_fim}.json`;
    const jsonStr = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.info('Relatório baixado como JSON.');
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-teal-600 to-green-700 rounded-xl p-6 text-white shadow-lg">
        <h1 className="text-3xl font-bold">Relatórios SaaS 📈</h1>
        <p className="opacity-90 mt-1">Visão geral e detalhada da performance do sistema.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-green-500" />
            Gerar Novo Relatório
          </CardTitle>
          <CardDescription>
            Configure e gere relatórios sobre o desempenho geral do SaaS.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="report-type">Tipo de Relatório</Label>
            <Select value={reportParams.tipo} onValueChange={(value) => setReportParams({...reportParams, tipo: value as SaaSReportData['tipo']})}>
              <SelectTrigger id="report-type">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Mensal">Mensal</SelectItem>
                <SelectItem value="Trimestral">Trimestral</SelectItem>
                <SelectItem value="Anual">Anual</SelectItem>
                <SelectItem value="Personalizado">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="periodo-inicio">Período Início</Label>
              <Input
                id="periodo-inicio"
                type="date"
                value={reportParams.periodo_inicio}
                onChange={(e) => setReportParams({...reportParams, periodo_inicio: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="periodo-fim">Período Fim</Label>
              <Input
                id="periodo-fim"
                type="date"
                value={reportParams.periodo_fim}
                onChange={(e) => setReportParams({...reportParams, periodo_fim: e.target.value})}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="incluir-detalhes"
              checked={reportParams.incluir_detalhes_igrejas}
              onCheckedChange={(checked) => setReportParams({...reportParams, incluir_detalhes_igrejas: checked as boolean})}
            />
            <Label htmlFor="incluir-detalhes">Incluir detalhes de cada igreja</Label>
          </div>
          <Button onClick={generateSaaSReport} disabled={isLoading} className="bg-green-500 hover:bg-green-600">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Gerando...
              </div>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Gerar Relatório
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-blue-500" />
            Histórico de Relatórios ({reports.length})
          </CardTitle>
          <CardDescription>
            Relatórios SaaS gerados anteriormente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              Nenhum relatório gerado ainda.
            </div>
          ) : (
            <div className="space-y-4">
              {reports.map(report => (
                <Card key={report.id} className="border-0 shadow-sm">
                  <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{report.tipo} - {formatDisplayDate(report.periodo_inicio)} a {formatDisplayDate(report.periodo_fim)}</h3>
                      <p className="text-sm text-gray-600">Gerado em: {formatDisplayDateTime(report.data_geracao)}</p>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-700">
                        <p><Users className="inline-block w-4 h-4 mr-1 text-purple-500" /> Igrejas: {report.total_igrejas} ({report.igrejas_ativas} ativas)</p>
                        <p><DollarSign className="inline-block w-4 h-4 mr-1 text-green-500" /> Receita Estimada: R$ {report.total_receita_estimada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <p><Clock className="inline-block w-4 h-4 mr-1 text-orange-500" /> Pagamentos Pendentes: {report.pagamentos_pendentes}</p>
                      </div>
                    </div>
                    <Button onClick={() => handleDownloadReport(report)} size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download JSON
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SaaSReportsTab;