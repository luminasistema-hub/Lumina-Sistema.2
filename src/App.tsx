import { Routes, Route, Navigate } from 'react-router-dom'
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
import { useEffect } from 'react'
import { SpeedInsights } from "@vercel/speed-insights/react";

function App() {
  const { user, isLoading, checkAuth, currentChurchId, initializeAuthListener } = useAuthStore()

  useEffect(() => {
    console.log('App mounted, initializing auth listener and checking authentication...')
    initializeAuthListener();
    checkAuth();
  }, [checkAuth, initializeAuthListener])

  useEffect(() => {
    console.log('App Render: isLoading:', isLoading, 'user:', user?.email, 'userRole:', user?.role, 'currentChurchId:', currentChurchId);
  }, [isLoading, user, currentChurchId]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-church-blue-50 to-church-purple-50">
      <Routes>
        {/* Rota da Landing Page */}
        <Route 
          path="/" 
          element={user ? <Navigate to={user.role === 'super_admin' ? "/master-admin" : "/dashboard"} replace /> : <LandingPage />} 
        />

        {/* Rotas de Login e Registro Comum */}
        <Route 
          path="/login" 
          element={user ? <Navigate to={user.role === 'super_admin' ? "/master-admin" : "/dashboard"} replace /> : <LoginPage />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to={user.role === 'super_admin' ? "/master-admin" : "/dashboard"} replace /> : <RegisterPage />} 
        />
        <Route 
          path="/cadastrar-igreja" 
          element={user ? <Navigate to={user.role === 'super_admin' ? "/master-admin" : "/dashboard"} replace /> : <CadastrarIgrejaPage />} 
        />
        
        {/* Rotas de Login e Registro de Super Admin */}
        <Route 
          path="/master-admin-login" 
          element={user?.role === 'super_admin' ? <Navigate to="/master-admin" replace /> : <MasterAdminLoginPage />} 
        />
        <Route 
          path="/super-admin-register" 
          element={user?.role === 'super_admin' ? <Navigate to="/master-admin" replace /> : <SuperAdminRegisterPage />} 
        />

        {/* Rotas Protegidas */}
        <Route 
          path="/master-admin" 
          element={user?.role === 'super_admin' ? <MasterAdminPage /> : <Navigate to="/master-admin-login" replace />} 
        />
        <Route 
          path="/dashboard" 
          element={user && user.role !== 'super_admin' && currentChurchId ? <DashboardPage currentChurchId={currentChurchId} /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/ead" 
          element={user && user.role !== 'super_admin' && currentChurchId ? <EADPortalPage /> : <Navigate to="/" replace />} 
        />
      </Routes>
      <SpeedInsights />
    </div>
  )
}

export default App