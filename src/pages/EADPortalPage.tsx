import { useAuthStore } from '../stores/authStore'
import MainLayout from '../components/layout/MainLayout'
import CoursesPage from '../components/spiritual/CoursesPage'
import { Navigate } from 'react-router-dom'

const EADPortalPage = () => {
  const { user, currentChurchId } = useAuthStore()

  // Super admin não usa portal EAD da igreja
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'super_admin') return <Navigate to="/master-admin" replace />
  if (!currentChurchId) return <Navigate to="/dashboard" replace />

  return (
    <MainLayout activeModule="courses">
      <CoursesPage />
    </MainLayout>
  )
}

export default EADPortalPage