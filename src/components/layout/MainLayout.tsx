import { ReactNode, useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuthStore } from "../../stores/authStore";
import { useIsMobile } from "../../hooks/use-mobile";
import { Sheet, SheetContent } from "../ui/sheet";
import { useNotifications } from "@/hooks/useNotifications";
import { SpecialNotificationDialog } from "../shared/SpecialNotificationDialog";
import { supabase } from "@/integrations/supabase/client";

interface MainLayoutProps {
  children: ReactNode;
  activeModule?: string;
  onModuleSelect?: (moduleId: string) => void;
}

const MainLayout = ({ children, activeModule = "dashboard", onModuleSelect }: MainLayoutProps) => {
  const { user } = useAuthStore();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { notifications } = useNotifications();
  const [specialNotification, setSpecialNotification] = useState<any>(null);

  useEffect(() => {
    const specialTypes = ['ANIVERSARIO', 'ANIVERSARIO_CASAMENTO', 'NOVA_ESCALA'];
    const unreadSpecial = notifications.find(n => 
      !n.lido && 
      specialTypes.includes(n.tipo) &&
      !localStorage.getItem(`specialNotificationShown_${n.id}`)
    );

    if (unreadSpecial) {
      setSpecialNotification(unreadSpecial);
    }
  }, [notifications]);

  const handleCloseSpecialNotification = async () => {
    if (!specialNotification) return;

    // Marca como vista no localStorage para não mostrar de novo na mesma sessão
    localStorage.setItem(`specialNotificationShown_${specialNotification.id}`, 'true');
    
    // Marca como lida no banco de dados
    if (specialNotification.user_id === user?.id) {
      await supabase.from('notificacoes').update({ lido: true }).eq('id', specialNotification.id);
    }
    
    setSpecialNotification(null);
  };

  const handleModuleSelect = (moduleId: string) => {
    console.log(`MainLayout: Selected module: ${moduleId}`);
    onModuleSelect?.(moduleId);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {!isMobile && (
        <Sidebar 
          activeModule={activeModule} 
          onModuleSelect={handleModuleSelect} 
        />
      )}
      
      <div className="flex-1 flex flex-col">
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-auto p-4">
          {children}
        </main>
      </div>

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

      <SpecialNotificationDialog
        isOpen={!!specialNotification}
        onClose={handleCloseSpecialNotification}
        notification={specialNotification}
      />
    </div>
  );
};

export default MainLayout;