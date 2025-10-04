import { ReactNode, useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuthStore } from "../../stores/authStore";
import { useIsMobile } from "../../hooks/use-mobile";
import { Sheet, SheetContent } from "../ui/sheet";

interface MainLayoutProps {
  children: ReactNode;
  activeModule?: string;
  onModuleSelect?: (moduleId: string) => void;
}

const MainLayout = ({ children, activeModule = "dashboard", onModuleSelect }: MainLayoutProps) => {
  const { user } = useAuthStore(); // Obter usuário do authStore
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleModuleSelect = (moduleId: string) => {
    console.log(`MainLayout: Selected module: ${moduleId}`);
    onModuleSelect?.(moduleId);
  };

  // Garante que só renderiza se houver usuário logado
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar desktop */}
      {!isMobile && (
        <Sidebar 
          activeModule={activeModule} 
          onModuleSelect={handleModuleSelect} 
        />
      )}
      
      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col">
        {/* Header com botão para abrir menu no mobile */}
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        {/* Página */}
        <main className="flex-1 overflow-auto p-4">
          {children}
        </main>
      </div>

      {/* Sidebar mobile em Sheet (menu sanduíche) */}
      {isMobile && (
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="p-0 w-72 sm:w-80">
            <Sidebar 
              activeModule={activeModule} 
              onModuleSelect={(id) => {
                handleModuleSelect(id);
                setMobileMenuOpen(false);
              }} 
            />
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
};

export default MainLayout;