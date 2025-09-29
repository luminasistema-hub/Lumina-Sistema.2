import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Calendar, BookOpen, Heart, TrendingUp, Eye, ArrowRight } from 'lucide-react';

const DashboardQuickActions = () => {
  const { user } = useAuthStore();

  if (!user) return null;

  const isAdminOrPastor = user.role === 'admin' || user.role === 'pastor';

  const quickActions = isAdminOrPastor
    ? [
        {
          title: 'Novo Evento',
          description: 'Criar um novo evento para a igreja',
          icon: <Calendar className="w-5 h-5" />,
          color: 'bg-blue-500 hover:bg-blue-600',
        },
        {
          title: 'Ver Membros',
          description: 'Visualizar lista de membros',
          icon: <Eye className="w-5 h-5" />,
          color: 'bg-green-500 hover:bg-green-600',
        },
        {
          title: 'Relatório Financeiro',
          description: 'Gerar relatório mensal',
          icon: <TrendingUp className="w-5 h-5" />,
          color: 'bg-purple-500 hover:bg-purple-600',
        },
      ]
    : [
        {
          title: 'Ver Cursos',
          description: 'Acesse os cursos disponíveis',
          icon: <BookOpen className="w-5 h-5" />,
          color: 'bg-blue-500 hover:bg-blue-600',
        },
        {
          title: 'Próximos Eventos',
          description: 'Veja eventos da igreja',
          icon: <Calendar className="w-5 h-5" />,
          color: 'bg-green-500 hover:bg-green-600',
        },
        {
          title: 'Ler Devocionais',
          description: 'Alimento espiritual diário',
          icon: <Heart className="w-5 h-5" />,
          color: 'bg-purple-500 hover:bg-purple-600',
        },
      ];

  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-500" />
          Ações Rápidas
        </CardTitle>
        <CardDescription>Acesse rapidamente as principais funcionalidades</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {quickActions.map((action, index) => (
            <Button key={index} variant="outline" className="w-full justify-start h-auto p-4 hover:bg-gray-50">
              <div
                className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center text-white mr-3`}
              >
                {action.icon}
              </div>
              <div className="text-left flex-1">
                <p className="font-medium">{action.title}</p>
                <p className="text-sm text-gray-500">{action.description}</p>
              </div>
              <ArrowRight className="w-4 h-4 ml-auto" />
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default DashboardQuickActions;