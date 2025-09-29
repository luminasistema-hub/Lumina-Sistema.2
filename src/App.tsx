import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import MasterAdminPage from './pages/MasterAdminPage' // Importar o novo painel master
import { useEffect } from 'react'

function App() {
  const { user, isLoading, checkAuth, currentChurchId, initializeAuthListener } = useAuthStore() // Obter initializeAuthListener

  useEffect(() => {
    console.log('App mounted, initializing auth listener and checking authentication...')
    initializeAuthListener(); // Inicializar o listener de autenticação uma vez
    checkAuth(); // Também verificar a autenticação no carregamento inicial
  }, [checkAuth, initializeAuthListener]) // Adicionar initializeAuthListener às dependências

  // Add this log to see the state right before rendering routes
  useEffect(() => {
    console.log('App Render: isLoading:', isLoading, 'user:', user?.email, 'userRole:', user?.role, 'currentChurchId:', currentChurchId);
  }, [isLoading, user, currentChurchId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-church-blue-50 to-church-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-church-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-church-blue-600 font-medium">Carregando Sistema Connect Vida...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-church-blue-50 to-church-purple-50">
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
        />
        {user?.role === 'super_admin' ? (
          <Route path="/master-admin" element={<MasterAdminPage />} />
        ) : (
          <Route 
            path="/dashboard" 
            element={user && currentChurchId ? <DashboardPage currentChurchId={currentChurchId} /> : <Navigate to="/login" replace />} 
          />
        )}
        <Route 
          path="/" 
          element={<Navigate to={user?.role === 'super_admin' ? "/master-admin" : (user ? "/dashboard" : "/login")} replace />} 
        />
      </Routes>
    </div>
  )
}

export default App