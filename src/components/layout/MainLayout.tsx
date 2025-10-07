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
    if (!user?.id) return;
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const lastShownStr = localStorage.getItem(`specialPopupLastShown_${user.id}`);
    const now = Date.now();
    if (lastShownStr) {
      const lastShown = parseInt(lastShownStr, 10);
      if (!Number.isNaN(lastShown) && now - lastShown < THIRTY_DAYS_MS) {
        // Dentro da janela de 30 dias: não mostrar o popup
        return;
      }
    }

    const specialTypes = ['ANIVERSARIO', 'ANIVERSARIO_CASAMENTO', 'NOVA_ESCALA'];
    const unreadSpecial = notifications.find(n =>
      !n.lido &&
      specialTypes.includes(n.tipo) &&
      !localStorage.getItem(`specialNotificationShown_${n.id}`)
    );

    if (unreadSpecial) {
      setSpecialNotification(unreadSpecial);
    }
  }, [notifications, user]);

  const handleCloseSpecialNotification = async () => {
    if (!specialNotification) return;

    // Marca como vista no localStorage para não mostrar de novo na mesma sessão
    localStorage.setItem(`specialNotificationShown_${specialNotification.id}`, 'true');
    // Registra o último momento que este usuário viu o popup (limite de 30 dias)
    if (user?.id) {
      localStorage.setItem(`specialPopupLastShown_${user.id}`, String(Date.now()));
    }
    
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
    <div className="flex h-screen bg-gray-50 overflow-x-hidden">
      {!isMobile && (
        <Sidebar 
          activeModule={activeModule} 
          onModuleSelect={handleModuleSelect} 
        />
      )}
      
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden responsive-section max-w-[100vw] min-w-0">
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
              onClose={() => setMobileMenuOpen(false)}
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