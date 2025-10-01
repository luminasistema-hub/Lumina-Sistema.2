import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Gauge, Speedometer, TrendingUp, Users, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

const MasterAdminWebPerformanceInsights: React.FC = () => {
  // Dados fictícios para simular métricas de performance web
  const webMetrics = {
    lcp: { value: 2.2, unit: 's', threshold: 2.5, status: 'good' }, // Largest Contentful Paint
    fid: { value: 50, unit: 'ms', threshold: 100, status: 'good' }, // First Input Delay
    cls: { value: 0.08, unit: '', threshold: 0.1, status: 'good' }, // Cumulative Layout Shift
    pageLoadTime: { value: 3.5, unit: 's', threshold: 4.0, status: 'average' },
    bounceRate: { value: 35, unit: '%', threshold: 40, status: 'good' },
    totalPageViews: { value: '150k', status: 'good' },
  };

  const getStatusBadge = (status: 'good' | 'average' | 'poor') => {
    switch (status) {
      case 'good': return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Bom</Badge>;
      case 'average': return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" /> Médio</Badge>;
      case 'poor': return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="w-3 h-3 mr-1" /> Ruim</Badge>;
      default: return <Badge variant="outline">N/A</Badge>;
    }
  };

  const getProgressColor = (status: 'good' | 'average' | 'poor') => {
    switch (status) {
      case 'good': return 'bg-green-500';
      case 'average': return 'bg-yellow-500';
      case 'poor': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Speedometer className="w-5 h-5 text-orange-500" />
          Insights de Performance Web
        </CardTitle>
        <CardDescription>
          Métricas de performance do aplicativo para usuários (dados fictícios).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <Gauge className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-xl font-bold">{webMetrics.lcp.value}{webMetrics.lcp.unit}</div>
              <div className="text-sm text-gray-600">LCP (Carregamento)</div>
              {getStatusBadge(webMetrics.lcp.status)}
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <Gauge className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <div className="text-xl font-bold">{webMetrics.fid.value}{webMetrics.fid.unit}</div>
              <div className="text-sm text-gray-600">FID (Interatividade)</div>
              {getStatusBadge(webMetrics.fid.status)}
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <Gauge className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-xl font-bold">{webMetrics.cls.value}</div>
              <div className="text-sm text-gray-600">CLS (Estabilidade Visual)</div>
              {getStatusBadge(webMetrics.cls.status)}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-800">Tempo de Carregamento da Página</h4>
                {getStatusBadge(webMetrics.pageLoadTime.status)}
              </div>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-blue-600">{webMetrics.pageLoadTime.value}{webMetrics.pageLoadTime.unit}</span>
                <Progress 
                  value={(webMetrics.pageLoadTime.threshold - webMetrics.pageLoadTime.value) / webMetrics.pageLoadTime.threshold * 100} 
                  className="w-1/2 h-2" 
                  indicatorColor={getProgressColor(webMetrics.pageLoadTime.status)}
                />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-800">Taxa de Rejeição</h4>
                {getStatusBadge(webMetrics.bounceRate.status)}
              </div>
              <div className="flex items-end justify-between">
                <span className="text-3xl font-bold text-purple-600">{webMetrics.bounceRate.value}{webMetrics.bounceRate.unit}</span>
                <Progress 
                  value={100 - webMetrics.bounceRate.value} 
                  className="w-1/2 h-2" 
                  indicatorColor={getProgressColor(webMetrics.bounceRate.status)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-teal-500 mx-auto mb-2" />
            <div className="text-xl font-bold">{webMetrics.totalPageViews}</div>
            <div className="text-sm text-gray-600">Visualizações Totais de Página (30 dias)</div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default MasterAdminWebPerformanceInsights;