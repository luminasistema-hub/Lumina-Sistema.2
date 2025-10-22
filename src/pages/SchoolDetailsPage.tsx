import MainLayout from '../components/layout/MainLayout'
import SchoolDetails from '../components/education/SchoolDetailsPage'
import { useAuthStore } from '../stores/authStore'
import { Navigate } from 'react-router-dom'

const SchoolDetailsPage = () => {
  const { user, currentChurchId } = useAuthStore()

  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'super_admin') return <Navigate to="/master-admin" replace />
  if (!currentChurchId) return <Navigate to="/dashboard" replace />

  return (
    <MainLayout activeModule="courses">
      <SchoolDetails />
    </MainLayout>
  )
}

export default SchoolDetailsPage
