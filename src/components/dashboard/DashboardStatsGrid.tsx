import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import { Card, CardContent } from '../ui/card';
import { Users, Calendar, BookOpen, DollarSign, Heart, TrendingUp } from 'lucide-react';
import { useDashboardStats } from '../../hooks/useDashboardStats';
import { Skeleton } from '../ui/skeleton';
import { useJourneyData } from '../../hooks/useJourneyData';

const DashboardStatsGrid = () => {
  const { user } = useAuthStore();
  const { data: statsData, isLoading } = useDashboardStats();
  const { overallProgress, totalSteps } = useJourneyData();

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-3 md:p-6">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-8 w-1/2 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const isAdminOrPastor = user.role === 'admin' || user.role === 'pastor';
  const isFinancialRole = user.role === 'admin' || user.role === 'pastor' || user.role === 'financeiro';

  const journeyStat = {
    title: 'Jornada Espiritual',
    value: `${Math.round(overallProgress || 0)}%`,
    change: `${Math.round(overallProgress || 0)}% de progresso`,
    icon: <TrendingUp className="w-5 h-5" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  };

  const stats = isAdminOrPastor
    ? [
        journeyStat,
        {
          title: 'Membros Ativos',
          value: statsData?.activeMembers?.toString() || '0',
          change: 'membros na igreja',
          icon: <Users className="w-5 h-5" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
        },
        {
          title: 'Eventos Próximos',
          value: statsData?.upcomingEvents?.toString() || '0',
          change: 'eventos agendados',
          icon: <Calendar className="w-5 h-5" />,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
        },
        {
          title: 'Cursos em Andamento',
          value: statsData?.activeCourses?.toString() || '0',
          change: 'inscrições ativas',
          icon: <BookOpen className="w-5 h-5" />,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
        },
        ...(isFinancialRole
          ? [
              {
                title: 'Ofertas do Mês',
                value: `R$ ${statsData?.totalMonthlyOfferings?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`,
                change: 'suas ofertas confirmadas este mês',
                icon: <DollarSign className="w-5 h-5" />,
                color: 'text-orange-600',
                bgColor: 'bg-orange-50',
              },
            ]
          : []),
      ]
    : [
        journeyStat,
        {
          title: 'Próximos Eventos',
          value: statsData?.upcomingEvents?.toString() || '0',
          change: 'esta semana',
          icon: <Calendar className="w-5 h-5" />,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
        },
        {
          title: 'Cursos em Andamento',
          value: statsData?.activeCourses?.toString() || '0',
          change: 'inscrições ativas',
          icon: <BookOpen className="w-5 h-5" />,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
        },
      ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
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