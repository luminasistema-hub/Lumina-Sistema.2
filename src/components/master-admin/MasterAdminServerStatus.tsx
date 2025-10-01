import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Server } from 'lucide-react';

const MasterAdminServerStatus: React.FC = () => {
  // As métricas de status do servidor abaixo são hardcoded.
  // Em um ambiente de produção real, elas seriam obtidas de um sistema de monitoramento de infraestrutura (ex: Prometheus, Grafana, AWS CloudWatch, etc.)
  // e não são diretamente acessíveis via API cliente do Supabase.
  const serverStatus = [
    { name: 'API Server', status: 'online', response: '45ms', uptime: '99.9%' },
    { name: 'Database', status: 'online', response: '12ms', uptime: '99.8%' },
    { name: 'File Storage', status: 'online', response: '89ms', uptime: '99.7%' },
    { name: 'Email Service', status: 'online', response: '156ms', uptime: '99.9%' },
    { name: 'Backup Service', status: 'online', response: '234ms', uptime: '99.5%' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server className="w-5 h-5 text-blue-500" />
          Status dos Serviços
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {serverStatus.map((service, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${service.status === 'online' ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <div className="font-medium text-sm">{service.name}</div>
                  <div className="text-xs text-gray-500">{service.response} • {service.uptime}</div>
                </div>
              </div>
              <Badge className={service.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {service.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MasterAdminServerStatus;