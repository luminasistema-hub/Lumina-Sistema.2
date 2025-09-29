import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import WelcomeCard from './WelcomeCard';
import DashboardStatsGrid from './DashboardStatsGrid';
import DashboardQuickActions from './DashboardQuickActions';
import MemberDashboardContent from './MemberDashboardContent';
import AdminPastorDashboardContent from './AdminPastorDashboardContent';

const DashboardHome = () => {
  const { user, currentChurchId } = useAuthStore();

  if (!user || !currentChurchId) {
    return (
      <div className="p-6 text-center text-gray-600">
        {user?.role === 'super_admin' ? 'Selecione uma igreja no menu lateral para visualizar o dashboard.' : 'Carregando informações da igreja...'}
      </div>
    );
  }

  const isAdminOrPastor = user.role === 'admin' || user.role === 'pastor';

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      <WelcomeCard />
      <DashboardStatsGrid />
      <DashboardQuickActions />

      {isAdminOrPastor ? <AdminPastorDashboardContent /> : <MemberDashboardContent />}
    </div>
  );
};

export default DashboardHome;