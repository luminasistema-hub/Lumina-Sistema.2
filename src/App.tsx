// src/App.tsx
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import MasterAdminPage from './pages/MasterAdminPage'
import MasterAdminLoginPage from './pages/MasterAdminLoginPage'
import SuperAdminRegisterPage from './pages/SuperAdminRegisterPage'
import CadastrarIgrejaPage from './pages/CadastrarIgrejaPage'
import LandingPage from './pages/LandingPage'
import EADPortalPage from './pages/EADPortalPage'
import SchoolDetailsPage from './pages/SchoolDetailsPage'
import PasswordResetPage from './pages/PasswordResetPage'
import NewPasswordPage from './pages/NewPasswordPage'
import NotFound from './pages/NotFound'
import { useEffect } from 'react'
import ErrorBoundary from './components/shared/ErrorBoundary'

// ----------------------------
// ProtectedRoute genérico
// ----------------------------
function ProtectedRoute({
  children,
  requireTenant = false,
  onlySuperAdmin = false,
  requireSuperAdmin = false,
}: {
  children: JSX.Element
  requireTenant?: boolean
  onlySuperAdmin?: boolean
  requireSuperAdmin?: boolean
}) {
  const { user, isLoading, currentChurchId } = useAuthStore()
  const loc = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-church-blue-50 to-church-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-church-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-church-blue-600 font-medium">Carregando Lumina...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: loc }} replace />
  }

  if ((onlySuperAdmin || requireSuperAdmin) && user.role !== 'super_admin') {
    return <Navigate to="/" replace />
  }

  if (requireTenant && !currentChurchId) {
    return <Navigate to="/cadastrar-igreja" replace />
  }

  return children
}

// ----------------------------
// App principal
// ----------------------------
function App() {
  const { user, isLoading, checkAuth, currentChurchId, initializeAuthListener } = useAuthStore()

  useEffect(() => {
    checkAuth()
    const unsub = initializeAuthListener()
    return () => {
      if (typeof unsub === 'function') unsub()
    }
  }, [checkAuth, initializeAuthListener])

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/cadastrar-igreja" element={<CadastrarIgrejaPage />} />
        <Route path="/password-reset" element={<PasswordResetPage />} />
        <Route path="/new-password" element={<NewPasswordPage />} />
        <Route path="/master-admin-login" element={<MasterAdminLoginPage />} />
        <Route path="/super-admin-register" element={<SuperAdminRegisterPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage currentChurchId={currentChurchId!} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/master-admin"
          element={
            <ProtectedRoute requireSuperAdmin>
              <MasterAdminPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  )
}

export default App