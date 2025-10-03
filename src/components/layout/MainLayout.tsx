import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuthStore } from "../../stores/authStore";

interface MainLayoutProps {
  children: ReactNode;
  activeModule?: string;
  onModuleSelect?: (moduleId: string) => void;
}

const MainLayout = ({ children, activeModule = "dashboard", onModuleSelect }: MainLayoutProps) => {
  const { user } = useAuthStore(); // Obter usuário do authStore

  const handleModuleSelect = (moduleId: string) => {
    console.log(`MainLayout: Selected module: ${moduleId}`);
    onModuleSelect?.(moduleId);
  };

  // Garante que só renderiza se houver usuário logado
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar 
        activeModule={activeModule} 
        onModuleSelect={handleModuleSelect} 
      />

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header />

        {/* Página */}
        <main className="flex-1 overflow-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
