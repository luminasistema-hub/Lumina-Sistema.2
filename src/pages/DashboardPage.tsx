import { useState, useEffect, Suspense } from 'react'
import { useAuthStore } from '../stores/authStore'
import MainLayout from '../components/layout/MainLayout'
import { lazy } from 'react'
const DashboardHome = lazy(() => import('../components/dashboard/DashboardHome'))
const PersonalInfo = lazy(() => import('../components/personal/PersonalInfo'))
const MemberJourney = lazy(() => import('../components/personal/MemberJourney'))
const VocationalTest = lazy(() => import('../components/personal/VocationalTest'))
const MyMinistryPage = lazy(() => import('../components/management/MyMinistryPage'))
const EventsPage = lazy(() => import('../components/spiritual/EventsPage'))
const DevotionalsPage = lazy(() => import('../components/spiritual/DevotionalsPage'))
const OfferingsPage = lazy(() => import('../components/contributions/OfferingsPage'))
const OrderOfServiceEventsPage = lazy(() => import('../components/management/OrderOfServiceEventsPage'))
const MemberManagementPage = lazy(() => import('../components/management/MemberManagementPage'))
const MinistriesPage = lazy(() => import('../components/management/MinistriesPage'))
const FinancialPanel = lazy(() => import('../components/management/FinancialPanel'))
const ConfiguracaoJornada = lazy(() => import('../components/management/ConfiguracaoJornada'))
const KidsPage = lazy(() => import('../components/family/KidsPage'))
const EventsManagementPage = lazy(() => import('../components/management/EventsManagementPage'))
const DevotionalsManagementPage = lazy(() => import('../components/management/DevotionalsManagementPage'))
const GrowthGroupsPage = lazy(() => import('../components/management/GrowthGroupsPage'))
const MyGrowthGroup = lazy(() => import('../components/personal/MyGrowthGroup'))
const NotificationManager = lazy(() => import('../components/admin/NotificationManager'))
const SystemSettings = lazy(() => import('../components/admin/SystemSettings'))
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
      case 'growth-groups':
        return <GrowthGroupsPage />
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
        <Suspense fallback={<div className="p-6 text-center text-gray-600">Carregando módulo...</div>}>
          {renderActiveModule()}
        </Suspense>
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