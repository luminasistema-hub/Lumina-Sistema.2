import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import { useAuthStore } from '../../stores/authStore' // Importar useAuthStore

interface MainLayoutProps {
  children: React.ReactNode
  activeModule?: string
  onModuleSelect?: (moduleId: string) => void
}

const MainLayout = ({ children, activeModule = 'dashboard', onModuleSelect }: MainLayoutProps) => {
  const { currentChurchId } = useAuthStore() // Obter currentChurchId do authStore

  const handleModuleSelect = (moduleId: string) => {
    console.log(`MainLayout: Selected module: ${moduleId}`)
    onModuleSelect?.(moduleId)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar 
        activeModule={activeModule} 
        onModuleSelect={handleModuleSelect}
        currentChurchId={currentChurchId} // Passar currentChurchId para Sidebar
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header currentChurchId={currentChurchId} /> {/* Passar currentChurchId para Header */}
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default MainLayout