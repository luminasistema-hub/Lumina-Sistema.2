import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom'; 
import MainLayout from '../components/layout/MainLayout';
import DashboardHome from '../components/dashboard/DashboardHome';
import PersonalInfo from '../components/personal/PersonalInfo';
import MemberJourney from '../components/personal/MemberJourney';
import VocationalTest from '../components/personal/VocationalTest';
import EventsPage from '../components/spiritual/EventsPage';
import EventsManagementPage from '../components/management/EventsManagementPage';
import DevotionalsManagementPage from '../components/management/DevotionalsManagementPage';
import DevotionalsPage from '../components/spiritual/DevotionalsPage';
import OfferingsPage from '../components/contributions/OfferingsPage';
import KidsPage from '../components/family/KidsPage';
import MemberManagementPage from '../components/management/MemberManagementPage';
import MinistriesPage from '../components/management/MinistriesPage';
import FinancialPanel from '../components/management/FinancialPanel';
import SystemStatus from '../components/admin/SystemStatus';
import SystemSettings from '../components/admin/SystemSettings';
import ConfiguracaoJornada from '../components/management/ConfiguracaoJornada'; 
import ProfileCompletionDialog from '../components/personal/ProfileCompletionDialog'; 
import { useAuthStore } from '../stores/authStore'; 
import OrderOfServicePage from '../components/management/OrderOfServicePage';
import MyMinistryPage from '../components/management/MyMinistryPage';

const DashboardPage = () => {
  const { user, isLoading } = useAuthStore(); 
  const location = useLocation(); 
  const [activeModule, setActiveModule] = useState('dashboard');
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  useEffect(() => {
    if (location.state?.activeModule) {
      setActiveModule(location.state.activeModule);
      window.history.replaceState({}, document.title); 
    }
  }, [location.state]);

  useEffect(() => {
    if (!isLoading && user && !user.perfil_completo && user.role !== 'super_admin') {
      setShowProfileDialog(true);
    }
  }, [user, isLoading]);

  const renderModuleContent = () => {
    switch (activeModule) {
      case 'dashboard': return <DashboardHome />;
      case 'personal-info': return <PersonalInfo />;
      case 'member-journey': return <MemberJourney />;
      case 'vocational-test': return <VocationalTest />;
      case 'events': return <EventsPage />;
      case 'events-management': return <EventsManagementPage />;
      case 'devotionals': return <DevotionalsPage />;
      case 'devotionals-management': return <DevotionalsManagementPage />;
      case 'offerings': return <OfferingsPage />;
      case 'kids-management': return <KidsPage />;
      case 'member-management': return <MemberManagementPage />;
      case 'ministries': return <MinistriesPage />;
      case 'financial-panel': return <FinancialPanel />;
      case 'journey-config': return <ConfiguracaoJornada />;
      case 'order-of-service': return <OrderOfServicePage />;
      case 'my-ministry': 
        return <MyMinistryPage />;
      case 'system-settings': return <SystemSettings />;
      case 'system-status': return <SystemStatus />;
      default: return <DashboardHome />;
    }
  }

  const handleModuleSelect = (moduleId: string) => {
    setActiveModule(moduleId);
    setShowProfileDialog(false);
  }

  return (
    <MainLayout activeModule={activeModule} onModuleSelect={handleModuleSelect}>
      {renderModuleContent()}
      {showProfileDialog && (
        <ProfileCompletionDialog
          isOpen={showProfileDialog}
          onClose={() => setShowProfileDialog(false)}
          onNavigateToProfile={() => {
              setActiveModule('personal-info');
              setShowProfileDialog(false);
          }}
        />
      )}
    </MainLayout>
  )
}
export default DashboardPage;