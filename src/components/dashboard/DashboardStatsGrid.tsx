import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Card, CardContent } from '../ui/card';
import { Users, Calendar, BookOpen, DollarSign, Heart, TrendingUp } from 'lucide-react';

const DashboardStatsGrid = () => {
  const { user } = useAuthStore();

  if (!user) return null;

  const isAdminOrPastor = user.role === 'admin' || user.role === 'pastor';
  const isFinancialRole = user.role === 'admin' || user.role === 'pastor' || user.role === 'financeiro';

  const stats = isAdminOrPastor
    ? [
        {
          title: 'Membros Ativos',
          value: '127',
          change: '+5 novos membros',
          icon: <Users className="w-5 h-5" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
        },
        {
          title: 'Eventos Próximos',
          value: '3',
          change: '+2 esta semana',
          icon: <Calendar className="w-5 h-5" />,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
        },
        {
          title: 'Cursos em Andamento',
          value: '2',
          change: '1 finalizado',
          icon: <BookOpen className="w-5 h-5" />,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
        },
        ...(isFinancialRole
          ? [
              {
                title: 'Ofertas do Mês',
                value: 'R$ 2.450',
                change: '+15% vs mês anterior',
                icon: <DollarSign className="w-5 h-5" />,
                color: 'text-orange-600',
                bgColor: 'bg-orange-50',
              },
            ]
          : [
              {
                title: 'Ministérios Ativos',
                value: '8',
                change: 'Todos funcionando',
                icon: <Heart className="w-5 h-5" />,
                color: 'text-orange-600',
                bgColor: 'bg-orange-50',
              },
            ]),
      ]
    : [
        {
          title: 'Cursos Disponíveis',
          value: '12',
          change: '3 novos cursos',
          icon: <BookOpen className="w-5 h-5" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
        },
        {
          title: 'Próximos Eventos',
          value: '4',
          change: 'Esta semana',
          icon: <Calendar className="w-5 h-5" />,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
        },
        {
          title: 'Devocionais',
          value: '25',
          change: 'Novos este mês',
          icon: <Heart className="w-5 h-5" />,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
        },
        {
          title: 'Jornada Espiritual',
          value: '75%',
          change: 'Progresso atual',
          icon: <TrendingUp className="w-5 h-5" />,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
        },
      ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-3 md:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-medium text-gray-600 truncate">{stat.title}</p>
                <p className="text-lg md:text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1 truncate">{stat.change}</p>
              </div>
              <div
                className={`w-8 h-8 md:w-12 md:h-12 ${stat.bgColor} rounded-lg flex items-center justify-center ml-2`}
              >
                <span className={stat.color}>{stat.icon}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DashboardStatsGrid;