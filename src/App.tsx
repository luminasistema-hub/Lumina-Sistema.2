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
import PaymentSuccessPage from './pages/PaymentSuccessPage'
import { useEffect } from 'react'

// ----------------------------
// ProtectedRoute genérico
// ----------------------------
function ProtectedRoute({
  children,
  requireTenant = false,
  onlySuperAdmin = false,
}: {
  children: JSX.Element
  requireTenant?: boolean
  onlySuperAdmin?: boolean
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

  if (onlySuperAdmin && user.role !== 'super_admin') {
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
    <Routes>
      {/* Landing */}
      <Route
        path="/"
        element={
          user ? (
            <Navigate
              to={user.role === 'super_admin' ? '/master-admin' : '/dashboard'}
              replace
            />
          ) : (
            <LandingPage />
          )
        }
      />

      {/* Login & Registro comuns */}
      <Route
        path="/login"
        element={
          user ? (
            <Navigate
              to={user.role === 'super_admin' ? '/master-admin' : '/dashboard'}
              replace
            />
          ) : (
            <LoginPage />
          )
        }
      />
      <Route
        path="/register/:churchId"
        element={
          user ? (
            <Navigate
              to={user.role === 'super_admin' ? '/master-admin' : '/dashboard'}
              replace
            />
          ) : (
            <RegisterPage />
          )
        }
      />
      <Route
        path="/cadastrar-igreja"
        element={
          <CadastrarIgrejaPage />
        }
      />
      <Route
        path="/payment-success"
        element={
          <PaymentSuccessPage />
        }
      />

      {/* Login & registro de super admin */}
      <Route
        path="/master-admin-login"
        element={
          user?.role === 'super_admin' ? (
            <Navigate to="/master-admin" replace />
          ) : (
            <MasterAdminLoginPage />
          )
        }
      />
      <Route
        path="/super-admin-register"
        element={
          user?.role === 'super_admin' ? (
            <Navigate to="/master-admin" replace />
          ) : (
            <SuperAdminRegisterPage />
          )
        }
      />

      {/* Rotas protegidas */}
      <Route
        path="/master-admin"
        element={
          <ProtectedRoute onlySuperAdmin>
            <MasterAdminPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requireTenant>
            <DashboardPage currentChurchId={currentChurchId!} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ead"
        element={
          <ProtectedRoute requireTenant>
            <EADPortalPage />
          </ProtectedRoute>
        }
      />

      {/* catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App