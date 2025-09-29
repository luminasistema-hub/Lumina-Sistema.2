import { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'

interface MainLayoutProps {
  children: React.ReactNode
  activeModule?: string
  onModuleSelect?: (moduleId: string) => void
}

const MainLayout = ({ children, activeModule = 'dashboard', onModuleSelect }: MainLayoutProps) => {
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
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header />
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

export default MainLayout