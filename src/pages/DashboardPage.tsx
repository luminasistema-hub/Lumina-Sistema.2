import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import MainLayout from '../components/layout/MainLayout'
import DashboardHome from '../components/dashboard/DashboardHome'
import PersonalInfo from '../components/personal/PersonalInfo'
import MemberJourney from '../components/personal/MemberJourney'
import VocationalTest from '../components/personal/VocationalTest'
import MyMinistryPage from '../components/management/MyMinistryPage'
import EventsPage from '../components/spiritual/EventsPage'
import DevotionalsPage from '../components/spiritual/DevotionalsPage'
import OfferingsPage from '../components/contributions/OfferingsPage'
import OrderOfServiceEventsPage from '../components/management/OrderOfServiceEventsPage'
import MemberManagementPage from '../components/management/MemberManagementPage'
import MinistriesPage from '../components/management/MinistriesPage'
import FinancialPanel from '../components/management/FinancialPanel'
import ConfiguracaoJornada from '../components/management/ConfiguracaoJornada'
import KidsPage from '../components/family/KidsPage'
import EventsManagementPage from '../components/management/EventsManagementPage'
import DevotionalsManagementPage from '../components/management/DevotionalsManagementPage'
import NotificationManager from '../components/admin/NotificationManager'
import SystemSettings from '../components/admin/SystemSettings'
import { SpecialNotificationDialog } from '@/components/shared/SpecialNotificationDialog'
import PastorAreaPage from '@/components/pastor/PastorAreaPage'

interface DashboardPageProps {
  currentChurchId: string
}

const DashboardPage = ({ currentChurchId }: DashboardPageProps) => {
  const { user } = useAuthStore()
  const [activeModule, setActiveModule] = useState('dashboard')
  const [showSpecialNotification, setShowSpecialNotification] = useState(false)

  useEffect(() => {
    if (user && !user.perfil_completo) {
      const timer = setTimeout(() => {
        setShowSpecialNotification(true)
      }, 3000) // Aguarda 3 segundos antes de mostrar
      return () => clearTimeout(timer)
    }
  }, [user])

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <DashboardHome />
      // Área Pessoal
      case 'personal-info':
        return <PersonalInfo />
      case 'member-journey':
        return <MemberJourney />
      case 'vocational-test':
        return <VocationalTest />
      case 'my-ministry':
        return <MyMinistryPage />
      // Crescimento Espiritual
      case 'events':
        return <EventsPage />
      case 'devotionals':
        return <DevotionalsPage />
      // Contribuições
      case 'offerings':
        return <OfferingsPage />
      // Gestão
      case 'pastor-area':
        return <PastorAreaPage />
      case 'order-of-service':
        return <OrderOfServiceEventsPage />
      case 'member-management':
        return <MemberManagementPage />
      case 'ministries':
        return <MinistriesPage />
      case 'financial-panel':
        return <FinancialPanel />
      case 'journey-config':
        return <ConfiguracaoJornada />
      case 'kids-management':
        return <KidsPage />
      case 'events-management':
        return <EventsManagementPage />
      case 'devotionals-management':
        return <DevotionalsManagementPage />
      // Administração
      case 'notification-management':
        return <NotificationManager />
      case 'system-settings':
        return <SystemSettings />
      default:
        return <DashboardHome />
    }
  }

  return (
    <>
      <MainLayout
        activeModule={activeModule}
        onModuleSelect={setActiveModule}
      >
        {renderActiveModule()}
      </MainLayout>
      
      {showSpecialNotification && (
        <SpecialNotificationDialog
          isOpen={showSpecialNotification}
          onClose={() => setShowSpecialNotification(false)}
          onAction={() => {
            setActiveModule('personal-info')
            setShowSpecialNotification(false)
          }}
        />
      )}
    </>
  )
}

export default DashboardPage